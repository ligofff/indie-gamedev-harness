---
name: game-programming
description: Use when implementing or reviewing gameplay systems, game state, AI, combat, player mechanics, tools, game data, or engine-facing game code.
---

# Game Programming

Implement gameplay as explicit, tunable, observable behavior.

## Gameplay

- Keep rules and tuning data separate where project architecture supports it. Values likely to change through playtesting belong in native data, resources, settings, or configuration.
- Use delta time correctly. Define pause, time scale, fixed-step, and interpolation behavior deliberately.
- Model state transitions explicitly. Emit events at system boundaries instead of coupling unrelated systems through direct internals.
- Do not silently change approved design rules. Surface conflict and obtain explicit approval before intentional design deviation; keep approved change traceable in existing project records.
- Define event payload provenance, simulation context, and applied modifiers. Event receiver owns resolution into local state or presentation; sender does not reach into receiver internals.
- Keep input, simulation, presentation, persistence, and UI responsibilities distinct enough to test and debug.
- Handle invalid data and missing references at trust boundaries; avoid silent corruption.
- Translate raw input into explicit game intents. Define buffering, repeat, remapping, device loss, pause, and focus-loss behavior where relevant.
- Reject or safely recover invalid state transitions; do not let duplicate, out-of-order, or impossible events silently corrupt gameplay state.
- Provide development-only debug visualization for gameplay state, intents, transitions, collision or targeting, and key simulation values; remove or gate it from player builds.

## AI And Combat

- Make AI tunable, visualizable, and player-readable. Telegraph dangerous intent early enough for player response.
- Cache or stagger expensive perception, navigation, and decision work only after measurement establishes need.
- Treat combat readability, hit feedback, invulnerability rules, targeting, and recovery as game-design behavior, not incidental implementation.
- Provide focused AI debug visibility for current state, target, intent, timers, perception inputs, navigation result, and transition reason; keep it development-only unless player-facing diagnostics are required.

## Tools And Data

- Development tools should remove repeated developer pain and expose useful debugging state; do not build a tool framework before one tool proves need.
- Validate project-native data shapes, defaults, references, and versions. Detect orphaned data and unsafe migrations.
- Prototype code optimizes for learning. Keep it isolated from production code and rewrite validated ideas to production standards rather than promoting accidental prototype architecture.
