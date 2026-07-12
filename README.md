# Indie Gamedev Harness

This harness keeps OpenCode configured for indie game work inside your project. It installs five behavior agents and a shared skill set locally—nothing goes on your system globally.

## Idea

The goal is to keep things simple, broadly usable, and lightweight. Existing projects like https://github.com/striderZA/OpenCodeGameStudios are solid work, and well worth a look; I just found myself wanting something with less surface area and more direct control over how the configuration behaves. This harness is the result: a small, self-contained pack that follows YAGNI, KISS, and DRY.

## Install

From the target project directory, run:

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness install .
```

## Update

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update . --all --yes
```

Updates keep your modified files intact and write `.harness-new` candidates when conflicts arise. Pass `--force` to back up any replaced files, or `--dry-run` to preview changes without writing them. Restart OpenCode after any operation that touches config, agents, skills, or plugins.

## Models

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness configure-models .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness install . --non-interactive --orchestrator-model provider/model
```

Assign models per role with these flags: `--orchestrator-model`, `--lead-programmer-model`, `--creative-model`, `--explorer-model`, and `--simple-programmer-model`. Each flag accepts a `provider/model` ID.

Variant flags swap `-model` for `-variant` and require the matching role model flag to be set.

The interactive flow lists available models via `opencode models --verbose`, keeps any existing assignments, and prompts for variants after you pick a known model. `--skip-models` is incompatible with any model or variant flag. Use `--set-default` to make `orchestrator` the default agent.

## Operations

`status`, `validate`, and `uninstall` all target the project-local harness. Uninstall keeps modified files unless you pass `--force`, which creates backups instead. Teams should commit the installed `.opencode` files and review update candidates together. For manual migration, back up your config and harness files first, run install with `--force` only after review, then restart OpenCode.

See [INSTALL.md](INSTALL.md) for full command and recovery guidance.
