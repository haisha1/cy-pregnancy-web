<script setup lang="ts">
import { useResource } from "../composables/useResource";
import { useAuth } from "../stores/auth";
import { api, errorText } from "../services/http";
import { ref } from "vue";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyLoadState from "../components/CyLoadState.vue";
import CyButton from "../components/CyButton.vue";
import CyBadge from "../components/CyBadge.vue";
import CyAlert from "../components/CyAlert.vue";
const auth = useAuth(),
  resource = useResource<Record<string, boolean>>(() => "/capabilities"),
  health = ref<Record<string, string> | null>(null),
  busy = ref(false),
  error = ref("");
const labels: Record<string, string> = {
  auth: "管理端登录",
  operators: "管理员账号",
  roles: "角色权限",
  audit: "操作审计",
  knowledgeWorkflow: "知识版本工作流",
  dashboard: "工作台统计",
  userRead: "用户只读查询",
  knowledgeSearch: "知识搜索",
  reviewQueue: "审核队列",
  releaseQueue: "发布队列",
  miniappContentDelivery: "App内容分发",
  modelRelease: "医学模型发布",
  feedback: "反馈工单",
  jobs: "任务管理",
  deletions: "删除申请",
  mfa: "多因素认证",
  releaseRollback: "发布回滚",
};
const healthLabels: Record<string, string> = {
  database: "数据库",
  redis: "Redis",
  userService: "用户服务",
  contentDelivery: "知识分发链路",
};
async function check() {
  busy.value = true;
  error.value = "";
  try {
    health.value = await api<Record<string, string>>("/system/health");
  } catch (e) {
    error.value = errorText(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <CyPageHeader title="系统能力" subtitle="已实现能力与实时依赖状态分别展示" />
  <div class="route-body">
    <CyLoadState
      :busy="resource.busy.value"
      :error="resource.error.value"
      :has-data="!!resource.data.value"
      @retry="resource.load"
      ><CyCard
        ><h2>功能接通情况</h2>
        <div
          v-for="(enabled, key) in resource.data.value"
          :key="key"
          class="capability-row"
        >
          <span>{{ labels[key] || key }}</span
          ><CyBadge :state="enabled ? 'active' : 'unavailable'" /><span
            class="caption"
            >{{ enabled ? "已实现" : "尚未接通" }}</span
          >
        </div></CyCard
      ></CyLoadState
    ><CyCard v-if="auth.can('operator:read')"
      ><div class="row spread">
        <h2>依赖服务检查</h2>
        <CyButton kind="secondary" :busy="busy" @click="check"
          >检查连接</CyButton
        >
      </div>
      <CyAlert v-if="error" tone="error">{{ error }}</CyAlert>
      <p class="caption spaced">
        仅反映检查时刻的连接状态，功能已实现不代表依赖一直可用。
      </p>
      <div v-for="(state, key) in health" :key="key" class="capability-row">
        <template v-if="key !== 'checkedAt'"
          ><span>{{ healthLabels[key] || key }}</span
          ><CyBadge :state="state"
        /></template></div
    ></CyCard>
  </div>
</template>
