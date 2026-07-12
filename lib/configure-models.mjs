import { execFile as nodeExecFile } from "node:child_process";
import { createInterface as nodeCreateInterface } from "node:readline/promises";
import { relative } from "node:path";
import { CANONICAL_ROLES, mergeModelAssignments, readOpenCodeConfig } from "./config.mjs";
import { assertSafeDestination, atomicWriteFile } from "./filesystem.mjs";
import { assertSafeProjectDirectory } from "./paths.mjs";

function run(execFile, command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { encoding: "utf8" }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function discoverOpenCodeModels({ execFile = nodeExecFile } = {}) {
  const output = await run(execFile, "opencode", ["models"]);
  return [...new Set(output.split(/\r?\n/).map((line) => line.trim()).filter((model) => /^[^/\s]+\/[^/\s]+$/.test(model)))];
}

export async function promptForModelAssignments({ models = [], previousAssignments = {}, input = process.stdin, output = process.stdout, createInterface = nodeCreateInterface, yes = false } = {}) {
  if (yes) return Object.fromEntries(CANONICAL_ROLES.map((role) => [role, previousAssignments[role] || "inherit"]));
  const readline = createInterface({ input, output });
  try {
    const choose = await readline.question("Models: [a]ll inherit, all [s]ame, [i]ndividual, [r]euse previous, [m]anual, [k]skip: ");
    let assignments;
    if (["", "a", "all", "k", "skip"].includes(choose.trim().toLowerCase())) assignments = Object.fromEntries(CANONICAL_ROLES.map((role) => [role, "inherit"]));
    else if (["r", "reuse"].includes(choose.trim().toLowerCase())) assignments = Object.fromEntries(CANONICAL_ROLES.map((role) => [role, previousAssignments[role] || "inherit"]));
    else if (["s", "same"].includes(choose.trim().toLowerCase())) {
      const model = await readline.question("Model (inherit or provider/model): ");
      assignments = Object.fromEntries(CANONICAL_ROLES.map((role) => [role, model.trim() || "inherit"]));
    } else {
      assignments = {};
      for (const role of CANONICAL_ROLES) {
        const available = models.length ? ` (${models.join(", ")})` : "";
        const model = await readline.question(`${role}${available} [${previousAssignments[role] || "inherit"}]: `);
        assignments[role] = model.trim() || previousAssignments[role] || "inherit";
      }
    }
    const unknown = Object.values(assignments).filter((model) => model !== "inherit" && !models.includes(model));
    if (unknown.length && (await readline.question(`Unknown model(s): ${[...new Set(unknown)].join(", ")}. Continue? [y/N] `)).trim().toLowerCase() !== "y") {
      return Object.fromEntries(CANONICAL_ROLES.map((role) => [role, "inherit"]));
    }
    return assignments;
  } finally {
    readline.close();
  }
}

export function configureModels({ root, assignments, dryRun = false }) {
  const projectRoot = assertSafeProjectDirectory(root);
  const configInfo = readOpenCodeConfig(projectRoot);
  if (configInfo.path) assertSafeDestination(projectRoot, relative(projectRoot, configInfo.path));
  const merged = mergeModelAssignments(configInfo.text, assignments);
  if (merged.changed) atomicWriteFile(projectRoot, configInfo.path ? relative(projectRoot, configInfo.path) : "opencode.json", merged.text, { dryRun });
  return { dryRun, changed: merged.changed, models: merged.modelsSetByInstaller };
}
