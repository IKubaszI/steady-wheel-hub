import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/steady-wheel-hub/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        // Rozbicie monolitycznego bundla na osobne chunki vendorów.
        // Ciężkie zależności (firebase ~400kB) ładują się równolegle i są
        // cache'owane osobno, dzięki czemu nie blokują pierwszego renderu.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
}));
