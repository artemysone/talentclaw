import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.claude/worktrees/**", "**/.claude/skills/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/actions/**"],
      exclude: ["**/__tests__/**", "lib/test-helpers.ts"],
    },
  },
})
