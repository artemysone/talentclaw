import { execSync } from "node:child_process";
import { log, which, cmdVersion } from "./utils.js";

export function installCoffeeshop(): boolean {
  if (which("coffeeshop")) {
    const csVersion = cmdVersion("coffeeshop");
    log("◆", `Coffee Shop detected${csVersion ? ` (${csVersion})` : ""}`);
    return true;
  }

  log("◆", "Installing Coffee Shop...");
  try {
    execSync("npm install -g coffeeshop", { stdio: "inherit" });
    log("  ✓", "Coffee Shop installed globally");
    return true;
  } catch {
    log(
      "  ✗",
      "Failed to install Coffee Shop. Install it manually: npm install -g coffeeshop",
    );
    return false;
  }
}
