import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("packed package installs and validates through its bin", () => {
  const shell = process.platform === "win32";
    const packed = JSON.parse(execFileSync("npm", ["pack", "--json"], { encoding: "utf8", shell }))[0];
    assert.ok(packed.files.some((file) => file.path === "INSTALL.md"));
  const tarball = join(process.cwd(), packed.filename);
  const temporary = mkdtempSync(join(tmpdir(), "gamedev-harness-package-"));
  const project = join(temporary, "project");
  try {
    mkdirSync(project);
    execFileSync("npm", ["install", tarball, "--prefix", temporary], { encoding: "utf8", shell });
    const bin = join(temporary, "node_modules", ".bin", process.platform === "win32" ? "gamedev-harness.cmd" : "gamedev-harness");
    assert.match(execFileSync(bin, ["install", project, "--non-interactive"], { encoding: "utf8", shell }), /install: ok/);
    assert.match(execFileSync(bin, ["validate", project], { encoding: "utf8", shell }), /validate: ok/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
    rmSync(tarball, { force: true });
  }
});
