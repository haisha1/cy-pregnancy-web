import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import { api, errorText } from "../services/http";
/** GET页面共用加载状态。切换路由时取消旧请求，避免迟到响应覆盖新页面。 */
export function useResource<T>(path: () => string) {
  const data = ref<T | null>(null) as Ref<T | null>;
  const busy = ref(false),
    error = ref("");
  let controller: AbortController | undefined;
  async function load() {
    controller?.abort();
    const current = new AbortController();
    controller = current;
    busy.value = true;
    error.value = "";
    try {
      const result = await api<T>(path(), { signal: current.signal });
      if (!current.signal.aborted) data.value = result;
    } catch (e) {
      if (!current.signal.aborted) error.value = errorText(e);
    } finally {
      if (controller === current) busy.value = false;
    }
  }
  watch(
    path,
    () => {
      data.value = null;
      void load();
    },
    { immediate: true },
  );
  onBeforeUnmount(() => controller?.abort());
  return { data, busy, error, load };
}
