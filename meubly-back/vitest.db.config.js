import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/db/**/*.db.test.js"],
    setupFiles: ["./tests/db/env.js"],
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
