<script setup lang="ts">
import { useResource } from "../composables/useResource";
import type { Role } from "../types/api";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyLoadState from "../components/CyLoadState.vue";
import CyAlert from "../components/CyAlert.vue";
const resource = useResource<Role[]>(() => "/roles");
</script>
<template>
  <CyPageHeader title="角色与权限" subtitle="预置角色矩阵" />
  <div class="route-body">
    <CyAlert
      >角色定义通过后端版本化迁移维护。安全管理员、编辑、审核、发布分工独立；作者不能审核自己的内容。</CyAlert
    ><CyLoadState
      :busy="resource.busy.value"
      :error="resource.error.value"
      :has-data="!!resource.data.value"
      @retry="resource.load"
      ><CyCard
        v-for="role in resource.data.value"
        :key="role.code"
        class="spaced"
        ><h2>{{ role.name }}</h2>
        <p class="caption mono">{{ role.code }}</p>
        <ul class="plain-list">
          <li
            v-for="permission in role.permissions"
            :key="permission"
            class="mono"
          >
            {{ permission }}
          </li>
        </ul></CyCard
      ></CyLoadState
    >
  </div>
</template>
