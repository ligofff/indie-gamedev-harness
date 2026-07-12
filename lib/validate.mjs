import { existsSync, lstatSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { CANONICAL_ROLES, findOpenCodeConfig, isValidModelId, readOpenCodeConfig, RULES_INSTRUCTION } from "./config.mjs";
import { assertSafeDestination } from "./filesystem.mjs";
import { parseManifest, sha256 } from "./manifest.mjs";
import { assertSafeProjectDirectory } from "./paths.mjs";
import { listTemplateFiles, readTemplateFile } from "./templates.mjs";
const MANIFEST_TARGET = ".opencode/harness/manifest.json";

const expectedModes = { orchestrator: "primary", "lead-programmer": "subagent", "creative-guy": "subagent", explorer: "subagent", "simple-programmer": "subagent" };

function frontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return {};
  return Object.fromEntries(match[1].split(/\r?\n/).map((line) => line.match(/^([\w-]+):\s*(.*)$/)).filter(Boolean).map(([, key, value]) => [key, value.replace(/^['"]|['"]$/g, "")]));
}

function regularFile(root, target) {
  const file = assertSafeDestination(root, target);
  return existsSync(file) && lstatSync(file).isFile() ? file : null;
}

export function validateInstalledHarness({ root }) {
  const errors = [];
  let projectRoot;
  try { projectRoot = assertSafeProjectDirectory(root); } catch (error) { return { valid: false, errors: [error.message] }; }
  let manifest;
  try {
    const manifestPath = assertSafeDestination(projectRoot, MANIFEST_TARGET);
    if (!existsSync(manifestPath)) throw new Error("Manifest missing");
    manifest = parseManifest(readFileSync(manifestPath, "utf8"));
  } catch (error) { errors.push(error.message); }
  if (manifest) {
    const templates = new Map(listTemplateFiles().map((template) => [template.target, template]));
    for (const [target, entry] of Object.entries(manifest.managedFiles)) {
      try { if (!regularFile(projectRoot, target)) errors.push(`Managed file missing: ${target}`); } catch (error) { errors.push(error.message); }
      const template = templates.get(target);
      if (!template) errors.push(`Unknown managed file: ${target}`);
      else if (entry.sourceSha256 !== sha256(readTemplateFile(template))) errors.push(`Template source hash mismatch: ${target}`);
    }
  }
  for (const template of listTemplateFiles()) {
    try {
      if (!regularFile(projectRoot, template.target)) errors.push(`Canonical file missing: ${template.target}`);
      if (manifest && !(template.target in manifest.managedFiles)) errors.push(`Canonical file unmanaged: ${template.target}`);
    } catch (error) { errors.push(error.message); }
  }
  for (const [role, mode] of Object.entries(expectedModes)) {
    let content = "";
    try {
      const target = `.opencode/agents/${role}.md`;
      const file = regularFile(projectRoot, target);
      content = file ? readFileSync(file, "utf8") : "";
      if (!file || basename(file) !== `${role}.md`) errors.push(`Invalid agent filename: ${role}`);
    } catch (error) { errors.push(error.message); }
    const fields = frontmatter(content);
    if (!fields.description || fields.mode !== mode) errors.push(`Invalid agent: ${role}`);
  }
  for (const template of listTemplateFiles().filter((item) => item.target.includes("/skills/"))) {
    try {
      const file = regularFile(projectRoot, template.target);
      const fields = file ? frontmatter(readFileSync(file, "utf8")) : {};
      const directory = template.target.split("/").at(-2);
      if (!file || fields.name !== directory || !fields.description) errors.push(`Invalid skill: ${template.target}`);
    } catch (error) { errors.push(error.message); }
  }
  try {
    const configPath = findOpenCodeConfig(projectRoot);
    if (configPath) assertSafeDestination(projectRoot, configPath.slice(projectRoot.length + 1));
    const config = readOpenCodeConfig(projectRoot).config;
    if (!Array.isArray(config.instructions) || config.instructions.filter((item) => item === RULES_INSTRUCTION).length !== 1) errors.push("Rules instruction must appear exactly once");
    if (config.agent !== undefined && (!config.agent || Array.isArray(config.agent) || typeof config.agent !== "object")) errors.push("Invalid agent configuration");
    for (const role of CANONICAL_ROLES) {
      const agent = config.agent?.[role];
      if (agent !== undefined && (!agent || Array.isArray(agent) || typeof agent !== "object")) errors.push(`Invalid agent configuration: ${role}`);
      const model = agent?.model;
      if (model !== undefined && !isValidModelId(model)) errors.push(`Invalid model: ${role}`);
    }
  } catch (error) { errors.push(error.message); }
  return { valid: errors.length === 0, errors };
}
