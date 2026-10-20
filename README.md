# 春雨孕算 · 管理端 Web

Vue 3 + TypeScript + Vite 管理工作台，沿用App蓝青渐变、玻璃卡片和双主题。已经接入真实Java管理服务与用户只读服务，覆盖登录、工作台、知识版本、独立审核、发布下架、用户查询、管理员、角色和审计。

设计来源：[Figma设计](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=9-3243)、[交互原型](https://www.figma.com/proto/aDVCwXrPWAwvhPTZBGFBLT?node-id=11-180)。颜色从 [App palette](../app/cy-pregnancy/styles/theme.ts) 自动生成，前端不维护第二套品牌色。

## 本机启动

需要Node ≥22.12、Java8、Maven、MySQL8、Redis。沿用两个服务的local配置；脚本支持JdkPath/MavenPath参数。

```powershell
cd D:\code\cy-pregnancy\web
npm ci
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

脚本隐藏启动三个进程，跳过已占用端口；日志在忽略目录`.local/*.log`。Java初次编译需要等待。打开 [管理工作台](http://127.0.0.1:5174)，管理服务18732、用户服务18731。浏览器通过Vite代理访问管理API，不持有服务间密钥。

首次空管理库创建`local_admin`，随机密码保存在`../cy-pregnancy-admin/server/.local/bootstrap-password.txt`，在本机文件查看，登录后修改。脚本不会重置现有账号。初始账号只有安全管理员权限，请在“管理员”分别创建编辑、审核和发布账号；作者不能自审。

也可分别运行两个服务的`scripts/dev.ps1 -Task run`和前端`npm run dev`。分开启动时先运行管理服务，生成供本机用户服务读取的内部只读密钥。

## 阅读与维护

| 文档 | 内容 |
| --- | --- |
| [代码阅读](docs/CODE-READING.md) | Vue3基础、响应式、代码分层、保存调用链 |
| [运行与验收](docs/IMPLEMENTATION.md) | 实现范围、测试、部署、已知限制 |
| [需求](REQUIREMENTS.md) | 角色和18类页面 |
| [设计](DESIGN.md) | App同源风格与Web文字对比度变体 |
| [交互契约](UX-CONTRACT.md) | 权限、分页、冲突和恢复 |
| [页面结构](WIREFRAMES.md) | 布局与响应式 |
| [组件](docs/COMPONENTS.md) | 共享组件与设计映射 |
| [API契约](docs/API-CONTRACT.md) | 字段、筛选、幂等、并发与错误 |
| [开发约定](docs/DEVELOPMENT.md) | 技术栈、目录、维护方法 |
| [Figma交付](docs/FIGMA-DELIVERY.md) | 设计、组件和原型证据 |
| [验收清单](docs/ACCEPTANCE.md) | 设计与工程检查范围 |

```powershell
npm run tokens:check
npm run check:docs
npm test
npm run typecheck
npm run format:check
npm run build
# 三个本机服务运行时执行；创建测试账号，完成后停用，不清空开发库
npm run test:e2e
```

Bearer仅存内存，刷新页面需要重新登录。知识草稿在会话过期时按账号在本标签页内存暂存，刷新或关闭不恢复。生产使用同源HTTPS，样例见 [Nginx](deploy/nginx.conf.example)。

知识发布已接通用户服务只读分发。医学模型发布、OCR、云同步、反馈、删除申请、MFA和回滚仍属后续独立能力。管理端不读取用户孕期健康明细，也不产生新临床公式。