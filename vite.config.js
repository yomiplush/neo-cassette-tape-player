import { defineConfig } from "vite";
export default defineConfig(({ mode }) => ({
  base: "./",
  build: { outDir: mode === "selfhost" ? "dist-selfhost" : "dist" },
}));
