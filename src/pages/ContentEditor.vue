<script setup lang="ts">
import {
  computed,
  reactive,
  ref,
  watch,
  onBeforeUnmount,
  toRaw,
  nextTick,
} from "vue";
import { retainDraft, consumeDraft } from "../domain/draftMemory";
import { useAuth } from "../stores/auth";
import { useRoute, useRouter } from "vue-router";
import { api, errorText, ApiError } from "../services/http";
import { useCommand } from "../composables/useCommand";
import { useUnsaved } from "../composables/useUnsaved";
import { validateContent } from "../domain/content";
import { useUi } from "../stores/ui";
import type { ContentForm, Knowledge, Receipt } from "../types/api";
import CyPageHeader from "../components/CyPageHeader.vue";
import CyCard from "../components/CyCard.vue";
import CyInput from "../components/CyInput.vue";
import CyButton from "../components/CyButton.vue";
import CyAlert from "../components/CyAlert.vue";
import CyLoadState from "../components/CyLoadState.vue";
const route = useRoute(),
  router = useRouter(),
  ui = useUi(),
  command = useCommand();
// reactive适合一组表单字段；ref用于单值。模板中顶层ref会自动解包，不需要写.value。
const form = reactive<ContentForm>({
  title: "",
  category: "",
  proContent: "",
  plainContent: "",
  references: [],
  evidenceNote: "",
});
const slug = ref(""),
  source = ref<Knowledge | null>(null),
  loading = ref(false),
  loadError = ref(""),
  error = ref(""),
  errors = ref<Record<string, string>>({});
const conflict = ref(false);
async function reconcile() {
  await ui.confirm({
    title: "加载最新版本并替换表单？",
    body: "当前输入仍保留到你确认。确认后会读取服务端最新内容，请先复制需要保留的修改。",
    confirmText: "加载最新版本",
    run: async () => {
      await load();
      if (loadError.value) throw Error(loadError.value);
      conflict.value = false;
      error.value = "";
    },
  });
}
const baseline = ref(""),
  ready = ref(false),
  clientUuid = ref(crypto.randomUUID()),
  versionUuid = ref(crypto.randomUUID());
const mode = computed(() => String(route.meta.kind)),
  isNew = computed(() => mode.value === "new");
const snapshot = () => JSON.stringify([form, slug.value]);
const dirty = computed(() => ready.value && baseline.value !== snapshot());
useUnsaved(() => dirty.value);
const auth = useAuth(),
  draftKey = auth.identity!.operator.uuid + ":" + route.path;
onBeforeUnmount(() => {
  if (!auth.authenticated && dirty.value)
    retainDraft(draftKey, toRaw(form), slug.value);
});
async function load() {
  loading.value = true;
  loadError.value = "";
  ready.value = false;
  try {
    if (!isNew.value) {
      const value = await api<Knowledge>(
        "/knowledge/versions/" + route.params.uuid,
      );
      source.value = value;
      if (
        mode.value === "edit" &&
        (value.state !== "draft" ||
          value.authorUuid !== auth.identity?.operator.uuid)
      )
        throw Error("仅可编辑本人草稿，请返回版本详情查看当前状态");
      slug.value = value.slug;
      Object.assign(form, {
        title: value.title,
        category: value.category,
        proContent: value.proContent,
        plainContent: value.plainContent,
        references: [...value.references],
        evidenceNote: value.evidenceNote,
      });
    }
    baseline.value = snapshot();
    ready.value = true;
    const retained = consumeDraft(draftKey);
    if (retained) {
      Object.assign(form, retained.form);
      slug.value = retained.slug;
      ui.notify("已恢复本标签页暂存的知识草稿，请核对后保存");
    }
  } catch (e) {
    loadError.value = errorText(e);
  } finally {
    loading.value = false;
  }
}
watch(() => route.fullPath, load, { immediate: true });
async function save(submitAfter = false) {
  errors.value = validateContent(form, isNew.value ? slug.value : undefined);
  if (submitAfter && !form.references.length)
    errors.value.references = "提交审核至少需要一条引用";
  error.value = "";
  if (Object.keys(errors.value).length) {
    error.value = "请检查表单中标出的字段";
    await nextTick();
    (
      document.querySelector('[aria-invalid="true"]') as HTMLElement | null
    )?.focus();
    return;
  }
  try {
    let result: Receipt;
    if (isNew.value)
      result = await command.send("/knowledge", {
        ...form,
        slug: slug.value,
        clientUuid: clientUuid.value,
        versionUuid: versionUuid.value,
      });
    else if (mode.value === "revise")
      result = await command.send(
        "/knowledge/" + source.value!.articleUuid + "/versions",
        { ...form, clientUuid: clientUuid.value },
        source.value!.articleRevision,
      );
    else
      result = await command.send(
        "/knowledge/versions/" + source.value!.uuid,
        { ...form },
        source.value!.revision,
        "PATCH",
      );
    // 写入成功后以服务端新revision为准，不在本地自行加1。
    source.value = await api<Knowledge>("/knowledge/versions/" + result.uuid);
    baseline.value = snapshot();
    ui.notify("草稿已保存");
    if (submitAfter) {
      await ui.confirm({
        title: "提交审核？",
        body: "草稿已保存。提交后正文将锁定，由其他审核人员独立审核。",
        confirmText: "提交审核",
        run: async () => {
          await command.send(
            "/knowledge/versions/" + source.value!.uuid + "/submit",
            undefined,
            source.value!.revision,
          );
          await router.replace("/knowledge/versions/" + result.uuid);
          ui.notify("已提交审核");
        },
      });
    } else if (isNew.value || mode.value === "revise")
      await router.replace("/knowledge/versions/" + result.uuid);
  } catch (e) {
    error.value = errorText(e);
    conflict.value = e instanceof ApiError && e.status === 409;
  }
}
</script>
<template>
  <CyPageHeader
    :title="isNew ? '新建知识' : mode === 'revise' ? '创建新版本' : '编辑草稿'"
    subtitle="专业与通俗表达共同维护，引用与证据说明随版本保存"
  /><CyLoadState
    :busy="loading"
    :error="loadError"
    :has-data="ready"
    @retry="load"
    ><form
      v-if="ready"
      class="route-body"
      novalidate
      @submit.prevent="save(false)"
    >
      <CyAlert v-if="error" tone="error"
        >{{ error
        }}<CyButton
          v-if="conflict && !isNew"
          kind="secondary"
          @click="reconcile"
          >查看最新版本</CyButton
        ></CyAlert
      ><CyCard
        ><h2>基础信息</h2>
        <div class="form-grid">
          <CyInput
            v-model="form.title"
            label="知识标题"
            :maxlength="160"
            :error="errors.title"
          /><CyInput
            v-model="form.category"
            label="分类"
            :maxlength="64"
            :error="errors.category"
          /><CyInput
            v-model="slug"
            label="slug"
            :readonly="!isNew"
            :error="errors.slug"
            help="3–100位小写字母、数字、连字符；创建后保持不变"
          /></div></CyCard
      ><CyCard
        ><div class="dual-expression">
          <section>
            <h2>专业表达</h2>
            <CyInput
              v-model="form.proContent"
              label="专业正文"
              multiline
              :rows="16"
              :maxlength="20000"
              :error="errors.proContent"
            />
          </section>
          <section>
            <h2>通俗表达</h2>
            <CyInput
              v-model="form.plainContent"
              label="通俗正文"
              multiline
              :rows="16"
              :maxlength="20000"
              :error="errors.plainContent"
            />
          </section></div></CyCard
      ><CyCard
        ><h2>证据与引用</h2>
        <CyAlert
          >请注明论文、指南的名称、年份和可核验来源，并说明适用人群及局限。引用是否准确仍需审核人员核实。</CyAlert
        >
        <div class="stack spaced">
          <div
            v-for="(_, index) in form.references"
            :key="index"
            class="reference-row"
          >
            <CyInput
              v-model="form.references[index]!"
              :label="'引用 ' + (index + 1)"
              :maxlength="500"
            /><CyButton
              kind="ghost"
              :aria-label="'删除引用 ' + (index + 1)"
              @click="form.references.splice(index, 1)"
              >删除</CyButton
            >
          </div>
          <p v-if="errors.references" class="is-error" role="alert">
            {{ errors.references }}
          </p>
          <CyButton
            kind="secondary"
            :disabled="form.references.length >= 30"
            @click="form.references.push('')"
            >添加引用</CyButton
          ><CyInput
            v-model="form.evidenceNote"
            label="证据说明与适用边界"
            multiline
            :rows="5"
            :maxlength="2000"
            :error="errors.evidenceNote"
          /></div
      ></CyCard>
      <div class="form-actions">
        <CyButton type="submit" :busy="command.busy.value">保存草稿</CyButton
        ><CyButton
          v-if="mode === 'edit'"
          :disabled="command.busy.value"
          @click="save(true)"
          >保存并提交审核</CyButton
        ><CyButton kind="secondary" @click="router.back()">返回</CyButton
        ><span class="caption"
          >{{ dirty ? "有未保存修改" : "内容已同步" }} ·
          保存后可在详情提交审核</span
        >
      </div>
    </form></CyLoadState
  >
</template>
