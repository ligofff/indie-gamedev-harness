import { existsSync, readFileSync } from "node:fs";
import { CANONICAL_ROLES, findOpenCodeConfig, readOpenCodeConfig, RULES_INSTRUCTION } from "./config.mjs";
import { assertSafeDestination } from "./filesystem.mjs";
import { parseManifest, sha256 } from "./manifest.mjs";
import { assertSafeProjectDirectory } from "./paths.mjs";
import { listTemplateFiles } from "./templates.mjs";
const MANIFEST_TARGET = ".opencode/harness/manifest.json";

export function getHarnessStatus({ root, packageVersion }) {
  const projectRoot = assertSafeProjectDirectory(root);
  let manifest;
  try {
    const manifestPath = assertSafeDestination(projectRoot, MANIFEST_TARGET);
    if (!existsSync(manifestPath)) return { installed: false, version: null, currentVersion: packageVersion, errors: ["Manifest missing"] };
    manifest = parseManifest(readFileSync(manifestPath, "utf8"));
  } catch (error) { return { installed: false, version: null, currentVersion: packageVersion, errors: [error.message] }; }
  const files = {};
  for (const [target, entry] of Object.entries(manifest.managedFiles)) {
    try {
      const path = assertSafeDestination(projectRoot, target);
      files[target] = !existsSync(path) ? "missing" : sha256(readFileSync(path)) === entry.baseSha256 ? "clean" : "modified";
    } catch { files[target] = "missing"; }
  }
  const candidates = Object.keys(files).filter((target) => {
    try { return existsSync(assertSafeDestination(projectRoot, `${target}.harness-new`)); } catch { return false; }
  });
  const unmanagedCollisions = [];
  for (const template of listTemplateFiles()) {
    if (template.target in manifest.managedFiles) continue;
    try {
      const path = assertSafeDestination(projectRoot, template.target);
      if (existsSync(path)) unmanagedCollisions.push(template.target);
    } catch (error) { unmanagedCollisions.push(`${template.target}: ${error.message}`); }
  }
  let config;
  try {
    const configPath = findOpenCodeConfig(projectRoot);
    if (configPath) assertSafeDestination(projectRoot, configPath.slice(projectRoot.length + 1));
    config = readOpenCodeConfig(projectRoot).config;
  } catch (error) { return { installed: true, version: manifest.packageVersion, currentVersion: packageVersion, files, candidates, unmanagedCollisions, errors: [error.message] }; }
  const models = Object.fromEntries(CANONICAL_ROLES.map((role) => [role, config.agent?.[role]?.model || "inherit"]));
  const instructionCount = Array.isArray(config.instructions) ? config.instructions.filter((item) => item === RULES_INSTRUCTION).length : 0;
  return { installed: true, version: manifest.packageVersion, currentVersion: packageVersion, current: manifest.packageVersion === packageVersion, files, candidates, unmanagedCollisions, models, instruction: instructionCount === 1 ? "exactly-one" : instructionCount === 0 ? "missing" : "multiple", defaultAgent: config.default_agent === undefined ? "missing" : config.default_agent, errors: [] };
}

export function printHarnessStatus(status, io) {
  io.stdout.write(`installed: ${status.installed}\n`);
  if (status.version) io.stdout.write(`version: ${status.version} (current ${status.currentVersion})\n`);
  if (status.installed) {
    io.stdout.write(`current: ${status.current}\n`);
    for (const [file, state] of Object.entries(status.files || {})) io.stdout.write(`file: ${file}: ${state}\n`);
    for (const candidate of status.candidates || []) io.stdout.write(`candidate: ${candidate}\n`);
    for (const collision of status.unmanagedCollisions || []) io.stdout.write(`unmanaged collision: ${collision}\n`);
    for (const [role, model] of Object.entries(status.models || {})) io.stdout.write(`model: ${role}: ${model}\n`);
    io.stdout.write(`default agent: ${status.defaultAgent}\n`);
    io.stdout.write(`instruction: ${status.instruction}\n`);
  }
  for (const error of status.errors || []) io.stdout.write(`error: ${error}\n`);
}
