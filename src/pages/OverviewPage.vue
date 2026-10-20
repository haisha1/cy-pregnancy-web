<script setup lang="ts">
import { computed } from "vue";
import { useResource } from "../composables/useResource";
import { useAuth } from "../stores/auth";
import type { Summary, Page, Row } from "../types/api";
import CyDataTable from "../components/CyDataTable.vue";
import { displayDate } from "../domain/content";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyButton from "../components/CyButton.vue";
import CyAlert from "../components/CyAlert.vue";
import CyLoadState from "../components/CyLoadState.vue";
const auth = useAuth(),
  resource = useResource<Summary>(() => "/dashboard/summary"),
  summary = resource.data;
const activity = auth.can("audit:read")
  ? useResource<Page<Row>>(() => "/dashboard/recent-activity")
  : null;
const tasks = computed(() =>
  [
    {
      title: "知识内容",
      detail: "编辑专业与通俗表达，维护引用依据",
      to: "/knowledge",
      permission: "knowledge:read",
    },
    {
      title: "待审核版本",
      detail: "核查证据与适用边界，记录审核意见",
      to: "/reviews",
      permission: "knowledge:review",
    },
    {
      title: "发布中心",
      detail: "发布已批准版本，管理当前发布状态",
      to: "/releases",
      permission: "knowledge:publish",
    },
    {
      title: "用户管理",
      detail: "查看匿名账号、注册与会话摘要",
      to: "/users",
      permission: "user:read",
    },
    {
      title: "管理员账号",
      detail: "配置预置角色和账号状态",
      to: "/operators",
      permission: "operator:read",
    },
  ].filter((t) => auth.can(t.permission)),
);
const metrics = computed(() =>
  summary.value
    ? [
        { label: "知识条目", value: summary.value.articles },
        { label: "当前发布", value: summary.value.published },
        { label: "待审核（排除本人）", value: summary.value.pendingReview },
        { label: "待发布", value: summary.value.pendingRelease },
        { label: "我的草稿", value: summary.value.myDrafts },
        { label: "匿名账号总数", value: summary.value.users?.total },
      ].filter((m) => m.value !== undefined)
    : [],
);
// 趋势来自实际注册日期计数，空日期由后端补零；这里只计算SVG坐标，不产生业务统计。
const points = computed(() => {
  const data = summary.value?.users?.trend || [],
    max = Math.max(1, ...data.map((d) => d.count));
  return data
    .map(
      (d, i) =>
        `${10 + (i * 780) / Math.max(1, data.length - 1)},${160 - (d.count / max) * 140}`,
    )
    .join(" ");
});
</script>
<template>
  <CyPageHeader title="工作台" subtitle="按当前权限查看任务与真实数据"
    ><CyButton
      kind="secondary"
      :busy="resource.busy.value"
      @click="resource.load"
      >刷新数据</CyButton
    ></CyPageHeader
  ><CyLoadState
    :busy="resource.busy.value"
    :error="resource.error.value"
    :has-data="!!summary"
    @retry="resource.load"
    ><div v-if="summary" class="route-body">
      <section class="hero-card">
        <div class="hero-readable">
          <h2>{{ auth.identity?.operator.displayName }}，欢迎回来</h2>
          <p>让每条内容有依据，让每次修改可追溯。</p>
          <span class="caption"
            >数据更新于 {{ displayDate(summary.updatedAt) }}</span
          >
        </div>
      </section>
      <div class="metric-grid">
        <CyCard v-for="metric in metrics" :key="metric.label"
          ><p class="muted">{{ metric.label }}</p>
          <div class="metric">{{ metric.value }}</div></CyCard
        >
      </div>
      <CyAlert v-if="summary.userStatus === 'unavailable'" tone="warning"
        >用户服务暂不可用，账号统计无法加载。其他管理功能仍可继续使用。</CyAlert
      >
      <div class="task-grid">
        <RouterLink v-for="task in tasks" :key="task.to" :to="task.to"
          ><CyCard
            ><h2>{{ task.title }}</h2>
            <p class="muted">{{ task.detail }}</p>
            <span class="caption">进入模块 →</span></CyCard
          ></RouterLink
        >
      </div>
      <CyCard v-if="summary.users"
        ><h2>最近注册趋势</h2>
        <p class="caption">按北京时间统计新增匿名账号，非活跃用户统计</p>
        <svg
          class="chart"
          viewBox="0 0 800 180"
          role="img"
          aria-label="最近注册趋势，详细数值见下方表格"
        >
          <line x1="10" y1="160" x2="790" y2="160" stroke="var(--grid)" />
          <polyline
            :points="points"
            fill="none"
            stroke="var(--primary)"
            stroke-width="3"
          />
        </svg>
        <details>
          <summary>查看每日数值</summary>
          <div class="table-scroll chart-point-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">日期</th>
                  <th scope="col">新增账号</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="point in summary.users.trend" :key="point.date">
                  <td>{{ point.date }}</td>
                  <td>{{ point.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details></CyCard
      >
      <CyCard v-if="activity"
        ><div class="row spread">
          <h2>最近操作</h2>
          <RouterLink to="/audits">查看全部审计</RouterLink>
        </div>
        <CyLoadState
          :busy="activity.busy.value"
          :error="activity.error.value"
          :has-data="!!activity.data.value"
          :empty="activity.data.value?.records.length === 0"
          @retry="activity.load"
          ><CyDataTable
            v-if="activity.data.value"
            :rows="activity.data.value.records"
            label="最近操作"
            :columns="[
              { key: 'occurredAt', label: '时间' },
              { key: 'actorName', label: '操作人' },
              { key: 'action', label: '操作' },
              { key: 'resultCode', label: '结果' },
            ]"
            ><template #cell-occurredAt="{ row }">{{
              displayDate(row.occurredAt)
            }}</template></CyDataTable
          ></CyLoadState
        ></CyCard
      >
    </div></CyLoadState
  >
</template>
