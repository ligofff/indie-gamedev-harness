---
name: harness-install
description: Use when installing, adopting, updating, or removing this harness in an OpenCode project.
---

# Harness Install

Install this harness into OpenCode without replacing a project's own conventions, configuration, agents, skills, or permissions.

## Principles

- Confirm OpenCode is the target runtime. This harness does not configure other agent runtimes or external tool servers, or dependencies.
- Inspect existing OpenCode configuration and local agent/skill directories before changing anything.
- Ask whether installation should apply to current project or the user's global OpenCode configuration when scope is unclear.
- Merge configuration. Preserve unrelated keys and user-defined permissions.
- Install five behavior agents and only skills useful to the project. Do not recreate domain-specific agents.
- Choose models from providers already available to the user. Orchestrator needs strongest reasoning; lead-programmer and creative-guy need strong but economical reasoning; explorer and simple-programmer favor low cost and reliable tool use.
- Do not publish or assume universal model IDs.
- Do not install external tool servers, packages, or engine tools. Mention optional tools only when a project need makes them relevant.
- Verify that OpenCode discovers agents and skills after installation. Configuration-time changes require an OpenCode restart.
- Report changed files, preserved configuration, validation evidence, optional tools not installed, and exact rollback actions.

## Existing Project Adoption

Start from what exists: engine settings, package manifests, source layout, test commands, assets, comments, and project notes. Reuse project-native truth locations. Do not scaffold folders, documents, or process files merely because this harness can use them.

## Removal

Remove only files installed by this harness and configuration entries that reference them. Preserve user-modified installed files unless the user explicitly approves their removal. Confirm no active OpenCode configuration references a file before deleting it.
