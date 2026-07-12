import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { findOpenCodeConfig, mergeHarnessConfig, mergeModelAssignments, readOpenCodeConfig } from "./config.mjs";
import { assertSafeDestination, atomicWriteFile, backupFileInProject, removeFileInProject } from "./filesystem.mjs";
import { createManifest, parseManifest, serializeManifest, sha256, PACKAGE_NAME } from "./manifest.mjs";
import { assertSafeProjectDirectory } from "./paths.mjs";
import { listTemplateFiles, loadHarnessPermissions, readTemplateFile } from "./templates.mjs";
import { validateInstalledHarness } from "./validate.mjs";
import { updateHarness } from "./update.mjs";

export const MANIFEST_TARGET = ".opencode/harness/manifest.json";

function controlledError(message) {
  const error = new Error(message);
  error.code = "INSTALL_COLLISION";
  return error;
}

function existingManifest(root) {
  const path = assertSafeDestination(root, MANIFEST_TARGET);
  if (!existsSync(path)) return null;
  return parseManifest(readFileSync(path, "utf8"));
}

function snapshotFiles(root, targets) {
  return targets.map((target) => {
    const path = assertSafeDestination(root, target);
    return { target, bytes: existsSync(path) ? readFileSync(path) : null };
  });
}

function restoreFiles(root, snapshots, backups) {
  for (const snapshot of snapshots) {
    if (snapshot.bytes === null) removeFileInProject(root, snapshot.target);
    else atomicWriteFile(root, snapshot.target, snapshot.bytes);
  }
  for (const backup of backups) removeFileInProject(root, backup);
}

export function installHarness({ root, flags = {}, packageVersion, dryRun = false }) {
  const projectRoot = assertSafeProjectDirectory(root);
  const templates = listTemplateFiles();
  const manifest = existingManifest(projectRoot);
  if (manifest) return { ...updateHarness({ root: projectRoot, packageVersion, force: Boolean(flags.force), dryRun, modelAssignments: flags.models }), reinstalled: true };
  const sources = new Map(templates.map((template) => [template.target, readTemplateFile(template)]));
  const configPath = findOpenCodeConfig(projectRoot);
  if (configPath) assertSafeDestination(projectRoot, configPath.slice(projectRoot.length + 1));
  const configInfo = readOpenCodeConfig(projectRoot);
  const configTarget = configInfo.path ? relative(projectRoot, configInfo.path) : "opencode.json";

  const collisions = [];
  for (const [target, source] of sources) {
    const destination = assertSafeDestination(projectRoot, target);
    if (!existsSync(destination)) continue;
    const bytes = readFileSync(destination);
    const managed = manifest?.managedFiles[target];
    if (Buffer.compare(bytes, source) === 0 || (managed && sha256(bytes) === managed.baseSha256)) continue;
    collisions.push(target);
  }
  if (collisions.length && !flags.force) throw controlledError(`Existing file conflicts: ${collisions.join(", ")}`);

  const snapshots = dryRun ? [] : snapshotFiles(projectRoot, [...sources.keys(), configTarget, MANIFEST_TARGET]);
  const backups = [];

  try {
    let merged = mergeHarnessConfig(configInfo.text, { permissions: loadHarnessPermissions(), setDefault: flags.setDefault, force: flags.force });
    const assignments = flags.models || {};
    if (Object.keys(assignments).length) {
      const modelMerge = mergeModelAssignments(merged.text, assignments);
      merged = {
        ...merged,
        text: modelMerge.text,
        changed: merged.changed || modelMerge.changed,
        changes: { ...merged.changes, modelsSetByInstaller: modelMerge.modelsSetByInstaller },
      };
    }

    const managedFiles = {};
    let copied = 0;
    let adopted = 0;
    for (const [target, source] of sources) {
      const destination = assertSafeDestination(projectRoot, target);
      if (existsSync(destination) && Buffer.compare(readFileSync(destination), source) === 0) adopted += 1;
      else copied += 1;
      managedFiles[target] = { baseSha256: sha256(source), sourceSha256: sha256(source) };
      if (!dryRun && (!existsSync(destination) || Buffer.compare(readFileSync(destination), source) !== 0)) {
        if (existsSync(destination)) {
          backups.push(backupFileInProject(projectRoot, target));
        }
        atomicWriteFile(projectRoot, target, source);
      }
    }
    const now = new Date().toISOString();
    const outputManifest = createManifest({
      packageName: PACKAGE_NAME,
      packageVersion,
      sourceVersion: packageVersion,
      currentVersion: packageVersion,
      installedAt: manifest?.installedAt || now,
      updatedAt: now,
      managedFiles,
      configChanges: { ...merged.changes, permissionConflicts: merged.permissionConflicts },
    });
    if (!dryRun && merged.changed) atomicWriteFile(projectRoot, configTarget, merged.text);
    if (!dryRun) atomicWriteFile(projectRoot, MANIFEST_TARGET, serializeManifest(outputManifest));
    const validation = dryRun ? { valid: true, errors: [] } : validateInstalledHarness({ root: projectRoot });
    if (!validation.valid) throw controlledError(`Install validation failed: ${validation.errors.join("; ")}`);
    return { dryRun, copied, adopted, configChanged: merged.changed, validation, reinstalled: false };
  } catch (error) {
    if (!dryRun) restoreFiles(projectRoot, snapshots, backups.filter(Boolean));
    throw error;
  }
}
