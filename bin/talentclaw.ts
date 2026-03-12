import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runSearch } from "./search.js";
import { checkNodeVersion } from "./bootstrap/check-node-version.js";
import { detectRuntime } from "./bootstrap/detect-runtime.js";
import { installRuntime } from "./bootstrap/install-runtime.js";
import { installCoffeeshop } from "./bootstrap/install-coffeeshop.js";
import { installSkill } from "./bootstrap/install-skill.js";
import { scaffoldWorkspace } from "./bootstrap/scaffold-workspace.js";
import { checkCredentials } from "./bootstrap/check-credentials.js";
import { checkGateway } from "./bootstrap/check-gateway.js";
import { startServer } from "./bootstrap/start-server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const skillSrcDir = join(packageRoot, "skills");

// 1. Node.js version gate
checkNodeVersion();

// Subcommand routing
const subcommand = process.argv[2];
if (subcommand === "search") {
  await runSearch(process.argv.slice(3));
  process.exit(0);
}

console.log("\n\x1b[1mtalentclaw\x1b[0m — your AI career agent\n");

// 2. Detect or install agent runtime
let runtime = detectRuntime();
if (!runtime) {
  runtime = installRuntime();
}

// 3. Coffee Shop CLI
const hasCoffeeshop = installCoffeeshop();

// 4. Install skill into runtime workspace
const skillInstalled = installSkill(runtime, skillSrcDir);

// 5. Scaffold ~/.talentclaw/
scaffoldWorkspace();

// 6. Check credentials
const hasApiKey = checkCredentials();

// 7. Check gateway health
const gatewayReachable = checkGateway(runtime);

// 8. Start Next.js dev server and print checklist
startServer(packageRoot, {
  runtime,
  skillInstalled,
  hasCoffeeshop,
  hasApiKey,
  gatewayReachable,
});
