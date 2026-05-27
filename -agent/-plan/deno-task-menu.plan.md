# Deno task menu helper plan

## Status

Driver helper and Cell sample-menu refactor are complete. Server sample-menu update remains.

Current commits:

- `6519b285f` — `chore(tmpl:m.mod): scaffold DenoTask runtime module`
- `6eaeb1e18` — `feat(driver-deno): add Deno task menu helper`
- `f2553d490` — `refactor(cell): use DenoTask menu for sample index`


## Commit sequence

- [x] `6519b285f` chore(tmpl:m.mod): scaffold DenoTask runtime module
- [x] `6eaeb1e18` feat(driver-deno): add Deno task menu helper
- [x] `f2553d490` refactor(cell): use DenoTask menu for sample index
- [ ] feat(server): add discoverable sample task menu



## Scope

Create a reusable Deno runtime helper for presenting a menu over a selected subset of tasks from a
package-local `deno.json`.

Primary first users:

- `@sys/cell` sample task menu
- `@sys/server` sample task menu

This is not a Cell feature, not a Server feature, and not a generic process helper. It is a Deno task
index/menu helper with CLI presentation and process dispatch at the edge.

## BMIND review

The underlying noun is not "sample". Samples are only the first policy use. The reusable concept is:

> choose one task from a filtered set of `deno.json.tasks`, then run it through `deno task`.

That makes the owner `@sys/driver-deno/runtime`, where the system already keeps Deno runtime concepts
such as `DenoFile`, `DenoDeps`, and `DenoVersion`.

`@sys/cli` should remain the prompt/formatting substrate. `@sys/process` should remain the child
process substrate. The new helper composes both, but the domain noun is still Deno task discovery and
dispatch.

## TMIND review

### Hostile view: sample-specific abstraction leak

A `DenoTask.Sample` helper would encode the first use case into the reusable noun and would age badly
once another package wants a docs/demo/dev menu.

Resolution: expose `DenoTask.Menu`, with caller-provided title and task inclusion patterns.

### Hostile view: second task registry

If callers pass copied task labels, the menu becomes a new registry that can drift from `deno.json`.

Resolution: callers pass task names or glob patterns to include; the helper reads `deno.json.tasks`
and preserves its order.

### Hostile view: shell parsing creep

Trying to detect aliases like `sample:files -> sample:files:ws` would require parsing task command
strings and guessing Deno task semantics.

Resolution: do not parse task command strings. If `sample:files` exists and matches the inclusion
pattern, list it as a real task. Running it delegates to Deno.

### Hostile view: CLI flag drift

A reusable interactive helper can become hostile to automation if it prompts with no deterministic
escape hatch.

Resolution: support canonical inspection and no-prompt behavior:

- `--help` / `-h`
- `--list` / `-l`
- `--non-interactive`

If no task is selected or provided in non-interactive mode, fail clearly rather than prompting.

### Hostile view: package boundary confusion

Running from the wrong cwd could read the wrong `deno.json`.

Resolution: require `cwd` explicitly on `DenoTask.Menu.main(...)`, default wrapper scripts pass `'.'`,
and all read/run operations resolve from that cwd.

## S-tier / ROI verdict

This is an S-tier move if kept small.

High ROI:

- removes duplicated local menu scripts before they spread;
- gives every package a discoverable `deno task sample` path;
- keeps Deno-specific knowledge out of `@sys/cli` and `@sys/process`;
- reuses `@sys/std` Glob matching instead of inventing inclusion semantics;
- leaves existing `sample:*` tasks as the execution contract.

Not S-tier if it grows into task-command parsing, alias inference, package-wide sample metadata, or a
new generalized workflow runner.

## Target module

Create the runtime module:

```text
code/sys.driver/driver-deno/src/m.runtime/m.DenoTask/
├── mod.ts
├── t.ts
├── common.ts
└── -test/-.test.ts
```

Exports:

```ts
export { DenoTask } from './m.DenoTask/mod.ts';
```

from:

```text
code/sys.driver/driver-deno/src/m.runtime/mod.ts
```

and type exports from:

```text
code/sys.driver/driver-deno/src/types.ts
```

## Proposed API

```ts
await DenoTask.Menu.main({
  cwd: '.',
  argv: Deno.args,
  title: '@sys/cell samples',
  include: ['sample:*'],
});
```

Core surface:

```ts
DenoTask.list({ cwd, include, exclude? })
DenoTask.run({ cwd, name })
DenoTask.Menu.main({ cwd, argv, title, include, exclude? })
```

### Inclusion semantics

Use the canonical `@sys/std` `Glob` helper for inclusion/exclusion matching.

- `include` accepts exact task names and glob patterns.
- default should be explicit; call-sites pass `['sample:*']` for sample menus.
- `exclude` is optional and evaluated after inclusion.
- preserve `deno.json.tasks` declaration order.
- only tasks whose command value is a string are listable.

Do not reimplement glob matching locally.

### Menu CLI grammar

`DenoTask.Menu.main(...)` owns the wrapper-script grammar:

```text
[--help|-h]
[--list|-l]
[--non-interactive]
[task-name]
```

Rules:

- normalize a leading `--` because `deno task sample -- --list` passes it through to `Deno.args`;
- `--help` prints usage plus the matching task list and does not prompt;
- `--list` prints the matching task list and does not prompt;
- a positional `task-name` runs that task only when it is in the filtered task set;
- `--non-interactive` with no positional `task-name` fails clearly and does not prompt;
- unknown flags fail clearly;
- no positional task and interactive mode opens the select menu;
- an empty filtered task set is a clear error for interactive/non-interactive execution, but is still
  printable through `--list`/`--help`.

`main(...)` is intentionally suitable for tiny wrapper scripts, so it sets `Deno.exitCode` for errors
and for selected task failures. `DenoTask.run(...)` only returns the inherited process result.

## Call-site updates

### `@sys/cell`

Reduce `code/sys/cell/-scripts/task.sample.ts` to a thin wrapper:

```ts
import { DenoTask } from '@sys/driver-deno/runtime';

await DenoTask.Menu.main({
  cwd: '.',
  argv: Deno.args,
  title: '@sys/cell samples',
  include: ['sample:*'],
});
```

Keep `code/sys/cell/deno.json` root task:

```json
"sample": "deno run -P=sample ./-scripts/task.sample.ts"
```

### `@sys/server`

Add `code/sys/server/-scripts/task.sample.ts`:

```ts
import { DenoTask } from '@sys/driver-deno/runtime';

await DenoTask.Menu.main({
  cwd: '.',
  argv: Deno.args,
  title: '@sys/server samples',
  include: ['sample:*'],
});
```

Add a root sample task in `code/sys/server/deno.json`:

```json
"sample": "deno run -P=sample ./-scripts/task.sample.ts"
```

Keep existing sample tasks unchanged:

```json
"sample:files": "deno task sample:files:ws",
"sample:files:ws": "deno run -P=sample-files-ws ./-sample/files.websocket/-start.ts",
"sample:files:static": "deno run -P=sample-files-static ./-sample/files.static/-start.ts"
```

Add the smallest root `sample` permission needed for the wrapper to read `deno.json` and dispatch a
selected task:

```json
"sample": {
  "read": true,
  "run": true,
  "env": true
}
```

The selected sample task still runs under its own existing permission profile.

## Implementation steps

1. Add `Glob` to the local driver-deno `common/libs.ts` import lane.
2. Implement `DenoTask.list(...)` with `DenoFile.load(cwd)`, `Obj.entries(...)`, and
   `Glob.matches(...)`.
3. Implement `DenoTask.run(...)` with
   `Process.inherit({ cmd: 'deno', args: ['task', name], cwd })`.
4. Implement `DenoTask.Menu.main(...)` using `Args.parse(...)`, `Cli.Input.Select`, and the grammar
   above.
5. Export `DenoTask` from `src/m.runtime/mod.ts`.
6. Keep the Cell and Server call-site changes for their own commits.
7. Verify narrow package checks/tests and runtime list/help paths.

## Test and verification plan

### Driver helper tests

In `code/sys.driver/driver-deno`:

```sh
deno task test --trace-leaks ./src/m.runtime/m.DenoTask
deno task check
```

Test cases:

- `DenoTask.list` includes exact names and glob patterns;
- `DenoTask.list` preserves `deno.json.tasks` order;
- `DenoTask.list` excludes after inclusion;
- non-string task values are ignored;
- `DenoTask.Menu.main --list` renders matching tasks without prompting;
- `DenoTask.Menu.main --non-interactive` fails clearly without a task selection;
- positional task selection fails when the task is outside the filtered set;
- positional task selection runs a matching real task and propagates the child exit code.

### Cell call-site verification

In `code/sys/cell`:

```sh
deno task check
deno task sample -- --list
deno task sample -- --help
deno task test --trace-leaks ./src/m.cli ./src/m.cell
```

### Server call-site verification

In `code/sys/server`:

```sh
deno task check
deno task sample -- --list
deno task sample -- --help
deno task test
```

## Non-goals

- No task command parsing.
- No alias folding.
- No sample metadata file.
- No new `@sys/cli` task domain APIs.
- No changes to `@sys/process`.
- No changes to Cell or Server runtime semantics.
- No broad package cleanup.

