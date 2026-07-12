# Install

Use this guide when user asks to install this harness into an OpenCode project.

## Node Requirement

Node 18+ is required only to run bundled `npm test` validator. OpenCode harness itself installs no package dependency.

## Before Changing Files

1. Confirm target runtime is OpenCode.
2. Inspect existing project or global OpenCode config, agents, skills, permissions, and instructions.
3. Ask whether installation is project-local or global when user did not say.
4. Check which models are available. Do not assume provider or model ID.

## Install

1. Copy five files from `.opencode/agents/` and needed directories from `.opencode/skills/` into target's native OpenCode locations.
2. Merge `opencode.json` fields. Preserve unrelated user configuration and permissions.
3. Set `orchestrator` as default primary agent only when target has no intentional primary-agent choice.
4. Assign models from user's available providers:
   - strongest reasoning model: orchestrator
   - strong economical coding model: lead-programmer
   - strong creative/reasoning model: creative-guy
   - inexpensive model with practical context: explorer
   - inexpensive reliable editing model: simple-programmer
5. Validate config, agent discovery, and skill discovery.
6. Tell user to restart OpenCode. It does not hot-reload config-time files.

## Report

Report changed files, preserved settings, selected models, validation result, optional tools not installed, and rollback steps.

## Remove

Remove only files installed by this harness and configuration entries that reference them. Preserve user-modified files unless user explicitly approves deletion. Validate config after removal.
