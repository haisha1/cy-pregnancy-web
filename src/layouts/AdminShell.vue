<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElDrawer } from "element-plus";
import { useAuth } from "../stores/auth";
import { useTheme } from "../stores/theme";
import { useUi } from "../stores/ui";
import CyButton from "../components/CyButton.vue";
import CySelect from "../components/CySelect.vue";
import SidebarNavigation from "./SidebarNavigation.vue";
const auth = useAuth(),
  theme = useTheme(),
  ui = useUi(),
  route = useRoute(),
  router = useRouter();
const drawer = ref(false);
const title = computed(() => String(route.meta.title || "管理工作台"));
async function logout() {
  if (
    await ui.confirm({
      title: "退出管理端？",
      body: "退出后需要重新登录，未保存内容请先处理。",
      confirmText: "退出登录",
    })
  ) {
    try {
      await auth.logout();
    } catch {
      ui.notify("已清除本机登录信息；网络异常，服务端会话撤销尚未确认");
    } finally {
      await router.push("/login");
    }
  }
}
</script>
<template>
  <a class="skip-link" href="#main">跳到主内容</a>
  <div class="admin-shell" :inert="ui.dialog.open || drawer">
    <div class="desktop-sidebar"><SidebarNavigation /></div>
    <div class="main-content">
      <header class="topbar">
        <div class="row">
          <CyButton
            class="mobile-menu"
            kind="secondary"
            aria-label="打开导航"
            @click="drawer = true"
            >菜单</CyButton
          ><span>管理工作台 / {{ title }}</span>
        </div>
        <div class="account-controls">
          <CySelect
            class="theme-select"
            label="界面主题"
            :model-value="theme.preference"
            :options="[
              { label: '跟随系统', value: 'system' },
              { label: '浅色模式', value: 'light' },
              { label: '深色模式', value: 'dark' },
            ]"
            @update:model-value="
              theme.preference = $event as 'system' | 'light' | 'dark'
            "
          /><span class="account-name">{{
            auth.identity?.operator.displayName
          }}</span
          ><RouterLink to="/account/password">修改密码</RouterLink
          ><CyButton kind="ghost" @click="logout">退出</CyButton>
        </div>
      </header>
      <main id="main" tabindex="-1"><slot /></main>
    </div>
  </div>
  <ElDrawer
    v-model="drawer"
    title="管理端导航"
    direction="ltr"
    size="280px"
    class="nav-drawer"
    :append-to-body="true"
    ><SidebarNavigation @navigate="drawer = false"
  /></ElDrawer>
</template>
