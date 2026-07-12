# Workspace test runner progress telemetry plan

- [x] 833371b7f refactor(workspace): extract test-runner progress model from terminal reporter
- [x] 22ebcc798 feat(workspace): collect capability-tagged native test stats
- [x] 1030d433e refactor(workspace): split test runner stats and strategy modules
- [x] 24c7adee3 feat(workspace): render observed test stats in runner and summary output
- [x] f0f136aa3 fix(workspace): group rendered test runner counts
- [x] 3f64ec4dc docs(workspace): document native runner telemetry boundaries

## Status

Complete. Historical planning note only; not an API source of truth.

This plan follows the current `@sys/workspace` runner truth and keeps Deno's native test runner as
the execution substrate. The goal is an exoskeleton around a stable core, not a replacement runner
and not a pretty-output parser hidden inside scheduler logic.

## Direct answer on Deno intent

There is no evidence in the inspected public CLI surface that Deno exposes a stable JSON or event
reporter for `deno test`.

Observed on Deno `2.9.1`:

```text
--reporter <reporter>  possible values: pretty, dot, junit, tap
```

`--help=full` shows the same reporter set. There is no visible unstable JSON/event reporter flag.

Do not claim a Deno Inc design rationale without primary-source evidence. The defensible claim is:
Deno's stable public contract currently exposes human-oriented output plus standard interchange
formats, not a structured live event stream. That may be an intentional product boundary, a
prioritization gap, or both. Treat it as a substrate fact, not a moral judgment.

BMIND read: this is not chiefly a missing flag problem. It is a boundary problem. Deno owns test
execution; `@sys/workspace` owns workspace scheduling, progress truth, and operator legibility.

## Current code truth

### Public runner entry

- `code/sys/workspace/src/m.run/m.Run.ts` exposes `WorkspaceRun.check`, `dry`, and `test`.
- `code/sys/workspace/src/m.run/u.run/u.main.ts` resolves the workspace graph, creates the run plan,
  and dispatches to sequential or parallel strategy.

### Sequential strategy

- `code/sys/workspace/src/m.run/u.run/u.sequential.ts` runs packages in graph order.
- It calls `runPackage(..., stdio: 'inherit')`.
- Child `deno task test` output is live because the child owns the terminal.
- `@sys/workspace` receives only the final package status and elapsed duration.

### Parallel strategy

- `code/sys/workspace/src/m.run/u.run/u.parallel.ts` performs topo-frontier scheduling.
- It emits scheduler events: `start`, `skip`, `finish`, `block`, `done`.
- It calls a buffered worker by default.
- Buffered worker calls `runPackage(..., stdio: 'buffered')`.

### Package process boundary

- `code/sys/workspace/src/m.run/u/u.worker.ts` owns package command resolution and subprocess
  execution.
- `stdio: 'inherit'` uses `Process.inherit`.
- `stdio: 'buffered'` uses `Process.invoke({ silent: true })`.
- Buffered mode captures stdout/stderr only after the child exits.

### Reporter truth

- `code/sys/workspace/src/m.run/u/u.reporter.ts` owns both progress state and terminal rendering.
- Current live truth is package-level:
  - runnable package total;
  - pending packages;
  - currently running package paths and elapsed time;
  - passed, failed, skipped, and blocked package counts;
  - recent completed package rows with elapsed time;
  - grouped failed package stdout/stderr after completion.
- It does not receive Deno test-case events.

### Test task instrumentation boundary

`code/sys/workspace/src/m.run/u.testStats/` owns native test stats collection:

- `u.classify.ts`: strict native `deno test ...` task classifier;
- `u.junit.ts`: JUnit parsing through `@sys/std/xml`;
- `u.report.ts`: run-scoped temp report lifecycle and command instrumentation.

Most current package `test` tasks are direct native commands such as `deno test -P=test`, sometimes
with paths or flags. These are instrumentable by appending native Deno report flags.

Not every package task is that simple. Examples inspected:

- `@sys/driver-stripe` has a composite `test` task chaining `check`, unit tests, build, and dist
  tests.
- `@sample/proxy` uses `true`.
- `@tdb/slc-fs` uses `echo no-op`.

Therefore stats collection must be capability-based per package. A package result can have native
stats observed, unavailable, or unsupported. Unsupported packages still count as package runs; they
must not be silently treated as zero-test packages.

## Deno native runner evidence

### Stable reporters

Native stable reporters are:

- `pretty`: human live output, includes test and step names and timings, but not structured.
- `dot`: compact human output.
- `tap`: structured-ish line protocol for completed tests/subtests, no timings in the observed
  output.
- `junit`: XML final report with counts and timings, not live progress.

### JUnit probe notes

`--reporter junit` emits XML with `tests`, `failures`, `errors`, and `time`, plus `testcase` timing.
For BDD tests, Deno reports a mix of top-level test and step cases, with classnames such as local
files, `ext:cli/40_test.js`, and `@std/testing` internals. Useful, but it needs normalization before
it becomes a clean `@sys/workspace` signal.

### Consequence

The native runner can give final test metadata with caveats. It does not give a clean live event
stream that can truthfully power "currently running test case" across package subprocesses.

## Design stance

### Principle

Keep three planes separate:

```text
scheduler truth → package progress model → optional native-test report facts
```

Do not let optional test-report parsing drive scheduling. Do not make parsed Deno output a hidden
source of truth for package status. The scheduler remains authoritative for package lifecycle.

### Stats target

The acceptable end state is package-first output with truthful native test stats where Deno gives us
a clean final report.

Final summary target:

```text
Workspace tests done in 8m
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 status       success
 task         test
 ran          51
 skipped      0
 failed       0
 tests        7,842 observed
 test failed  0
 reports      49/51

package                              status   tests   failed   elapsed
code/sys/types                       ok       64      0        253ms
code/sys.dev                         ok       —       —        123ms
code/sys/crdt                        ok       42      0        246ms
code/sys/std                         ok       812     0        24s
```

`tests` means native report test cases observed from Deno's structured report output. It is not a
new semantic ontology and it does not pretend to distinguish Deno top-level tests, BDD `it` steps,
and nested test steps unless Deno reports those as distinct structured facts. If that distinction is
needed later, add explicit columns such as `tests` and `steps` only after the substrate supports it
cleanly.

`reports` is required whenever any package lacks native stats. A successful no-op or unsupported
composite package must display `—`, not `0`, and the summary must make the observed denominator
plain.

Live runner target:

- Preserve the package scheduler line as the primary live truth.
- Add observed native stats only from completed package reports.
- Do not show a workspace-wide native test total while packages are still running unless it is backed
  by already-observed reports.
- Completed tick rows may show compact native stats when width allows, for example
  `✓ code/sys/crdt 310ms · 42 tests`.
- A running package row may show elapsed package time, but not an invented internal test count.

### Honest capability matrix

| Signal | Clean now | Clean incremental | Notes |
| --- | --- | --- | --- |
| Package total | yes | yes | Already known from run plan. |
| Package running live | yes | yes | Scheduler event truth. |
| Package elapsed live | yes | yes | Reporter state. |
| Package final elapsed | yes | yes | `Package.Ran.elapsed`. |
| Failed package output | yes | yes | Buffered stdout/stderr after failure. |
| Native test-case total final | no | yes, when instrumentable | JUnit report can provide observed cases. |
| Native test-case failures final | no | yes, when instrumentable | JUnit report can provide failures/errors. |
| Native test-case timing final | no | yes, when instrumentable | JUnit testcase timings are available with normalization caveats. |
| Native report coverage | no | yes | Summary must show observed reports over runnable packages. |
| Test-case running live | no | no clean path | Pretty parsing would be brittle. |
| Test-case live progress count | no | later, limited | TAP can emit completed tests, but no known total until completion. |

## Architecture direction

### Target shape

```text
m.run/
  t.ts                         public contracts
  u/u.run.parallel.ts          scheduler events only
  u/u.run.sequential.ts        scheduler events only
  u/u.progress.ts              reducer: events → snapshot
  u/u.reporter.ts              terminal adapter: snapshot → spinner text
  u/u.worker.ts                package process boundary
  u/u.test-stats.ts            package stat availability and aggregation
  m.deno-test/
    t.ts                       native report facts, capability tags
    u.instrument.ts            task instrumentation classifier
    u.junit.ts                 final XML facts, preferred first source
    u.tap.ts                   completed-line facts, optional later source
```

Names are provisional. Do not scaffold until implementation begins and names are reviewed.

## Implementation phases

### Phase 0: protect current behavior with characterization tests

Goal: freeze the useful baseline before moving seams.

- Keep current parallel reporter output behavior intact.
- Add tests that describe the current event-to-frame behavior as package-progress semantics, not
  terminal-spinner mechanics.
- Confirm non-TTY reporter remains low-noise.

Acceptance:

- Existing `m.run` tests pass.
- Current final summary shape remains unchanged.
- Current failed-output grouping remains unchanged.

### Phase 1: extract progress model from reporter rendering

Goal: separate truth accumulation from terminal presentation.

- Introduce a package-level progress snapshot type.
- Move mutable reporter counters into a reducer/model helper.
- Keep `createParallelReporter` as a thin terminal adapter.
- Do not add Deno test parsing in this phase.

Acceptance:

- Unit tests can feed scheduler events and assert snapshots without spinner setup.
- Terminal frames match current output for the same snapshots.
- No child-process behavior changes.

### Phase 2: make scheduler event contracts explicit

Goal: stop treating event types as reporter-private detail.

- Promote package scheduler events into the `WorkspaceRun` type spine if they cross module seams.
- Keep the event contract package-level and scheduler-owned.
- Consider sequential strategy event emission if a shared progress view is useful there.

Acceptance:

- Parallel runner and reporter share the same typed event contract.
- Sequential strategy can remain inherited-stdio until a concrete need exists.
- No public API claims native test-case telemetry.

### Phase 3: type the stats contract

Goal: make availability and absence impossible to confuse.

- Add a package stats type with explicit variants, for example `observed`, `unavailable`, and
  `unsupported`.
- Add stats to `Package.Ran` only when the task is `test`; keep non-test tasks unaffected.
- Define aggregate stats helpers in one place rather than counting in formatters.
- Preserve package result compatibility for callers that do not care about native stats.

Acceptance:

- A package with no report is distinguishable from a package with zero tests.
- Aggregates can express `observed`, `failed`, and report coverage.
- Existing non-test task result shapes remain boring and stable.

### Phase 4: add capability-tagged native stats adapter

Goal: harvest native final facts without pretending they are live events.

Preferred first source: JUnit final report written with `--junit-path`. This preserves normal pretty
stdout for failed-output grouping while giving the runner a structured final artifact.

- Classify each package `test` task before instrumentation.
- Instrument only simple native `deno test ...` tasks by appending a per-package `--junit-path`.
- Write JUnit files into a run-scoped temp directory, not package roots.
- Use collision-safe per-package artifact names.
- Cleanup temp report artifacts after parsing; cleanup failure should warn or be ignored, not fail an
  otherwise valid package run.
- Leave composite, no-op, or unknown task shapes uninstrumented and mark stats unavailable.
- Parse final XML into capability-tagged facts.
- Keep package success/failure authoritative from process status.

Potential facts:

- package test stats observed: yes/no;
- observed native testcase total;
- failures/errors;
- testcase names for failures;
- testcase durations and slowest cases;
- report parser warnings;
- unavailable reason when stats cannot be observed.

Acceptance:

- Instrumentation classifier tests cover simple `deno test`, path-scoped `deno test`, composite
  tasks, no-op tasks, and unknown commands.
- Parser tests use small XML fixtures and real Deno-generated samples.
- Temp artifact tests prove reports do not accumulate in package directories.
- Unsupported packages display `—` and increment the missing-report denominator.
- If report parsing fails, package status remains usable and the parser warning is explicit.

### Phase 5: optional TAP completed-event adapter

Goal: evaluate whether TAP can improve live completed counts without brittle pretty parsing.

This is not needed for the first acceptable stats pass. If it becomes valuable, decide the process
streaming primitive first so `@sys/workspace` does not bypass `@sys/process`.

Current `@sys/process` options:

- `Process.invoke`: buffered result after completion.
- `Process.inherit`: live terminal output, no structured data capture.
- `Process.capture`: bounded capture with status, no live event callback.
- `Process.spawn`: live stdout/stderr events, but not shaped as a run-and-return-status primitive.

If live child-output parsing is needed, first decide whether `@sys/process` should grow a small
streaming run primitive or whether `Process.capture` should accept an output callback.

Acceptance:

- TAP parser is line-oriented, bounded, and covered by fixtures.
- Capability tags state what was observed and what was unavailable.
- The terminal reporter remains package-first.
- No raw `Deno.Command` process orchestration is embedded in `@sys/workspace`.

### Phase 6: split internal runner modules after stats collection lands

Status: landed in `1030d433e refactor(workspace): split test runner stats and strategy modules`.

Goal: reduce file size and make the next rendering pass easier without mixing factoring churn into
stats collection.

Current shape:

```text
src/m.run/
  u.run/
    mod.ts
    u.main.ts
    u.parallel.ts
    u.sequential.ts
  u.testStats/
    mod.ts
    u.classify.ts
    u.junit.ts
    u.report.ts
```

Notes:

- Prefer `u.run/` and `u.testStats/` as sibling utility namespaces under `m.run/`, not nested
  `u/u.run/*` or ambiguous `u.test/*` directories.
- Keep `m.testing` out of this refactor. That module is public workspace-structure test helpers,
  not runner-native Deno test telemetry.
- Preserve public imports through `m.run` surfaces; this should be an internal movement/refactor.
- Keep `u.testStats/mod.ts` as the small public adapter/facade for the runner.
- Split concerns as:
  - `u.classify.ts`: task classifier;
  - `u.junit.ts`: JUnit parsing;
  - `u.report.ts`: temp artifact/report lifecycle;
  - `mod.ts`: public adapter types and composition.

Acceptance met:

- No behavior change from the stats collection commit.
- Existing stats, progress, reporter, sequential, and parallel tests pass.
- Imports remain layer-honest and use local `common.ts` lanes.

### Phase 7: operator UX integration

Goal: add useful stats without noise.

Final summary additions:

- Add `tests`, `test failed`, and `reports` rows to the summary when native stats collection is
  enabled or observed.
- Add `tests` and `failed` columns to package rows when any package has native stats.
- Use `—` for unavailable per-package stats.
- Keep package `ran`, `skipped`, and `failed` rows because package execution remains the primary
  truth.

Live runner additions:

- Keep `✓ n/total passed`, running, pending, skipped, blocked, and failed as package counts.
- Optionally add compact completed-package stats when width allows.
- Optionally add an aggregate `tests observed` metric sourced only from completed native reports.
- Never show an all-workspace native test total while packages are still running unless that number
  comes from observed reports.

Acceptance:

- Default output stays Tuftean and scanable.
- The final summary never treats unavailable stats as zero.
- The summary reports observed native stats denominator when any package lacks a report.
- Wide workspace runs remain readable.

## Non-goals

- Do not replace Deno's native test runner.
- Do not parse `pretty` output in core scheduler logic.
- Do not mix native Deno `--parallel` semantics with `@sys/workspace` graph scheduling.
- Do not make test-case telemetry a dependency of package scheduling.
- Do not hand-roll subprocess orchestration when `@sys/process` should own the primitive.

## Resolved first-pass decisions

- Enable native stats by default for instrumentable simple native `deno test` package tasks in the
  workspace test runner.
- Use JUnit `--junit-path` as the first stats source because it preserves normal stdout/stderr while
  emitting a stable CI-interchange artifact.
- Store JUnit artifacts in a run-scoped temp directory and lifecycle-own cleanup.
- Treat one JUnit `<testcase>` as one observed native test case.
- Do not rely on `DOMParser` for JUnit parsing; the workspace package test profile does not expose
  that global. Use the canonical `@std/xml` parser and keep the adapter constrained to JUnit facts.
- Use `tests` as the operator-facing short column label, with `reports` making availability explicit.
- Do not normalize BDD top-level tests versus steps in the first pass; that distinction is not cleanly
  available from the stable native contract.
- Do not add an `@sys/process` streaming primitive for the first stats pass.

## Deferred decisions

- Whether TAP streaming earns a second pass for completed-live test counts.
- Whether a later Deno release exposes a cleaner event or JSON reporter that should replace JUnit
  parsing.
- Whether richer vocabulary such as `tests` plus `steps` becomes useful after the substrate supports
  it cleanly.

## Final reality

This arc is complete through `3f64ec4dc docs(workspace): document native runner telemetry
boundaries`.

The runner now keeps package-level scheduler progress as the live source of truth and renders native
Deno test stats only as capability-tagged observed final facts. Unsupported, unavailable, skipped, or
blocked package stats render as `—`, not zero. Human-facing count output is grouped for scanability.

Commit-message queue: retired. No active follow-up commit message remains.

Landed messages:

- `fix(workspace): group rendered test runner counts` landed as `f0f136aa3`.
- `docs(workspace): document native runner telemetry boundaries` landed as `3f64ec4dc`.
