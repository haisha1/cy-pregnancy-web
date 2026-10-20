#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
: "${BUILD_NUMBER:?请在 Jenkins 构建任务内执行}"
export WEB_IMAGE="cy-pregnancy-web:${BUILD_NUMBER}"
export SERVICE_NETWORK="${SERVICE_NETWORK:-cy-pregnancy-internal}"
node --version
npm --version
docker version
docker compose version
npm ci --no-audit --no-fund
npm run build
test -f dist/index.html
docker build -f Dockerfile.prebuilt -t "$WEB_IMAGE" .
docker run --rm "$WEB_IMAGE" nginx -t
if ! docker network inspect "$SERVICE_NETWORK" >/dev/null 2>&1; then
    docker network create "$SERVICE_NETWORK"
fi
docker compose config --quiet
previous_image="$(docker inspect --format '{{.Config.Image}}' cy-pregnancy-web 2>/dev/null || true)"
if docker compose up -d --wait --wait-timeout 90; then
    echo "部署成功：$WEB_IMAGE；宿主机入口 http://127.0.0.1:18080"
else
    docker compose logs --tail 80 web || true
    if [ -n "$previous_image" ]; then
        echo "部署失败，尝试恢复 $previous_image"
        WEB_IMAGE="$previous_image" docker compose up -d --wait --wait-timeout 90 || true
    fi
    exit 1
fi
