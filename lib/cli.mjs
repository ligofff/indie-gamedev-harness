import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { CANONICAL_ROLES, readOpenCodeConfig } from "./config.mjs";
import { configureModels, discoverOpenCodeModels, promptForModelAssignments } from "./configure-models.mjs";
import { installHarness } from "./install.mjs";
import { assertSafeProjectDirectory, resolveProjectPath } from "./paths.mjs";
import { getHarnessStatus, printHarnessStatus } from "./status.mjs";
import { validateInstalledHarness } from "./validate.mjs";
import { discoverHarnessRoots, updateAllHarnesses, updateHarness } from "./update.mjs";
import { uninstallHarness } from "./uninstall.mjs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

export const PACKAGE_VERSION = packageJson.version;

const commands = new Set(["install", "configure-models", "update", "uninstall", "status", "validate"]);
const booleanFlags = new Set(["yes", "dry-run", "force", "all", "help", "version", "set-default", "skip-models", "non-interactive"]);
const modelFlags = new Map([["orchestrator-model", "orchestrator"], ["lead-programmer-model", "lead-programmer"], ["creative-model", "creative-guy"], ["explorer-model", "explorer"], ["simple-programmer-model", "simple-programmer"]]);

function invalidArgument(message) {
  const error = new Error(message);
  error.code = "INVALID_ARGUMENT";
  return error;
}

export function parseCliArguments(argv) {
  const result = { command: null, path: null, flags: {} };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument.startsWith("--")) {
      const flag = argument.slice(2);
      if (booleanFlags.has(flag)) {
        result.flags[flag] = true;
        continue;
      }
      if (modelFlags.has(flag)) {
        const model = argv[index + 1];
        if (!model || model.startsWith("--")) throw invalidArgument(`Missing value for --${flag}`);
        result.flags.models ||= {};
        result.flags.models[modelFlags.get(flag)] = model;
        index += 1;
        continue;
      }
      throw invalidArgument(`Unknown flag --${flag}`);
    }
    if (result.command === null) result.command = argument;
    else if (result.path === null) result.path = argument;
    else throw invalidArgument("Duplicate positional argument");
  }

  if (result.command !== null && !commands.has(result.command)) {
    throw invalidArgument(`Unknown command ${result.command}`);
  }
  if (result.command === null && Object.keys(result.flags).some((flag) => !["help", "version"].includes(flag))) {
    throw invalidArgument("Command required for supplied flags");
  }
  if (result.command !== null && (result.flags.help || result.flags.version)) {
    throw invalidArgument("Help and version cannot be combined with a command");
  }
  if (result.flags.all && (result.command !== "update" || result.path === null)) throw invalidArgument("--all requires update with an explicit directory");
  if (result.flags.models && !["install", "configure-models"].includes(result.command)) throw invalidArgument("Model flags require install or configure-models");
  if (result.flags["skip-models"] && result.flags.models) throw invalidArgument("--skip-models cannot be combined with model flags");
  return result;
}

function previousModels(root) {
  const config = readOpenCodeConfig(root).config;
  return Object.fromEntries(CANONICAL_ROLES.map((role) => [role, config.agent?.[role]?.model]).filter(([, model]) => model));
}

async function selectModels(root, flags, io, discover = discoverOpenCodeModels) {
  if (flags["skip-models"]) return {};
  if (flags["non-interactive"]) return Object.fromEntries(CANONICAL_ROLES.map((role) => [role, flags.models?.[role] || "inherit"]));
  let models = [];
  try { models = await discover({ cwd: root }); }
  catch (error) {
    if (error.code === "ENOENT") io.stderr.write("OpenCode was not found on PATH. Install OpenCode or add it to PATH; choose inherit, manual model IDs, or skip.\n");
    else io.stderr.write(`opencode models did not complete in ${root}. Run \"opencode models\" there to diagnose; choose inherit, manual model IDs, or skip.\n`);
  }
  const assignments = await promptForModelAssignments({ models, previousAssignments: previousModels(root), input: process.stdin, output: io.stdout, createInterface, yes: Boolean(flags.yes) });
  return { ...assignments, ...flags.models };
}

async function confirmUpdateAll(io) {
  const readline = createInterface({ input: process.stdin, output: io.stdout });
  try { return (await readline.question("Update all discovered harnesses? [y/N] ")).trim().toLowerCase() === "y"; }
  finally { readline.close(); }
}

export async function runCli(argv, io, { discoverOpenCodeModels: discover = discoverOpenCodeModels } = {}) {
  let parsed;
  try {
    parsed = parseCliArguments(argv);
  } catch (error) {
    io.stderr.write(`${error.message}\n`);
    return 2;
  }
  if (parsed.flags.version) {
    io.stdout.write(`${PACKAGE_VERSION}\n`);
    return 0;
  }
  if (parsed.flags.help || parsed.command === null) {
    io.stdout.write("Usage: gamedev-harness <install|configure-models|update|uninstall|status|validate> [path] [--yes] [--dry-run] [--force] [--all] [--set-default] [--skip-models] [--non-interactive] [--orchestrator-model provider/model] [--lead-programmer-model provider/model] [--creative-model provider/model] [--explorer-model provider/model] [--simple-programmer-model provider/model]\n");
    return 0;
  }
  try {
    const root = assertSafeProjectDirectory(resolveProjectPath(parsed.path));
    if (parsed.command === "install") {
      const models = await selectModels(root, parsed.flags, io, discover);
      const result = installHarness({ root, flags: { ...parsed.flags, models }, packageVersion: PACKAGE_VERSION, dryRun: Boolean(parsed.flags["dry-run"]) });
      io.stdout.write(`install: ${result.dryRun ? "dry-run" : "ok"}; copied ${result.copied}; adopted ${result.adopted}\n`);
      return result.conflicts?.length || !result.validation.valid ? 1 : 0;
    }
    if (parsed.command === "configure-models") {
      const models = await selectModels(root, parsed.flags, io, discover);
      const result = configureModels({ root, assignments: models, dryRun: Boolean(parsed.flags["dry-run"]) });
      io.stdout.write(`configure-models: ${result.dryRun ? "dry-run" : result.changed ? "ok" : "unchanged"}\n`);
      return 0;
    }
    if (parsed.command === "update") {
      if (parsed.flags.all) {
        if (parsed.flags["non-interactive"] && !parsed.flags.yes) {
          io.stderr.write("--all with --non-interactive requires --yes\n");
          return 2;
        }
        const roots = discoverHarnessRoots({ root });
        io.stdout.write(`update: discovered ${roots.length}\n`);
        for (const harnessRoot of roots) io.stdout.write(`update: discovered ${harnessRoot}\n`);
        if (!parsed.flags.yes && !parsed.flags["non-interactive"] && !(await confirmUpdateAll(io))) return 0;
        const results = updateAllHarnesses({ root, roots, packageVersion: PACKAGE_VERSION, force: Boolean(parsed.flags.force), dryRun: Boolean(parsed.flags["dry-run"]) });
        for (const item of results) io.stdout.write(`update: ${item.root}; ${item.error ? item.error.message : item.result.updated ? "ok" : "failed"}\n`);
        const failed = results.filter((item) => item.error || item.result.conflicts.length || !item.result.validation.valid);
        io.stdout.write(`update: ${results.length - failed.length} ok; ${failed.length} failed\n`);
        return failed.length ? 1 : 0;
      }
      const result = updateHarness({ root, packageVersion: PACKAGE_VERSION, force: Boolean(parsed.flags.force), dryRun: Boolean(parsed.flags["dry-run"]) });
      io.stdout.write(`update: ${result.dryRun ? "dry-run" : "ok"}\n`);
      return result.conflicts.length || !result.validation.valid ? 1 : 0;
    }
    if (parsed.command === "uninstall") {
      const result = uninstallHarness({ root, force: Boolean(parsed.flags.force), dryRun: Boolean(parsed.flags["dry-run"]) });
      io.stdout.write(`uninstall: ${result.dryRun ? "dry-run" : "ok"}; preserved ${result.preserved.length}\n`);
      return result.preserved.length ? 1 : 0;
    }
    if (parsed.command === "status") {
      const status = getHarnessStatus({ root, packageVersion: PACKAGE_VERSION });
      printHarnessStatus(status, io);
      return status.installed ? 0 : 1;
    }
    const result = validateInstalledHarness({ root });
    if (result.valid) io.stdout.write("validate: ok\n");
    else io.stderr.write(`validate: ${result.errors.join("; ")}\n`);
    return result.valid ? 0 : 1;
  } catch (error) {
    io.stderr.write(`${error.message}\n`);
    return ["UNSAFE_PATH", "INVALID_TARGET", "PATH_TRAVERSAL", "SYMLINK_DESTINATION", "INVALID_ARGUMENT"].includes(error.code) ? 2 : 1;
  }
}
