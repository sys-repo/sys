# @sys/tmpl repo starter
Starter workspace for programmatic multi-package repositories managed by people and agents.

This template produces a **"system workspace"** for multi-package composition.

Create: `deno run -A jsr:@sys/tmpl/repo`

<p>&nbsp;</p>

### Prerequisites
Deno (standards-based, secure-by-default TypeScript runtime):
```bash
# https://deno.com
curl -fsSL https://deno.land/install.sh | sh
deno --version

# or

brew install deno
brew upgrade deno
```

Git LFS (Large File Storage) is required to fetch and push large tracked assets.
```bash
git lfs install
```

<p>&nbsp;</p>


## Tasks
Core tasks from `deno.json`:

- `deno task ci` → runs baseline quality gates (`check` then `test`)
- `deno task check` → type-checks the repo
- `deno task check:graph` → verifies the generated workspace graph snapshot
- `deno task info` → prints Deno runtime and workspace source stats
- `deno task install` → refreshes `deno.lock`
- `deno task prep` → syncs dependency authority files, the workspace graph snapshot, generated package metadata, and GitHub workflows for workspace packages under `./code/packages`
- `deno task prep:graph` → writes the workspace graph snapshot only
- `deno task test` → runs all unit tests within the workspace with permissions `-P=test`
- `deno task upgrade` → runs the interactive workspace upgrade flow from `deps.yaml`

To run the canonical workspace upgrade flow through the same task surface:
- `deno task upgrade -- --non-interactive`
- `deno task upgrade -- --policy latest`
- `deno task upgrade -- --non-interactive --policy latest --dry-run`

Generators:
- `deno task tmpl` → launches `@sys/tmpl` (all templates, interactive or `--params`)
- `deno task tmpl:project` → launches `@sys/tmpl` narrowed to `pkg`


<p>&nbsp;</p>

---
## Git Tag: baseline-0
After generating this starter from `@sys/tmpl/repo` and making your initial prep/config
updates for your project, tag it with:

```bash
git tag -fa baseline-0 -m "baseline-0: generated from @sys/tmpl/repo and prepped with initial configuration"
git push --force origin baseline-0
```

<p>&nbsp;</p>

## /packages
New packages:
- via interactive CLI: `deno task tmpl:project`
- via non-interactive/agent flow using `deno run ... @sys/tmpl ... --non-interactive`
- after adding/removing workspace packages with `deno.json` tasks, refresh workflows with `deno task prep`

<p>&nbsp;</p>
