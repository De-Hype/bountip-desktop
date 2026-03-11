import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "electron/main.ts",
        vite: {
          build: {
            rollupOptions: {
              external: ["better-sqlite3", "keytar", "koffi"],
            },
          },
        },
      },
      preload: {
        input: "electron/preload.ts",
        vite: {
          build: {
            rollupOptions: {
              output: {
                format: "cjs",
                entryFileNames: "[name].cjs",
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
    }),
  ],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome120",
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // No manualChunks to avoid 'exports' undefined errors in mixed ESM/CJS environments
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
