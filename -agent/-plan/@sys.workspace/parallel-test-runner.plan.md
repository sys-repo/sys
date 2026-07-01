# Workspace parallel test runner plan

## Commit arc

- [x] 6ad8f3f21 refactor(workspace): preserve sequential task runner boundary
- [x] 51cbe1f7c feat(workspace): add topo-safe parallel test scheduler
- [x] 819c18cc4 feat(workspace): wire parallel test flags
- [x] eff498739 feat(workspace): add parallel test progress reporter
- [x] c88cb9d47 docs(workspace): add test runner DSL guidance
- [x] 3c75b0837 feat(workspace): default tests to topological parallel runner
- [x] e2f151562 fix(workspace): propagate root test task failures

## Baseline

Historical truth run from the workspace root before this feature:

```sh
deno task test
```

Observed serial baseline:

- serial strategy
- 51 packages
- 0 skipped
- 0 failed
- 40m wall time
- slowest package currently `code/sys.driver/driver-vite` at 29m

This remains the comparison baseline. The first parallel runner must not replace or blur it.

Expectation truth: parallel workspace execution removes artificial idle time, but it cannot beat the
slowest critical path. With the current profile, the first honest target is reducing 40m toward the
`driver-vite`-dominated lower bound, not pretending the whole workspace becomes a 5m run.

## TMIND review outcome

The feature is not a new testing package. It is an execution strategy for `@sys/workspace` task
runs, starting with tests.

BMIND essence:

> Preserve the truth of the workspace graph while removing artificial idle time.

Final boundary:

- `Workspace.Run.test()` remains semantic-API serial by default;
- root `/sys` `deno task test` defaults to the topo-safe parallel runner;
- `deno task test:seq` preserves the inherited-stdio serial baseline;
- topo safety comes from the persisted workspace graph, not from package name order or timing luck;
- the core is a deterministic package execution state machine, not a spinner or concurrency trick;
- scheduling emits state/events; terminal rendering consumes them;
- help and DSL updates are part of the feature, not polish afterthoughts.

## Final recorded reality

This plan completed as a root-task behavior change plus `@sys/workspace` runner seams.

Stable behavior to preserve:

- root `deno task test` routes through `deno task test:parallel`;
- root `deno task test:parallel` invokes `-scripts/task.test.ts --parallel`;
- root `deno task test:seq` invokes `-scripts/task.test.ts --parallel=false`;
- `-scripts/task.test.ts` strips all task separators (`--`) and injects `--parallel` only when no
  explicit `--parallel*` flag is present;
- parser/API still reject `--jobs` unless `--parallel` is explicit in the argv being parsed;
- `Workspace.Run.test()` without an explicit strategy remains serial and inherited-stdio;
- parallel execution is topo-frontier/topological, not saturating or unordered;
- `jobs` is a cap over the graph-ready frontier, so low active counts are correct when the frontier
  is narrow;
- `jobs=auto` is hardware-aware: unknown/invalid hardware resolves to `4`, known hardware resolves
  to `clamp(2, 8, floor(cpu / 2))`;
- scheduler truth remains separate from reporter formatting;
- final result rows and canonical failure selection are graph ordered, not race ordered;
- failed parallel runs stop launching new packages, await in-flight packages, and mark unstarted
  runnable packages as blocked;
- skipped packages unlock dependents but do not inflate runnable progress denominators;
- progress reporting uses runnable package totals for `passed X/Y` and percent;
- the active section self-docs current scheduler semantics as `active (--schedule=topological)`.

Important non-result: saturating scheduling was intentionally deferred. If added later, it should be
an explicit mode such as `--schedule=saturating`, not a silent replacement for the topological
frontier default.

## Command contract

Canonical root route stays:

```sh
deno task test
```

Root task routes:

```sh
deno task test
deno task test:parallel
deno task test:seq
deno task test -- --jobs=auto
deno task test -- --jobs=8
```

Flag semantics:

- root `deno task test` injects `--parallel` before parsing when no explicit `--parallel` flag is
  present.
- `deno task test:parallel` is the explicit parallel alias.
- `deno task test:seq` passes `--parallel=false` and preserves the serial baseline.
- at the parser/API layer, `--parallel` selects the topo-frontier scheduler.
- at the parser/API layer, `--jobs` is valid only with `--parallel`.
- on the root default route, `--jobs` works because the wrapper injects `--parallel` before parsing.
- `--jobs=auto` is explicit and equivalent to omitting `--jobs` after `--parallel`.
- `--jobs=<n>` accepts positive integers only.
- invalid or misplaced flags fail clearly before running packages.
- resolved strategy and job count are printed in the run header.

Native Deno distinction:

```sh
deno task --jobs=8 test        # Deno task-runner semantics
deno task test -- --jobs=8     # @sys/workspace runner semantics
```

The `@sys/workspace` flags live after `--`. Native Deno workspace task parallelism may be
benchmarked, but it is not the source of truth unless it proves the same package selection,
graph-topo constraints, failure semantics, and reporting semantics.

Initial `auto` heuristic:

```text
hardwareConcurrency unknown → 4
hardwareConcurrency known   → clamp(2, 8, floor(cpu / 2))
```

Reason: package tests may compile, spawn subprocesses, use node modules, or allocate heavily. A
bounded heuristic is more truthful than saturating all cores.

## Public API shape

Refined after the sequential-boundary refactor: keep the shared base args boring, and add strategy
only to the test surface. This keeps `check` and `dry` honest until they explicitly earn parallel
support.

```ts
type Args = {
  readonly cwd?: t.StringDir;
  readonly graph?: t.WorkspaceGraph.PersistedGraph;
  readonly rebuildGraph?: boolean;
  readonly filter?: Filter.Predicate;
};

namespace Filter {
  type Entry = {
    readonly dir: t.StringDir;
    readonly pkg: t.Pkg;
    readonly task: Task;
  };

  type Predicate = (entry: Entry) => boolean;
}

namespace Test {
  type Args = WorkspaceRun.Args & {
    readonly strategy?: Strategy;
  };

  type Strategy = Strategy.Sequential | Strategy.Parallel;

  namespace Strategy {
    type Sequential = {
      readonly kind: 'sequential';
    };

    type Parallel = {
      readonly kind: 'parallel';
      readonly jobs?: Jobs;
    };

    type Jobs = number | 'auto';
  }
}
```

Add a small runtime args helper to the `Workspace.Run` lib, not to the repo script:

```ts
type Lib = {
  readonly Args: Args.Lib;
  readonly Fmt: Fmt.Lib;
  check(args?: Args): Promise<Result>;
  dry(args?: Args): Promise<Result>;
  test(args?: Test.Args): Promise<Result>;
};

namespace Args {
  type Lib = {
    test(argv: readonly string[]): TestParseResult;
  };

  type TestParseResult =
    | { readonly kind: 'run'; readonly run: WorkspaceRun.Test.Args }
    | { readonly kind: 'help'; readonly text: string };
}
```

Default behavior is exactly `strategy: { kind: 'sequential' }`.

Result truth must expand enough for parallel execution:

- `ran`: package command reached a terminal process status;
- `skipped`: package has no applicable task;
- `blocked`: package did not launch because a dependency failed or fail-fast stopped the frontier.

If multiple packages fail during one parallel run, the canonical `failure` is selected by graph
order, not by race completion order.

Keep `Workspace.Run.test(args)` as the public call. Do not add a separate root noun unless the
runner concept earns promotion after check/dry support.

## Internal module split

Target shape inside `code/sys/workspace/src/m.run/`:

```text
t.ts                    public runner contract
m.Run.ts                public lib object
u.run.ts                orchestration and graph/candidate resolution
u.run.sequential.ts     baseline serial behavior
u.run.parallel.ts       topo-frontier scheduler
u.args.ts               typed task-test flag parsing and help input
u.jobs.ts               resolved parallel worker bounds and auto heuristic
u.plan.ts               shared candidate/edge plan from graph truth
u.worker.ts             one package task execution and command resolution
u.reporter.ts           terminal progress lifecycle
u.fmt.ts                final summary, progress frame, and package rows
```

Current implementation reality: the sequential seam, topo-safe scheduler, flag parsing, and parallel
reporter are in place. `u.run.ts` resolves graph truth and candidate manifests, then delegates
baseline execution to `u.run.sequential.ts` or explicit test parallel execution to
`u.run.parallel.ts`. `u.plan.ts` owns manifest-backed plan construction, `u.jobs.ts` owns
worker-bound resolution, `u.worker.ts` owns package command resolution/execution, and
`u.reporter.ts` consumes scheduler events for terminal progress without changing scheduler
semantics.

## Scheduler contract

The parallel runner builds a package plan from:

- `graph.orderedPaths`
- `graph.edges`
- package manifest task availability
- optional `filter`

Runtime behavior:

1. restrict dependency edges to the selected candidate set after filtering;
2. maintain a deterministic state machine: pending → ready → running → terminal;
3. mark packages with all dependencies complete as ready;
4. process missing-task packages as terminal `skipped` outcomes that unlock dependents;
5. launch at most `jobs` ready packages, in `orderedPaths` order;
6. on success, unlock dependents;
7. on first failure, stop launching new packages;
8. allow in-flight packages to finish;
9. mark unstarted packages as blocked when fail-fast prevents launch;
10. return one deterministic `WorkspaceRun.Result` ordered by graph order, not finish order.

Dependency edges use the existing direction: dependency package → dependent package.

`jobs=1` at the scheduler level should produce the same package start order as sequential. The
public sequential path still remains separate because inherited stdio is valuable for debugging.

The scheduler commit should include an internal event/progress seam (`start`, `skip`, `finish`,
`block`, `done`) so the reporter can consume live state later without changing scheduler semantics.

## Process and output policy

Sequential:

- use current inherited stdio;
- keep direct per-package output;
- fail fast immediately.

Parallel:

- do not inherit child stdio;
- capture package stdout/stderr;
- show progress through the reporter;
- print grouped output for failed packages;
- optionally print grouped output for all packages only under a later explicit verbose flag.

First pass may use `Process.invoke({ silent: true })` for package tasks only as an explicit buffered
output tradeoff: no streaming package output, no mid-run cancellation, and memory proportional to
child output. Do not use raw `Deno.Command` in `@sys/workspace` to bypass `@sys/process`; if
streaming or cancellation becomes required, extend the canonical process primitive first.

Do not build a streaming terminal multiplexer unless a real need appears.

## Reporter and formatting

Reporter is terminal UX, not scheduler logic.

Initial reporter:

- one multiline spinner frame for active parallel execution;
- first line carries counts and package completion percent;
- active packages render as a compact width-aware grid, not a sentence;
- counts cover pending, running, passed, skipped, blocked, and failed where relevant;
- final table uses the current `Workspace.Run.Fmt.result(...)` style with one-space indentation;
- clear line for `strategy parallel, jobs N`;
- plain deterministic output in non-TTY or test contexts.

Progress frame target:

```text
⠦  ✓ passed 18   ⦿ running 6   ◦ pending 27   ✕ failed 0   · done 35%

   active
     ⦿ code/sys.driver/driver-vite   11m     ⦿ code/-tmpl                    2m      ⦿ code/sys.tools              48s
     ⦿ code/sys/server               31s     ⦿ code/sys.ui/ui-components     18s     ⦿ code/sys.model/model-slug    9s
```

Glyph/color contract:

```text
✓ passed     c.green
⦿ running    c.cyan
⦾ ready      c.white or dim cyan
◦ pending    c.gray / c.dim
✕ failed     c.red when >0, otherwise c.gray
⊘ blocked    c.yellow
active       c.gray
elapsed      c.gray
done N%      c.gray
```

`done N%` means terminal packages divided by total packages. It must not imply wall-clock remaining.

Active-grid layout:

- resolve width with `Cli.Fmt.Text.fitWidth(...)`;
- use `Cli.Fmt.Text.visibleWidth(...)` and `Cli.Fmt.Text.padEnd(...)` for cell alignment;
- shorten paths with `Cli.Fmt.Path.tty(path, { fit: 'width', width: pathWidth, relative: 'bare' })`;
- choose 3 columns when each cell can stay legible;
- fall back to 2 columns, then 1 column;
- cap visible rows and render `+N more` for overflow.

Ora-style multiline spinner output must be runtime-probed. If line clearing ghosts, keep reporter
isolated and fall back to a one-line spinner plus throttled active-grid refresh.

Use only existing surfaces unless a gap is proven:

- `Cli.Spinner`
- `Cli.table`
- `Cli.Fmt.hr`
- `Cli.Fmt.Path.tty`
- `Cli.Fmt.Text`
- `c` colors
- `Time.duration`
- `Str` helpers

No exotic full-screen dashboard in the first pass.

## CLI bridge

Root script to change:

```text
-scripts/task.test.ts
```

Keep the root script thin. Typed flag parsing belongs in `@sys/workspace`; the repo script only owns
the root task help text.

Final root shape keeps the script thin:

```ts
if (wantsHelp(Deno.args)) {
  console.info(help());
  return;
}

const args = Workspace.Run.Args.test(defaultTestArgs(Deno.args));
const result = await Workspace.Run.test(args);
```

Rules:

- `deno task test` defaults to parallel at the root task wrapper.
- `deno task test:parallel` is an explicit parallel alias.
- `deno task test:seq` preserves the serial baseline.
- `Workspace.Run.test()` without args remains the semantic serial API baseline.
- `--jobs` without `--parallel` still fails at the parser/API layer; the root wrapper injects
  `--parallel` before parsing on the default route.
- unknown flags fail before running packages.
- `deno task test -- --help` prints root task help and exits before running packages.

Avoid broadening the package CLI command unless the human wants `@sys/workspace test` as a published
command. The immediate route is the repo task.

## Help and DSL updates

Help/DSL work is required because this changes agent/operator behavior.

Add a new DSL chapter:

```text
code/sys/workspace/src/m.help/yaml/dsl.test.yaml
```

Update:

```text
code/sys/workspace/src/m.help/yaml/dsl.yaml
code/sys/workspace/src/m.help/-bundle/-bundle.json
code/sys/workspace/src/m.help/-bundle/-bundle.ts
```

DSL chapter should state:

- root `deno task test` defaults to topo-safe parallel execution;
- `deno task test:seq` preserves the serial inherited-stdio baseline;
- `Workspace.Run.test()` without args remains the semantic serial API baseline;
- `--jobs=auto` resolution is bounded and printed;
- `@sys/workspace` flags live after `--` and are distinct from native Deno task flags;
- scheduler is topo-frontier, not unordered parallelism;
- failed parallel runs stop new launches but await in-flight packages;
- blocked packages are reported truthfully;
- final result order is graph order;
- speedup is bounded by the slowest critical path.

Help update options:

1. Minimal root-task help in `-scripts/task.test.ts` for `--help`.
2. Published `@sys/workspace dsl test` chapter for agent/operator design guidance.
3. Later, if an `@sys/workspace test` command is created, add it to `m.cli` help.

First pass should implement options 1 and 2 only.

## Tests

Required narrow tests before full repo proof:

- parser accepts `--parallel`, `--parallel --jobs=auto`, `--parallel --jobs=8`;
- parser strips the leading `--` separator passed by `deno task test -- ...`;
- root task accepts `--help` and returns help without running packages;
- parser rejects `--jobs=8` without `--parallel`;
- root wrapper injects `--parallel` by default unless an explicit `--parallel` flag is present;
- parser rejects non-positive and non-integer job values;
- parser rejects unknown flags before running packages;
- auto jobs resolver clamps unknown and known hardware counts;
- scheduler runs independent packages concurrently in fake-worker tests;
- scheduler waits for dependency package completion before dependent launch;
- scheduler stops launching new packages after failure;
- scheduler awaits in-flight packages after failure;
- scheduler marks unstarted packages blocked after fail-fast;
- deterministic failure selection follows graph order;
- result package rows remain graph ordered;
- formatter displays strategy and resolved jobs;
- progress frame renders counts, done percent, and active grid deterministically at fixed widths;
- final package table is one-space indented.

Final narrow proof completed:

```sh
deno fmt --check -- -scripts/task.test.ts -scripts/-test/-task.test.test.ts code/sys/workspace/src/m.run/u.reporter.ts code/sys/workspace/src/m.run/-test/-u.reporter.test.ts
deno check --config deno.json ./-scripts/task.test.ts ./-scripts/-test/-task.test.test.ts
deno test -P=test ./-scripts/-test/-task.test.test.ts
cd /Users/phil/code/org.sys/sys/code/sys/workspace && deno task test --trace-leaks ./src/m.run/-test/-u.reporter.test.ts
```

Earlier implementation proofs covered parser, jobs, scheduler, worker, reporter, root wrapper, and
DSL/help tests. The final proof focused on the last changed root-wrapper and reporter seams.

Recommended full regression before or after landing remains:

```sh
cd /Users/phil/code/org.sys/sys && deno task test:seq
cd /Users/phil/code/org.sys/sys && deno task test -- --jobs=auto
```

`test:seq` protects the serial baseline. The default-root run exercises the parallel topological
route and result truth.

## Non-goals

- Do not replace Deno's workspace task runner globally.
- Do not parallelize inside individual package test suites.
- Do not make parallel the `Workspace.Run.test()` semantic API default without a separate design
  pass.
- Do not add a full-screen TUI.
- Do not change package graph generation.
- Do not optimize `code/sys.driver/driver-vite` inside this feature.

## Resolved and deferred design answers

- Parallel captured output prints for failed packages only; skipped packages do not get grouped
  output.
- `--jobs=1 --parallel` is allowed as scheduler proof and debugging.
- `check` and `dry` did not gain parallel strategy in this feature.
- `deno task test -- --help` is supported by the root task wrapper before running packages.
- Native `deno task --jobs` is not the source of truth for this feature.
- The reporter owns terminal progress and redraw lifecycle behind an isolated seam.
- Saturating scheduling is deferred and must be explicit if introduced later.
