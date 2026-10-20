#!/bin/sh
# Web 发布唯一入口：在 Jenkins 仓库工作区执行 sh deploy/jenkins-build.sh。
# 使用 POSIX sh，兼容 Jenkins 默认 /bin/sh；禁止同时执行多个发布任务。
# 端口由 compose.yml 管理：宿主机 127.0.0.1:18080 -> 容器 8080。
set -eu
cd "$(dirname "$0")/.."

STEP="初始化"
DEPLOY_STARTED=0
PREVIOUS_IMAGE=""
CONTAINER="cy-pregnancy-web"
STARTED_AT=$(date +%s)

log() {
    printf '[%s] [%s] %s
' "$(date '+%Y-%m-%d %H:%M:%S %z')" "$STEP" "$*"
}
step() {
    STEP="$1"
    printf '
========== %s ==========
' "$STEP"
}
# 只打印服务状态、端口及有限行数的 Nginx 日志，不输出环境变量或凭据。
diagnostics() {
    docker ps -a --filter "name=^/$CONTAINER$" \
        --format 'table {{.Names}}	{{.Status}}	{{.Ports}}' || true
    docker inspect --format '运行={{.State.Status}} 健康={{if .State.Health}}{{.State.Health.Status}}{{else}}未配置{{end}}' \
        "$CONTAINER" || true
    docker logs --tail 60 "$CONTAINER" || true
}
# 所有失败都报告失败阶段；只有开始更新容器后，才尝试恢复上一镜像。
# 镜像 ID 而非可变标签用于恢复，避免重新构建相同标签影响恢复目标。
on_exit() {
    result=$?
    trap - 0
    if [ "$result" -ne 0 ]; then
        log "失败：退出码 $result；失败阶段：$STEP"
        if [ "$DEPLOY_STARTED" -eq 1 ]; then
            diagnostics
            if [ -n "$PREVIOUS_IMAGE" ]; then
                log "尝试恢复上一版镜像：$PREVIOUS_IMAGE"
                if WEB_IMAGE="$PREVIOUS_IMAGE" docker compose up -d --wait --wait-timeout 90; then
                    log "上一版已恢复；本次 Jenkins 构建仍标记失败。"
                else
                    log "恢复失败，请在服务器检查容器状态。"
                    diagnostics
                fi
            else
                log "首次部署，没有上一版镜像；保留失败容器供排查。"
            fi
        fi
    fi
    exit "$result"
}
trap on_exit 0
trap 'exit 130' INT
trap 'exit 143' TERM

step "1/8 检查项目与发布参数"
: "${BUILD_NUMBER:?缺少 BUILD_NUMBER，请在 Jenkins 任务中运行}"
# 限定标签来源，避免误用任务外的非法构建编号。
case "$BUILD_NUMBER" in *[!0-9]*|'') log "BUILD_NUMBER 必须是数字"; exit 1 ;; esac
export WEB_IMAGE="cy-pregnancy-web:${BUILD_NUMBER}"
export SERVICE_NETWORK="${SERVICE_NETWORK:-cy-pregnancy-internal}"
for file in package.json package-lock.json Dockerfile compose.yml deploy/docker/nginx.conf; do
    test -f "$file" || { log "缺少文件：$file；请确认最新代码已 push。"; exit 1; }
done
log "工作目录：$(pwd)"
log "构建编号：$BUILD_NUMBER；镜像：$WEB_IMAGE"
log "共享网络：$SERVICE_NETWORK"
log "端口：127.0.0.1:18080 -> 容器 8080"
git log -1 --format='提交：%h %s'

step "2/8 检查 Node 与 Docker 环境"
for tool in node npm docker; do
    command -v "$tool" >/dev/null 2>&1 || { log "找不到命令：$tool"; exit 1; }
done
node --version
npm --version
# 遵守项目要求：Node >= 22.12.0。
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 12)) { console.error("需要 Node >=22.12.0"); process.exit(1); }'
docker version
docker compose version
# 不接管旧 docker run 或其他 Compose 项目创建的同名容器。
if docker container inspect "$CONTAINER" >/dev/null 2>&1; then
    owner=$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "$CONTAINER")
    service=$(docker inspect --format '{{index .Config.Labels "com.docker.compose.service"}}' "$CONTAINER")
    if [ "$owner" != "cy-pregnancy-web" ] || [ "$service" != "web" ]; then
        log "同名容器不属于当前 Compose；请确认旧 Web 容器后迁移，脚本不自动删除。"
        exit 1
    fi
    PREVIOUS_IMAGE=$(docker inspect --format '{{.Image}}' "$CONTAINER")
    log "已记录上一版镜像 ID：$PREVIOUS_IMAGE"
else
    log "没有现有 Web 容器，本次为首次部署。"
fi

step "3/8 安装前端依赖"
log "根据 package-lock.json 安装依赖；下载过程请查看 npm 输出。"
npm ci --no-audit --no-fund
log "依赖安装完成。"

step "4/8 构建并检查 dist"
# build 同时执行 TypeScript 检查和 Vite 生产构建。
npm run build
test -s dist/index.html
ls -lh dist
du -sh dist
log "dist 已生成，开始构建运行镜像。"

step "5/8 构建 Docker 镜像"
# .dockerignore 仅放行 dist 和 Nginx 配置，不发送 node_modules 或生产配置。
docker build --progress=plain -f Dockerfile -t "$WEB_IMAGE" .
docker run --rm "$WEB_IMAGE" nginx -t
log "镜像构建及 Nginx 语法检查通过。"

step "6/8 检查网络与 Compose"
if docker network inspect "$SERVICE_NETWORK" >/dev/null 2>&1; then
    log "复用已有网络：$SERVICE_NETWORK"
else
    log "创建共享网络：$SERVICE_NETWORK"
    docker network create "$SERVICE_NETWORK"
fi
# 只校验，不打印可能包含敏感参数的配置展开结果。
docker compose config --quiet
log "Compose 配置检查通过。"

step "7/8 更新容器并等待健康检查"
log "开始更新，最多等待 90 秒；更新期间可能短暂不可用。"
DEPLOY_STARTED=1
docker compose up -d --wait --wait-timeout 90
# 检查容器内的 8080，不能使用默认 80。
docker exec "$CONTAINER" sh -c \
    'wget -q -O /dev/null http://127.0.0.1:8080/healthz && wget -q -O /dev/null http://127.0.0.1:8080/'
log "容器健康检查及首页检查通过。"

step "8/8 发布结果"
docker compose ps
log "部署成功：$WEB_IMAGE"
log "宝塔反向代理目标：http://127.0.0.1:18080"
log "耗时：$(( $(date +%s) - STARTED_AT )) 秒"
log "此检查验证前端；登录和管理 API 还需 Java 后端正常运行。"
# 全流程成功后解除恢复标记，不删除历史镜像、Jenkins 容器或数据库。
DEPLOY_STARTED=0
