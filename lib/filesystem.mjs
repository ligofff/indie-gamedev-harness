import { mkdirSync, renameSync, rmSync, writeFileSync, lstatSync, existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { resolveTargetPath } from "./paths.mjs";

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function existingComponents(root, destination) {
  const rootPath = resolve(root);
  if (lstatSync(rootPath).isSymbolicLink()) throw codedError("SYMLINK_DESTINATION", `Symlink destination component: ${rootPath}`);
  const parts = relative(rootPath, resolve(destination)).split(sep).filter(Boolean);
  let current = rootPath;
  for (const part of parts) {
    current = resolve(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw codedError("SYMLINK_DESTINATION", `Symlink destination component: ${current}`);
    }
  }
}

export function assertSafeDestination(root, target) {
  const destination = resolveTargetPath(root, target);
  existingComponents(root, destination);
  return destination;
}

export function ensureSafeDirectory(root, target, options = {}) {
  const directory = target === "" || target === "." ? resolve(root) : assertSafeDestination(root, target);
  existingComponents(root, directory);
  if (!options.dryRun) mkdirSync(directory, { recursive: true });
  existingComponents(root, directory);
  return directory;
}

export function atomicWriteFile(root, target, content, options = {}) {
  const destination = assertSafeDestination(root, target);
  if (options.dryRun) return { changed: true, dryRun: true };
  ensureSafeDirectory(root, relative(root, dirname(destination)));
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, content, { flag: "wx" });
    renameSync(temporary, destination);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
  return { changed: true, dryRun: false };
}

export function copyFileIntoProject(root, target, source, options = {}) {
  return atomicWriteFile(root, target, readFileSync(source), options);
}

export function removeFileInProject(root, target, options = {}) {
  const destination = assertSafeDestination(root, target);
  if (!existsSync(destination)) return { changed: false, dryRun: Boolean(options.dryRun) };
  if (!lstatSync(destination).isFile()) throw codedError("UNSAFE_REMOVE", `Refusing to remove non-file: ${target}`);
  if (options.dryRun) return { changed: true, dryRun: true };
  rmSync(destination);
  return { changed: true, dryRun: false };
}

export function backupFileInProject(root, target, options = {}) {
  const destination = assertSafeDestination(root, target);
  if (!existsSync(destination)) return null;
  if (!lstatSync(destination).isFile()) throw codedError("UNSAFE_REMOVE", `Refusing to back up non-file: ${target}`);
  let timestamp = options.timestamp || Date.now();
  let backupTarget = `${target}.harness-backup-${timestamp}`;
  while (existsSync(assertSafeDestination(root, backupTarget))) backupTarget = `${target}.harness-backup-${++timestamp}`;
  if (options.dryRun) return backupTarget;
  renameSync(destination, assertSafeDestination(root, backupTarget));
  return backupTarget;
}
