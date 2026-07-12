import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const configPath = join(root, "opencode.json");
let failed = false;

function fail(message) {
  failed = true;
  console.error(`FAIL ${message}`);
}

if (!existsSync(configPath)) {
  fail("opencode.json: missing");
} else {
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    if (config.$schema !== "https://opencode.ai/config.json") fail("opencode.json: invalid canonical schema URL");
  } catch (error) {
    fail(`opencode.json: invalid JSON (${error.message})`);
  }
}

if (!failed) console.log("PASS canonical source schema");
if (failed) process.exitCode = 1;
