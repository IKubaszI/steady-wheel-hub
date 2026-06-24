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
          // Core React stack \u2014 cached separately and rarely changes
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Firebase SDK \u2014 large (~694 kB) but only needed after auth
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          // TanStack Query \u2014 isolated for better long-term cache hits
          query: ["@tanstack/react-query"],
          // Recharts \u2014 only used on the Analytics page, defer loading it
          recharts: ["recharts"],
          // Tesseract.js WASM OCR \u2014 huge, only needed on explicit user action
          tesseract: ["tesseract.js"],
        },
      },
    },
  },
}));
