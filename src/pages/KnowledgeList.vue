<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../stores/auth";
import { useCursorList } from "../composables/useCursorList";
import { states, displayDate } from "../domain/content";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyButton from "../components/CyButton.vue";
import CyBadge from "../components/CyBadge.vue";
import CySearch from "../components/CySearch.vue";
import CySelect from "../components/CySelect.vue";
import CyDataTable from "../components/CyDataTable.vue";
import CyCursorPagination from "../components/CyCursorPagination.vue";
import CyLoadState from "../components/CyLoadState.vue";
import CyAlert from "../components/CyAlert.vue";
const route = useRoute(),
  auth = useAuth();
const router = useRouter();
const mode = computed(() => String(route.meta.kind || "knowledge"));
const endpoint = () =>
  mode.value === "reviews"
    ? "/knowledge/review-queue"
    : mode.value === "releases"
      ? "/knowledge/release-queue"
      : "/knowledge";
const list = useCursorList(endpoint);
const title = computed(() =>
  mode.value === "reviews"
    ? "审核工作台"
    : mode.value === "releases"
      ? "发布中心"
      : "知识内容",
);
const filter = computed(
  () => !!(route.query.q || route.query.state || route.query.category),
);
const columns = [
  { key: "title", label: "标题 / slug" },
  { key: "category", label: "分类" },
  { key: "versionNo", label: "版本" },
  { key: "state", label: "版本状态" },
  { key: "currentlyPublished", label: "当前发布" },
  { key: "authorName", label: "作者" },
  { key: "actions", label: "操作" },
];
</script>
<template>
  <CyPageHeader :title="title" subtitle="维护内容、来源与版本记录"
    ><CyButton
      v-if="mode === 'knowledge' && auth.can('knowledge:edit')"
      @click="router.push('/knowledge/new')"
      >新建知识</CyButton
    ></CyPageHeader
  >
  <div class="route-body">
    <CyAlert v-if="mode === 'releases'" title="知识发布" tone="warning"
      >发布后App可读取当前版本；下架后重新读取不可见。不会修改医学计算参数。</CyAlert
    ><CyAlert v-if="mode === 'reviews'"
      >队列展示非本人提交的待审核版本；审核权限不允许作者自审。</CyAlert
    ><CyCard
      ><div class="filterbar">
        <CySearch
          :model-value="String(route.query.q || '')"
          label="搜索标题或 slug"
          @search="list.filters({ q: $event })"
        /><CySelect
          v-if="mode === 'knowledge'"
          label="版本状态"
          :model-value="String(route.query.state || '')"
          :options="[
            { label: '全部状态', value: '' },
            ...Object.entries(states).map(([value, label]) => ({
              value,
              label,
            })),
          ]"
          @update:model-value="list.filters({ state: $event })"
        /><CySelect
          v-if="mode === 'releases'"
          label="发布视图"
          :model-value="String(route.query.view || 'approved')"
          :options="[
            { label: '待发布', value: 'approved' },
            { label: '当前发布', value: 'current' },
          ]"
          @update:model-value="list.filters({ view: $event })"
        /><CyButton
          kind="secondary"
          @click="
            list.filters({
              q: undefined,
              state: undefined,
              category: undefined,
            })
          "
          >重置</CyButton
        ><CyButton kind="ghost" :disabled="list.busy.value" @click="list.load"
          >刷新</CyButton
        >
      </div>
      <CyLoadState
        :busy="list.busy.value"
        :error="list.error.value"
        :empty="!list.rows.value.length"
        :has-data="!!list.rows.value.length"
        :filtered="filter"
        @retry="list.load"
        @clear="
          list.filters({ q: undefined, state: undefined, category: undefined })
        "
        ><CyDataTable :rows="list.rows.value" :columns="columns" :label="title"
          ><template #cell-title="{ row }"
            ><RouterLink :to="'/knowledge/versions/' + row.uuid">{{
              row.title
            }}</RouterLink>
            <p class="caption">{{ row.slug }}</p></template
          ><template #cell-versionNo="{ row }">v{{ row.versionNo }}</template
          ><template #cell-state="{ row }"
            ><CyBadge :state="String(row.state)" /></template
          ><template #cell-currentlyPublished="{ row }"
            ><span class="caption">{{
              row.currentlyPublished ? "当前发布" : "非当前发布"
            }}</span></template
          ><template #cell-authorName="{ row }"
            >{{ row.authorName || "—" }}
            <p class="caption">{{ displayDate(row.createdAt) }}</p></template
          ><template #cell-actions="{ row }"
            ><RouterLink
              :to="
                mode === 'reviews'
                  ? '/reviews/' + row.uuid
                  : '/knowledge/versions/' + row.uuid
              "
              >{{ mode === "reviews" ? "开始审核" : "查看" }}</RouterLink
            ></template
          ></CyDataTable
        ></CyLoadState
      ><CyCursorPagination
        :previous="!!list.previous.value.length"
        :next="!!list.next.value"
        :limit="list.limit.value"
        :busy="list.busy.value"
        @back="list.back"
        @forward="list.forward"
        @limit="list.filters({ limit: $event })"
    /></CyCard>
  </div>
</template>
