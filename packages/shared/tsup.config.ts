import { defineConfig } from "tsup";

/**
 * Dual build: ESM (.js) for bundler consumers (Vite/web) and CommonJS (.cjs)
 * for Node/NestJS (api), plus one set of .d.ts. A `export *` barrel is only
 * statically analyzable by bundlers in its ESM form — hence both formats.
 */
export default defineConfig({
  entry: [
    "src/index.ts",
    "src/extraction/index.ts",
    "src/catalog/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
});
