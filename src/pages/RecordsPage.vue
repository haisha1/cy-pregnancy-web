<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCursorList } from "../composables/useCursorList";
import { displayDate } from "../domain/content";
import { useUi } from "../stores/ui";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyButton from "../components/CyButton.vue";
import CySearch from "../components/CySearch.vue";
import CySelect from "../components/CySelect.vue";
import CyDateRange from "../components/CyDateRange.vue";
import CyDataTable from "../components/CyDataTable.vue";
import CyBadge from "../components/CyBadge.vue";
import CyLoadState from "../components/CyLoadState.vue";
import CyCursorPagination from "../components/CyCursorPagination.vue";
import CyAlert from "../components/CyAlert.vue";
const route = useRoute(),
  router = useRouter(),
  ui = useUi();
const kind = computed(() => String(route.meta.kind)),
  list = useCursorList(() => "/" + kind.value);
const audit = computed(() => kind.value === "audits"),
  users = computed(() => kind.value === "users");
const title = computed(() =>
  audit.value ? "审计日志" : users.value ? "用户管理" : "管理员账号",
);
// 同一套列表、筛选和游标分页组件供三个模块复用，列定义只描述各模块的数据差异。
const columns = computed(() =>
  audit.value
    ? [
        { key: "occurredAt", label: "发生时间" },
        { key: "actorName", label: "操作人" },
        { key: "action", label: "操作" },
        { key: "resourceUuid", label: "资源标识" },
        { key: "resultCode", label: "结果" },
        { key: "requestId", label: "请求标识" },
      ]
    : users.value
      ? [
          { key: "uuid", label: "匿名账号标识" },
          { key: "state", label: "状态" },
          { key: "createdAt", label: "注册时间" },
          { key: "lastLoginAt", label: "最近登录" },
          { key: "activeSessions", label: "有效会话" },
          { key: "actions", label: "操作" },
        ]
      : [
          { key: "displayName", label: "姓名 / 用户名" },
          { key: "roleCodes", label: "角色" },
          { key: "state", label: "状态" },
          { key: "actions", label: "操作" },
        ],
);
const dates = computed<[string, string] | null>(() =>
  route.query.start && route.query.end
    ? [String(route.query.start), String(route.query.end)]
    : null,
);
const filtered = computed(
  () =>
    !!(
      route.query.q ||
      route.query.state ||
      route.query.start ||
      route.query.role ||
      route.query.action ||
      route.query.result
    ),
);
function clear() {
  return list.filters({
    q: undefined,
    state: undefined,
    start: undefined,
    end: undefined,
    role: undefined,
    action: undefined,
    result: undefined,
  });
}
async function copy(value: unknown) {
  try {
    await navigator.clipboard.writeText(String(value));
    ui.notify("请求标识已复制");
  } catch {
    ui.notify("复制失败，请选中文本复制");
  }
}
</script>
<template>
  <CyPageHeader
    :title="title"
    :subtitle="
      audit
        ? '保留操作结果与追踪标识'
        : users
          ? '仅展示匿名账号与会话摘要'
          : '按预置角色分配管理权限'
    "
    ><CyButton v-if="!audit && !users" @click="router.push('/operators/new')"
      >新建账号</CyButton
    ></CyPageHeader
  >
  <div class="route-body">
    <CyAlert v-if="users"
      >用户模块提供真实账号只读查询，不展示口令、设备密钥或孕期健康明细。</CyAlert
    ><CyCard
      ><div class="filterbar">
        <CySearch
          :model-value="String(route.query.q || '')"
          :label="
            audit
              ? '搜索操作人、资源或请求标识'
              : users
                ? '搜索匿名账号标识'
                : '搜索姓名或用户名'
          "
          @search="list.filters({ q: $event })"
        /><CySelect
          v-if="!audit"
          label="账号状态"
          :model-value="String(route.query.state || '')"
          :options="[
            { label: '全部状态', value: '' },
            { label: '启用', value: 'active' },
            { label: '停用', value: 'disabled' },
          ]"
          @update:model-value="list.filters({ state: $event })"
        /><CyDateRange
          v-if="audit || users"
          :model-value="dates"
          label="日期范围"
          @update:model-value="
            list.filters({ start: $event?.[0], end: $event?.[1] })
          "
        /><CyButton kind="secondary" @click="clear">重置</CyButton
        ><CyButton kind="ghost" :disabled="list.busy.value" @click="list.load"
          >刷新</CyButton
        >
      </div>
      <CyLoadState
        :busy="list.busy.value"
        :error="list.error.value"
        :empty="!list.rows.value.length"
        :has-data="!!list.rows.value.length"
        :filtered="filtered"
        @retry="list.load"
        @clear="clear"
        ><CyDataTable :rows="list.rows.value" :columns="columns" :label="title"
          ><template #cell-displayName="{ row }"
            >{{ row.displayName }}
            <p class="caption">{{ row.username }}</p></template
          ><template #cell-roleCodes="{ row }">{{
            (row.roleCodes as string[]).join("、")
          }}</template
          ><template #cell-state="{ row }"
            ><CyBadge :state="String(row.state)" /></template
          ><template #cell-createdAt="{ row }">{{
            displayDate(row.createdAt)
          }}</template
          ><template #cell-lastLoginAt="{ row }">{{
            displayDate(row.lastLoginAt)
          }}</template
          ><template #cell-occurredAt="{ row }">{{
            displayDate(row.occurredAt)
          }}</template
          ><template #cell-requestId="{ row }"
            ><span class="mono small">{{ row.requestId }}</span
            ><CyButton
              kind="ghost"
              :aria-label="'复制请求标识 ' + row.requestId"
              @click="copy(row.requestId)"
              >复制</CyButton
            ></template
          ><template #cell-actions="{ row }"
            ><RouterLink :to="'/' + kind + '/' + row.uuid">{{
              users ? "查看详情" : "编辑账号"
            }}</RouterLink></template
          ></CyDataTable
        ></CyLoadState
      ><CyCursorPagination
        :previous="!!list.previous.value.length"
        :next="!!list.next.value"
        :limit="list.limit.value"
        :busy="list.busy.value"
        @back="list.back"
        @forward="list.forward"
        @limit="list.filters({ limit: $event })"
    /></CyCard>
  </div>
</template>
