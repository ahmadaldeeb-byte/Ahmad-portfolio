import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/** Builds the whole platform as one self-contained HTML file (no server needed). */
const src = path.resolve(import.meta.dirname, "src");
export default defineConfig({
  root: path.join(src, "standalone"),
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: path.join(src, "standalone/shims/link.tsx") },
      { find: "next/navigation", replacement: path.join(src, "standalone/shims/navigation.ts") },
      { find: "next/dynamic", replacement: path.join(src, "standalone/shims/dynamic.tsx") },
      { find: "@", replacement: src },
    ],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-standalone"),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000,
  },
});
