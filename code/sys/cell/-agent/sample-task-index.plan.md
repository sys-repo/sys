# Cell sample task index plan

## Status

Planned. No implementation changes yet.

## Scope

Make Cell samples discoverable from the package task surface:

```sh
deno task sample
```

This work is limited to the `@sys/cell` package sample-task entrypoint and its Deno task wiring.
It does not change Cell descriptor semantics, service/task execution semantics, sample contents, or
`CellCli` command behavior.

## TMIND review

### Hostile view: duplicated truth risk

The sample list must not be copied into a script. The authoritative sample surface already exists in
`deno.json.tasks`. If the script owns a second list, it will drift the first time a sample task is
renamed.

Resolution: derive the index from `deno.json.tasks` at runtime.

### Hostile view: CLI command creep

Adding a `cell sample` command would make this feel productized, but the user intent is Deno-task
discoverability. A new Cell CLI command would broaden public behavior and create unnecessary API
surface.

Resolution: make `deno task sample` the UX seam; keep `CellCli` unchanged.

### Hostile view: pure script claim

A script that imports `@sys/cell` just to list samples is not pure. It would pull in Cell runtime
concerns for a package-local task index.

Resolution: keep the script independent of the Cell runtime. It should read `deno.json`, render the
sample task index, and dispatch the selected existing Deno task.

### Hostile view: interactive automation hazard

`deno task sample` may be invoked by a human at a terminal, but it could also be probed by tooling.
Interactive-by-default is acceptable for ambiguity, but the behavior should remain bounded and
legible.

Resolution: provide a small help/list surface if implementation wants non-interactive inspection;
otherwise keep the default prompt simple, cancellable, and no-write until a sample is selected.

## S-tier essence

- One source of truth: `deno.json.tasks`.
- One new user seam: `deno task sample`.
- No Cell runtime coupling.
- No duplicated sample registry.
- No public `CellCli` expansion.
- Existing `sample:*` tasks remain the executable contract.
- The index is a thin human affordance over the existing task namespace.

## BMIND review

The simplest correct model is: samples are tasks. Therefore the sample browser is not a Cell feature;
it is a Deno task affordance for the Cell package. The script should be boring: discover task names,
show them, and run the chosen task. Anything more risks turning a package-local index into a second
sample platform.

## Proposed implementation

### 1. Wire the root sample task

Update `code/sys/cell/deno.json` tasks:

```json
"sample": "deno run -P=sample ./-scripts/task.sample.ts"
```

Keep the existing `sample:*` tasks unchanged.

### 2. Replace the current sample starter script

Rewrite `code/sys/cell/-scripts/task.sample.ts` so it:

1. reads the package-local `deno.json`;
2. extracts task names matching `sample:*`;
3. preserves `deno.json` task order;
4. renders an indexed interactive menu using `@sys/cli`;
5. runs the selected task through `deno task <task-name>`;
6. exits cleanly on cancel/exit.

The script should not import `@sys/cell`.

### 3. Keep optional flags small, if added

Only add flags if they are cheap and useful:

- `--help` / `-h` prints the script purpose and examples;
- `--list` prints discovered sample task names without prompting.

Do not add filtering, categories, aliases, or config files in this pass.

### 4. Presentation target

Default prompt should show a compact list similar to:

```text
@sys/cell samples

├─ sample:stripe
├─ sample:deploy:start
├─ sample:deploy:prep
├─ sample:deploy
├─ sample:vite
└─ sample:vite:dev

(exit)
```

Selection dispatches the existing task exactly.

## Test and verification plan

### Narrow proof

If extraction earns a helper, add a test for the pure task-index function:

- includes only names starting with `sample:`;
- excludes root `sample`;
- preserves input order;
- returns an empty list cleanly when no sample tasks exist.

### Runtime proof

From `code/sys/cell`:

```sh
deno task check
deno task test --trace-leaks ./src/m.cli ./src/m.cell
deno task sample
```

For `deno task sample`, manually verify the prompt lists the current `sample:*` tasks and that
selecting one dispatches the matching existing task.

## Non-goals

- No changes to `Cell`, `CellCli`, or descriptor/task semantics.
- No changes to sample folders.
- No new sample registry file.
- No reformatting or broad package cleanup.
- No workspace-wide task runner abstraction.
