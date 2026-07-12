import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PACKAGE_VERSION, parseCliArguments, runCli } from "../lib/cli.mjs";
import { CANONICAL_ROLES, isValidModelId, mergeHarnessConfig, mergeModelAssignments, readOpenCodeConfig } from "../lib/config.mjs";
import { configureModels, discoverOpenCodeModels, promptForModelAssignments } from "../lib/configure-models.mjs";
import { atomicWriteFile } from "../lib/filesystem.mjs";
import { installHarness } from "../lib/install.mjs";
import { createManifest, parseManifest, serializeManifest, sha256, PACKAGE_NAME } from "../lib/manifest.mjs";
import { assertSafeProjectDirectory, resolveTargetPath } from "../lib/paths.mjs";
import { getHarnessStatus } from "../lib/status.mjs";
import { updateAllHarnesses, updateHarness } from "../lib/update.mjs";
import { uninstallHarness } from "../lib/uninstall.mjs";
import { listTemplateFiles, loadHarnessPermissions, readTemplateFile } from "../lib/templates.mjs";
import { validateInstalledHarness } from "../lib/validate.mjs";

function temporaryDirectory() {
  return mkdtempSync(join(tmpdir(), "gamedev-harness-"));
}

test("templates contain POSIX canonical files and permissions", () => {
  const files = listTemplateFiles();
  assert.equal(files.filter((file) => file.target.startsWith(".opencode/agents/")).length, 5);
  assert.equal(files.filter((file) => file.target.startsWith(".opencode/skills/")).length, 16);
  assert.ok(files.every((file) => !file.target.includes("\\")));
  assert.deepEqual(readTemplateFile(files.find((file) => file.source === "AGENTS.md")), readFileSync("AGENTS.md"));
  assert.deepEqual(loadHarnessPermissions(), JSON.parse(readFileSync("opencode.json")).permission);
});

test("paths reject unsafe targets", () => {
  const root = temporaryDirectory();
  assert.throws(() => resolveTargetPath(root, "../outside"), { code: "PATH_TRAVERSAL" });
  assert.throws(() => assertSafeProjectDirectory(""), { code: "UNSAFE_PATH" });
  assert.throws(() => assertSafeProjectDirectory("   "), { code: "UNSAFE_PATH" });
  rmSync(root, { recursive: true });
});

test("atomic files support spaces and dry runs", () => {
  const root = temporaryDirectory();
  atomicWriteFile(root, "a space/file.txt", Buffer.from("content"));
  assert.equal(readFileSync(join(root, "a space/file.txt"), "utf8"), "content");
  assert.deepEqual(atomicWriteFile(root, "dry/file.txt", "no", { dryRun: true }), { changed: true, dryRun: true });
  assert.throws(() => atomicWriteFile(root, "../bad", "no"), { code: "PATH_TRAVERSAL" });
  rmSync(root, { recursive: true });
});

test("manifest is deterministic and malformed input is controlled", () => {
  const manifest = createManifest({ packageName: PACKAGE_NAME, packageVersion: "0.2.0", sourceVersion: "0.2.0", installedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", managedFiles: { "a.txt": { baseSha256: sha256("a"), sourceSha256: sha256("b") } } });
  assert.equal(serializeManifest(manifest), serializeManifest(parseManifest(serializeManifest(manifest))));
  assert.throws(() => createManifest({ ...manifest, managedFiles: { "../bad": { baseSha256: sha256("a"), sourceSha256: sha256("b") } } }), { code: "INVALID_MANIFEST" });
  assert.throws(() => parseManifest("{}"), { code: "INVALID_MANIFEST" });
});

test("config merge preserves JSONC, ownership, malformed permissions, and models", () => {
  const merged = mergeHarnessConfig("{\n  // keep\n  \"default_agent\": \"custom\",\n  \"instructions\": []\n}\n");
  assert.match(merged.text, /\/\/ keep/);
  assert.match(merged.text, /\.opencode\/harness\/rules\.md/);
  assert.equal(mergeHarnessConfig(merged.text).changes.instructionAdded, false);
  assert.match(mergeHarnessConfig(merged.text, { setDefault: true }).text, /"default_agent": "orchestrator"/);
  assert.equal(mergeHarnessConfig('{"default_agent":"orchestrator"}', { setDefault: true }).changes.defaultAgentSetByInstaller, false);
  assert.deepEqual(mergeHarnessConfig('{"permission": []}', { permissions: { edit: { "*": "allow" } }, force: true }).permissionConflicts, ["permission"]);
  const text = '{\n  // keep\n  "agent": { "other": { "model": "x/y" }, "orchestrator": { "model": "old/model", "keep": true } }\n}\n';
  const assigned = mergeModelAssignments(text, { orchestrator: "new/model", "creative-guy": "inherit" });
  assert.match(assigned.text, /\/\/ keep/);
  assert.match(assigned.text, /"other"/);
  const inherited = mergeModelAssignments(assigned.text, { orchestrator: "inherit" });
  assert.doesNotMatch(inherited.text, /"new\/model"/);
  assert.equal(isValidModelId("vendor/family/model"), true);
  assert.equal(isValidModelId("vendor//model"), false);
  assert.equal(isValidModelId("vendor/model/"), false);
  assert.throws(() => mergeModelAssignments(text, { orchestrator: "bad" }), { code: "INVALID_ARGUMENT" });
  assert.match(mergeModelAssignments(text, { orchestrator: "vendor/family/model" }).text, /vendor\/family\/model/);
});

test("model commands validate grammar, preserve config, inherit, and allow injected discovery", async () => {
  assert.deepEqual(parseCliArguments(["install", ".", "--creative-model", "vendor/model"]).flags.models, { "creative-guy": "vendor/model" });
  assert.throws(() => parseCliArguments(["update", ".", "--orchestrator-model", "vendor/model"]), { code: "INVALID_ARGUMENT" });
  assert.throws(() => parseCliArguments(["install", ".", "--skip-models", "--orchestrator-model", "vendor/model"]), { code: "INVALID_ARGUMENT" });
  assert.throws(() => parseCliArguments(["install", ".", "--noninteractive"]), { code: "INVALID_ARGUMENT" });
  const cwd = "test-cwd";
   assert.deepEqual(await discoverOpenCodeModels({ cwd, platform: "linux", execFile(command, args, options, callback) {
     assert.equal(command, "opencode");
     assert.deepEqual(args, ["models"]);
     assert.deepEqual(options, { encoding: "utf8", cwd });
     callback(null, "vendor/family/model\nvendor/family/model\ninvalid\nother/model\n", "");
   } }), ["vendor/family/model", "other/model"]);
   assert.deepEqual(await discoverOpenCodeModels({ cwd, platform: "win32", execFile(command, args, options, callback) {
     assert.equal(command, process.env.ComSpec || "cmd.exe");
     assert.deepEqual(args, ["/d", "/s", "/c", "opencode models"]);
     assert.deepEqual(options, { encoding: "utf8", cwd });
     callback(null, "vendor/model\n", "");
   } }), ["vendor/model"]);
  const root = temporaryDirectory();
  writeFileSync(join(root, "opencode.jsonc"), '{\n  // preserve\n  "agent": { "other": { "keep": true }, "orchestrator": { "model": "old/model" } }\n}\n');
  configureModels({ root, assignments: { orchestrator: "inherit", "creative-guy": "vendor/model" } });
  const text = readFileSync(join(root, "opencode.jsonc"), "utf8");
  assert.match(text, /\/\/ preserve/);
  assert.match(text, /"other"/);
  assert.doesNotMatch(text, /old\/model/);
  assert.match(text, /vendor\/model/);
  const beforeDryRun = readFileSync(join(root, "opencode.jsonc"), "utf8");
  const dryRun = configureModels({ root, assignments: { orchestrator: "other/model" }, dryRun: true });
  assert.deepEqual(dryRun, { dryRun: true, changed: true, models: { orchestrator: "other/model" } });
  assert.equal(readFileSync(join(root, "opencode.jsonc"), "utf8"), beforeDryRun);
   const models = ["alpha/model-1", "alpha/model-2", ...Array.from({ length: 12 }, (_, index) => `beta/model-${index + 1}`)];
   const sameOutput = { text: "", write(value) { this.text += value; } };
   const sameAnswers = ["s", "2", "2"];
   const sameAssignments = await promptForModelAssignments({ models, output: sameOutput, createInterface() { return { question() { return Promise.resolve(sameAnswers.shift()); }, close() {} }; } });
   assert.ok(CANONICAL_ROLES.every((role) => sameAssignments[role] === "beta/model-2"));
   assert.match(sameOutput.text, /Available providers: 2:\n1\. alpha \(2\)\n2\. beta \(12\)\n/);
   assert.match(sameOutput.text, /Available models from beta: 12\. First 10:\n/);
   assert.match(sameOutput.text, /10\. beta\/model-10\n/);
   assert.doesNotMatch(sameOutput.text, /beta\/model-11|beta\/model-12/);
   const individualOutput = { text: "", write(value) { this.text += value; } };
   const individualAnswers = ["i", "1", "1", "manual", "manual/unknown", "inherit", "", "2", "2", "y"];
  const individualAssignments = await promptForModelAssignments({
    models,
     previousAssignments: { explorer: "beta/model-4" },
    output: individualOutput,
    createInterface() { return { question() { return Promise.resolve(individualAnswers.shift()); }, close() {} }; },
  });
   assert.equal(individualAssignments.orchestrator, "alpha/model-1");
  assert.equal(individualAssignments["lead-programmer"], "manual/unknown");
  assert.equal(individualAssignments["creative-guy"], "inherit");
   assert.equal(individualAssignments.explorer, "beta/model-4");
   assert.equal(individualAssignments["simple-programmer"], "beta/model-2");
   assert.equal((individualOutput.text.match(/Available providers:/g) || []).length, CANONICAL_ROLES.length);
   const invalidOutput = { text: "", write(value) { this.text += value; } };
   const invalidAnswers = ["s", "2", "11", "3"];
  const invalidPrompts = [];
  await promptForModelAssignments({ models, output: invalidOutput, createInterface() { return { question(prompt) { invalidPrompts.push(prompt); return Promise.resolve(invalidAnswers.shift()); }, close() {} }; } });
   assert.ok(invalidPrompts.includes("Invalid model. Try again: "));
  rmSync(root, { recursive: true });
});

test("non-interactive models inherit unspecified roles and discovery failure remains controllable", async () => {
  const root = temporaryDirectory();
  const output = { text: "", write(value) { this.text += value; } };
  const errors = { text: "", write(value) { this.text += value; } };
  assert.equal(await runCli(["install", root, "--non-interactive", "--orchestrator-model", "vendor/model"], { stdout: output, stderr: errors }), 0);
  const config = readOpenCodeConfig(root).config;
  assert.equal(config.agent.orchestrator.model, "vendor/model");
  assert.equal(config.agent["creative-guy"]?.model, undefined);
  await assert.rejects(discoverOpenCodeModels({ execFile(command, args, options, callback) { callback(new Error("missing")); } }));
  rmSync(root, { recursive: true });
});

test("CLI reports controlled model discovery diagnostics", async () => {
  const root = temporaryDirectory();
  const output = { text: "", write(value) { this.text += value; } };
  const errors = { text: "", write(value) { this.text += value; } };
  const missing = new Error("missing");
  missing.code = "ENOENT";
  assert.equal(await runCli(["configure-models", root, "--yes"], { stdout: output, stderr: errors }, { discoverOpenCodeModels: async ({ cwd }) => { assert.equal(cwd, root); throw missing; } }), 0);
  assert.equal(errors.text, "OpenCode was not found on PATH. Install OpenCode or add it to PATH; choose inherit, manual model IDs, or skip.\n");
  rmSync(root, { recursive: true });
});

test("missing and dual configs handled", () => {
  const root = temporaryDirectory();
  assert.deepEqual(readOpenCodeConfig(root).config, {});
  writeFileSync(join(root, "opencode.json"), "{}");
  writeFileSync(join(root, "opencode.jsonc"), "{}");
  assert.throws(() => readOpenCodeConfig(root), { code: "AMBIGUOUS_CONFIG" });
  rmSync(root, { recursive: true });
});

test("install is non-interactive, reports status, and permits modified managed files", () => {
  const root = temporaryDirectory();
  const first = installHarness({ root, flags: { models: { orchestrator: "vendor/model", "creative-guy": "inherit" } }, packageVersion: PACKAGE_VERSION });
  assert.equal(first.validation.valid, true);
  assert.ok(listTemplateFiles().every((file) => existsSync(join(root, file.target))));
  assert.match(readFileSync(join(root, "opencode.json"), "utf8"), /vendor\/model/);
  assert.equal(getHarnessStatus({ root, packageVersion: PACKAGE_VERSION }).files[".opencode/agents/orchestrator.md"], "clean");
  writeFileSync(join(root, ".opencode/agents/orchestrator.md"), `${readFileSync(join(root, ".opencode/agents/orchestrator.md"), "utf8")}\nchanged\n`);
  assert.equal(validateInstalledHarness({ root }).valid, true);
  assert.equal(getHarnessStatus({ root, packageVersion: PACKAGE_VERSION }).files[".opencode/agents/orchestrator.md"], "modified");
  rmSync(root, { recursive: true });
});

test("install preserves existing JSONC and collision has no partial writes", () => {
  const root = temporaryDirectory();
  writeFileSync(join(root, "opencode.jsonc"), '{\n  // preserve\n  "default_agent": "custom",\n  "agent": { "other": { "keep": true } }\n}\n');
  installHarness({ root, flags: {}, packageVersion: PACKAGE_VERSION });
  assert.match(readFileSync(join(root, "opencode.jsonc"), "utf8"), /"default_agent": "custom"/);
  const collisionRoot = temporaryDirectory();
  atomicWriteFile(collisionRoot, ".opencode/harness/rules.md", "collision");
  assert.throws(() => installHarness({ root: collisionRoot, packageVersion: PACKAGE_VERSION }), { code: "INSTALL_COLLISION" });
  assert.equal(existsSync(join(collisionRoot, ".opencode/agents")), false);
  rmSync(root, { recursive: true });
  rmSync(collisionRoot, { recursive: true });
});

test("install restores files and config after validation failure", () => {
  const root = temporaryDirectory();
  const config = '{"agent":[]}\n';
  writeFileSync(join(root, "opencode.json"), config);
  assert.throws(() => installHarness({ root, packageVersion: PACKAGE_VERSION }), { code: "INSTALL_COLLISION" });
  assert.equal(readFileSync(join(root, "opencode.json"), "utf8"), config);
  assert.equal(existsSync(join(root, ".opencode/harness/manifest.json")), false);
  assert.ok(listTemplateFiles().every((file) => !existsSync(join(root, file.target))));
  rmSync(root, { recursive: true });
});

test("install prevents symlink escape and cli has controlled exit codes", () => {
  const root = temporaryDirectory();
  const outside = temporaryDirectory();
  symlinkSync(outside, join(root, ".opencode"), "junction");
  assert.throws(() => installHarness({ root, packageVersion: PACKAGE_VERSION }), { code: "SYMLINK_DESTINATION" });
  rmSync(root, { recursive: true });
  rmSync(outside, { recursive: true });
  const cliRoot = temporaryDirectory();
  assert.match(execFileSync(process.execPath, ["bin/gamedev-harness.mjs", "install", cliRoot, "--non-interactive"], { encoding: "utf8" }), /install: ok/);
  try { execFileSync(process.execPath, ["bin/gamedev-harness.mjs", "update"], { encoding: "utf8", stdio: "pipe" }); assert.fail("expected failure"); } catch (error) { assert.equal(error.status, 1); }
  rmSync(cliRoot, { recursive: true });
});

test("bin help and version", () => {
  assert.match(execFileSync(process.execPath, ["bin/gamedev-harness.mjs", "--help"], { encoding: "utf8" }), /Usage:/);
  assert.equal(execFileSync(process.execPath, ["bin/gamedev-harness.mjs", "--version"], { encoding: "utf8" }), `${PACKAGE_VERSION}\n`);
});

test("update writes conflict candidates, force backs up, and dry runs do not mutate", () => {
  const root = temporaryDirectory();
  installHarness({ root, packageVersion: PACKAGE_VERSION });
  const target = ".opencode/agents/orchestrator.md";
  const path = join(root, target);
  writeFileSync(path, "local change");
  const manifestPath = join(root, ".opencode/harness/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.managedFiles[target].baseSha256 = sha256("old baseline");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const before = readFileSync(path, "utf8");
  const dry = updateHarness({ root, packageVersion: PACKAGE_VERSION, dryRun: true });
  assert.equal(dry.conflicts.length, 1);
  assert.equal(readFileSync(path, "utf8"), before);
  const conflicted = updateHarness({ root, packageVersion: PACKAGE_VERSION });
  assert.equal(conflicted.conflicts.length, 1);
  assert.ok(existsSync(`${path}.harness-new`));
  updateHarness({ root, packageVersion: PACKAGE_VERSION, force: true });
  assert.deepEqual(readFileSync(path), readTemplateFile(listTemplateFiles().find((file) => file.target === target)));
  assert.ok(readdirSync(join(root, ".opencode/agents")).some((name) => name.startsWith("orchestrator.md.harness-backup-")));
  rmSync(root, { recursive: true });
});

test("update persists resolved baselines while conflicts remain on rerun", () => {
  const root = temporaryDirectory();
  installHarness({ root, packageVersion: PACKAGE_VERSION });
  const conflicted = ".opencode/agents/orchestrator.md";
  const resolved = ".opencode/agents/lead-programmer.md";
  const manifestPath = join(root, ".opencode/harness/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const oldBaseline = "old baseline";
  manifest.managedFiles[conflicted].baseSha256 = sha256(oldBaseline);
  manifest.managedFiles[conflicted].sourceSha256 = sha256(oldBaseline);
  manifest.managedFiles[resolved].baseSha256 = sha256(oldBaseline);
  manifest.managedFiles[resolved].sourceSha256 = sha256(oldBaseline);
  writeFileSync(join(root, conflicted), "local change");
  writeFileSync(join(root, resolved), oldBaseline);
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const first = updateHarness({ root, packageVersion: "9.9.9" });
  assert.equal(first.conflicts.length, 1);
  const persisted = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(persisted.packageVersion, PACKAGE_VERSION);
  assert.equal(persisted.managedFiles[conflicted].baseSha256, sha256(oldBaseline));
  assert.equal(persisted.managedFiles[resolved].baseSha256, sha256(readTemplateFile(listTemplateFiles().find((file) => file.target === resolved))));
  rmSync(join(root, `${conflicted}.harness-new`));
  const second = updateHarness({ root, packageVersion: "9.9.9" });
  assert.equal(second.conflicts.length, 1);
  assert.equal(existsSync(join(root, `${resolved}.harness-new`)), false);
  rmSync(root, { recursive: true });
});

test("forced update removes only matching regular candidates", () => {
  const root = temporaryDirectory();
  installHarness({ root, packageVersion: PACKAGE_VERSION });
  const target = ".opencode/agents/orchestrator.md";
  const candidate = join(root, `${target}.harness-new`);
  writeFileSync(candidate, readTemplateFile(listTemplateFiles().find((file) => file.target === target)));
  updateHarness({ root, packageVersion: PACKAGE_VERSION, force: true, dryRun: true });
  assert.ok(existsSync(candidate));
  updateHarness({ root, packageVersion: PACKAGE_VERSION, force: true });
  assert.equal(existsSync(candidate), false);
  writeFileSync(candidate, "local candidate");
  updateHarness({ root, packageVersion: PACKAGE_VERSION, force: true });
  assert.equal(readFileSync(candidate, "utf8"), "local candidate");
  rmSync(root, { recursive: true });
});

test("update adopts unmanaged template additions and scans all manifests", () => {
  const root = temporaryDirectory();
  const nested = join(root, "nested");
  mkdirSync(nested);
  installHarness({ root, packageVersion: PACKAGE_VERSION });
  installHarness({ root: nested, packageVersion: PACKAGE_VERSION });
  const manifestPath = join(root, ".opencode/harness/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  delete manifest.managedFiles[".opencode/agents/explorer.md"];
  writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.equal(updateHarness({ root, packageVersion: PACKAGE_VERSION }).conflicts.length, 0);
  assert.equal(updateAllHarnesses({ root, packageVersion: PACKAGE_VERSION }).length, 2);
  rmSync(root, { recursive: true });
});

test("uninstall preserves modified files, cleans owned config, and removes manifest", () => {
  const root = temporaryDirectory();
  installHarness({ root, packageVersion: PACKAGE_VERSION });
  const modified = join(root, ".opencode/agents/orchestrator.md");
  writeFileSync(modified, "modified");
  const dry = uninstallHarness({ root, dryRun: true });
  assert.equal(dry.preserved.length, 1);
  assert.ok(existsSync(join(root, ".opencode/harness/manifest.json")));
  const result = uninstallHarness({ root });
  assert.equal(result.preserved.length, 1);
  assert.ok(existsSync(modified));
  assert.equal(existsSync(join(root, ".opencode/harness/manifest.json")), false);
  rmSync(root, { recursive: true });
});

test("installed validation rejects malformed canonical files and config but permits modified hashes", () => {
  const root = temporaryDirectory();
  installHarness({ root, packageVersion: PACKAGE_VERSION });
  writeFileSync(join(root, ".opencode/agents/orchestrator.md"), "---\nmode: primary\n---\n");
  assert.equal(validateInstalledHarness({ root }).valid, false);
  installHarness({ root, packageVersion: PACKAGE_VERSION, flags: { force: true } });
  writeFileSync(join(root, ".opencode/skills/game-design/SKILL.md"), "---\nname: wrong\ndescription: x\n---\n");
  assert.equal(validateInstalledHarness({ root }).valid, false);
  installHarness({ root, packageVersion: PACKAGE_VERSION, flags: { force: true } });
  writeFileSync(join(root, "opencode.json"), '{"instructions":[".opencode/harness/rules.md", ".opencode/harness/rules.md"],"agent":[] }\n');
  assert.equal(validateInstalledHarness({ root }).valid, false);
  rmSync(root, { recursive: true });
});

test("installed validation rejects unknown targets and stale template source hashes", () => {
  const root = temporaryDirectory();
  installHarness({ root, packageVersion: PACKAGE_VERSION });
  const manifestPath = join(root, ".opencode/harness/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.managedFiles["unknown.md"] = { baseSha256: sha256("x"), sourceSha256: sha256("x") };
  writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.match(validateInstalledHarness({ root }).errors.join("\n"), /Unknown managed file: unknown\.md/);
  delete manifest.managedFiles["unknown.md"];
  manifest.managedFiles[".opencode/agents/orchestrator.md"].sourceSha256 = sha256("stale");
  writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.match(validateInstalledHarness({ root }).errors.join("\n"), /Template source hash mismatch: \.opencode\/agents\/orchestrator\.md/);
  rmSync(root, { recursive: true });
});
