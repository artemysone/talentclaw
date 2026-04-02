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
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/dist-electron/**", "**/.claude/worktrees/**", "**/.claude/skills/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "app/actions/**", "app/api/**"],
      exclude: ["**/*.test.ts", "**/__tests__/**", "**/.next/**", "**/dist/**", "**/dist-electron/**", "lib/test-helpers.ts"],
    },
  },
})
