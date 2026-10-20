<script setup lang="ts">
import type { Row } from "../types/api";
defineProps<{
  rows: Row[];
  columns: { key: string; label: string }[];
  label: string;
}>();
</script>
<template>
  <div
    class="table-scroll"
    role="region"
    :aria-label="label + '，可横向滚动'"
    tabindex="0"
  >
    <table>
      <caption class="sr-only">
        {{
          label
        }}
      </caption>
      <thead>
        <tr>
          <th v-for="c in columns" :key="c.key" scope="col">{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="String(row.uuid ?? row.id)">
          <td v-for="c in columns" :key="c.key">
            <slot :name="'cell-' + c.key" :row="row">{{
              row[c.key] ?? "—"
            }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
