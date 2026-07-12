import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, posix } from "node:path";

export const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
export const RULES_TARGET = ".opencode/harness/rules.md";

const packageRootPath = PACKAGE_ROOT;

function templateEntries(directory, targetDirectory) {
  return readdirSync(join(packageRootPath, directory), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => ({ source: join(directory, entry.name), target: posix.join(targetDirectory, entry.name) }));
}

export function listTemplateFiles() {
  const agents = templateEntries(".opencode/agents", ".opencode/agents");
  const skills = readdirSync(join(packageRootPath, ".opencode/skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ source: `.opencode/skills/${entry.name}/SKILL.md`, target: `.opencode/skills/${entry.name}/SKILL.md` }));
  return [{ source: "AGENTS.md", target: RULES_TARGET }, ...agents, ...skills]
    .sort((left, right) => left.target.localeCompare(right.target));
}

export function readTemplateFile(template) {
  const source = typeof template === "string" ? template : template.source;
  return readFileSync(join(packageRootPath, source));
}

export function loadHarnessPermissions() {
  const config = JSON.parse(readFileSync(join(packageRootPath, "opencode.json"), "utf8"));
  return JSON.parse(JSON.stringify(config.permission));
}
