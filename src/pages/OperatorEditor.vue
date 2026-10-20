<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, errorText } from "../services/http";
import { useCommand } from "../composables/useCommand";
import { useUnsaved } from "../composables/useUnsaved";
import { useUi } from "../stores/ui";
import { useAuth } from "../stores/auth";
import { validPassword } from "../domain/content";
import type { Operator, Role, Receipt } from "../types/api";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyButton from "../components/CyButton.vue";
import CyInput from "../components/CyInput.vue";
import CySelect from "../components/CySelect.vue";
import CyLoadState from "../components/CyLoadState.vue";
import CyAlert from "../components/CyAlert.vue";
const route = useRoute(),
  router = useRouter(),
  ui = useUi(),
  auth = useAuth(),
  command = useCommand();
const isNew = computed(() => !route.params.uuid);
const form = reactive({
  username: "",
  displayName: "",
  password: "",
  roleCodes: [] as string[],
  state: "active",
});
const source = ref<Operator | null>(null),
  roles = ref<Role[]>([]),
  loading = ref(false),
  ready = ref(false),
  error = ref(""),
  loadError = ref(""),
  newPassword = ref(""),
  baseline = ref("");
const clientUuid = crypto.randomUUID();
const snapshot = () => JSON.stringify(form);
useUnsaved(() => ready.value && snapshot() !== baseline.value);
async function load() {
  loading.value = true;
  loadError.value = "";
  ready.value = false;
  try {
    roles.value = await api<Role[]>("/roles");
    if (!isNew.value) {
      source.value = await api<Operator>("/operators/" + route.params.uuid);
      Object.assign(form, { ...source.value, password: "" });
    }
    baseline.value = snapshot();
    ready.value = true;
  } catch (e) {
    loadError.value = errorText(e);
  } finally {
    loading.value = false;
  }
}
watch(() => route.fullPath, load, { immediate: true });
async function save() {
  error.value = "";
  if (
    !form.displayName.trim() ||
    form.displayName.length > 64 ||
    !form.roleCodes.length
  ) {
    error.value = "请填写姓名（最多64字符）并选择至少一个角色";
    return;
  }
  if (
    isNew.value &&
    (!/^[a-z][a-z0-9_]{2,39}$/.test(form.username) ||
      !validPassword(form.password))
  ) {
    error.value =
      "用户名须为3–40位小写字母、数字、下划线且以字母开头；密码至少12字符且最多72字节";
    return;
  }
  await ui.confirm({
    title: isNew.value ? "创建管理员账号？" : "保存账号权限与状态？",
    body: "角色或状态变更会使目标账号的已有会话失效；最后一名安全管理员受到服务端保护。",
    confirmText: "保存账号",
    run: async () => {
      const result = await command.send<Receipt>(
        isNew.value ? "/operators" : "/operators/" + source.value!.uuid,
        isNew.value
          ? {
              clientUuid,
              username: form.username,
              displayName: form.displayName,
              password: form.password,
              roleCodes: form.roleCodes,
            }
          : {
              displayName: form.displayName,
              state: form.state,
              roleCodes: form.roleCodes,
            },
        source.value?.revision,
        isNew.value ? "POST" : "PATCH",
      );
      baseline.value = snapshot();
      form.password = "";
      baseline.value = snapshot();
      ui.notify("账号已保存");
      if (result.uuid === auth.identity?.operator.uuid) {
        auth.clear();
        await router.replace("/login");
      } else await router.push("/operators");
    },
  });
}
async function reset() {
  if (!validPassword(newPassword.value)) {
    error.value = "新密码至少12字符且最多72字节";
    return;
  }
  await ui.confirm({
    title: "重置该账号密码？",
    body: "该账号已有会话将全部失效，请通过可信渠道交付新密码。",
    danger: true,
    confirmText: "重置密码",
    run: async () => {
      await command.send(
        "/operators/" + source.value!.uuid + "/password",
        { password: newPassword.value },
        source.value!.revision,
      );
      newPassword.value = "";
      ui.notify("密码已重置");
      if (source.value!.uuid === auth.identity?.operator.uuid) {
        auth.clear();
        await router.replace("/login");
      } else await load();
    },
  });
}
</script>
<template>
  <CyPageHeader
    :title="isNew ? '新建管理员' : '编辑管理员'"
    subtitle="角色基于服务端权限矩阵，不支持输入任意权限"
  /><CyLoadState
    :busy="loading"
    :error="loadError"
    :has-data="ready"
    @retry="load"
    ><div v-if="ready" class="route-body">
      <CyAlert v-if="error" tone="error">{{ error }}</CyAlert
      ><CyCard
        ><form class="stack" novalidate @submit.prevent="save">
          <div class="form-grid">
            <CyInput
              v-model="form.username"
              label="用户名"
              :readonly="!isNew"
              :maxlength="40"
              autocomplete="off"
            /><CyInput
              v-model="form.displayName"
              label="显示姓名"
              :maxlength="64"
            /><CyInput
              v-if="isNew"
              v-model="form.password"
              label="初始密码"
              type="password"
              autocomplete="new-password"
              help="至少12字符，UTF-8最多72字节"
            /><CySelect
              v-model="form.roleCodes"
              label="角色"
              multiple
              :options="roles.map((r) => ({ value: r.code, label: r.name }))"
            /><CySelect
              v-if="!isNew"
              v-model="form.state"
              label="账号状态"
              :options="[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'disabled' },
              ]"
            />
          </div>
          <div class="row">
            <CyButton type="submit" :busy="command.busy.value"
              >保存账号</CyButton
            ><CyButton kind="secondary" @click="router.push('/operators')"
              >返回列表</CyButton
            >
          </div>
        </form></CyCard
      ><CyCard v-if="!isNew"
        ><h2>重置密码</h2>
        <CyInput
          v-model="newPassword"
          label="新密码"
          type="password"
          autocomplete="new-password"
          help="至少12字符，UTF-8最多72字节；不会显示现有密码"
        /><CyButton kind="danger" :disabled="command.busy.value" @click="reset"
          >重置密码</CyButton
        ></CyCard
      >
    </div></CyLoadState
  >
</template>
