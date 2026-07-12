import { execFile as nodeExecFile } from "node:child_process";
import { createInterface as nodeCreateInterface } from "node:readline/promises";
import { relative } from "node:path";
import { CANONICAL_ROLES, isValidModelId, mergeModelAssignments, readOpenCodeConfig } from "./config.mjs";
import { assertSafeDestination, atomicWriteFile } from "./filesystem.mjs";
import { assertSafeProjectDirectory } from "./paths.mjs";

function run(execFile, command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export async function discoverOpenCodeModels({ cwd, execFile = nodeExecFile, platform = process.platform } = {}) {
  const output = platform === "win32"
    ? await run(execFile, process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "opencode models"], { encoding: "utf8", cwd })
    : await run(execFile, "opencode", ["models"], { encoding: "utf8", cwd });
  return [...new Set(output.split(/\r?\n/).map((line) => line.trim()).filter(isValidModelId))];
}

export async function promptForModelAssignments({ models = [], previousAssignments = {}, input = process.stdin, output = process.stdout, createInterface = nodeCreateInterface, yes = false } = {}) {
  if (yes) return Object.fromEntries(CANONICAL_ROLES.map((role) => [role, previousAssignments[role] || "inherit"]));
  const readline = createInterface({ input, output });
  try {
    const providers = [];
    for (const model of models) {
      const name = model.slice(0, model.indexOf("/"));
      let provider = providers.find((entry) => entry.name === name);
      if (!provider) {
        provider = { name, models: [] };
        providers.push(provider);
      }
      provider.models.push(model);
    }
    const showAvailableProviders = () => {
      output.write(`Available providers: ${providers.length}:\n`);
      for (const [index, provider] of providers.entries()) output.write(`${index + 1}. ${provider.name} (${provider.models.length})\n`);
    };
    const showAvailableModels = (provider) => {
      const displayedModels = provider.models.slice(0, 10);
      output.write(`Available models from ${provider.name}: ${provider.models.length}. First ${displayedModels.length}:\n`);
      for (const [index, model] of displayedModels.entries()) output.write(`${index + 1}. ${model}\n`);
    };
    const selectManualModel = async (fallback) => {
      let answer = await readline.question(`Manual model [${fallback}]: `);
      while (true) {
        const model = answer.trim();
        if (!model) return fallback;
        if (model.toLowerCase() === "inherit") return "inherit";
        if (isValidModelId(model)) return model;
        answer = await readline.question("Invalid model. Try again: ");
      }
    };
    const selectModel = async (provider, fallback) => {
      showAvailableModels(provider);
      let answer = await readline.question("Model [manual/inherit]: ");
      while (true) {
        const model = answer.trim();
        if (!model) return fallback;
        if (model.toLowerCase() === "inherit") return "inherit";
        if (model.toLowerCase() === "manual") return selectManualModel(fallback);
        if (/^\d+$/.test(model)) {
          const index = Number(model) - 1;
          if (index >= 0 && index < Math.min(10, provider.models.length)) return provider.models[index];
        }
        answer = await readline.question("Invalid model. Try again: ");
      }
    };
    const selectProvider = async (fallback) => {
      showAvailableProviders();
      let answer = await readline.question("Provider [manual/inherit]: ");
      while (true) {
        const provider = answer.trim();
        if (!provider) return fallback;
        if (provider.toLowerCase() === "inherit") return "inherit";
        if (provider.toLowerCase() === "manual") return selectManualModel(fallback);
        if (/^\d+$/.test(provider)) {
          const index = Number(provider) - 1;
          if (index >= 0 && index < providers.length) return selectModel(providers[index], fallback);
        }
        answer = await readline.question("Invalid provider. Try again: ");
      }
    };
    const choose = await readline.question("Models: [a]ll inherit, all [s]ame, [i]ndividual, [r]euse previous, [m]anual, [k]skip: ");
    let assignments;
    if (["", "a", "all", "k", "skip"].includes(choose.trim().toLowerCase())) assignments = Object.fromEntries(CANONICAL_ROLES.map((role) => [role, "inherit"]));
    else if (["r", "reuse"].includes(choose.trim().toLowerCase())) assignments = Object.fromEntries(CANONICAL_ROLES.map((role) => [role, previousAssignments[role] || "inherit"]));
    else if (["s", "same"].includes(choose.trim().toLowerCase())) {
      const model = await selectProvider("inherit");
      assignments = Object.fromEntries(CANONICAL_ROLES.map((role) => [role, model]));
    } else {
      assignments = {};
      for (const role of CANONICAL_ROLES) {
        output.write(`${role} [${previousAssignments[role] || "inherit"}]:\n`);
        assignments[role] = await selectProvider(previousAssignments[role] || "inherit");
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
