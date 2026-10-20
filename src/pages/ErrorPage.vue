<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import CyCard from "../components/CyCard.vue";
import CyButton from "../components/CyButton.vue";
const route = useRoute(),
  router = useRouter();
</script>
<template>
  <CyCard class="spaced"
    ><h1>{{ route.name === "forbidden" ? "暂无访问权限" : "页面不存在" }}</h1>
    <p class="muted spaced">
      {{
        route.name === "forbidden"
          ? "当前账号没有该模块的权限，请联系安全管理员。"
          : "请检查地址，或返回工作台继续操作。"
      }}
    </p>
    <CyButton kind="secondary" @click="router.push('/overview')"
      >返回工作台</CyButton
    ></CyCard
  >
</template>
