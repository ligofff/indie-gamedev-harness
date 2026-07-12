import { existsSync, lstatSync, readdirSync, readFileSync, rmdirSync } from "node:fs";
import { dirname, relative } from "node:path";
import { cleanupHarnessConfig, readOpenCodeConfig } from "./config.mjs";
import { assertSafeDestination, atomicWriteFile, backupFileInProject, removeFileInProject } from "./filesystem.mjs";
import { parseManifest, sha256 } from "./manifest.mjs";
import { assertSafeProjectDirectory } from "./paths.mjs";

const MANIFEST_TARGET = ".opencode/harness/manifest.json";

function readManifest(root) {
  const path = assertSafeDestination(root, MANIFEST_TARGET);
  if (!existsSync(path)) {
    const error = new Error("Manifest missing");
    error.code = "INVALID_MANIFEST";
    throw error;
  }
  return parseManifest(readFileSync(path, "utf8"));
}

function removeEmptyParents(root, target, dryRun) {
  let directory = dirname(assertSafeDestination(root, target));
  while (directory !== root && existsSync(directory) && lstatSync(directory).isDirectory() && readdirSync(directory).length === 0) {
    if (!dryRun) rmdirSync(directory);
    directory = dirname(directory);
  }
}

export function uninstallHarness({ root, force = false, dryRun = false }) {
  const projectRoot = assertSafeProjectDirectory(root);
  const manifest = readManifest(projectRoot);
  const preserved = [];
  const removed = [];
  for (const [target, entry] of Object.entries(manifest.managedFiles)) {
    const path = assertSafeDestination(projectRoot, target);
    if (!existsSync(path)) continue;
    if (sha256(readFileSync(path)) !== entry.baseSha256 && !force) {
      preserved.push(target);
      continue;
    }
    if (!dryRun && force && sha256(readFileSync(path)) !== entry.baseSha256) backupFileInProject(projectRoot, target);
    if (!dryRun && existsSync(path)) removeFileInProject(projectRoot, target);
    removeEmptyParents(projectRoot, target, dryRun);
    removed.push(target);
  }
  const configInfo = readOpenCodeConfig(projectRoot);
  const cleanup = cleanupHarnessConfig(configInfo.text, manifest.configChanges);
  if (!dryRun && cleanup.changed) atomicWriteFile(projectRoot, configInfo.path ? relative(projectRoot, configInfo.path) : "opencode.json", cleanup.text);
  if (!dryRun) removeFileInProject(projectRoot, MANIFEST_TARGET);
  removeEmptyParents(projectRoot, MANIFEST_TARGET, dryRun);
  return { dryRun, removed, preserved, configChanged: cleanup.changed };
}
