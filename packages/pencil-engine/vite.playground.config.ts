import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(directory, "playground"),
  base: "/",
  build: {
    outDir: resolve(directory, "dist-playground"),
    emptyOutDir: true,
    rollupOptions: { input: resolve(directory, "playground/index.html") }
  }
});
