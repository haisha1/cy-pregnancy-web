<script setup lang="ts">
withDefaults(
  defineProps<{
    kind?: "primary" | "secondary" | "ghost" | "danger";
    busy?: boolean;
    disabled?: boolean;
    type?: "button" | "submit";
  }>(),
  { kind: "primary", type: "button" },
);
</script>
<template>
  <button
    :type="type"
    class="cy-button"
    :class="'cy-button--' + kind"
    :disabled="disabled || busy"
    :aria-busy="busy"
  >
    <span v-if="busy" class="spinner" aria-hidden="true" /><slot />
  </button>
</template>
