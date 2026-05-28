# Cell sample task index plan

## Status

Implemented. Current implementation is a thin package task that delegates menu/list/non-interactive
behavior to the upstream `@sys/driver-deno/runtime` `DenoTask.Menu` helper.

## Scope

Make Cell samples discoverable from the package task surface:

```sh
deno task sample
```

This work is limited to the `@sys/cell` package sample-task entrypoint and its Deno task wiring. It
does not change Cell descriptor semantics, service/task execution semantics, sample contents, or
`CellCli` command behavior.

## TMIND review

### Hostile view: duplicated truth risk

The sample list must not be copied into a script. The authoritative sample surface already exists in
`deno.json.tasks`. If the script owns a second list, it will drift the first time a sample task is
renamed.

Resolution: derive the index from `deno.json.tasks` at runtime through the shared Deno task menu
helper.

### Hostile view: CLI command creep

Adding a `cell sample` command would make this feel productized, but the user intent is Deno-task
discoverability. A new Cell CLI command would broaden public behavior and create unnecessary API
surface.

Resolution: make `deno task sample` the UX seam; keep `CellCli` unchanged.

### Hostile view: pure script claim

A script that imports `@sys/cell` just to list samples is not pure. It would pull in Cell runtime
concerns for a package-local task index.

Resolution: keep the script independent of the Cell runtime. The package script delegates to
`DenoTask.Menu.main(...)`, and the upstream helper reads `deno.json`, filters matching tasks,
renders the sample task index, and dispatches the selected existing Deno task.

### Hostile view: interactive automation hazard

`deno task sample` may be invoked by a human at a terminal, but it could also be probed by tooling.
Interactive-by-default is acceptable for ambiguity, but the behavior should remain bounded and
legible.

Resolution: the shared helper provides bounded `--help`, `--list`, and `--non-interactive` surfaces.
The default prompt remains simple, cancellable, and no-write until a sample is selected.

## S-tier essence

- One source of truth: `deno.json.tasks`.
- One new user seam: `deno task sample`.
- No Cell runtime coupling.
- No duplicated sample registry.
- No public `CellCli` expansion.
- Existing `sample:*` tasks remain the executable contract.
- The index is a thin human affordance over the existing task namespace.

## BMIND review

The simplest correct model is: samples are tasks. Therefore the sample browser is not a Cell
feature; it is a Deno task affordance for the Cell package. The local script should stay boring:
bind Cell's sample task pattern into the shared Deno task menu helper. Anything more risks turning a
package-local index into a second sample platform.

## Final implementation

### 1. Wire the root sample task

Updated `code/sys/cell/deno.json` tasks:

```json
"sample": "deno run -P=sample ./-scripts/task.sample.ts"
```

Kept the existing `sample:*` tasks unchanged.

### 2. Replace the current sample starter script

`code/sys/cell/-scripts/task.sample.ts` is now only the Cell-specific binding into the shared Deno
task menu helper:

```ts
import { DenoTask } from '@sys/driver-deno/runtime';

await DenoTask.Menu.main({
  cwd: '.',
  argv: Deno.args,
  title: '@sys/cell samples',
  include: ['sample:*'],
});
```

The script does not import `@sys/cell`, does not duplicate the sample registry, and does not own
menu mechanics locally. `deno.json.tasks` remains the source of truth.

### 3. Keep optional flags small

The local Cell package owns no custom flags. The upstream helper currently exposes the small generic
menu surface:

- `--help` / `-h` prints the helper purpose, examples, and matched tasks;
- `--list` / `-l` prints discovered sample task names without prompting;
- `--non-interactive <task-name>` dispatches a selected task deterministically and fails instead of
  prompting when no task name is given.

Do not add Cell-local filtering, categories, aliases, or config files in this pass.

### 4. Presentation target

Inspection output from `deno task sample -- --list` is compact and task-shaped:

```text
@sys/cell samples
sample:stripe
sample:deploy:start
sample:deploy:prep
sample:deploy
sample:vite
sample:vite:dev
```

Interactive selection and `--non-interactive <task-name>` dispatch the existing Deno task exactly.

## Test and verification plan

### Narrow proof

No extra Cell-local test helper was added. The package script is now a thin delegation seam;
behavior coverage for menu parsing/listing/dispatch belongs to the upstream Deno task helper.

### Runtime proof

Verified from `code/sys/cell` on 2026-05-28:

```sh
deno task check
deno task test --trace-leaks ./src/m.cli ./src/m.cell
deno task sample -- --list
deno task sample -- --help
```

`deno task sample -- --list` lists the current `sample:*` tasks in `deno.json` order through the
shared helper.

## Non-goals

- No changes to `Cell`, `CellCli`, or descriptor/task semantics.
- No changes to sample folders.
- No new sample registry file.
- No reformatting or broad package cleanup.
- No workspace-wide task runner abstraction.
