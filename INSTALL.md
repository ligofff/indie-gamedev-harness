# Install and Maintain

All commands run from target project and install project-local files only. No global OpenCode configuration changes.

## Commands

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness install .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update .
npx --yes --package=github:ligofff/indie-gamedev-harness#v0.2.0 gamedev-harness install .
npx --yes --package=github:ligofff/indie-gamedev-harness#v0.2.0 gamedev-harness update .
```

`master` means current repository branch. `v0.2.0` is example release tag; replace it with desired tag. Use tags for repeatable team installs.

Install preserves existing JSON or JSONC configuration, permissions, default agent unless `--set-default`, and unrelated agents. It copies canonical harness files, records hashes, and adopts matching existing files. Restart OpenCode when finished.

## Model process

Use `configure-models` to edit only model configuration:

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness configure-models .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness configure-models . --non-interactive --creative-model provider/model
```

Model flags: `--orchestrator-model`, `--lead-programmer-model`, `--creative-model`, `--explorer-model`, `--simple-programmer-model`. Interactive discovery calls `opencode models`; discovery failure still permits inherit, manual IDs, or skip. Unknown manual IDs require confirmation. Existing assignments can be reused. `--non-interactive` uses supplied values only and makes fresh unspecified roles inherit. `--skip-models` and model flags conflict.

## Updates, conflicts, backups

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update . --dry-run
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update . --force
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness update . --all --yes
```

Update preserves user modifications. Conflicts create `.harness-new` candidate files. `--force` backs up replaced files with `.harness-backup-...`; review backups and candidates before deletion. `--all` discovers harnesses and prompts once unless `--yes`. Noninteractive `--all` requires `--yes`.

## Uninstall, teams, migration

```sh
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness validate .
npx --yes --package=github:ligofff/indie-gamedev-harness#master gamedev-harness uninstall .
```

Teams should commit project-local harness changes and coordinate conflict resolution. For manual migration or adoption, back up `opencode.json` or `opencode.jsonc` and `.opencode` first. Use `install . --force` only after reviewing collision backups. Uninstall preserves modified files unless forced. Restart OpenCode after every configuration or harness change.
