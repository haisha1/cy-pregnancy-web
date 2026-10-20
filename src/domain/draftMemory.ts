import type { ContentForm } from "../types/api";
/** 只在当前标签页内存暂存非秘密的知识草稿，按操作者隔离，刷新/关闭即消失。 */
const drafts = new Map<string, { form: ContentForm; slug: string }>();
export function retainDraft(key: string, form: ContentForm, slug: string) {
  if (drafts.size >= 5) drafts.delete(drafts.keys().next().value!);
  drafts.set(key, { form: structuredClone(form), slug });
}
export function consumeDraft(key: string) {
  const draft = drafts.get(key);
  drafts.delete(key);
  return draft;
}
