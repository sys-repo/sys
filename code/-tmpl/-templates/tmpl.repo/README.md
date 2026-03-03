# @sys/tmpl repo starter
Monorepo starter structure for programmatic projects managed by people and agents.

<p>&nbsp;</p>

### Prerequisites
Deno (standards-based, secure-by-default TypeScript runtime):
```bash
# https://deno.com
curl -fsSL https://deno.land/install.sh | sh
deno --version
deno upgrade

# or

brew install deno
deno --version
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
- `deno task test` → runs all unit tests within the mono-repo with permissions `-P=unit`
- `deno task outdated` → reports dependency updates
- `deno task upgrade` → upgrades dependencies to latest

Generators:
- `deno task tmpl` → launches `@sys/tmpl` (all templates, interactive or `--params`)
- `deno task tmpl:project` → launches `@sys/tmpl` narrowed to `pkg.deno`


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

<p>&nbsp;</p>

### Agent Prompt Seed
```
From within `./code/projects`, set `FOLDER` to your target folder name.

Do ONLY the following:

1) Create a new folder: `${FOLDER}/`
2) Inside `${FOLDER}/`, add:
   - `main.ts` (minimal; should run without args)
   - `deno.json` with a single task: `dev` (runs `deno run -A main.ts`)
   - Do NOT set `name` (this is a simple runnable folder, not a package → avoids the `exports` warning)
3) Update the monorepo root `deno.json` to include/register `${FOLDER}/` (add the appropriate reference so tooling/tasks can see it).

No other files, no refactors, no extra changes.
```
