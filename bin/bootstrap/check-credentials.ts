import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "../helpers.js";

export function checkCredentials(): boolean {
  let apiKey: string | undefined = process.env.COFFEESHOP_API_KEY;

  if (!apiKey) {
    try {
      const configContent = readFileSync(
        join(DATA_DIR, "config.yaml"),
        "utf-8",
      );
      const match = configContent.match(
        /^coffeeshop_api_key:\s*["']?(.+?)["']?\s*$/m,
      );
      if (match && match[1]) {
        apiKey = match[1];
      }
    } catch {
      // Config unreadable — ignore
    }
  }

  return !!apiKey;
}
