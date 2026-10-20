<script setup lang="ts">
import { ElSelect, ElOption } from "element-plus";
import { useId } from "vue";
defineProps<{
  modelValue: string | string[];
  label: string;
  options: { label: string; value: string }[];
  multiple?: boolean;
  disabled?: boolean;
}>();
defineEmits<{ "update:modelValue": [value: string | string[]] }>();
const id = useId();
</script>
<template>
  <div class="cy-select">
    <label :id="id + '-label'" :for="id">{{ label }}</label
    ><ElSelect
      :id="id"
      :model-value="modelValue"
      :multiple="multiple"
      :disabled="disabled"
      :aria-labelledby="id + '-label'"
      :fit-input-width="true"
      @update:model-value="$emit('update:modelValue', $event)"
      ><ElOption
        v-for="o in options"
        :key="o.value"
        :label="o.label"
        :value="o.value"
    /></ElSelect>
  </div>
</template>
