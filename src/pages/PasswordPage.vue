<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../stores/auth";
import { useUi } from "../stores/ui";
import { useCommand } from "../composables/useCommand";
import { validPassword } from "../domain/content";
import { errorText } from "../services/http";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyInput from "../components/CyInput.vue";
import CyButton from "../components/CyButton.vue";
import CyAlert from "../components/CyAlert.vue";
const oldPassword = ref(""),
  newPassword = ref(""),
  confirmation = ref(""),
  error = ref(""),
  auth = useAuth(),
  ui = useUi(),
  router = useRouter(),
  command = useCommand();
async function submit() {
  error.value = "";
  if (
    !oldPassword.value ||
    !validPassword(newPassword.value) ||
    newPassword.value !== confirmation.value
  ) {
    error.value = "请填写原密码，新密码至少12字符、最多72字节，且两次输入一致";
    return;
  }
  try {
    await command.send(
      "/auth/password",
      { oldPassword: oldPassword.value, newPassword: newPassword.value },
      auth.identity!.operator.revision,
    );
    oldPassword.value = "";
    newPassword.value = "";
    confirmation.value = "";
    auth.clear();
    ui.notify("密码已更新，请重新登录");
    await router.replace("/login");
  } catch (e) {
    error.value = errorText(e);
  }
}
</script>
<template>
  <CyPageHeader
    title="修改密码"
    subtitle="更新后当前账号全部会话将失效"
  /><CyCard class="password-card"
    ><form class="stack" novalidate @submit.prevent="submit">
      <CyAlert v-if="error" tone="error">{{ error }}</CyAlert
      ><CyInput
        v-model="oldPassword"
        label="原密码"
        type="password"
        autocomplete="current-password"
      /><CyInput
        v-model="newPassword"
        label="新密码"
        type="password"
        autocomplete="new-password"
        help="至少12字符，UTF-8最多72字节"
      /><CyInput
        v-model="confirmation"
        label="确认新密码"
        type="password"
        autocomplete="new-password"
      />
      <div>
        <CyButton type="submit" :busy="command.busy.value">更新密码</CyButton>
      </div>
    </form></CyCard
  >
</template>
