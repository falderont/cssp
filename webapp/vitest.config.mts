import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["prisma/tests/**/*.test.ts"],
    setupFiles: ["prisma/tests/setup.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
    // "server-only" (imported by lib/db.ts, lib/tenant.ts, etc.) resolves to a
    // no-op only under the "react-server" export condition that Next's server
    // bundler sets; without it, importing those modules under plain Vite/Vitest
    // throws. This makes vitest resolve the same way Next's server build does.
    conditions: ["react-server"],
  },
  ssr: {
    resolve: {
      conditions: ["react-server"],
    },
  },
});
