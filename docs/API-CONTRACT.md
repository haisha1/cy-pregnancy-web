# 接口与数据契约

基线日期：2026-10-19。管理与用户服务已完成真实MySQL迁移和接口联调。现有接口及本轮新增读接口如下，运行记录见IMPLEMENTATION.md。

源码：[Controller](../../cy-pregnancy-admin/server/src/main/java/com/chunyu/pregnancy/admin/controller)、[DTO](../../cy-pregnancy-admin/server/src/main/java/com/chunyu/pregnancy/admin/dto)、[业务说明](../../cy-pregnancy-admin/server/docs/02-接口与业务流程.md)。运行时 OpenAPI `/v3/api-docs` 在联调时重新导出核对，不用本文替代完整字段定义。

## 1. 响应与鉴权

- API 前缀 `/admin/api/v1`；统一响应 `code/message/data/requestId/serverTime`。
- 登录返回 Bearer accessToken 与 expiresIn；通过 `/me` 获取当前身份和最新权限。没有已确认的 refresh-token 契约，不自行增加自动刷新接口。
- Token 只在运行内存中保存，刷新后重新登录；生产若需要跨刷新会话，先实施明确的服务端会话/HttpOnly Cookie 契约，不能悄悄改为 localStorage。
- requestId 用于排查，UI 默认显示中文可操作错误，避免直接倾倒内部错误详情。

## 2. 已有接口清单

下表路径省略公共前缀。If-Match 必须是带双引号的 revision 值。

| 方法  | 路径                               | 权限                         | If-Match 对象                     |
| ----- | ---------------------------------- | ---------------------------- | --------------------------------- |
| POST  | /auth/login                        | 公开，受限流                 | 无                                |
| GET   | /me                                | 登录                         | 无                                |
| POST  | /auth/logout                       | 登录                         | 无                                |
| POST  | /auth/password                     | 登录                         | 当前账号 revision                 |
| GET   | /operators                         | operator:read                | 无                                |
| GET   | /roles                             | operator:read                | 无，预置角色只读                  |
| POST  | /operators                         | operator:manage              | 无，创建含稳定 clientUuid         |
| PATCH | /operators/{uuid}                  | operator:manage              | 目标账号 revision                 |
| POST  | /operators/{uuid}/password         | operator:manage              | 目标账号 revision                 |
| GET   | /knowledge                         | knowledge:read               | 无                                |
| GET   | /knowledge/{articleUuid}/versions  | knowledge:read               | 无                                |
| GET   | /knowledge/versions/{uuid}         | knowledge:read               | 无                                |
| POST  | /knowledge                         | knowledge:edit               | 无，创建含 clientUuid/versionUuid |
| POST  | /knowledge/{articleUuid}/versions  | knowledge:edit               | 条目 articleRevision              |
| PATCH | /knowledge/versions/{uuid}         | knowledge:edit + 作者draft   | 版本 revision                     |
| POST  | /knowledge/versions/{uuid}/submit  | knowledge:edit + 作者draft   | 版本 revision                     |
| POST  | /knowledge/versions/{uuid}/review  | knowledge:review + 非作者    | 版本 revision                     |
| POST  | /knowledge/versions/{uuid}/publish | knowledge:publish + approved | 版本 revision                     |
| POST  | /knowledge/{articleUuid}/withdraw  | knowledge:publish            | 条目 articleRevision              |
| GET   | /audits                            | audit:read                   | 无                                |
| GET   | /capabilities                      | 登录                         | 无                                |

没有 `GET /operators/{uuid}` 单详情，也没有删除知识、撤回送审、编辑权限码或回滚接口。

## 3. 分页与编辑页载入

现有分页请求 `beforeId?`、`limit`（默认20，最大100），响应 `data.records` 和 `data.nextBeforeId`；没有 total。按内部 ID 降序；nextBeforeId=null 表示没有下一批。浏览器保存前驱游标栈实现往返，不自行把 UUID 当作 beforeId。

现有目录无关键词、状态、分类等搜索参数。禁止仅筛选当前页充当全库结果。返回列表恢复 URL 与游标；page size 改变时回首批。

管理员编辑页从列表最新 `OperatorResponse` 取得 uuid/username/displayName/state/revision/roleCodes。直接链接或刷新缺摘要时，第一阶段提供“返回列表重新选择”恢复入口，不盲目遍历全库或猜测字段；后续补单详情 API 才提供可靠的独立深链编辑。保存冲突同样要求重新获取新摘要。

## 4. 内容字段与状态

`DraftContentRequest`：

| 字段                      | 当前约束                                            |
| ------------------------- | --------------------------------------------------- |
| title                     | 非空，最长160                                       |
| category                  | 非空，最长64；当前是字符串，不假定已有分类字典 API  |
| proContent / plainContent | 各非空，最长20000，纯文本                           |
| references                | 非null，最多30条；单条非空、最长500；草稿允许空列表 |
| evidenceNote              | 非空，最长2000                                      |

新建还需稳定 `clientUuid`、`versionUuid` 与 slug，slug 匹配 `[a-z0-9][a-z0-9-]{2,99}`。送审要求至少一条引用。审核 body 为 `decision: approve|reject`、非空 note（最长2000），并非只在驳回时才需要意见。

列表摘要只有：articleUuid、slug、articleRevision、uuid、versionNo、title、category、state、revision、currentlyPublished。本轮增加authorUuid、authorName、createdAt、publishedAt；仍无updatedAt、submittedAt和当前发布版本号，不得伪造。

详情增加 proContent、plainContent、references、evidenceNote、authorUuid、reviewerUuid、reviewNote、publishedAt。只有 UUID 时显示可读截断标识，不凭空映射为“编辑A”；现有详情没有 submittedAt，需该信息时列入接口扩展。

| 版本状态  | 中文   | 可执行下一步（还需权限）   |
| --------- | ------ | -------------------------- |
| draft     | 草稿   | 作者编辑/送审              |
| submitted | 待审核 | 非作者批准/驳回            |
| approved  | 已批准 | 发布                       |
| rejected  | 已驳回 | 新建修订版本，不覆写原版本 |
| published | 已发布 | 当前发布指针指向时可下架   |
| withdrawn | 已下架 | 查看历史，后续修订走新版本 |

`currentlyPublished` 与历史 state 分别展示。新版本发布后旧版历史可能仍标 published，但已非当前。审核 note、来源登记不等于自动完成医学认证。

## 5. 幂等与并发

除登录、退出外的写请求带 `Idempotency-Key: 小写UUID v4`。创建 body UUID 在重试中保持。更新和状态变化另带 `If-Match: "revision"`，取正确的账号/条目/版本，而不是展示用 versionNo。

前端为一次明确动作建立 `{key,payload,revision,resource}` 运行上下文，超时保持这组值重试；修改 payload 或开始新动作时创建新 key。不要在通用请求拦截器每次自动重建 key。

写回执只有 uuid/revision/state/parentUuid，不能直接当完整详情。恢复旧幂等回执后依然需要读取最新详情；成功保存得到新 revision，送审必须使用新值。HTTP 超时不等于命令一定失败。

## 6. 错误处理

| HTTP         | Web 行为                                               |
| ------------ | ------------------------------------------------------ |
| 400/422      | 区分字段与表单错误，保留输入，映射服务端业务码         |
| 401          | 清会话，安全回登录，重登取 /me                         |
| 403          | 权限不足/自审限制等具体原因，不能无限重试              |
| 404          | 资源不存在，提供返回来源                               |
| 409          | 区分 revision/state/idempotency 冲突，保留输入查看最新 |
| 428          | 缺失前置版本，修复载入/请求，不盲目重发                |
| 429          | 显示限流状态；服务端提供时间才显示倒计时               |
| 503/网络超时 | 保留已有数据和动作上下文，提供适当重试                 |

密码策略按当前服务：至少12个 Java 字符长度单位，UTF-8 最长72字节；前端用 JS length 与 TextEncoder 对齐当前约束，不能只验字符个数或悄悄截断。生产策略变更以服务端为准。

## 7. 本轮新增读接口（已实现）

以下省略公共前缀/admin/api/v1。所有列表均在服务端筛选后执行游标分页，不返回正文、密码或虚构总数。

| 方法/路径 | 权限 | 契约 |
| --- | --- | --- |
| GET /dashboard/summary | dashboard:read | 按当前权限返回管理库计数；user:read时聚合用户统计，失败返回userStatus=unavailable和users=null |
| GET /dashboard/user-trend?days=7 | user:read | 1–30天注册数，缺日补零，Asia/Shanghai日期与updatedAt，不冒充DAU |
| GET /dashboard/recent-activity | audit:read | 最近5条审计摘要 |
| GET /users、/users/{uuid} | user:read | 匿名uuid、state、createdAt、lastLoginAt、activeSessions；列表q/state/start/end/beforeId/limit |
| GET /knowledge/review-queue | knowledge:review | 全库submitted并排除作者本人；q/category/state/beforeId/limit |
| GET /knowledge/release-queue | knowledge:publish | view=approved（默认）或current；全库查询后分页 |
| GET /operators/{uuid} | operator:read | 公开账号字段、最新revision和roleCodes |
| GET /system/health | operator:read | checkedAt、database/redis up或down、userService up或unavailable；真实探测且有限超时 |

知识目录支持q（标题/slug）、category、state、start/end。管理员支持q（用户名/姓名）、state、role。审计支持q（姓名/资源UUID/requestId）、action、result、start/end。日期为北京时间起止日，结束日包含整日。q最长100，默认limit20，范围1–100；非法输入400/422。筛选先于分页，LIKE中的%/_/!作为字面字符转义。

V2权限迁移向四个角色增加dashboard:read，仅security_admin增加user:read；保留原有职责分离。健康探测不等同capabilities静态能力。

用户服务内部GET /internal/admin/users、/users/{uuid}、/user-stats通过独立ADMIN_READ_KEY验证，最少32字符、恒时比较；无配置503，缺失/错误403。管理服务内部聚合，浏览器不直连内部口。HTTP连接超时1.5秒、读超时2.5秒，查询超时3秒；参数错误不伪装成服务不可用。用户公开UUID由Java随机生成，迁移为旧账号回填，不暴露数据库主键或微信索引。

详情仍未扩展submittedAt/updatedAt；无自定义角色编辑、用户健康档案或用户停用接口。
## 8. 模型、内容与 App 分发

当前capabilities表示源码实现能力，不代替服务健康；miniappContentDelivery已实现。modelRelease、feedback、jobs、deletions、mfa、releaseRollback仍关闭。

管理服务GET /internal/content/knowledge及/{articleUuid}通过X-Content-Read-Key供用户服务读取，独立CONTENT_READ_KEY至少32字符。只返回当前published指针。目录支持q、category、beforeId、limit（1—100）；详情返回uuid、versionUuid、versionNo、title、category、publishedAt（UTC）、proContent、plainContent、references、evidenceNote，不含作者或审核意见。

用户服务GET /api/v1/knowledge及/{articleUuid}供游客读取，no-store；下架或非当前内容404，服务异常503。App通过“后台已发布知识”读取，不保存历史发布正文缓存。Web依赖检查同时验证用户服务和反向内容读取链路。发布不改本地PRD JSON、公式或医学参考参数，不声称已有用户已刷新；已展示文字无法远程抹除。模型仍需要独立原文、系数、适用范围、授权、复核与回归证据。
