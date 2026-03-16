#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");

const PLATFORMS = {
  "darwin-arm64": "@artemyshq/talentclaw-cli-darwin-arm64",
  "darwin-x64": "@artemyshq/talentclaw-cli-darwin-x64",
  "linux-x64": "@artemyshq/talentclaw-cli-linux-x64",
};

const key = `${process.platform}-${process.arch}`;
const pkg = PLATFORMS[key];

if (!pkg) {
  console.error(`talentclaw: unsupported platform ${key}`);
  console.error(`Supported: ${Object.keys(PLATFORMS).join(", ")}`);
  process.exit(1);
}

let binPath;
try {
  const require = createRequire(import.meta.url);
  const pkgDir = dirname(require.resolve(`${pkg}/package.json`));
  binPath = join(pkgDir, "bin", "talentclaw");
} catch {
  console.error(`talentclaw: could not find native binary package ${pkg}`);
  console.error("Try reinstalling: npm install -g talentclaw");
  process.exit(1);
}

try {
  execFileSync(binPath, process.argv.slice(2), {
    stdio: "inherit",
    env: { ...process.env, TALENTCLAW_PACKAGE_ROOT: packageRoot },
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
