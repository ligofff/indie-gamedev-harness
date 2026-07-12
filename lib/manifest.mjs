import { createHash } from "node:crypto";
import { isAbsolute, normalize } from "node:path";

export const MANIFEST_SCHEMA_VERSION = 1;
export const PACKAGE_NAME = "indie-gamedev-harness";

function invalidManifest(message) {
  const error = new Error(message);
  error.code = "INVALID_MANIFEST";
  return error;
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
  }
  return value;
}

function validateManagedFiles(managedFiles) {
  if (!isPlainObject(managedFiles)) {
    throw invalidManifest("managedFiles must be an object");
  }
  for (const [path, hashes] of Object.entries(managedFiles)) {
    if (typeof path !== "string" || !path || path.includes("\\") || isAbsolute(path) || path.split("/").includes("..") || normalize(path).split("/").includes("..")) {
      throw invalidManifest(`Invalid managed file path: ${path}`);
    }
    if (!isPlainObject(hashes)) throw invalidManifest("Managed file entry must be an object");
    for (const hash of [hashes.baseSha256, hashes.sourceSha256]) {
      if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) throw invalidManifest("Invalid managed file hash");
    }
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isIsoTimestamp(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

function validateManifest(manifest) {
  if (!isPlainObject(manifest) || manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) throw invalidManifest("Unsupported manifest schema");
  if (manifest.packageName !== PACKAGE_NAME) throw invalidManifest("Invalid package name");
  for (const field of ["packageVersion", "sourceVersion"]) {
    if (typeof manifest[field] !== "string" || !manifest[field]) throw invalidManifest(`Invalid ${field}`);
  }
  for (const field of ["installedAt", "updatedAt"]) {
    if (!isIsoTimestamp(manifest[field])) throw invalidManifest(`Invalid ${field}`);
  }
  if (!isPlainObject(manifest.configChanges)) throw invalidManifest("configChanges must be an object");
  const changes = manifest.configChanges;
  for (const field of ["schemaAdded", "instructionAdded", "defaultAgentSetByInstaller"]) {
    if (typeof changes[field] !== "boolean") throw invalidManifest(`Invalid config ownership: ${field}`);
  }
  if (!isPlainObject(changes.modelsSetByInstaller)) throw invalidManifest("Invalid config ownership: modelsSetByInstaller");
  for (const [role, value] of Object.entries(changes.modelsSetByInstaller)) {
    if (typeof role !== "string" || typeof value !== "string") throw invalidManifest("Invalid model ownership");
  }
  if (!Array.isArray(changes.permissionsAdded) || changes.permissionsAdded.some((entry) => !isPlainObject(entry) || typeof entry.category !== "string" || typeof entry.rule !== "string" || typeof entry.value !== "string")) {
    throw invalidManifest("Invalid permission ownership");
  }
  validateManagedFiles(manifest.managedFiles);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function createManifest(values = {}) {
  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    packageName: values.packageName,
    packageVersion: values.packageVersion,
    sourceVersion: values.sourceVersion,
    currentVersion: values.currentVersion,
    installedAt: values.installedAt,
    updatedAt: values.updatedAt,
    managedFiles: values.managedFiles || {},
    configChanges: values.configChanges || {
      schemaAdded: false,
      instructionAdded: false,
      defaultAgentSetByInstaller: false,
      modelsSetByInstaller: {},
      permissionsAdded: [],
    },
  };
  validateManifest(manifest);
  return sortValue(manifest);
}

export function serializeManifest(manifest) {
  return `${JSON.stringify(sortValue(manifest), null, 2)}\n`;
}

export function parseManifest(text) {
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    throw invalidManifest("Manifest is invalid JSON");
  }
  validateManifest(manifest);
  return sortValue(manifest);
}
