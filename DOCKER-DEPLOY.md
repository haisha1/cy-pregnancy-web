# Web：Jenkins → Docker → 宝塔

唯一链路：拉取 main → Node.js 22.12+ 构建 dist → Docker 镜像 → Compose 更新 Web 并检查健康状态 → 宝塔入口。不手动上传 dist，不提交 dist、node_modules 或生产 .env。

## 文件

| 文件 | 用途 |
| --- | --- |
| Jenkinsfile | 可选 Pipeline 入口，禁止并发，保留最近 10 次构建 |
| deploy/jenkins-build.sh | 自由风格任务及 Pipeline 共用构建发布脚本 |
| Dockerfile、.dockerignore | 仅打包 dist 和容器配置 |
| compose.yml | 镜像、端口、资源、日志和共享网络 |
| .env.example | 非敏感参数参考 |
| deploy/docker/nginx.conf | SPA、缓存、健康检查和 API 代理 |
| deploy/baota-docker.conf.example | 宝塔反向代理参考 |

## 当前自由风格任务

分支设为 */main；启用 NodeJS 构建环境（22.12+），禁止并发，设置构建记录保留数量。删除原来重复的 npm/Docker Shell，只保留一个执行 Shell：

~~~sh
sh deploy/jenkins-build.sh
~~~

Jenkins 必须有 Git、Node、Docker CLI、Buildx、Compose，并可访问宿主机 Docker socket。该权限可以控制宿主机容器，仅执行可信代码。先手动构建。

镜像标签为 cy-pregnancy-web:构建编号，容器名 cy-pregnancy-web。同一 Web 只用一个发布任务，避免镜像编号冲突。更新可能短暂中断，发布失败尝试恢复上一版镜像并标记失败；首次发布没有旧版可恢复。若已有同名容器由其他方案管理，先确认并迁移，避免 Compose 冲突。脚本不会主动删除已有容器或 Jenkins 数据。

## 可选 Pipeline

新建 Pipeline → Pipeline script from SCM → Git，设置同一 SSH 仓库和 main，Script Path 填 Jenkinsfile。NodeJS 工具安装名称需为 node22，或修改 Jenkinsfile。迁移后停用原自由风格任务，不要同时发布。

## 后端网络

脚本创建或复用 cy-pregnancy-internal。管理后端必须加入同一网络，别名 admin-api，容器内监听 18732。需要调整参数时设置 Jenkins 环境变量 SERVICE_NETWORK、WEB_MEMORY_LIMIT；.env.example 仅供参考，脚本不会生成生产 .env。

浏览器通过同源 /admin/api/ 请求后端。后端未启动时页面可访问，API 返回 503。前端 healthy 不代表登录、数据库或两个 Java 服务正常。

## 宝塔和验收

端口为 `0.0.0.0:18080:8080`，同时支持两种入口：

- IP 直连：腾讯云安全组及服务器防火墙放行 TCP 18080 后，访问 `http://服务器公网IP:18080`。
- 域名访问：宝塔站点代理到 `http://127.0.0.1:18080`，参考[配置片段](deploy/baota-docker.conf.example)。域名解析、备案及 HTTPS 准备好后启用 80/443 入口，无需修改容器端口。

HTTP IP 入口用于临时查看页面，正式管理登录使用 HTTPS。宝塔对域名设置的访问限制不会自动作用于 IP 直连入口，需要限制访问来源时同步配置 18080 入站规则。

在宝塔服务器终端检查：

~~~sh
docker ps --filter name=cy-pregnancy-web
curl --fail http://127.0.0.1:18080/healthz
curl --fail -I http://127.0.0.1:18080/
docker logs --tail 80 cy-pregnancy-web
~~~

通过域名检查首页、刷新子路由、登录与 API。缺失静态资源应返回 404，内部接口不得暴露。本地检查不能代替真实服务器 Docker 构建、运行和后端联调。

## push 自动触发

手动发布成功后，GitHub 配置 Jenkins Webhook，自由风格任务启用 GitHub hook trigger for GITScm polling。GitHub 必须能访问回调地址；仅配置 Git SSH 不会自动触发。

## 清理

新旧 Jenkins 可能共用 /var/jenkins_home 对应的宿主机目录，不能删除此目录。只清理确认停用的旧容器，不使用全局命令清理卷或其他项目。构建记录策略不会删除 Docker 镜像；至少保留当前及上一版 Web 镜像以便恢复。
