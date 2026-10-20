import { ref } from "vue";
import { api } from "../services/http";
/** 一次动作的载荷与revision不变时复用key；超时重试不能创建第二次写操作。 */
export function useCommand() {
  const busy = ref(false);
  let lastFingerprint = "";
  let key = "";
  async function send<T>(
    path: string,
    body?: unknown,
    revision?: number,
    method = "POST",
  ): Promise<T> {
    if (busy.value) throw Error("操作正在执行");
    const fingerprint = JSON.stringify([path, body, revision, method]);
    if (fingerprint !== lastFingerprint) {
      key = crypto.randomUUID();
      lastFingerprint = fingerprint;
    }
    busy.value = true;
    try {
      const result = await api<T>(path, { method, body, revision, key });
      key = "";
      lastFingerprint = "";
      return result;
    } finally {
      busy.value = false;
    }
  }
  return { busy, send };
}
