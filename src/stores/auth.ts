import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, setToken } from "../services/http";
import type { Identity } from "../types/api";
export const useAuth = defineStore("auth", () => {
  const identity = ref<Identity | null>(null);
  const authenticated = computed(() => identity.value !== null);
  const can = (permission: string) =>
    identity.value?.permissions.includes(permission) ?? false;
  function clear() {
    identity.value = null;
    setToken("");
  }
  async function login(username: string, password: string) {
    const result = await api<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    setToken(result.accessToken);
    try {
      identity.value = await api<Identity>("/me");
    } catch (e) {
      clear();
      throw e;
    }
  }
  async function refresh() {
    identity.value = await api<Identity>("/me");
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      clear();
    }
  }
  return { identity, authenticated, can, login, logout, refresh, clear };
});
