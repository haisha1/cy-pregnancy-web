<script setup lang="ts">
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { useRoute } from "vue-router";
import AdminShell from "./layouts/AdminShell.vue";
import CyDialogProvider from "./components/CyDialogProvider.vue";
import { useTheme } from "./stores/theme";
useTheme();
const route = useRoute();
</script>
<template>
  <ElConfigProvider :locale="zhCn"
    ><RouterView v-if="route.meta.public" /><AdminShell v-else
      ><RouterView :key="route.path" /></AdminShell
    ><CyDialogProvider
  /></ElConfigProvider>
</template>
