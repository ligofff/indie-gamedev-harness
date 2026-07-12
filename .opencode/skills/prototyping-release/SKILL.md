---
name: prototyping-release
description: Use when validating a game idea, scoping work, planning milestones, running playtests, preparing builds, handling hotfixes, releases, patch notes, telemetry, or live operations.
---

# Prototyping And Release

## Prototypes

- State one question or hypothesis. A prototype exists to answer it, not become accidental production code.
- Timebox scope, use placeholders freely, define observable success or failure, and record findings.
- Decide explicitly to iterate, pivot, stop, or rebuild for production. Keep prototype shortcuts isolated from shipped systems.

## Planning

- Keep plans small and adaptive: outcome, smallest steps, dependencies, risks, uncertainty, and verification.
- Distinguish required scope from polish and optional work. Cut breadth before cutting correctness, accessibility, or data safety.
- Use milestones only when they aid a real decision or commitment. Do not require sprint or story bureaucracy.

## Release And Operations

- Verify build version, target platform, backups, migration behavior, known issues, rollback path, and critical player journey before release.
- Keep hotfix scope narrow. Reproduce, repair root cause, run regression evidence, and record player impact.
- Separate technical changelog from player-facing patch notes. Player notes explain visible changes, impact, and known issues in clear language.
- Use telemetry and experiments only for a defined decision. Respect privacy, avoid dark patterns, and plan rollback for economy or live-event changes.
