<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>
<template>
  <header class="page-heading">
    <div>
      <h1 tabindex="-1">{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="header-actions"><slot /></div>
  </header>
</template>
