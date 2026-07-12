import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

const root = process.cwd();
const openCodeDir = join(root, ".opencode");
const agentsDir = join(openCodeDir, "agents");
const skillsDir = join(openCodeDir, "skills");
const expectedAgents = new Map([
  ["orchestrator", "primary"],
  ["lead-programmer", "subagent"],
  ["simple-programmer", "subagent"],
  ["explorer", "subagent"],
  ["creative-guy", "subagent"],
]);
const requiredSkills = new Set([
  "harness-install",
  "orchestration-context",
  "lazy-engineering",
  "game-design",
  "narrative-worldbuilding",
  "art-visuals",
  "audio",
  "ui-accessibility-localization",
  "architecture-engineering",
  "game-programming",
  "engine-godot",
  "engine-unity",
  "engine-unreal",
  "engine-lightweight-cpp",
  "testing-debugging-security-performance",
  "prototyping-release",
]);

let failed = false;

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  failed = true;
  console.error(`FAIL ${message}`);
}

function parseFrontmatter(file) {
  const content = readFileSync(file, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    fail(`${relative(root, file)}: missing frontmatter`);
    return { content, fields: new Map() };
  }

  const fields = new Map();
  let nestedKey = "";
  for (const line of match[1].split(/\r?\n/)) {
    const topLevel = line.match(/^([\w-]+):\s*(.*)$/);
    if (topLevel) {
      nestedKey = topLevel[2] ? "" : topLevel[1];
      fields.set(topLevel[1], topLevel[2].replace(/^['"]|['"]$/g, ""));
      continue;
    }

    const nested = line.match(/^\s+([\w-]+):\s*(.*)$/);
    if (nested && nestedKey) {
      fields.set(`${nestedKey}.${nested[1]}`, nested[2].replace(/^['"]|['"]$/g, ""));
    }
  }
  return { content, fields };
}

function skillDirectories(directory) {
  if (!existsSync(directory)) return [];
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = join(directory, entry.name);
    found.push(child, ...skillDirectories(child));
  }
  return found;
}

function skillFiles(directory) {
  const files = [];
  for (const skillDir of skillDirectories(directory)) {
    const file = join(skillDir, "SKILL.md");
    if (!existsSync(file)) {
      fail(`${relative(root, skillDir)}: missing SKILL.md`);
      continue;
    }
    files.push(file);
  }
  return files;
}

function validateConfig() {
  const failedBefore = failed;
  const configFile = join(root, "opencode.json");
  if (!existsSync(configFile)) return fail("opencode.json: missing");

  let config;
  try {
    config = JSON.parse(readFileSync(configFile, "utf8"));
  } catch (error) {
    return fail(`opencode.json: invalid JSON (${error.message})`);
  }

  if (config.$schema !== "https://opencode.ai/config.json") fail("opencode.json: missing current schema URL");
  if (config.default_agent !== "orchestrator") fail("opencode.json: default_agent must be orchestrator");
  for (const field of ["plugin", "command", "mcp"]) {
    if (field in config) fail(`opencode.json: ${field} is not part of minimal harness`);
  }

  if (!Array.isArray(config.instructions) || config.instructions.length === 0) {
    fail("opencode.json: instructions must be a nonempty array");
  } else {
    for (const [index, instruction] of config.instructions.entries()) {
      const label = `opencode.json: instructions[${index}]`;
      if (typeof instruction !== "string" || !instruction.trim()) {
        fail(`${label}: must be a nonempty string`);
        continue;
      }
      if (isAbsolute(instruction) || instruction.includes("://")) {
        fail(`${label}: must be a local relative path`);
        continue;
      }
      const file = resolve(root, instruction);
      const pathFromRoot = relative(root, file);
      if (pathFromRoot === "" || pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
        fail(`${label}: must resolve inside repository (${instruction})`);
        continue;
      }
      try {
        if (!statSync(file).isFile()) fail(`${label}: must resolve to a regular file (${instruction})`);
      } catch {
        fail(`${label}: must resolve to an existing regular file (${instruction})`);
      }
    }
  }
  if (failed === failedBefore) pass("config: valid minimal OpenCode configuration");
}

function validateAgents() {
  const failedBefore = failed;
  if (!existsSync(agentsDir)) return fail("agents: directory missing");
  const files = readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.slice(0, -3));

  if (files.length !== expectedAgents.size) fail(`agents: expected ${expectedAgents.size}, found ${files.length}`);
  for (const [name, mode] of expectedAgents) {
    const file = join(agentsDir, `${name}.md`);
    if (!existsSync(file)) {
      fail(`agents: missing ${name}.md`);
      continue;
    }
    const { fields } = parseFrontmatter(file);
    if (!fields.get("description")) fail(`agents/${name}.md: missing description`);
    if (fields.get("mode") !== mode) fail(`agents/${name}.md: mode must be ${mode}`);
  }

  const explorerFile = join(agentsDir, "explorer.md");
  if (existsSync(explorerFile)) {
    const explorer = parseFrontmatter(explorerFile).fields;
    if (explorer.get("permission.edit") !== "deny") fail("agents/explorer.md: edit permission must be deny");
  }
  const simpleFile = join(agentsDir, "simple-programmer.md");
  if (existsSync(simpleFile)) {
    const simple = parseFrontmatter(simpleFile).fields;
    if (simple.get("permission.task") !== "deny") fail("agents/simple-programmer.md: task permission must be deny");
  }
  if (failed === failedBefore) pass("agents: five behavior roles and required boundaries found");
}

function validateSkills() {
  const failedBefore = failed;
  if (!existsSync(skillsDir)) return fail("skills: directory missing");
  const files = skillFiles(skillsDir);
  const names = new Set();
  for (const file of files) {
    const { fields } = parseFrontmatter(file);
    const folder = relative(skillsDir, file).split(sep).at(-2);
    const name = fields.get("name");
    if (!name) fail(`${relative(root, file)}: missing name`);
    if (name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) fail(`${relative(root, file)}: name must use lowercase kebab-case`);
    if (name && name.length > 64) fail(`${relative(root, file)}: name must be at most 64 characters`);
    if (name !== folder) fail(`${relative(root, file)}: name must match directory`);
    const description = fields.get("description");
    if (!description || !description.includes("Use when")) fail(`${relative(root, file)}: description must be nonempty and include Use when`);
    if (description && description.length > 1024) fail(`${relative(root, file)}: description must be at most 1024 characters`);
    if (names.has(name)) fail(`${relative(root, file)}: duplicate skill name ${name}`);
    names.add(name);
  }

  for (const name of requiredSkills) {
    if (!names.has(name)) fail(`skills: missing ${name}`);
  }
  if (failed === failedBefore) pass(`skills: ${names.size} valid reusable skills found`);
}

function validateOpenCodeEntries(directory = openCodeDir) {
  if (!existsSync(directory)) return fail(".opencode: directory missing");
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (directory === openCodeDir && ["commands", "rules", "plugins", "modules", "node_modules", "package.json", "package-lock.json", ".gitignore"].includes(entry.name)) {
      fail(`${relative(root, file)}: legacy runtime entry not allowed`);
    }
    const details = lstatSync(file);
    if (details.isSymbolicLink()) {
      try {
        statSync(file);
        fail(`${relative(root, file)}: symbolic link or junction not allowed`);
      } catch {
        fail(`${relative(root, file)}: dangling symbolic link not allowed`);
      }
      continue;
    }
    if (details.isDirectory()) validateOpenCodeEntries(file);
  }
}

function validateActiveFiles() {
  const failedBefore = failed;
  const activeFiles = ["README.md", "AGENTS.md", "INSTALL.md", "opencode.json"];
  for (const file of activeFiles) {
    if (!existsSync(join(root, file))) fail(`${file}: missing`);
  }

  const forbidden = [
    /\.pi/i,
    /claude/i,
    /cursor/i,
    /ccgs/i,
    /OpenCode Game Studios/i,
    /\.agents\/modules/i,
    /\.opencode\/modules/i,
    /installed\.json/i,
    /production\/session/i,
    /docs\/framework/i,
    /docs\/architecture/i,
    /creative-director|technical-director|producer|qa-lead|gameplay-programmer/i,
    /\.opencode\/(commands|rules|plugins)/i,
    /aseprite-mcp/i,
  ];
  const files = [
    ...activeFiles.map((file) => join(root, file)),
    ...(existsSync(agentsDir) ? readdirSync(agentsDir, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => join(agentsDir, entry.name)) : []),
    ...(existsSync(skillsDir) ? skillFiles(skillsDir) : []),
  ];
  for (const file of files) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    for (const expression of forbidden) {
      if (expression.test(content)) fail(`${relative(root, file)}: stale reference ${expression}`);
    }
    if (file !== join(root, "INSTALL.md") && /mcp/i.test(content)) fail(`${relative(root, file)}: stale reference /mcp/i`);
  }
  if (failed === failedBefore) pass("active files: no alternate-runtime or old-framework references");
}

validateOpenCodeEntries();
validateConfig();
validateAgents();
validateSkills();
validateActiveFiles();

if (failed) process.exitCode = 1;
