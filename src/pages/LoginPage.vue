<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../stores/auth";
import { errorText } from "../services/http";
import { safeReturnTo } from "../domain/content";
import CyCard from "../components/CyCard.vue";
import CyInput from "../components/CyInput.vue";
import CyButton from "../components/CyButton.vue";
import CyAlert from "../components/CyAlert.vue";
const username = ref(""),
  password = ref(""),
  error = ref(""),
  busy = ref(false);
const auth = useAuth(),
  route = useRoute(),
  router = useRouter();
async function login() {
  if (busy.value) return;
  error.value = "";
  if (!username.value.trim() || !password.value) {
    error.value = "请填写用户名和密码";
    return;
  }
  busy.value = true;
  try {
    await auth.login(username.value.trim(), password.value);
    password.value = "";
    await router.replace(safeReturnTo(route.query.returnTo));
  } catch (e) {
    error.value = errorText(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="login-page">
    <section class="login-brand">
      <div class="brand">春雨孕算</div>
      <h1>同一份内容，更清楚地维护。</h1>
      <p>专业与白话双表达<br />独立审核与发布<br />来源和版本可追溯</p>
    </section>
    <CyCard class="login-form"
      ><h2>登录管理工作台</h2>
      <p class="muted">使用分配给你的管理员账号登录</p>
      <form class="stack" novalidate @submit.prevent="login">
        <CyAlert v-if="route.query.expired" tone="warning"
          >登录已过期，请重新登录。未提交内容只在当前会话中暂存。</CyAlert
        ><CyInput
          v-model="username"
          label="用户名"
          autocomplete="username"
          :maxlength="64"
          placeholder="请输入用户名"
        /><CyInput
          v-model="password"
          label="密码"
          type="password"
          autocomplete="current-password"
        /><CyAlert v-if="error" tone="error">{{ error }}</CyAlert
        ><CyButton type="submit" :busy="busy">登录</CyButton>
      </form>
      <p class="caption">管理员账号与 App 用户账号相互独立</p></CyCard
    >
  </div>
</template>
