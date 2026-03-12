import { existsSync } from "node:fs";
import { platform } from "node:os";
import { spawn, exec } from "node:child_process";
import { DATA_DIR, log } from "../helpers.js";
import { check } from "./utils.js";
import type { Runtime } from "./detect-runtime.js";

interface BootstrapState {
  runtime: Runtime | null;
  skillInstalled: boolean;
  hasCoffeeshop: boolean;
  hasApiKey: boolean;
  gatewayReachable: boolean;
}

export function startServer(
  packageRoot: string,
  state: BootstrapState,
): void {
  log("◆", "Starting web UI...");

  const nextProcess = spawn("npx", ["next", "dev", "--port", "3100"], {
    cwd: packageRoot,
    stdio: "pipe",
    shell: true,
  });

  let uiReady = false;
  let uiFailed = false;
  let uiError = "";
  let checklistPrinted = false;

  function printChecklist() {
    if (checklistPrinted) return;
    checklistPrinted = true;

    const { runtime, skillInstalled, hasCoffeeshop, hasApiKey, gatewayReachable } = state;

    console.log("\n\x1b[2m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
    console.log("\x1b[1mBootstrap checklist\x1b[0m\n");

    check("Agent runtime", !!runtime, runtime?.name || "none");
    check("talentclaw skill", skillInstalled);
    check("Workspace", existsSync(DATA_DIR), DATA_DIR);
    check(
      "Coffee Shop CLI",
      hasCoffeeshop,
      hasCoffeeshop ? "installed" : "npm install -g coffeeshop",
    );
    check(
      "Coffee Shop account",
      hasApiKey,
      hasApiKey ? "connected" : "your agent will set this up",
    );
    if (runtime?.name === "OpenClaw" || runtime?.name === "ZeroClaw") {
      check(
        "Gateway",
        gatewayReachable,
        gatewayReachable ? "reachable" : `start with: ${runtime.cmd} start`,
      );
    }

    const uiOk = uiReady && !uiFailed;
    check(
      "Web UI",
      uiOk,
      uiOk ? "http://localhost:3100" : uiError || "failed to start",
    );

    console.log("\n\x1b[2m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");

    if (uiOk) {
      console.log(
        `\n\x1b[1mtalentclaw ready\x1b[0m — http://localhost:3100\n`,
      );

      const url = "http://localhost:3100";
      const openCmd =
        platform() === "darwin"
          ? "open"
          : platform() === "win32"
            ? "start"
            : "xdg-open";

      exec(`${openCmd} ${url}`, (err) => {
        if (err) {
          console.log(`Open ${url} in your browser to get started.`);
        }
      });
    } else {
      console.log(`\n\x1b[33mWeb UI failed to start\x1b[0m — ${uiError}`);
      if (uiError.includes("already in use")) {
        console.log(
          `  Kill the existing process: \x1b[1mlsof -ti :3100 | xargs kill\x1b[0m`,
        );
        console.log(`  Then re-run: \x1b[1mnpx talentclaw\x1b[0m\n`);
      }
    }
  }

  nextProcess.stdout?.on("data", (data: Buffer) => {
    const text = data.toString();
    if (!uiReady && !uiFailed && text.includes("Ready")) {
      uiReady = true;
      printChecklist();
    }
  });

  nextProcess.stderr?.on("data", (data: Buffer) => {
    const text = data.toString();
    if (text.includes("EADDRINUSE")) {
      uiFailed = true;
      uiError = "port 3100 is already in use";
      process.stderr.write(data);
      printChecklist();
    } else if (text.includes("Error") || text.includes("error")) {
      process.stderr.write(data);
    }
  });

  nextProcess.on("exit", (code) => {
    if (code !== null && code !== 0 && !uiReady && !uiFailed) {
      uiFailed = true;
      uiError = uiError || `server exited with code ${code}`;
      printChecklist();
    }
  });

  nextProcess.on("error", (err) => {
    uiFailed = true;
    uiError = err.message;
    printChecklist();
  });

  // Fallback: print checklist after timeout if "Ready" never appears
  setTimeout(() => {
    if (!uiReady && !uiFailed) {
      uiReady = true;
      printChecklist();
    }
  }, 8000);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down talentclaw...");
    nextProcess.kill("SIGINT");
    process.exit(0);
  });
}
