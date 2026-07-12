---
name: orchestration-context
description: Use when delegating work, gathering context, planning multi-step work, preserving decisions, or recovering after context loss.
---

# Orchestration And Context

## Delegation

- Delegate by behavior, not subject label. Use explorer for evidence, lead-programmer for technical decisions, simple-programmer for bounded edits, and creative-guy for creative reasoning.
- Give each delegate a goal, scope, relevant constraints, required return format, and verification expectation.
- Parallelize only independent work. Sequence work when a later decision depends on earlier evidence.
- Do not delegate a known one-file read merely to create ceremony.
- A blocked agent returns evidence, impact, completed safe work, and smallest decision needed.

## Context

- Prefer explorer when a request needs broad search, caller tracing, pattern discovery, or cross-cutting evidence.
- Read directly when one or two known files answer the question.
- Keep durable decisions in an existing project-native location when session loss would make them expensive to reconstruct. Ask the user when no suitable location exists.
- A compact handoff preserves goal, scope, decisions, changed files, verification, blockers, and next step. Do not preserve raw conversation when these facts are enough.
- Treat code, settings, assets, and tests as stronger evidence than old notes. Update or remove notes that contradict active project truth.

## Plans

- Plans state outcome, smallest useful steps, dependencies, risks, and verification. They do not require epics, stories, sprints, or fixed document paths.
- Ask questions only when an answer changes outcome, scope, or irreversible work.
- Report partial progress plainly. Never turn an uncertainty into a hidden assumption.
