import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, errorText, queryString } from "../services/http";
import type { Page, Row } from "../types/api";
/** URL是已提交查询的唯一来源；新查询取消旧请求，编号保证旧响应不能覆盖新结果。 */
export function useCursorList(endpoint: () => string) {
  const route = useRoute(),
    router = useRouter();
  const rows = ref<Row[]>([]),
    busy = ref(false),
    error = ref(""),
    next = ref<number | null>(null);
  let controller: AbortController | undefined;
  let generation = 0;
  const limit = computed(() =>
    ["20", "50", "100"].includes(String(route.query.limit))
      ? Number(route.query.limit)
      : 20,
  );
  const before = computed(() => Number(route.query.beforeId) || null);
  const previous = computed(() =>
    String(route.query.previous || "")
      .split(",")
      .filter(Boolean),
  );
  async function load() {
    const g = ++generation;
    controller?.abort();
    controller = new AbortController();
    busy.value = true;
    error.value = "";
    try {
      const values = {
        ...route.query,
        previous: undefined,
        limit: limit.value,
      };
      const data = await api<Page<Row>>(endpoint() + queryString(values), {
        signal: controller.signal,
      });
      if (g === generation) {
        if (!Array.isArray(data.records)) throw Error("列表响应格式异常");
        rows.value = data.records;
        next.value = data.nextBeforeId;
      }
    } catch (e) {
      if (
        g === generation &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        error.value = errorText(e);
    } finally {
      if (g === generation) busy.value = false;
    }
  }
  function filters(values: Record<string, unknown>) {
    void router.replace({
      query: {
        ...route.query,
        ...Object.fromEntries(
          Object.entries(values).map(([k, v]) => [
            k,
            v ? String(v) : undefined,
          ]),
        ),
        beforeId: undefined,
        previous: undefined,
      },
    });
  }
  function forward() {
    if (next.value && !busy.value)
      void router.push({
        query: {
          ...route.query,
          beforeId: String(next.value),
          previous: [...previous.value, String(before.value ?? 0)].join(","),
        },
      });
  }
  function back() {
    const stack = [...previous.value];
    const cursor = stack.pop();
    if (cursor !== undefined)
      void router.push({
        query: {
          ...route.query,
          beforeId: Number(cursor) ? cursor : undefined,
          previous: stack.length ? stack.join(",") : undefined,
        },
      });
  }
  watch(() => [route.fullPath, endpoint()], load, { immediate: true });
  onBeforeUnmount(() => {
    generation++;
    controller?.abort();
  });
  return {
    rows,
    busy,
    error,
    next,
    previous,
    limit,
    load,
    filters,
    forward,
    back,
  };
}
