<script setup lang="ts">
import { ElDatePicker } from "element-plus";
import { useId } from "vue";
const id = useId();
defineProps<{ modelValue: [string, string] | null }>();
defineEmits<{ "update:modelValue": [value: [string, string] | null] }>();
</script>
<template>
  <div class="cy-select date-range">
    <span>日期范围</span
    ><label class="sr-only" :for="id + '-start'">开始日期</label
    ><label class="sr-only" :for="id + '-end'">结束日期</label
    ><ElDatePicker
      :model-value="modelValue"
      :id="[id + '-start', id + '-end']"
      type="daterange"
      value-format="YYYY-MM-DD"
      format="YYYY-MM-DD"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      range-separator="至"
      aria-label="日期范围"
      :editable="false"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>
