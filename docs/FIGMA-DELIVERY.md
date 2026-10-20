# 管理端 Figma 实际交付

日期：2026-10-19。已使用 Figma 插件新建独立设计文件，原 App 文件未修改。

- [打开设计文件与封面](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=9-3243)
- [从登录体验原型](https://www.figma.com/proto/aDVCwXrPWAwvhPTZBGFBLT?node-id=11-180)
- [从工作台体验模块导航](https://www.figma.com/proto/aDVCwXrPWAwvhPTZBGFBLT?node-id=11-578)
- [本地节点与验证清单](../artifacts/figma/delivery.json)

## 1. 模块分区

| Figma Page               | 内容                                             | 入口                                                                            |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 00-Cover                 | 交付范围与模块索引                               | [封面](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=9-3243)      |
| 01-Foundations           | 双主题、颜色、字体、圆角、玻璃与降级             | [规范](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=9-3157)      |
| 02-Base Components       | 基础组件、图标、变体与状态对照板                 | [组件板](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=9-3405)    |
| 03-Business Components   | 表格、双表达、引用依据、审核、历史、能力等       | [双表达组件](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=4-274) |
| 04-Content               | W05-W08：列表、新建、编辑、详情                  | [知识列表](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=5-2)     |
| 05-Review & Release      | W09-W11：队列、审核与发布                        | [审核详情](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=7-1189)  |
| 06-Account & System      | W01、W12-W18：登录、账号、角色、审计、能力、改密 | [登录](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=7-2)         |
| 07-Overview & Users      | W02-W04：工作台与最小账号查询                    | [工作台](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=7-1441)    |
| 08-States & Responsive   | 异常、确认、控件展开、响应式                     | [冲突状态](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=9-1345)  |
| 09-Interactive Prototype | 同页跨模块导航与流程演示                         | [原型](https://www.figma.com/proto/aDVCwXrPWAwvhPTZBGFBLT?node-id=11-180)       |
| 99-Dev Handoff           | 组件与开发契约映射                               | [交付说明](https://www.figma.com/design/aDVCwXrPWAwvhPTZBGFBLT?node-id=9-3541)  |

页面复用公共与业务组件实例，文字、图标和布局可编辑，没有整页截图图层。导航图标来自 App 原始 SVG，并使用 INSTANCE_SWAP；主组件留在组件分区，不拆散实例。

## 2. 实际数量与口径

| 项目     | 实际交付                                                                          |
| -------- | --------------------------------------------------------------------------------- |
| 模块     | 11个Figma Page                                                                    |
| 业务页面 | W01-W18，18类，Light/Dark共36张默认稿                                             |
| 状态     | 34张：12类状态双主题、4类确认双主题、控件展开双主题                               |
| 响应式   | 6张：390px登录双主题、768px纵排审核、1024px导航展开、1280px表格横滚、1920px工作台 |
| 主组件   | 58个，基础40、业务18；其中基础含5个矢量图标                                       |
| 组件集   | 8套，共32个变体，其余为独立复用组件                                               |
| 变量     | 110个：62原始色、31个App共享语义色、16尺寸、1个Web危险动作色                      |
| 样式     | 7个Noto Sans SC文字样式、1个玻璃效果样式                                          |
| 原型镜像 | 60张，排除在36张默认稿之外                                                        |
| 原型连接 | 回读确认524条，另有封面4条模块链接、2个原型起点                                   |

长表单按内容扩展画板高度。状态、响应式、说明板与原型镜像分别计数，不混作新增业务页面；响应式是关键模板示例，并非18页所有断点的穷举稿。

## 3. 原型与真实能力边界

原型覆盖登录、模块导航、主题切换、创建、编辑、送审、批准/驳回、管理库发布和下架的状态演示。深层实例连接已重新解析并逐条回读，当前导航不向自身跳转；集中同一Page避免跨Page导航限制。

这些连接不调用服务，也不证明Web实现完成。统计、最小用户查询、全量队列保留接口待补标识；没有伪造实时KPI、数据库/Redis健康或App分发成功。正文和引用是设计结构示例，不代表临床审批。

## 4. 验证与维护

- 已视觉查看18类业务页面，覆盖浅深色代表稿；修正横向自动布局高度导致的正文重叠。
- 对36张默认稿及主要状态稿检查字体、实例、正文高度和整页位图；字体为Noto Sans SC，无完整UI位图。
- 修正输入错误说明、状态标签、危险按钮对比以及390px输入宽度和视口裁切。
- 110个变量均有WEB代码语法，未遗留ALL_SCOPES；语义色使用别名，原始色按规范隐藏作用域。
- 原型524条连接和起点已回读；节点与统计见delivery.json。

Figma中的焦点、禁用、忙碌等是设计状态，不代表浏览器键盘、读屏器、权限、接口或构建已验收。

后续先修改Theme/组件，再检查业务实例与原型镜像，避免只改单页。Web运行组件已建立；本轮未创建Code Connect映射，设计组件与运行组件的名称差异见COMPONENTS.md。

`scripts/figma-*.js` 是Figma Plugin API构建片段，依赖编排注入的页面ID、组件ID和辅助函数，不是可直接node执行的Web代码；不要对已交付文件盲目重跑创建步骤。维护以delivery.json和实际画布为准。
