/** 传输类型与页面状态分开；服务端返回的权限和revision始终是最终依据。 */
export interface Row {
  [key: string]: unknown;
}
export interface Page<T> {
  records: T[];
  nextBeforeId: number | null;
}
export interface Operator extends Row {
  uuid: string;
  username: string;
  displayName: string;
  state: "active" | "disabled";
  revision: number;
  roleCodes: string[];
}
export interface Identity {
  operator: Operator;
  permissions: string[];
}
export interface Role {
  code: string;
  name: string;
  permissions: string[];
}
export type KnowledgeState =
  "draft" | "submitted" | "approved" | "rejected" | "published" | "withdrawn";
export interface Knowledge extends Row {
  uuid: string;
  articleUuid: string;
  articleRevision: number;
  slug: string;
  title: string;
  category: string;
  versionNo: number;
  state: KnowledgeState;
  revision: number;
  currentlyPublished: boolean;
  authorUuid?: string;
  authorName?: string;
  createdAt?: string;
  proContent: string;
  plainContent: string;
  references: string[];
  evidenceNote: string;
  reviewNote?: string;
}
export interface ContentForm {
  title: string;
  category: string;
  proContent: string;
  plainContent: string;
  references: string[];
  evidenceNote: string;
}
export interface Receipt {
  uuid: string;
  revision: number;
  state: string;
  parentUuid: string | null;
}
export interface UserAccount extends Row {
  uuid: string;
  state: string;
  createdAt: string;
  lastLoginAt: string | null;
  activeSessions: number;
}
export interface UserStats {
  total: number;
  todayNew: number;
  trend: { date: string; count: number }[];
  updatedAt: string;
}
export interface Summary {
  updatedAt: string;
  articles?: number;
  published?: number;
  pendingReview?: number;
  pendingRelease?: number;
  myDrafts?: number;
  users?: UserStats | null;
  userStatus?: string;
}
