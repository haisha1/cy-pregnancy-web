import { onBeforeUnmount, onMounted } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useUi } from "../stores/ui";
import { useAuth } from "../stores/auth";
export function useUnsaved(dirty: () => boolean) {
  const ui = useUi(),
    auth = useAuth();
  onBeforeRouteLeave(
    () =>
      !auth.authenticated ||
      !dirty() ||
      ui.confirm({
        title: "离开编辑页面？",
        body: "尚有未保存修改。可以继续编辑，或放弃本次修改。",
        confirmText: "放弃修改",
      }),
  );
  const guard = (event: BeforeUnloadEvent) => {
    if (dirty()) {
      event.preventDefault();
      event.returnValue = "";
    }
  };
  onMounted(() => window.addEventListener("beforeunload", guard));
  onBeforeUnmount(() => window.removeEventListener("beforeunload", guard));
}
