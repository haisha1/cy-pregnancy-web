# 公共组件与页面模板

状态：Web运行组件已创建于src/components；Figma设计组件已完成，见 [实际交付](FIGMA-DELIVERY.md)。视觉值只读取 [DESIGN](../DESIGN.md)，交互只读取 [UX-CONTRACT](../UX-CONTRACT.md)。Web 与 App 复用设计契约，不把依赖 uni-app 标签/生命周期的 .vue 文件直接复制进浏览器工程。

## 1. App → Web 对照

| App 参考                 | Web 计划组件                     | 保留                              | 桌面扩展                                 |
| ------------------------ | -------------------------------- | --------------------------------- | ---------------------------------------- |
| GaPage                   | CyAdminShell、CyPageHeader       | 主题、统一外壳、离线/错误提示     | 侧栏、面包屑、账号区                     |
| GaCard                   | CyGlassCard                      | 24px 圆角、描边、高光、模糊与降级 | default/strong 两种工作面                |
| GaButton                 | CyButton、CyIconButton           | 动作渐变、次级玻璃、禁用/busy     | 40px 标准、32px 行内、44px touch         |
| GaField                  | CyField、CyTextField、CyTextArea | 标签、错误区、单向数据流          | 字段错误摘要、纯文本长文                 |
| GaDateField              | CyDateRange                      | 纯日期语义、中文标签              | authored 桌面日期面板；不复用 uni picker |
| GaTabs                   | CyTabs、CySegmented              | 蓝色选中与同源材质                | 键盘方向键、路由/非路由变体              |
| GaSearch                 | CySearchField                    | 清除操作、保留输入                | IME、防抖、取消旧请求                    |
| GaNotice/GaEmpty         | CyAlert、CyEmpty、CyLoadState    | 中文说明与明确下一步              | 区分空/无结果/失败/未接入                |
| GaReference/GaSourceList | CyReferenceEditor、CySourceList  | 来源可追溯                        | 编辑引用、送审校验                       |
| GaResultChart            | CyTrendChart                     | 同源图表颜色、文字替代            | 运营趋势；不复用临床参考曲线逻辑         |
| 无直接对应               | CyDataTable、CyCursorPagination  | 同源工作面                        | 服务端游标、可访问 table                 |
| 平台确认与 toast         | CyDialog、CyNotificationProvider | 统一反馈与动作语义                | 浏览器焦点陷阱、回焦、live region        |

Cy 前缀为管理端自己的外观/行为适配层；下层可选成熟可访问组件库，不能把库默认皮肤直接作为交付设计。

## 2. 基础组件责任

| 组件               | 输入/事件约定                                    | 不负责什么                   |
| ------------------ | ------------------------------------------------ | ---------------------------- |
| CyButton           | intent、emphasis、size、busy、disabled；click    | API 调用、权限推断           |
| CyGlassCard        | surface=default/strong；header/body/footer 插槽  | 每页自定义颜色/玻璃实现      |
| CyField            | label、required、help、error、fieldId；控件插槽  | 隐式修改业务表单             |
| CyTextField        | modelValue/update:modelValue；type、readonly     | 把输入中空字符串自动转成 0   |
| CySelect           | modelValue、options、multiple；update            | 与 Table Selection 混用      |
| CyDataTable        | columns、rows、rowKey、loading、error、empty     | 按当前页伪造全库统计         |
| CyCursorPagination | limit、nextBeforeId、前驱栈可用性；navigate      | 虚构总数与任意页跳转         |
| CyDialog           | open、title、description、pending；close/confirm | 关闭即代表服务器动作取消     |
| CyStateBadge       | domain、state、label                             | 单凭绿色表示正常或医学结论   |
| CyLoadState        | loading/error/empty/unavailable/stale            | 用同一“暂无数据”覆盖所有情况 |

props 名称为规划契约；实现时一次性在组件层落地并同步文档，不允许各页采用互不兼容命名。`intent` 与 `emphasis` 分别表示语义和强调程度，避免危险色与主按钮混为一谈。

## 3. 业务复用组件

- `KnowledgeIdentity`：标题、slug、版本号、状态和 currentlyPublished，区分条目和版本。
- `DualExpressionEditor/Viewer`：共享双表达布局、标签、字数、只读/编辑态；不注册 App 全局模式切换。
- `ReferenceEvidencePanel`：引用列表与依据；字段上限来自 API DTO，送审时检查至少一条引用。
- `VersionHistory`：按条目载入版本摘要，选中后查看正文，不每行请求完整双表达。
- `ReviewDecisionPanel`：审核意见、approve/reject、作者自审说明、失败保留输入。
- `PublishScopeNotice`：统一解释“管理库发布”与 App 分发的边界。
- `OperatorRoleFields`：预置角色选择、状态变更说明和会话撤销提醒。
- `CapabilityList`：布尔能力状态，不渲染未提供的数据库健康数据。

状态词典放 `domain/knowledge.ts` 等领域文件。相同 state 的中文、颜色和操作可用性只维护一次；权限检查仍由服务端兜底。

## 4. 页面模板

1. **ListPage**：标题/主动作 → 条件区（接口允许时）→ LoadState → DataTable → CursorPagination。
2. **FormPage**：标题/脏状态 → 错误摘要 → 字段分组 → 底部动作；自然滚动，窄屏单栏。
3. **ResourceDetail**：身份 → 状态/范围提示 → 正文 → 来源 → 历史 → 权限/状态允许的动作。
4. **ReviewDetail**：资源详情 + 固定 ReviewDecisionPanel；来源返回可指向知识详情或队列。
5. **ReadOnlyMatrix**：角色/能力/审计只读内容，不复用可编辑表单外观造成误解。

## 5. 组件设计交付顺序

先完成 Theme/Dimensions → Card/Button/Field/Badge → Shell/Table/Dialog/Select → 业务双表达/来源/版本 → 四个代表页面 → 其余页面。

每个组件交付 Light/Dark、尺寸变体及适用的 default、hover、focus、selected、disabled、busy、error。组件状态在组件集维护，不用几十张手工不一致副本替代。

## 运行时名称映射

CyGlassCard→CyCard；CyField/TextField/TextArea→CyInput；CySearchField→CySearch；Empty→CyLoadState；NotificationProvider→CyDialogProvider/useUi；游标分页→CyCursorPagination/useCursorList；确认→useUi.confirm。复合控件由Element Plus提供键盘/浮层底层，Cy负责品牌适配。不存在的未来组件名称不可视为可导入代码。
