# @sys/tmpl repo starter
Starter workspace for programmatic multi-package repositories managed by people and agents.

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
- `deno task info` → prints Deno runtime and workspace source stats
- `deno task prep` → syncs generated package metadata and GitHub workflows for project modules under `./code/projects`
- `deno task test` → runs all unit tests within the workspace with permissions `-P=test`
- `deno task outdated` → reports dependency updates from the canonical `deps.yaml` manifest
- `deno task upgrade` → runs the interactive workspace upgrade flow from `deps.yaml`

To run a non-default upgrade mode, pass flags through the same task surface:
- `deno task upgrade -- --mode latest`
- `deno task upgrade -- --non-interactive --mode latest`

Generators:
- `deno task tmpl` → launches `@sys/tmpl` (all templates, interactive or `--params`)
- `deno task tmpl:project` → launches `@sys/tmpl` narrowed to `pkg`


<p>&nbsp;</p>

---
## Git Tag: baseline-0
After generating this starter from `@sys/tmpl/repo` and making your initial prep/config
updates for your project, tag it with:

```bash
git tag -fa baseline-0 -m "baseline-0: generated from @sys/tmpl/repo and prepped with initial configuration and values"
git push --force origin baseline-0
```

<p>&nbsp;</p>

## /projects
New projects:
- via interactive CLI: `deno task tmpl:project`
- via non-interactive/agent flow using `deno run ... @sys/tmpl ... --no-interactive`
- after adding/removing project modules with `deno.json` tasks, refresh workflows with `deno task prep`

<p>&nbsp;</p>
