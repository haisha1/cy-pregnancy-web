<script setup lang="ts">
import CyButton from "./CyButton.vue";
defineProps<{
  busy?: boolean;
  error?: string;
  empty?: boolean;
  hasData?: boolean;
  filtered?: boolean;
}>();
defineEmits<{ retry: []; clear: [] }>();
</script>
<template>
  <div :aria-busy="busy">
    <div v-if="error" class="load-state" role="alert">
      <h2>暂时无法加载</h2>
      <p>{{ error }}</p>
      <CyButton kind="secondary" @click="$emit('retry')">重新加载</CyButton>
    </div>
    <div v-else-if="busy && !hasData" class="load-state" role="status">
      <span class="spinner" />正在载入…
    </div>
    <div v-else-if="empty && !busy" class="load-state">
      <h2>{{ filtered ? "没有匹配结果" : "还没有记录" }}</h2>
      <p>
        {{
          filtered
            ? "请调整或清除筛选条件。"
            : "新建内容或完成相应操作后，记录会出现在这里。"
        }}
      </p>
      <CyButton v-if="filtered" kind="secondary" @click="$emit('clear')"
        >清除条件</CyButton
      >
    </div>
    <slot v-else />
  </div>
</template>
