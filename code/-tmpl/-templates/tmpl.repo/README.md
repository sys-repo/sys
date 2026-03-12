# @sys/tmpl repo starter
Monorepo starting structure for programmatic projects managed by people and agents.

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


## Starter Tasks
Core baseline tasks from `deno.json`:

- `deno task ci` → runs baseline quality gates (`check` then `test`)
- `deno task check` → type/lint gate for the starter shell
- `deno task prep` → regenerates GitHub workflows for discovered project modules under `./code/projects`
- `deno task test` → runs all unit tests within the mono-repo with permissions `-P=test`
- `deno task outdated` → reports dependency updates
- `deno task upgrade` → upgrades dependencies to latest

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

