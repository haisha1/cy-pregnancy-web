<script setup lang="ts">
import { computed } from "vue";
import { useAuth } from "../stores/auth";
const auth = useAuth();
defineEmits<{ navigate: [] }>();
const entries = computed(() =>
  [
    {
      path: "/overview",
      label: "工作台",
      icon: "overview",
      permission: "dashboard:read",
    },
    {
      path: "/knowledge",
      label: "知识内容",
      icon: "content",
      permission: "knowledge:read",
    },
    {
      path: "/reviews",
      label: "审核工作台",
      icon: "review",
      permission: "knowledge:review",
    },
    {
      path: "/releases",
      label: "发布中心",
      icon: "review",
      permission: "knowledge:publish",
    },
    {
      path: "/users",
      label: "用户管理",
      icon: "users",
      permission: "user:read",
    },
    {
      path: "/operators",
      label: "管理员",
      icon: "system",
      permission: "operator:read",
    },
    {
      path: "/roles",
      label: "角色权限",
      icon: "system",
      permission: "operator:read",
    },
    {
      path: "/audits",
      label: "操作审计",
      icon: "content",
      permission: "audit:read",
    },
    {
      path: "/capabilities",
      label: "系统能力",
      icon: "system",
      permission: "",
    },
  ].filter((e) => !e.permission || auth.can(e.permission)),
);
</script>
<template>
  <aside class="sidebar">
    <RouterLink to="/overview" class="brand"
      ><span>春雨孕算</span><small>管理工作台</small></RouterLink
    >
    <nav class="nav-list" aria-label="主导航">
      <RouterLink
        v-for="e in entries"
        :key="e.path"
        :to="e.path"
        class="nav-item"
        :title="e.label"
        :aria-label="e.label"
        @click="$emit('navigate')"
        ><span class="nav-icon"
          ><img :src="'/icons/' + e.icon + '.svg'" alt="" /></span
        ><span class="nav-text">{{ e.label }}</span></RouterLink
      >
    </nav>
    <p class="sidebar-note">内容有依据<br />版本可追溯</p>
  </aside>
</template>
