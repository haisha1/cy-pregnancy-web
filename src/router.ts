import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "./stores/auth";
/** 路由只控制界面入口，服务端每个接口仍独立检查权限，不能把前端隐藏当成鉴权。 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/overview" },
    {
      path: "/login",
      name: "login",
      component: () => import("./pages/LoginPage.vue"),
      meta: { title: "登录", public: true },
    },
    {
      path: "/overview",
      component: () => import("./pages/OverviewPage.vue"),
      meta: { title: "工作台", permission: "dashboard:read" },
    },
    {
      path: "/knowledge",
      component: () => import("./pages/KnowledgeList.vue"),
      meta: {
        title: "知识内容",
        permission: "knowledge:read",
        kind: "knowledge",
      },
    },
    {
      path: "/knowledge/new",
      component: () => import("./pages/ContentEditor.vue"),
      meta: { title: "新建知识", permission: "knowledge:edit", kind: "new" },
    },
    {
      path: "/knowledge/versions/:uuid/edit",
      component: () => import("./pages/ContentEditor.vue"),
      meta: { title: "编辑草稿", permission: "knowledge:edit", kind: "edit" },
    },
    {
      path: "/knowledge/versions/:uuid/revise",
      component: () => import("./pages/ContentEditor.vue"),
      meta: {
        title: "创建新版本",
        permission: "knowledge:edit",
        kind: "revise",
      },
    },
    {
      path: "/knowledge/versions/:uuid",
      component: () => import("./pages/KnowledgeDetail.vue"),
      meta: { title: "知识详情", permission: "knowledge:read" },
    },
    {
      path: "/reviews",
      component: () => import("./pages/KnowledgeList.vue"),
      meta: {
        title: "审核工作台",
        permission: "knowledge:review",
        kind: "reviews",
      },
    },
    {
      path: "/reviews/:uuid",
      component: () => import("./pages/KnowledgeDetail.vue"),
      meta: { title: "版本审核", permission: "knowledge:review" },
    },
    {
      path: "/releases",
      component: () => import("./pages/KnowledgeList.vue"),
      meta: {
        title: "发布中心",
        permission: "knowledge:publish",
        kind: "releases",
      },
    },
    {
      path: "/operators",
      component: () => import("./pages/RecordsPage.vue"),
      meta: {
        title: "管理员账号",
        permission: "operator:read",
        kind: "operators",
      },
    },
    {
      path: "/operators/new",
      component: () => import("./pages/OperatorEditor.vue"),
      meta: { title: "新建管理员", permission: "operator:manage" },
    },
    {
      path: "/operators/:uuid",
      component: () => import("./pages/OperatorEditor.vue"),
      meta: { title: "编辑管理员", permission: "operator:manage" },
    },
    {
      path: "/users",
      component: () => import("./pages/RecordsPage.vue"),
      meta: { title: "用户管理", permission: "user:read", kind: "users" },
    },
    {
      path: "/users/:uuid",
      component: () => import("./pages/UserDetail.vue"),
      meta: { title: "用户详情", permission: "user:read" },
    },
    {
      path: "/roles",
      component: () => import("./pages/RolesPage.vue"),
      meta: { title: "角色权限", permission: "operator:read" },
    },
    {
      path: "/audits",
      component: () => import("./pages/RecordsPage.vue"),
      meta: { title: "操作审计", permission: "audit:read", kind: "audits" },
    },
    {
      path: "/capabilities",
      component: () => import("./pages/CapabilitiesPage.vue"),
      meta: { title: "系统能力" },
    },
    {
      path: "/account/password",
      component: () => import("./pages/PasswordPage.vue"),
      meta: { title: "修改密码" },
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("./pages/ErrorPage.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("./pages/ErrorPage.vue"),
    },
  ],
});
router.beforeEach((to) => {
  const auth = useAuth();
  if (!to.meta.public && !auth.authenticated)
    return { path: "/login", query: { returnTo: to.fullPath } };
  if (to.meta.public && auth.authenticated) return "/overview";
  if (to.meta.permission && !auth.can(String(to.meta.permission)))
    return "/403";
});
router.afterEach((to) => {
  document.title = String(to.meta.title || "页面") + " · 春雨孕算";
});
