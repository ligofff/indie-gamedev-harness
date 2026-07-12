---
name: testing-debugging-security-performance
description: Use when diagnosing bugs, planning or reviewing tests, validating player-facing behavior, handling saves or networking, auditing security, or profiling performance.
---

# Testing, Debugging, Security, And Performance

## Debugging And Tests

- Reproduce before repair. Trace input, state, shared function, output, and all callers to find root cause.
- Use deterministic, isolated checks for logic when practical. Add regression coverage at shared cause, not only ticket path.
- Match evidence to work: focused tests for logic, integration checks for boundaries, screenshots or captures for visuals and UI, playtests for feel, device testing for hardware behavior.
- Map each acceptance criterion to evidence or explicitly record why it cannot yet be verified; passing tests alone do not prove untested criteria.
- Record evidence state with each result: command or scenario, environment/version, pass/fail, artifact location, and known gaps.
- Classify severity separately from priority. A reproducible report includes environment, prerequisites, steps, actual result, expected result, evidence, and impact.
- Treat flaky checks as a reliability defect; gather repeat evidence before suppressing them.
- Define measurable pass thresholds before testing: correctness tolerances, frame-time or memory budgets, acceptable error rates, and target-device coverage.
- In engines with domain reload or editor lifecycle, test fixtures may be destroyed and recreated across reloads, play-mode entry/exit, and assembly recompilation. Verify test setup and teardown survive these transitions. Static state, singletons, and `[InitializeOnLoad]` callbacks need explicit reset in test teardown.
- Test formula boundaries and invariants: zero, one, minimum, maximum, just-inside, just-outside, overflow or underflow, rounding, invalid input, and repeated application.
- Treat zero-assertion tests and tests without a meaningful observable boundary check as incomplete, not passing coverage.
- Confirm suspected flakiness with repeated equivalent runs using project threshold; quarantine only confirmed flakes, visibly, temporarily, with owner and remediation path. Never silently suppress failure.

## Security And Networking

- Identify trust boundaries: player input, saves, mods, network packets, backend writes, external files, telemetry, and secrets.
- For each changed trust boundary, identify plausible attacker, entry point, asset at risk, abuse path, and mitigating validation or authority rule.
- Review changed or added dependencies for maintained source, known vulnerabilities, permissions or native code exposure, license fit, update path, and necessity.
- Validate untrusted data at boundary. Keep authority server-side for multiplayer outcomes that matter.
- Define protocol versioning, ownership, reconciliation, prediction, replication scope, and bandwidth budget before expanding network behavior.
- Do not expose secrets in repository, logs, screenshots, client builds, or error messages. Minimize collected player data and protect privacy.
- Protect save integrity with schema/version validation, bounds checks, atomic writes or recoverable backups, corruption handling, and migration tests. Never overwrite recoverable player progress blindly.
- Make replay behavior deterministic enough to diagnose: record versioned inputs, seed or authoritative state, simulation-affecting settings, and compatibility limits.
- Validate RPC sender authority, payload shape, ordering, idempotency, rate limits, and failure responses. Define disconnect, timeout, reconnect, resync, duplicate message, and stale-state behavior before shipping networked features.

## Performance

- Establish a reproducible baseline on target hardware before optimization.
- Classify bottleneck: CPU, GPU, memory, loading, IO, network, allocation, or contention.
- Change one measured cause at a time and compare before/after against a budget. Avoid claims based only on editor performance.
- Preserve correctness, accessibility, and visual readability when applying performance tiers or fallbacks.

## Cross-Platform Output

- Prefer project-supported concise or error-focused output for verification and CI.
- Capture or filter full tool/engine output only when actively diagnosing a failure.
- Compact reports must preserve all required failures, warnings, and diagnostics — never omit required signal for brevity.
- Do not add shell-specific wrappers (bash, PowerShell, cmd) around verification commands.
