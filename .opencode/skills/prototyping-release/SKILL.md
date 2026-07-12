---
name: prototyping-release
description: Use when validating a game idea, scoping work, planning milestones, running playtests, preparing builds, handling hotfixes, releases, patch notes, telemetry, or live operations.
---

# Prototyping And Release

## Prototypes

- State one question or hypothesis. A prototype exists to answer it, not become accidental production code.
- Timebox scope, use placeholders freely, and define observable success, failure, stop, and inconclusive outcomes. Use an existing project-native prototype finding/result artifact, or create one only when demonstrated complexity, continuity, decision, or handoff need warrants it.
- Isolate both ways: prototype code must not depend on shipped systems, and shipped systems must not depend on prototype code. A successful prototype informs a fresh production implementation, not a promoted shortcut.
- In that artifact when used, record result evidence, limitations, and production implications: behavior or player observations, measured data when relevant, retained decisions, rejected assumptions, required production work, and follow-up owner or route.
- Decide explicitly to iterate, pivot, stop, or rebuild for production. Stop when timebox ends without useful evidence; call result inconclusive rather than extending scope by default.

## Planning

- Keep plans small and adaptive: outcome, smallest steps, dependencies, risks, uncertainty, and verification.
- Distinguish required scope from polish and optional work. Cut breadth before cutting correctness, accessibility, or data safety.
- Use milestones only when they aid a real decision or commitment. Do not require sprint or story bureaucracy.
- Recalibrate remaining plan from delivery variance: compare planned effort and scope with completed work, blockers, and rework. At risk milestones frame protect, simplify, defer, or cut choices around essential player outcome.

## Playtests

- Capture test context with each finding: build identity, platform and input method, participant experience, session purpose, relevant route or scenario, and observation conditions.
- Separate observations from interpretations. Route reproducible defects to bug work, design or comprehension findings to design decisions, tuning evidence to balance work, and non-blocking friction to polish; prioritize player harm and evidence.

## Release And Operations

- Verify build version, target platform, backups, migration behavior, known issues, rollback path, and critical player journey before release.
- At release candidate, freeze scope except release blockers. Record explicitly what is included, deferred, and accepted risk; reopen scope only for a verified blocker or release decision.
- Before release, define proportionate monitoring, alert thresholds, rollback trigger and steps, player/support communications, known-issue messaging, and responsible contact path using existing project practice.
- Keep hotfix scope narrow. Use hotfix path only for critical player harm, such as unplayability, data loss, security exposure, or a major broken flow requiring urgent repair; route lower-severity work normally. Reproduce, repair root cause, run targeted regression evidence, and record player impact.
- Verify hotfix in deployed build, not only local or candidate build. If verification fails or new critical harm appears, execute rollback decision promptly; then record prevention action addressing root cause, detection, test gap, or release process gap.
- Separate technical changelog from player-facing patch notes. Player notes explain visible changes, impact, and known issues in clear language.
- Use telemetry and experiments only for a defined decision. Specify purpose, minimal metric and interpretation, privacy impact, retention or access limits where applicable, and meaningful opt-out when collection is not necessary. Respect privacy, avoid dark patterns, and plan rollback for economy or live-event changes.
