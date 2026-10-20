import type { ContentForm, KnowledgeState } from "../types/api";
export const states: Record<KnowledgeState, string> = {
  draft: "草稿",
  submitted: "待审核",
  approved: "已批准",
  rejected: "已驳回",
  published: "已发布",
  withdrawn: "已下架",
};
export const stateLabel = (value: string) =>
  states[value as KnowledgeState] ||
  {
    active: "启用",
    disabled: "停用",
    up: "正常",
    down: "异常",
    unavailable: "不可用",
  }[value] ||
  value;
export function validateContent(
  form: ContentForm,
  slug?: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [name, max] of [
    ["title", 160],
    ["category", 64],
    ["proContent", 20000],
    ["plainContent", 20000],
    ["evidenceNote", 2000],
  ] as const)
    if (!form[name].trim() || form[name].length > max)
      errors[name] = `请填写内容，且不超过${max}字符`;
  if (slug !== undefined && !/^[a-z0-9][a-z0-9-]{2,99}$/.test(slug))
    errors.slug = "使用3–100位小写字母、数字或连字符，以字母或数字开头";
  if (
    form.references.length > 30 ||
    form.references.some((r) => !r.trim() || r.length > 500)
  )
    errors.references = "最多30条引用，每条须填写且不超过500字符";
  return errors;
}
export const validPassword = (value: string) =>
  value.length >= 12 && new TextEncoder().encode(value).length <= 72;
export function safeReturnTo(value: unknown): string {
  return typeof value === "string" &&
    /^\/(?!\/)/.test(value) &&
    !/[\\\u0000-\u001f]/.test(value) &&
    !value.startsWith("/login")
    ? value
    : "/overview";
}
export function displayDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (!Number.isFinite(d.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replaceAll("/", "-");
}
