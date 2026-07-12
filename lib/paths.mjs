import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { isAbsolute, parse, relative, resolve } from "node:path";

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function isPathInside(root, candidate) {
  const path = relative(resolve(root), resolve(candidate));
  return !path.startsWith("..") && !isAbsolute(path);
}

export function resolveProjectPath(target, cwd = process.cwd()) {
  if (target !== undefined && target !== null) {
    if (typeof target !== "string" || !target.trim()) throw codedError("INVALID_TARGET", "Target must be a nonempty path");
    return resolve(cwd, target);
  }
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return resolve(cwd);
  }
}

export function assertSafeProjectDirectory(target) {
  if (typeof target !== "string" || !target.trim()) {
    throw codedError("UNSAFE_PATH", "Target must be an existing non-root directory");
  }
  const resolved = resolve(target);
  if (resolved === parse(resolved).root || !existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw codedError("UNSAFE_PATH", "Target must be an existing non-root directory");
  }
  return resolved;
}

export function findGitWorktreeRoot(cwd = process.cwd()) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

export function resolveTargetPath(root, target) {
  if (typeof target !== "string" || !target || isAbsolute(target)) throw codedError("PATH_TRAVERSAL", "Target must be a relative path");
  const resolved = resolve(root, target);
  if (resolved === resolve(root) || !isPathInside(root, resolved)) throw codedError("PATH_TRAVERSAL", "Target escapes project directory");
  return resolved;
}
