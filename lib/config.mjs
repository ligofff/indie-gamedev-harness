import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { applyEdits, modify, parse, ParseErrorCode } from "jsonc-parser";

export const RULES_INSTRUCTION = ".opencode/harness/rules.md";
export const CANONICAL_ROLES = ["orchestrator", "lead-programmer", "creative-guy", "explorer", "simple-programmer"];

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function configPath(root, extension) {
  return join(root, `opencode.${extension}`);
}

export function findOpenCodeConfig(root) {
  const json = configPath(root, "json");
  const jsonc = configPath(root, "jsonc");
  if (existsSync(json) && existsSync(jsonc)) throw codedError("AMBIGUOUS_CONFIG", "Both opencode.json and opencode.jsonc exist");
  if (existsSync(json)) return json;
  if (existsSync(jsonc)) return jsonc;
  return null;
}

export function readOpenCodeConfig(root) {
  const path = findOpenCodeConfig(root);
  if (!path) return { path: null, text: "{}\n", config: {} };
  const text = readFileSync(path, "utf8");
  const errors = [];
  const config = parse(text, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length || !config || Array.isArray(config) || typeof config !== "object") {
    throw codedError("INVALID_CONFIG", "OpenCode configuration must be a valid object");
  }
  return { path, text, config };
}

function update(text, path, value) {
  return applyEdits(text, modify(text, path, value, {
    formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" },
  }));
}

export function isValidModelId(value) {
  return typeof value === "string" && /^[^/\s]+(?:\/[^/\s]+)+$/.test(value);
}

export function mergeModelAssignments(text, assignments) {
  if (!assignments || typeof assignments !== "object" || Array.isArray(assignments)) {
    throw codedError("INVALID_ARGUMENT", "Model assignments must be an object");
  }
  const models = assignments.models || assignments;
  const variants = assignments.variants || {};
  if (!models || typeof models !== "object" || Array.isArray(models) || !variants || typeof variants !== "object" || Array.isArray(variants)) {
    throw codedError("INVALID_ARGUMENT", "Model assignments must contain model and variant objects");
  }
  if (Object.keys(models).some((role) => !CANONICAL_ROLES.includes(role)) || Object.keys(variants).some((role) => !CANONICAL_ROLES.includes(role))) {
    throw codedError("INVALID_ARGUMENT", "Unknown model role");
  }
  let output = text;
  const modelsSetByInstaller = {};
  const variantsSetByInstaller = {};
  for (const role of CANONICAL_ROLES) {
    if (!(role in models)) continue;
    const model = models[role];
    if (model !== "inherit" && !isValidModelId(model)) {
      throw codedError("INVALID_ARGUMENT", `Invalid model for ${role}`);
    }
    const errors = [];
    const config = parse(output, errors, { allowTrailingComma: true, disallowComments: false });
    if (errors.length || !config || Array.isArray(config) || typeof config !== "object") {
      throw codedError("INVALID_CONFIG", "OpenCode configuration must be a valid object");
    }
    const existing = config.agent && typeof config.agent === "object" && !Array.isArray(config.agent)
      ? config.agent[role]?.model
      : undefined;
    if (model === "inherit") {
      if (existing !== undefined) {
        output = update(output, ["agent", role, "model"], undefined);
        modelsSetByInstaller[role] = "inherit";
      }
      if (config.agent?.[role]?.variant !== undefined) {
        output = update(output, ["agent", role, "variant"], undefined);
        variantsSetByInstaller[role] = "inherit";
      }
    } else if (existing !== model) {
      output = update(output, ["agent", role, "model"], model);
      modelsSetByInstaller[role] = model;
    }
  }
  for (const role of CANONICAL_ROLES) {
    if (!(role in variants)) continue;
    const variant = variants[role];
    if (variant !== "inherit" && (typeof variant !== "string" || !variant)) throw codedError("INVALID_ARGUMENT", `Invalid variant for ${role}`);
    const errors = [];
    const config = parse(output, errors, { allowTrailingComma: true, disallowComments: false });
    if (errors.length || !config || Array.isArray(config) || typeof config !== "object") throw codedError("INVALID_CONFIG", "OpenCode configuration must be a valid object");
    const existing = config.agent && typeof config.agent === "object" && !Array.isArray(config.agent) ? config.agent[role]?.variant : undefined;
    if (variant === "inherit") {
      if (existing !== undefined) {
        output = update(output, ["agent", role, "variant"], undefined);
        variantsSetByInstaller[role] = "inherit";
      }
    } else if (existing !== variant) {
      output = update(output, ["agent", role, "variant"], variant);
      variantsSetByInstaller[role] = variant;
    }
  }
  return { text: output, changed: output !== text, modelsSetByInstaller, variantsSetByInstaller };
}

export function mergeHarnessConfig(text, options = {}) {
  const errors = [];
  let config = parse(text, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length || !config || Array.isArray(config) || typeof config !== "object") {
    throw codedError("INVALID_CONFIG", "OpenCode configuration must be a valid object");
  }

  const canonicalPermissions = options.permissions || {};
  let output = text;
  let schemaAdded = false;
  let instructionAdded = false;
  let defaultAgentSetByInstaller = false;
  const permissionsAdded = [];
  const permissionConflicts = [];

  if (!("$schema" in config)) {
    output = update(output, ["$schema"], "https://opencode.ai/config.json");
    config.$schema = "https://opencode.ai/config.json";
    schemaAdded = true;
  }
  const instructions = config.instructions;
  if (instructions === undefined) {
    output = update(output, ["instructions"], [RULES_INSTRUCTION]);
    config.instructions = [RULES_INSTRUCTION];
    instructionAdded = true;
  } else if (!Array.isArray(instructions) || instructions.some((instruction) => typeof instruction !== "string")) {
    throw codedError("INVALID_CONFIG", "instructions must be an array of strings");
  } else if (!instructions.includes(RULES_INSTRUCTION)) {
    output = update(output, ["instructions", -1], RULES_INSTRUCTION);
    config.instructions.push(RULES_INSTRUCTION);
    instructionAdded = true;
  }
  if (config.default_agent === undefined || (options.setDefault && config.default_agent !== "orchestrator")) {
    output = update(output, ["default_agent"], "orchestrator");
    config.default_agent = "orchestrator";
    defaultAgentSetByInstaller = true;
  }
  const permissionMalformed = config.permission !== undefined && (!config.permission || Array.isArray(config.permission) || typeof config.permission !== "object");
  if (permissionMalformed) {
    permissionConflicts.push("permission");
  } else if (config.permission === undefined && Object.keys(canonicalPermissions).length) {
    output = update(output, ["permission"], {});
    config.permission = {};
  }
  for (const category of permissionMalformed ? [] : Object.keys(canonicalPermissions).sort()) {
    const rules = canonicalPermissions[category];
    if (!rules || Array.isArray(rules) || typeof rules !== "object") continue;
    if (config.permission[category] === undefined) {
      output = update(output, ["permission", category], {});
      config.permission[category] = {};
    } else if (!config.permission[category] || Array.isArray(config.permission[category]) || typeof config.permission[category] !== "object") {
      permissionConflicts.push(category);
      continue;
    }
    for (const rule of Object.keys(rules).sort()) {
      if (config.permission[category][rule] === undefined || (options.force && config.permission[category][rule] !== rules[rule])) {
        output = update(output, ["permission", category, rule], rules[rule]);
        config.permission[category][rule] = rules[rule];
        permissionsAdded.push({ category, rule, value: rules[rule] });
      } else if (config.permission[category][rule] !== rules[rule]) {
        permissionConflicts.push(`${category}.${rule}`);
      }
    }
  }
  return {
    text: output,
    changed: output !== text,
    changes: { schemaAdded, instructionAdded, defaultAgentSetByInstaller, modelsSetByInstaller: {}, variantsSetByInstaller: {}, permissionsAdded },
    permissionConflicts,
  };
}

export function cleanupHarnessConfig(text, ownership = {}) {
  const errors = [];
  let config = parse(text, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length || !config || Array.isArray(config) || typeof config !== "object") {
    throw codedError("INVALID_CONFIG", "OpenCode configuration must be a valid object");
  }
  let output = text;
  if (ownership.instructionAdded && Array.isArray(config.instructions) && config.instructions.filter((item) => item === RULES_INSTRUCTION).length === 1) {
    output = update(output, ["instructions", config.instructions.indexOf(RULES_INSTRUCTION)], undefined);
    config.instructions.splice(config.instructions.indexOf(RULES_INSTRUCTION), 1);
  }
  if (ownership.defaultAgentSetByInstaller && config.default_agent === "orchestrator") {
    output = update(output, ["default_agent"], undefined);
    delete config.default_agent;
  }
  for (const [role, value] of Object.entries(ownership.modelsSetByInstaller || {})) {
    if (value !== "inherit" && config.agent?.[role]?.model === value) {
      output = update(output, ["agent", role, "model"], undefined);
      delete config.agent[role].model;
    }
  }
  for (const [role, value] of Object.entries(ownership.variantsSetByInstaller || {})) {
    if (value !== "inherit" && config.agent?.[role]?.variant === value) {
      output = update(output, ["agent", role, "variant"], undefined);
      delete config.agent[role].variant;
    }
  }
  for (const entry of ownership.permissionsAdded || []) {
    if (config.permission?.[entry.category]?.[entry.rule] === entry.value) {
      output = update(output, ["permission", entry.category, entry.rule], undefined);
      delete config.permission[entry.category][entry.rule];
    }
  }
  return { text: output, changed: output !== text };
}
