/** Token仅在内存；HTTP封装不决定页面跳转，以事件交给应用层处理会话失效。 */
let token = "";
export const setToken = (value: string) => {
  token = value;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    revision?: number;
    key?: string;
  } = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort("timeout"), 12000);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined)
      headers["Content-Type"] = "application/json";
    if (options.key) headers["Idempotency-Key"] = options.key;
    if (options.revision !== undefined)
      headers["If-Match"] = `"${options.revision}"`;
    const response = await fetch("/admin/api/v1" + path, {
      method: options.method || "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object" || !("code" in payload))
      throw new ApiError(
        response.status,
        "INVALID_RESPONSE",
        "服务响应格式异常，请重试",
      );
    const envelope = payload as {
      code: string;
      message: string;
      data: T;
      requestId?: string;
    };
    if (!response.ok || envelope.code !== "OK") {
      if (response.status === 401 && path !== "/auth/login")
        window.dispatchEvent(new Event("cy:session-expired"));
      throw new ApiError(
        response.status,
        envelope.code,
        envelope.message || "操作未完成，请重试",
        envelope.requestId,
      );
    }
    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted)
      throw new DOMException("请求已取消", "AbortError");
    throw new ApiError(
      0,
      controller.signal.aborted ? "TIMEOUT" : "NETWORK",
      controller.signal.aborted
        ? "请求超时，结果尚未确认。请使用原操作重试。"
        : "无法连接服务，请检查网络后重试",
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
export const errorText = (error: unknown) =>
  error instanceof ApiError && error.requestId
    ? `${error.message}（请求标识：${error.requestId}）`
    : error instanceof Error
      ? error.message
      : "操作未完成，请重试";
export function queryString(values: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== null && value !== undefined && value !== "")
      p.set(key, String(value));
  return p.size ? "?" + p.toString() : "";
}
