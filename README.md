# Indie Gamedev Harness

Small OpenCode harness for solo game development.

It has five behavior agents and reusable gamedev skills. No modules, bundled external tool servers,
alternate harness adapters, command catalog, or required project structure.

## Roles

- `orchestrator`: talks with user, plans, delegates, and summarizes.
- `lead-programmer`: makes technical decisions and prepares exact implementation work.
- `simple-programmer`: applies bounded edits without inventing design or architecture.
- `explorer`: read-only codebase research with evidence.
- `creative-guy`: game design, narrative, art, audio, UX, and creative utility work.

## Use

Run OpenCode in a project containing this harness. Start with normal language; the
orchestrator routes work and loads relevant skills only when needed.

Example:

```text
Add coyote time to jumping. Reuse current movement settings and add smallest regression check.
```

See `INSTALL.md` for agent-readable installation and removal guidance.

## Principles

- Preserve project conventions and sources of truth.
- Reuse before writing.
- Delete before adding.
- Fix root causes.
- Keep concrete values in game assets, settings, or code, not duplicated docs.
- Verify non-trivial changes.

Licensed under MIT.
