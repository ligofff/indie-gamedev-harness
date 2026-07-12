import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { mergeModelAssignments, readOpenCodeConfig } from "./config.mjs";
import { assertSafeDestination, atomicWriteFile, backupFileInProject, removeFileInProject } from "./filesystem.mjs";
import { createManifest, parseManifest, serializeManifest, sha256 } from "./manifest.mjs";
import { assertSafeProjectDirectory } from "./paths.mjs";
import { listTemplateFiles, readTemplateFile } from "./templates.mjs";
import { validateInstalledHarness } from "./validate.mjs";

export const MANIFEST_TARGET = ".opencode/harness/manifest.json";

function conflict(message) {
  const error = new Error(message);
  error.code = "UPDATE_CONFLICT";
  return error;
}

function readManifest(root) {
  const path = assertSafeDestination(root, MANIFEST_TARGET);
  if (!existsSync(path)) throw conflict("Manifest missing");
  return parseManifest(readFileSync(path, "utf8"));
}

function writeCandidate(root, target, source, force, dryRun) {
  const candidate = `${target}.harness-new`;
  const path = assertSafeDestination(root, candidate);
  if (existsSync(path) && !force) throw conflict(`Candidate exists: ${candidate}`);
  if (!dryRun && existsSync(path)) backupFileInProject(root, candidate);
  if (!dryRun) atomicWriteFile(root, candidate, source);
  return candidate;
}

function cleanupCandidate(root, target, source, force, dryRun) {
  if (!force || dryRun) return;
  let candidate;
  try { candidate = assertSafeDestination(root, `${target}.harness-new`); }
  catch { return; }
  if (!existsSync(candidate)) return;
  const details = lstatSync(candidate);
  if (details.isSymbolicLink() || !details.isFile() || sha256(readFileSync(candidate)) !== sha256(source)) return;
  removeFileInProject(root, `${target}.harness-new`);
}

export function updateHarness({ root, packageVersion, force = false, dryRun = false, modelAssignments = null }) {
  const projectRoot = assertSafeProjectDirectory(root);
  const manifest = readManifest(projectRoot);
  const templates = new Map(listTemplateFiles().map((template) => [template.target, readTemplateFile(template)]));
  const managedFiles = { ...manifest.managedFiles };
  const conflicts = [];
  let changed = false;

  for (const [target, entry] of Object.entries(manifest.managedFiles)) {
    const destination = assertSafeDestination(projectRoot, target);
    const localExists = existsSync(destination);
    const local = localExists ? readFileSync(destination) : null;
    const clean = localExists && sha256(local) === entry.baseSha256;
    const source = templates.get(target);
    if (source === undefined) {
      if (clean || !localExists) {
        if (!dryRun && localExists) removeFileInProject(projectRoot, target);
        delete managedFiles[target];
        changed = true;
      } else if (force) {
        if (!dryRun) backupFileInProject(projectRoot, target);
        delete managedFiles[target];
        changed = true;
      } else conflicts.push(`Modified removed file: ${target}`);
      continue;
    }
    const sourceHash = sha256(source);
    cleanupCandidate(projectRoot, target, source, force, dryRun);
    const sourceChanged = sourceHash !== entry.baseSha256;
    if (clean && sourceChanged) {
      if (!dryRun) atomicWriteFile(projectRoot, target, source);
      managedFiles[target] = { baseSha256: sourceHash, sourceSha256: sourceHash };
      changed = true;
    } else if (!clean && sourceChanged) {
      if (force) {
        if (!dryRun) backupFileInProject(projectRoot, target);
        if (!dryRun) atomicWriteFile(projectRoot, target, source);
        managedFiles[target] = { baseSha256: sourceHash, sourceSha256: sourceHash };
        changed = true;
      } else {
        const candidate = writeCandidate(projectRoot, target, source, false, dryRun);
        conflicts.push(`Modified file conflicts: ${target}; candidate: ${candidate}`);
      }
    }
  }

  for (const [target, source] of templates) {
    if (target in manifest.managedFiles) continue;
    const destination = assertSafeDestination(projectRoot, target);
    if (!existsSync(destination)) {
      if (!dryRun) atomicWriteFile(projectRoot, target, source);
      managedFiles[target] = { baseSha256: sha256(source), sourceSha256: sha256(source) };
      changed = true;
    } else if (sha256(readFileSync(destination)) === sha256(source)) {
      managedFiles[target] = { baseSha256: sha256(source), sourceSha256: sha256(source) };
      changed = true;
    } else if (force) {
      if (!dryRun) backupFileInProject(projectRoot, target);
      if (!dryRun) atomicWriteFile(projectRoot, target, source);
      managedFiles[target] = { baseSha256: sha256(source), sourceSha256: sha256(source) };
      changed = true;
    } else conflicts.push(`Added file conflicts: ${target}`);
  }

  let configChanged = false;
  let configChanges = manifest.configChanges;
  if (modelAssignments !== null) {
    const configInfo = readOpenCodeConfig(projectRoot);
    if (configInfo.path) assertSafeDestination(projectRoot, relative(projectRoot, configInfo.path));
    const modelMerge = mergeModelAssignments(configInfo.text, modelAssignments);
    configChanged = modelMerge.changed;
    configChanges = {
      ...manifest.configChanges,
      modelsSetByInstaller: { ...manifest.configChanges.modelsSetByInstaller, ...modelMerge.modelsSetByInstaller },
      variantsSetByInstaller: { ...(manifest.configChanges.variantsSetByInstaller || {}), ...modelMerge.variantsSetByInstaller },
    };
    if (!dryRun && configChanged) {
      atomicWriteFile(projectRoot, configInfo.path ? relative(projectRoot, configInfo.path) : "opencode.json", modelMerge.text);
    }
  }
  const outputManifest = createManifest({
    ...manifest,
    ...(conflicts.length ? {} : {
      packageVersion,
      sourceVersion: packageVersion,
      currentVersion: packageVersion,
      updatedAt: new Date().toISOString(),
    }),
    managedFiles,
    configChanges,
  });
  if (!dryRun) atomicWriteFile(projectRoot, MANIFEST_TARGET, serializeManifest(outputManifest));
  const validation = dryRun ? { valid: true, errors: [] } : validateInstalledHarness({ root: projectRoot });
  return { dryRun, changed, configChanged, conflicts, validation, updated: !conflicts.length };
}

export function discoverHarnessRoots({ root }) {
  const projectRoot = assertSafeProjectDirectory(root);
  const roots = [];
  const skipped = new Set([".git", "node_modules", "dist", "build", "coverage", ".cache"]);
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || skipped.has(entry.name) || (entry.name.startsWith(".") && entry.name !== ".opencode")) continue;
      const child = join(directory, entry.name);
      const manifest = join(child, "harness", "manifest.json");
      if (entry.name === ".opencode" && existsSync(manifest)) {
        roots.push(dirname(child));
        continue;
      }
      scan(child);
    }
  }
  scan(projectRoot);
  return roots;
}

export function updateAllHarnesses({ root, packageVersion, force = false, dryRun = false, roots = discoverHarnessRoots({ root }) }) {
  const results = [];
  for (const harnessRoot of roots) {
    try { results.push({ root: harnessRoot, result: updateHarness({ root: harnessRoot, packageVersion, force, dryRun }) }); }
    catch (error) { results.push({ root: harnessRoot, error }); }
  }
  return results;
}
