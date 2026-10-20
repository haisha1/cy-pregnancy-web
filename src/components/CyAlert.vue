<script setup lang="ts">
withDefaults(
  defineProps<{ title?: string; tone?: "info" | "warning" | "error" }>(),
  { tone: "info" },
);
</script>
<template>
  <div
    class="cy-alert"
    :class="'cy-alert--' + tone"
    :role="tone === 'error' ? 'alert' : 'status'"
  >
    <strong v-if="title">{{ title }}</strong>
    <div><slot /></div>
  </div>
</template>
