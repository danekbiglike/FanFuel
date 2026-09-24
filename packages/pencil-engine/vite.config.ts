import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const demoDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "demo");
export default defineConfig({
  build: { rollupOptions: { input: {
    index: resolve(demoDirectory, "index.html"),
    study: resolve(demoDirectory, "study.html"),
    contour: resolve(demoDirectory, "contour.html")
  } } }
});
