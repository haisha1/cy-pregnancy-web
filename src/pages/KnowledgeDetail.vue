<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useResource } from "../composables/useResource";
import { useCommand } from "../composables/useCommand";
import { useAuth } from "../stores/auth";
import { useUi } from "../stores/ui";
import type { Knowledge, Page, Row } from "../types/api";
import { api, errorText } from "../services/http";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyButton from "../components/CyButton.vue";
import CyBadge from "../components/CyBadge.vue";
import CyAlert from "../components/CyAlert.vue";
import CyInput from "../components/CyInput.vue";
import CyLoadState from "../components/CyLoadState.vue";
const route = useRoute(),
  router = useRouter(),
  auth = useAuth(),
  ui = useUi(),
  command = useCommand();
const resource = useResource<Knowledge>(
    () => "/knowledge/versions/" + route.params.uuid,
  ),
  item = resource.data;
const note = ref(""),
  error = ref(""),
  history = ref<Row[]>([]),
  next = ref<number | null>(null),
  historyBusy = ref(false);
const own = computed(
  () => item.value?.authorUuid === auth.identity?.operator.uuid,
);
async function action(kind: string) {
  if (!item.value) return;
  error.value = "";
  if (kind === "submit" && !item.value.references.length) {
    error.value = "提交审核前请至少添加一条引用";
    return;
  }
  if (
    ["approve", "reject"].includes(kind) &&
    (!note.value.trim() || note.value.length > 2000)
  ) {
    error.value = "请填写不超过2000字符的审核意见";
    return;
  }
  const titles: Record<string, string> = {
    submit: "提交审核",
    approve: "批准版本",
    reject: "驳回版本",
    publish: "发布知识",
    withdraw: "下架知识",
  };
  await ui.confirm({
    title: titles[kind] + "？",
    body:
      kind === "publish"
        ? "发布后，小程序可通过用户服务读取当前版本；不会更改医学计算参数。"
        : kind === "withdraw"
          ? "将移除该条目的当前发布标记，保留版本与审计记录。"
          : "确认后将记录本次操作，提交后正文不再可编辑。",
    confirmText: titles[kind],
    danger: kind === "withdraw" || kind === "reject",
    run: async () => {
      const v = item.value!;
      await command.send(
        kind === "withdraw"
          ? "/knowledge/" + v.articleUuid + "/withdraw"
          : "/knowledge/versions/" +
              v.uuid +
              "/" +
              (["approve", "reject"].includes(kind) ? "review" : kind),
        ["approve", "reject"].includes(kind)
          ? { decision: kind, note: note.value }
          : undefined,
        kind === "withdraw" ? v.articleRevision : v.revision,
      );
      await resource.load();
      history.value = [];
      ui.notify("操作已完成");
    },
  });
}
async function loadHistory(more = false) {
  if (!item.value) return;
  historyBusy.value = true;
  try {
    const result = await api<Page<Row>>(
      "/knowledge/" +
        item.value.articleUuid +
        "/versions?limit=20" +
        (more && next.value ? "&beforeId=" + next.value : ""),
    );
    history.value = more
      ? [...history.value, ...result.records]
      : result.records;
    next.value = result.nextBeforeId;
  } catch (e) {
    error.value = errorText(e);
  } finally {
    historyBusy.value = false;
  }
}
</script>
<template>
  <CyPageHeader
    title="知识版本详情"
    subtitle="核对正文、证据依据与版本状态"
  /><CyLoadState
    :busy="resource.busy.value"
    :error="resource.error.value"
    :has-data="!!item"
    @retry="resource.load"
    ><div v-if="item" class="route-body">
      <CyAlert v-if="error" tone="error">{{ error }}</CyAlert
      ><CyCard
        ><div class="row spread">
          <div class="content-identity">
            <h2>{{ item.title }}</h2>
            <span class="mono caption"
              >{{ item.slug }} · v{{ item.versionNo }} ·
              {{ item.category }}</span
            >
            <div class="row">
              <CyBadge :state="item.state" /><span class="caption">{{
                item.currentlyPublished ? "当前发布版本" : "非当前发布版本"
              }}</span>
            </div>
          </div>
          <div class="row">
            <CyButton
              v-if="auth.can('knowledge:edit') && own && item.state === 'draft'"
              kind="secondary"
              @click="router.push('/knowledge/versions/' + item.uuid + '/edit')"
              >编辑草稿</CyButton
            ><CyButton
              v-if="auth.can('knowledge:edit')"
              kind="secondary"
              @click="
                router.push('/knowledge/versions/' + item.uuid + '/revise')
              "
              >创建新版本</CyButton
            ><CyButton
              v-if="auth.can('knowledge:edit') && own && item.state === 'draft'"
              @click="action('submit')"
              >提交审核</CyButton
            ><CyButton
              v-if="auth.can('knowledge:publish') && item.state === 'approved'"
              @click="action('publish')"
              >发布知识</CyButton
            ><CyButton
              v-if="auth.can('knowledge:publish') && item.currentlyPublished"
              kind="danger"
              @click="action('withdraw')"
              >下架</CyButton
            >
          </div>
        </div></CyCard
      ><CyCard
        ><div class="dual-expression">
          <section>
            <h2>专业表达</h2>
            <pre>{{ item.proContent }}</pre>
          </section>
          <section>
            <h2>通俗表达</h2>
            <pre>{{ item.plainContent }}</pre>
          </section>
        </div></CyCard
      ><CyCard
        ><h2>证据与引用</h2>
        <ol class="plain-list">
          <li v-for="(reference, index) in item.references" :key="index">
            {{ reference }}
          </li>
        </ol>
        <p v-if="!item.references.length" class="muted">尚未填写引用</p>
        <h3 class="spaced">证据说明与适用边界</h3>
        <pre>{{ item.evidenceNote }}</pre></CyCard
      ><CyCard v-if="item.reviewNote"
        ><h2>审核意见</h2>
        <pre>{{ item.reviewNote }}</pre></CyCard
      ><CyCard v-if="auth.can('knowledge:review') && item.state === 'submitted'"
        ><h2>审核决定</h2>
        <CyAlert v-if="own" tone="warning">作者不能审核本人提交的版本。</CyAlert
        ><template v-else
          ><CyInput
            v-model="note"
            label="审核意见（批准与驳回均必填）"
            multiline
            :maxlength="2000"
          />
          <div class="row">
            <CyButton :busy="command.busy.value" @click="action('approve')"
              >批准</CyButton
            ><CyButton
              kind="danger"
              :disabled="command.busy.value"
              @click="action('reject')"
              >驳回</CyButton
            >
          </div></template
        ></CyCard
      ><CyCard
        ><div class="row spread">
          <h2>版本记录</h2>
          <CyButton kind="ghost" :busy="historyBusy" @click="loadHistory()"
            >加载版本记录</CyButton
          >
        </div>
        <div class="history-list">
          <RouterLink
            v-for="version in history"
            :key="String(version.uuid)"
            :to="'/knowledge/versions/' + version.uuid"
            >v{{ version.versionNo }} · {{ version.title }}
            <CyBadge :state="String(version.state)"
          /></RouterLink>
        </div>
        <CyButton
          v-if="next"
          class="spaced"
          kind="secondary"
          :busy="historyBusy"
          @click="loadHistory(true)"
          >加载更早版本</CyButton
        ></CyCard
      >
    </div></CyLoadState
  >
</template>
