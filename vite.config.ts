import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [vue()],
  server: {
    watch: {
      ignored: [
        "**/artifacts/**",
        "**/test-results/**",
        "**/playwright-report/**",
        "**/.local/**",
        "**/docs/**",
      ],
    },
    port: 5174,
    strictPort: true,
    proxy: {
      "/admin/api": {
        target: process.env.ADMIN_API_TARGET || "http://127.0.0.1:18732",
        changeOrigin: false,
      },
    },
  },
  build: { sourcemap: false, chunkSizeWarningLimit: 900 },
});
