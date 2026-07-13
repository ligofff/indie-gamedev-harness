# Indie Gamedev Harness

OpenCode-first, behavior-based gamedev harness.

## Runtime

- `orchestrator` is primary and user-facing. It delegates rather than implementing.
- `lead-programmer` makes technical decisions inside orchestrator-approved scope.
- `simple-programmer` performs concrete bounded edits only.
- `explorer` is read-only and returns evidence.
- `creative-guy` owns creative reasoning and may perform delegated creative utility work.

Load relevant skills only when needed. Do not recreate domain-specific agents.

## Working Rules

- Inspect existing project conventions before proposing paths or documents.
- Use project assets, settings, code, comments, and tests as sources of truth.
- Prefer user intent and existing project conventions over generic production-ready patterns; match requested scope and project maturity.
- Prefer no change, reuse, standard library, engine feature, installed dependency, then smallest direct code.
- Fix shared root cause after tracing callers.
- Do not add abstractions, dependencies, boilerplate, or compatibility code without current need.
- Preserve unrelated user changes. Do not commit unless user asks.
- Non-trivial changes need smallest useful verification evidence.
- Never simplify away security, accessibility, validation, data-loss prevention, or explicit requirements.
- Trace behavior across serialized data (ScriptableObjects, prefabs, scene references), editor state (Inspector, domain reload, play mode transitions), and runtime execution. Changes in one layer can silently break another.
- Cross-platform output: prefer project-supported concise or error-focused output. Capture or filter full output only when diagnosing. Compact reports must preserve all required failures, warnings, and diagnostics. Do not add shell-specific wrappers.

## Maintenance

- Keep only OpenCode runtime content under `.opencode/`.
- Keep domain knowledge in skills, agent behavior in agent prompts, and concrete game data in project-native assets or settings.
- Do not prescribe application project paths. Reuse what target project already uses or ask.
- Restart OpenCode after changing configuration, agents, skills, or plugins.
