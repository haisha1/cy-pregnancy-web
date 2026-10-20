import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { palettes } from "../theme/app-palette.generated";
export const useTheme = defineStore("theme", () => {
  const preference = ref<"system" | "light" | "dark">("system");
  try {
    const v = localStorage.getItem("cy:admin:theme");
    if (v === "light" || v === "dark" || v === "system") preference.value = v;
  } catch {
    /* 偏好不可存储时仍可使用界面。 */
  }
  const media = matchMedia("(prefers-color-scheme: dark)");
  const systemDark = ref(media.matches);
  media.addEventListener("change", (e) => (systemDark.value = e.matches));
  const resolved = computed(() =>
    preference.value === "system"
      ? systemDark.value
        ? "dark"
        : "light"
      : preference.value,
  );
  watch(
    [resolved, preference],
    () => {
      const root = document.documentElement;
      root.dataset.theme = resolved.value;
      for (const [k, v] of Object.entries(palettes[resolved.value]))
        root.style.setProperty(k, v);
      try {
        localStorage.setItem("cy:admin:theme", preference.value);
      } catch {}
    },
    { immediate: true },
  );
  return { preference, resolved };
});
