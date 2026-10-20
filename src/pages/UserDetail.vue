<script setup lang="ts">
import { useRoute } from "vue-router";
import { useResource } from "../composables/useResource";
import type { UserAccount } from "../types/api";
import { displayDate } from "../domain/content";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyBadge from "../components/CyBadge.vue";
import CyLoadState from "../components/CyLoadState.vue";
const route = useRoute(),
  resource = useResource<UserAccount>(() => "/users/" + route.params.uuid),
  item = resource.data;
</script>
<template>
  <CyPageHeader title="用户详情" subtitle="匿名账号只读摘要" /><CyLoadState
    :busy="resource.busy.value"
    :error="resource.error.value"
    :has-data="!!item"
    @retry="resource.load"
    ><CyCard v-if="item"
      ><dl class="detail-grid">
        <dt>匿名账号标识</dt>
        <dd class="mono">{{ item.uuid }}</dd>
        <dt>状态</dt>
        <dd><CyBadge :state="item.state" /></dd>
        <dt>注册时间</dt>
        <dd>{{ displayDate(item.createdAt) }}</dd>
        <dt>最近登录时间</dt>
        <dd>{{ displayDate(item.lastLoginAt) }}</dd>
        <dt>当前有效会话</dt>
        <dd>{{ item.activeSessions }}</dd>
      </dl>
      <p class="caption spaced">
        这里不提供健康数据查询、用户停用或账号删除操作。
      </p></CyCard
    ></CyLoadState
  >
</template>
