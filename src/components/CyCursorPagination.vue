<script setup lang="ts">
import CyButton from "./CyButton.vue";
import CySelect from "./CySelect.vue";
defineProps<{
  previous: boolean;
  next: boolean;
  limit: number;
  busy?: boolean;
}>();
defineEmits<{ back: []; forward: []; limit: [value: number] }>();
</script>
<template>
  <nav class="pagination" aria-label="列表分页">
    <CyButton
      kind="secondary"
      :disabled="!previous || busy"
      @click="$emit('back')"
      >上一批</CyButton
    ><CySelect
      label="每批数量"
      :model-value="String(limit)"
      :options="
        [20, 50, 100].map((v) => ({
          label: String(v) + '条',
          value: String(v),
        }))
      "
      @update:model-value="$emit('limit', Number($event))"
    /><CyButton
      kind="secondary"
      :disabled="!next || busy"
      @click="$emit('forward')"
      >下一批</CyButton
    >
  </nav>
</template>
