# Web代码阅读指南

先读src/main.ts → App.vue → router.ts → layouts/AdminShell.vue，再读pages/ContentEditor.vue → composables/useCommand.ts → services/http.ts。这条路径覆盖初始化、页面切换、输入和保存。

## Vue3基础

`<script setup lang="ts">`里的顶层变量、函数和导入组件可以直接用于本文件template，无需data/methods/components注册。脚本按组件实例执行。

`ref('')`包装单值，脚本读写使用.value，模板顶层ref自动解包。比如脚本password.value对应模板v-model="password"。普通对象里的嵌套ref不会统一解包，所以list.busy.value仍明确写.value。

`reactive({...})`用于表单字段，直接form.title读写。不要将响应式对象解构成普通变量后期待同步。computed表示派生值，例如由快照计算dirty；watch处理请求、主题等副作用，卸载时清理请求和监听。

`defineProps`接收父组件输入，`defineEmits`向父组件通知。CyInput用modelValue/update:modelValue组成v-model：子组件发出字符串，父组件更新自己的字段，不直接修改父对象。

Pinia跨页面共享状态。auth保存身份/权限，theme保存非秘密偏好，ui管理确认/通知。直接使用store属性保持响应性，解构时使用storeToRefs。

## 一次保存的调用链

1. CyInput将输入回传给ContentEditor.form，computed计算是否有未保存修改。
2. domain/content.ts校验标题、双表达、引用、证据和slug，与后端DTO对齐。
3. useCommand.send锁定busy，生成幂等key；同一失败动作重试时保留key。
4. http.ts附加Bearer、Idempotency-Key、带引号的If-Match，处理统一响应、超时和会话事件。
5. 后端检查权限、作者、状态、revision；业务数据、审计和幂等回执同事务写入。
6. 页面读最新详情；新建进详情，编辑留页，送审是保存后的独立确认。

versionNo是给人看的内容版本；revision是并发锁，不能混用。articleRevision用于新增版本/下架条目，版本revision用于正文修改/送审/审核/发布，不在前端自己加1。

## 列表与异常

useCursorList共用服务端筛选、请求取消、上一批/下一批。无总数契约，不提供任意跳页。RecordsPage为管理员、用户、审计组合不同列，KnowledgeList复用知识/审核/发布。

读请求失败显示可重试错误，不冒充空数据；写失败保留输入。超时代表结果未知，不能立即建立第二次动作。401重登，409明确加载新版本。知识草稿只暂存在本标签页内存，密码不恢复。

后端读接口独立放AdminReadController/Service/Mapper。用户查询只投影匿名UUID和会话摘要，内部只读密钥不进入浏览器。管理库发布与App分发不同，登记引用也不等于完成临床认证。