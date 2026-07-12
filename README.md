# Indie Gamedev Harness

Project-local OpenCode harness for indie game work. It installs five behavior agents and reusable skills into target project. No global installation.

## Install

Run from target project directory:

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness install .
npx --yes --package=github:ligofff/indie-gamedev-harness#v0.2.0 gamedev-harness install .
```

`master` uses current repository branch. Tag such as `v0.2.0` uses fixed release. Both commands modify only project-local files.

## Update

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update .
npx --yes --package=github:ligofff/indie-gamedev-harness#v0.2.0 gamedev-harness update .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update . --all --yes
```

Updates preserve modified files and write `.harness-new` candidates for conflicts. `--force` backs up replaced files. Use `--dry-run` to inspect without mutation. Restart OpenCode after install, update, uninstall, or model changes.

## Models

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness configure-models .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness install . --non-interactive --orchestrator-model provider/model
```

Available flags: `--orchestrator-model`, `--lead-programmer-model`, `--creative-model`, `--explorer-model`, and `--simple-programmer-model`. Model IDs use `provider/model`. Interactive flow discovers models, preserves existing assignments, and supports inherit, one model for all roles, individual values, reuse, and manual IDs. `--skip-models` cannot combine with model flags. `--set-default` sets `orchestrator` default agent.

## Operations

`status`, `validate`, and `uninstall` operate on project-local harness. Uninstall preserves modified files unless `--force`; force creates backups. Teams should commit installed `.opencode` harness files and resolve update candidates together. For manual migration or adoption, back up target config and harness files first, run install with `--force` only after review, then restart OpenCode.

See [INSTALL.md](INSTALL.md) for full command and recovery guidance.
