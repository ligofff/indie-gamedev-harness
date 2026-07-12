# Indie Gamedev Harness

Project-local OpenCode harness for indie game work. It installs five behavior agents and reusable skills into target project. No global installation.

## Install

Run from target project directory:

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness install .
```

## Update

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update . --all --yes
```

Updates preserve modified files and write `.harness-new` candidates for conflicts. `--force` backs up replaced files. Use `--dry-run` to inspect without mutation. Restart OpenCode after install, update, uninstall, or model changes.

## Models

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness configure-models .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness install . --non-interactive --orchestrator-model provider/model
```

Available model flags: `--orchestrator-model`, `--lead-programmer-model`, `--creative-model`, `--explorer-model`, and `--simple-programmer-model`. Matching variant flags replace `-model` with `-variant`; each variant flag requires its role's model flag. Model IDs use `provider/model`. Interactive flow uses `opencode models --verbose`, preserves existing assignments, and prompts for available variants after known model selection. `--skip-models` cannot combine with model or variant flags. `--set-default` sets `orchestrator` default agent.

## Operations

`status`, `validate`, and `uninstall` operate on project-local harness. Uninstall preserves modified files unless `--force`; force creates backups. Teams should commit installed `.opencode` harness files and resolve update candidates together. For manual migration or adoption, back up target config and harness files first, run install with `--force` only after review, then restart OpenCode.

See [INSTALL.md](INSTALL.md) for full command and recovery guidance.
