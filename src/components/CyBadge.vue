<script setup lang="ts">
import { stateLabel } from "../domain/content";
defineProps<{ state: string; label?: string }>();
</script>
<template>
  <span class="cy-badge" :class="'tone-' + state">{{
    label || stateLabel(state)
  }}</span>
</template>
