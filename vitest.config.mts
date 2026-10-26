import { defineConfig } from "vitest/config";
import path from "node:path";

// .mts so Vite loads it as ESM — a .ts config with ESM syntax is loaded as
// CommonJS and warns under Vite's native config loader. The package stays
// CommonJS for Next's sake, so this file carries the extension instead.
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json so tests import the same
    // way application code does.
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // The first run downloads a mongod binary, and booting a replica set is
    // slower than a standalone instance.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Each suite boots its own mongod; running them in parallel on one machine
    // is slower and flakier than running them in sequence.
    fileParallelism: false,
  },
});
