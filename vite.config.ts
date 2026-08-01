import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiOrigin = new URL(
    env.AXIOM_AUTH_CALLBACK_URL || "http://localhost:8000/api/auth/callback",
  ).origin;

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
    build: {
      // Three.js is isolated behind the cinematic runtime lazy-load; warn only above that approved vendor chunk.
      chunkSizeWarningLimit: 550,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/three")) {
              return "three";
            }
            return undefined;
          }
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["src/test/setup.ts"],
      globals: true,
    },
  };
});
