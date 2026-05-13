# Completed plan: add Cell task execution planning

## Status

Complete and landed. `Cell.Task.plan(cell, name, options?)` and `cell task <name> [dir] --plan` now
exist.

This file is historical record, not active work.

## Decision

Add a no-import task closure planning layer between descriptor validation and endpoint verification.

The resulting Cell task authority ladder is:

```txt
validate  → is this a valid Cell descriptor?
plan      → what task closure would this Cell traverse?
verify    → do the selected endpoint modules import and expose run(...) options?
run       → execute the selected endpoint closure now.
```

`plan(...)` answers the missing semantic question:

> Given a root task name, what task tree would Cell traverse, and what leaf endpoints would that
> imply, without importing or executing owner code?

## Landed behavior

- `Cell.Task.plan(cell, name, options?)` returns a `Plan`.
- `cell task <name> [dir] --plan` prints the requested task closure.
- `Plan.tree` preserves composite structure.
- `Plan.leaves` exposes flat leaf execution order.
- Repeated task refs intentionally repeat in `Plan.leaves`.
- `Plan` types live in the FS-free public type surface.
- Planning does not call `import()`.
- Planning does not check endpoint shape.
- Planning does not read endpoint module files.
- Planning does not read or parse owner config files.
- Planning validates descriptor graph invariants defensively.
- Planning applies trusted-prefix and Cell-root containment checks for reachable leaf endpoint
  addresses.
- Configless CLI plan leaves omit config output rather than printing a placeholder.
- `--plan` is scoped to `task`; it is rejected for root, `init`, `dsl`, and `start`.

## BMIND sweep result

- Public task API now includes `plan`, `verify`, and `run`.
- Runtime task module exports `plan` from `src/m.cell/u.task/mod.ts`.
- Root `Cell.Task.plan(...)` lazy-loads the task runtime seam like `verify` and `run`.
- Task endpoint/config address resolution is shared through `src/m.cell/u.task/u.resolve.ts`.
- Default trusted prefix lives in `src/m.cell/common.ts` as `DEFAULTS` / `D`.
- `verify(...)` still imports endpoint modules and checks `run(...)` shape.
- `run(...)` still pre-verifies the requested task closure before executing any leaf.
- CLI `--dry-run` remains an effect-preview flag for Cell-owned writes; task preview uses `--plan`
  because Cell does not own endpoint side effects.
- Type-only Plan consumers can import the public type surface without dragging in FS-aware task
  implementation code.

## Non-goals preserved

- No timeouts.
- No cancellation.
- No retries.
- No concurrency controls.
- No shell task primitive.
- No service planning.
- No JSON/machine-readable CLI plan format.
- No import-time endpoint verification inside `plan(...)`.
- No `RunResult` shape change.
- No `Cell.plan(...)` root alias.
- No stable per-occurrence task IDs; `Plan.leaves[index]` is the occurrence identity.
- No symlink realpath hardening; current lexical containment behavior is preserved in the shared
  resolver.

## Verification

- `deno fmt --check -- src/m.tmpl/u/u.write.ts src/m.tmpl/u/u.paths.ts src/m.help/yaml/task.yaml src/m.help/u/u.paths.ts src/m.help/-bundle/-bundle.json src/m.cli/u.task.ts src/m.cli/u.args.ts src/m.cli/t.ts src/m.cli/m.CellCli.ts src/m.cli/-test/-.test.ts src/m.cell/u.task/u.verify.ts src/m.cell/u.task/u.run.ts src/m.cell/u.task/u.resolve.ts src/m.cell/u.task/u.plan.ts src/m.cell/u.task/mod.ts src/m.cell/u.task/-test/-u.plan.test.ts src/m.cell/u.task.root.ts src/m.cell/u.services/u.verify.ts src/m.cell/u.load.ts src/m.cell/t.ts src/m.cell/mod.ts src/m.cell/common.ts src/m.cell/-test/u.fixture.ts src/m.cell/-test/-u.task.test.ts src/m.cell/-test/-.test.ts`
- `deno task check`
- `deno task test`

## Historical record

- The plan originated as a design-only note for the missing task planning layer.
- The implementation followed the focused scope: `Cell.Task.plan` plus `cell task --plan`.
- The landed implementation keeps Cell as a folder/task composition primitive and does not expand it
  into a workflow engine.
