<script setup lang="ts">
import { onBeforeUnmount, ref, watch, useId } from "vue";
const id = useId();
const props = defineProps<{ modelValue: string; label?: string }>();
const emit = defineEmits<{ search: [value: string] }>();
const value = ref(props.modelValue),
  input = ref<HTMLInputElement>();
let composing = false,
  timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => props.modelValue,
  (v) => (value.value = v),
);
function commit() {
  clearTimeout(timer);
  if (!composing) emit("search", value.value.trim());
}
function changed() {
  clearTimeout(timer);
  if (!composing) timer = setTimeout(commit, 300);
}
function clear() {
  value.value = "";
  composing = false;
  commit();
  input.value?.focus();
}
function enter(event: KeyboardEvent) {
  if (composing || event.isComposing) return;
  event.preventDefault();
  commit();
}
onBeforeUnmount(() => clearTimeout(timer));
</script>
<template>
  <div class="cy-search">
    <label class="sr-only" :for="id">{{ label || "搜索标题或标识" }}</label
    ><input
      :id="id"
      ref="input"
      v-model="value"
      type="search"
      :placeholder="label || '搜索标题或标识'"
      @input="changed"
      @compositionstart="composing = true"
      @compositionend="
        composing = false;
        changed();
      "
      @keydown.enter="enter"
    /><button v-if="value" type="button" aria-label="清除搜索" @click="clear">
      清除
    </button>
  </div>
</template>
