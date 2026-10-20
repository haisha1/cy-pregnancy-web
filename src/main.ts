import { createApp } from "vue";
import { createPinia } from "pinia";
import "element-plus/dist/index.css";
import "./theme/web-tokens.css";
import App from "./App.vue";
import { router } from "./router";
import { useAuth } from "./stores/auth";
import { useUi } from "./stores/ui";
const app = createApp(App);
app.use(createPinia());
app.use(router);
window.addEventListener("cy:session-expired", () => {
  useAuth().clear();
  useUi().sessionExpired();
  void router.replace({
    path: "/login",
    query: { expired: "1", returnTo: router.currentRoute.value.fullPath },
  });
});
app.config.errorHandler = (error) => {
  console.error(
    "页面运行异常",
    error instanceof Error ? error.name : "UnknownError",
  );
  useUi().notify("页面出现异常，请刷新后重试");
};
app.mount("#app");
