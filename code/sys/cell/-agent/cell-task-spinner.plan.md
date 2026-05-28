# Cell task CLI spinner/progress plan

## Status

Implemented and committed.

This plan records the completed design and implementation history for task run telemetry and
CLI-owned spinner progress.

## Scope

Presentation/progress for `cell task ...` execution.

This work intentionally does **not** change deploy task semantics, deploy push/prep vocabulary,
Orbiter config, shell-command task primitives, or owner endpoint progress protocols.

## Final design

Keep the Cell kernel quiet and composable by default.

- `Cell.Task.run(...)` emits pure task-run lifecycle telemetry only when an observer is supplied.
- `Cell.task(...)` passes task-run options through unchanged.
- The CLI installs a presentation observer and owns spinner output.
- Task endpoints remain owner code and do not depend on CLI UI APIs.
- Telemetry observer errors are swallowed and never change task execution semantics.

## Final type model

Task run telemetry lives under the run namespace:

- `t.Cell.Task.Run.Options`
- `t.Cell.Task.Run.EventHandler`
- `t.Cell.Task.Run.Event`

`Run.Options` extends task verification options and adds:

```ts
onEvent?: EventHandler;
```

The event model is descriptor/result based, not string-only UI vocabulary:

```ts
| { kind: 'task:start'; task: Descriptor; leaves: readonly Leaf[] }
| { kind: 'task:step:start'; rootTask: Descriptor; step: Leaf }
| { kind: 'task:step:ok'; rootTask: Descriptor; step: Leaf; result: StepResult }
| { kind: 'task:step:fail'; rootTask: Descriptor; step: Leaf; result: StepResult }
| { kind: 'task:ok'; task: Descriptor; steps: readonly StepResult[] }
| { kind: 'task:fail'; task: Descriptor; error: unknown; steps: readonly StepResult[] }
```

Notes:

- `task:start.leaves` provides the ordered leaf run set so the CLI can derive aligned completion
  output without hard-coded widths.
- Step elapsed time is already canonically stored on `StepResult.metrics.run.startedAt/resolvedAt`.
- CLI derives display elapsed with `Time.elapsed(startedAt, resolvedAt).toString()`.

## Final CLI behavior

For `cell task <name> [dir]`:

- TTY-gated spinner progress is installed by the CLI only.
- Root start may display `running task <task-name>`.
- Active leaf step displays low-noise text:

```text
running pull:view
```

- Completed leaf steps own the per-step evidence:

```text
✔ ok step pull:view     120ms
✔ ok step deploy:stage  16ms
```

Formatting rules:

- success status `ok` is green;
- failure status `failed` is yellow;
- `step` label is gray;
- step name is white;
- elapsed is gray;
- no italic;
- completion elapsed column is aligned from the actual task run leaf set;
- summary has a blank line before and after;
- root path is formatted with `Fs.trimCwd()` and `Cli.Fmt.path(..., Cli.Fmt.Path.fmt())`;
- no duplicate per-step `ok ...` summary rows.

Summary output remains:

```text
root    -sample/cell.deploy
task    sample:deploy:prep
steps   2
```

## Related commits

Implementation commits already in history:

- `ec6ff9243` — `feat(cell): add task run telemetry and CLI spinner progress`
  - introduced the main telemetry namespace, CLI spinner renderer, task formatting split, tests, and
    shared CLI test fixture.
- `64b230956` — `feat(cell): add task run telemetry and CLI spinner progress`
  - hardened spinner completion semantics, elapsed display, ordered leaf telemetry, and alignment.

## Files changed

Core task telemetry:

- `src/m.cell/t.ts`
- `src/m.cell/u/task.root.ts` (historical path: `src/m.cell/u.task.root.ts`)
- `src/m.cell/u.task/u.run.ts`

CLI presentation/orchestration:

- `src/common/t.ts`
- `src/m.cli/m.run/u.task.ts`
- `src/m.cli/u.fmt/u.task.ts`
- `src/m.cli/u/u.task.ts`

Tests/fixtures:

- `src/m.cell/-test/-u.task.test.ts`
- `src/m.cli/-test/-.test.ts`
- `src/m.cli/-test/u.fixture.ts`

## Implementation history

1. Verified the boundary split: kernel task run is programmatic; CLI owns human output.
2. Added task run telemetry under `Cell.Task.Run.*` rather than introducing UI/progress terms into
   the kernel.
3. Threaded `Task.Run.Options` through `Cell.Task.run(...)` and root `Cell.task(...)` overloads.
4. Emitted lifecycle telemetry around root start/ok/fail and leaf step start/ok/fail.
5. Preserved semantics by swallowing observer errors.
6. Kept preflight behavior: reachable task closure is verified before any leaf endpoint executes.
7. Moved task CLI formatting/spinner rendering into `src/m.cli/u.fmt/u.task.ts`.
8. Refactored `src/m.cli/u/u.task.ts` to orchestration/result shaping only, with
   `src/m.cli/m.run/u.task.ts` remaining the command router.
9. Used `Cli.spinner`, `Cli.Fmt.spinnerText`, and `Cli.Fmt.spinnerRaw` for spinner presentation.
10. Removed duplicate per-step summary rows; spinner completion lines now carry that evidence.
11. Added canonical elapsed display from `StepResult.metrics.run` via `Time.elapsed(...)`.
12. Removed hard-coded completion width; alignment derives from `task:start.leaves`.
13. Cleaned type-surface issues:
    - no `typeof Cli.spinner`/`ReturnType<typeof Cli.spinner>` in the reviewed path;
    - CLI spinner types flow through `t.CliSpinner.*` exported from root `common/t.ts`;
    - input option shapes avoid `readonly` arrays.
14. Moved shared CLI test `silent(...)` helper to `src/m.cli/-test/u.fixture.ts`.

## Test coverage

Load-bearing coverage added/updated for:

- leaf task run args and config path behavior;
- root `Cell.task(...)` delegation and option pass-through;
- composite leaf order and ordered `task:start.leaves` telemetry;
- configless task args;
- requested-closure-only verification/import behavior;
- observer errors during success and failure;
- preflight before executing any leaf;
- first failing referenced task stops execution;
- CLI spinner formatting for root start, step start, step success, and step failure;
- task summary and task plan behavior.

## Verification

Verified during implementation before the feature commits:

```sh
deno fmt --check ...
deno task check
deno task test --trace-leaks ./src/m.cli/-test/-.test.ts ./src/m.cell/-test/-u.task.test.ts
deno task test
```

Current baseline verification from `code/sys/cell` on 2026-05-28:

```sh
deno task check
deno task test --trace-leaks ./src/m.cli ./src/m.cell
```

## BMIND conclusion

The implementation preserves the Cell microkernel split:

- Cell owns task ordering, execution metrics, and lifecycle telemetry.
- CLI owns human presentation.
- Owner endpoints own their own work and any domain-specific progress.

The feature work is committed. This plan is current as a baseline record before the next Cell pass.
