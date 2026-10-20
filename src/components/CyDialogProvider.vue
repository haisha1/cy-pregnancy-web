<script setup lang="ts">
import { ElDialog } from "element-plus";
import { nextTick } from "vue";
import { useUi } from "../stores/ui";
import CyButton from "./CyButton.vue";
import CyAlert from "./CyAlert.vue";
const ui = useUi();
async function focusCancel() {
  await nextTick();
  (
    document.querySelector(
      ".cy-dialog .dialog-cancel",
    ) as HTMLButtonElement | null
  )?.focus();
}
</script>
<template>
  <ElDialog
    :model-value="ui.dialog.open"
    :title="ui.dialog.title"
    class="cy-dialog"
    width="520px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="!ui.dialog.busy"
    :show-close="!ui.dialog.busy"
    :before-close="ui.close"
    @open-auto-focus="focusCancel"
    ><p>{{ ui.dialog.body }}</p>
    <CyAlert v-if="ui.dialog.error" tone="error">{{ ui.dialog.error }}</CyAlert
    ><template #footer
      ><CyButton
        class="dialog-cancel"
        kind="secondary"
        :disabled="ui.dialog.busy"
        @click="ui.close"
        >取消</CyButton
      ><CyButton
        :kind="ui.dialog.danger ? 'danger' : 'primary'"
        :busy="ui.dialog.busy"
        @click="ui.accept"
        >{{ ui.dialog.confirmText }}</CyButton
      ></template
    ></ElDialog
  >
  <div class="notification" role="status" aria-live="polite" aria-atomic="true">
    <span v-if="ui.message">{{ ui.message }}</span>
  </div>
</template>
