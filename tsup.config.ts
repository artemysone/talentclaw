import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["bin/talentclaw.ts"],
  format: ["esm"],
  outDir: "dist",
  target: "node22",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
})
