import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { errorText } from "../services/http";
interface ConfirmOptions {
  title: string;
  body: string;
  confirmText?: string;
  danger?: boolean;
  run?: () => Promise<unknown>;
}
export const useUi = defineStore("ui", () => {
  const message = ref("");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const dialog = reactive({
    open: false,
    title: "",
    body: "",
    confirmText: "确认",
    danger: false,
    busy: false,
    error: "",
  });
  let resolve: ((ok: boolean) => void) | undefined;
  let run: (() => Promise<unknown>) | undefined;
  function notify(text: string) {
    message.value = text;
    clearTimeout(timer);
    timer = setTimeout(() => (message.value = ""), 4000);
  }
  function confirm(options: ConfirmOptions) {
    if (dialog.open) return Promise.resolve(false);
    Object.assign(dialog, {
      ...options,
      confirmText: options.confirmText || "确认",
      open: true,
      busy: false,
      error: "",
    });
    run = options.run;
    return new Promise<boolean>((r) => (resolve = r));
  }
  function close() {
    if (dialog.busy) return;
    dialog.open = false;
    resolve?.(false);
    resolve = undefined;
    run = undefined;
  }
  async function accept() {
    if (dialog.busy) return;
    dialog.busy = true;
    dialog.error = "";
    try {
      await run?.();
      dialog.open = false;
      resolve?.(true);
      resolve = undefined;
      run = undefined;
    } catch (e) {
      dialog.error = errorText(e);
    } finally {
      dialog.busy = false;
    }
  }
  function sessionExpired() {
    dialog.open = false;
    dialog.busy = false;
    resolve?.(false);
    resolve = undefined;
    run = undefined;
  }
  return { message, dialog, notify, confirm, close, accept, sessionExpired };
});
