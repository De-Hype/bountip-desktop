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
    chunkSizeWarningLimit: 1000, // Increase warning limit
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("@radix-ui") ||
              id.includes("lucide-react") ||
              id.includes("framer-motion")
            ) {
              return "vendor-ui";
            }
            if (id.includes("@tanstack") || id.includes("date-fns")) {
              return "vendor-utils";
            }
            if (id.includes("country-state-city")) {
              return "vendor-geo-data";
            }
            if (id.includes("react-icons")) {
              return "vendor-icons";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            return "vendor"; // All other node_modules
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
