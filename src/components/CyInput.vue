<script setup lang="ts">
import { ref, useId, watch, nextTick, onMounted } from "vue";
const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    error?: string;
    help?: string;
    placeholder?: string;
    type?: string;
    multiline?: boolean;
    rows?: number;
    maxlength?: number;
    readonly?: boolean;
    autocomplete?: string;
  }>(),
  { type: "text", rows: 7 },
);
defineEmits<{ "update:modelValue": [value: string] }>();
const id = useId(),
  show = ref(false);
const area = ref<HTMLTextAreaElement>();
function resize() {
  if (area.value) {
    area.value.style.height = "auto";
    area.value.style.height = Math.min(640, area.value.scrollHeight + 2) + "px";
  }
}
watch(
  () => props.modelValue,
  async () => {
    await nextTick();
    resize();
  },
);
onMounted(resize);
</script>
<template>
  <div class="cy-field">
    <label :for="id">{{ label }}</label>
    <div class="input-wrap">
      <textarea
        class="resize-none"
        ref="area"
        v-if="multiline"
        :id="id"
        :value="modelValue"
        :rows="rows"
        :maxlength="maxlength"
        :readonly="readonly"
        :placeholder="placeholder"
        :aria-invalid="!!error"
        :aria-describedby="id + '-help'"
        @input="
          $emit(
            'update:modelValue',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
      /><input
        v-else
        :id="id"
        :value="modelValue"
        :type="type === 'password' && show ? 'text' : type"
        :maxlength="maxlength"
        :readonly="readonly"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="id + '-help'"
        @input="
          $emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      /><button
        v-if="type === 'password'"
        type="button"
        class="secret-toggle"
        :aria-label="show ? '隐藏' + label : '显示' + label"
        :aria-pressed="show"
        @click="show = !show"
      >
        {{ show ? "隐藏" : "显示" }}
      </button>
    </div>
    <div
      :id="id + '-help'"
      class="field-help"
      :class="{ 'is-error': error }"
      :role="error ? 'alert' : undefined"
    >
      {{ error || help || " " }}
    </div>
  </div>
</template>
<style scoped>
.resize-none {
  resize: none;
}
</style>
