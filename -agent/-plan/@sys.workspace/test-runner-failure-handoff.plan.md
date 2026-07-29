test-runner-failure-handoff.plan.md
- [x] 60c10bcbd refactor(workspace): isolate failed package diagnostics
- [x] 71d1698c3 fix(workspace): continue parallel tests after package failures
- [x] 6bbb615de feat(workspace): add actionable workspace test failure handoff
- [x] b26c60bd1 feat(workspace): render completed tests as a live recency window
- [x] f8775f9d9 feat(workspace): fit parallel test screen to the terminal viewport
- [x] 35806950a fix(workspace): streamline parallel test completion
- [x] 8131b42b5 refactor(workspace): split run formatters by responsibility
- [x] 234271ba8 docs(workspace): align test runner guidance with final handoff
- [x] 7fbe8dff0 feat(workspace): preserve package names in run results
- [x] f86a5b245 fix(workspace): stabilize parallel test progress handoff
- [x] c29462c7a refactor(workspace): group parallel reporter modules
- [x] ac6e472761 test(cli): add scoped spinner factory stubbing
- [x] 6ae1ec804 fix(workspace): clarify collected report summary
- [x] 8150b5102 fix(workspace): color final handoff outcome
- [x] 603077d38 fix(workspace): anchor live failure actions to viewport
- [x] de4718fa6 fix(workspace): fit running jobs across available width
- [x] 1d32b2b2f fix(workspace): wrap handoff statistics at semantic boundaries

## Conditional CLI viewport-session arc

Checkpoint resolved after Workspace commit 4 and before commit 5.

- [x] Compared the Vite lifecycle with the proposed Workspace lifecycle for a materially identical
      domain-free kernel.
- [x] Decision: no shared lifecycle extraction is earned before Commit 5; proceed with
      Workspace-local composition over canonical CLI primitives.
- [x] Reason: Vite owns long-lived `startup → ready → disposed` phases, content/layout invalidation
      classes, keyboard actions, and split spinner/repaint behavior; Workspace owns one finite
      `active → stopped` phase, complete-frame invalidation, scheduler events, elapsed ticks, and
      final handoff transfer. Abstracting those differences now would add policy callbacks rather
      than remove a stable common mechanism.
- [x] Revisit extraction only after both domain runtimes exist and a smaller exact mechanism
      independently simplifies each without carrying Vite/Workspace phases, layout, clearing,
      spinner, or final-output policy.

Durable landed prerequisites:

- [x] 777afd0d8 `feat(driver-vite): fit dev screen rendering to the terminal viewport` — lands the
      declared stdout-targeted `Cli.Spinner` capability and calibrated Vite viewport consumer.
- [x] d325aae92 `feat(cli): repaint terminal frames without blanking` — lands canonical stdout frame
      replacement, including deterministic empty-frame clearing.
- [x] 9588b4e45 `fix(driver-vite): avoid clear-before-render dev frames` — records the final Vite
      lifecycle calibration that Workspace must not regress or generalize wholesale.

Never import or generalize `DevScreenRuntime` or `DevScreenLayout` as units.

## Current implementation status

- Commit 1 is landed as `60c10bcbd`.
- Commit 2 is landed as `71d1698c3`.
- Commit 3 is landed as `6bbb615de`; focused proof is green, and a real interactive root run
  confirms the immediate minimal rerun index persists while later packages continue.
- Commit 4 is landed as `b26c60bd1`; focused leak-traced reporter/progress, full `m.run`,
  help-bundle parity, formatting, diff, and Workspace type-check proof was green before landing.
- Commit 5 landed as `f8775f9d9`: root interactive clearing, pure width/height layout, retained
  viewport projection, exact resize adoption, coalesced redraw, stdout spinner ownership,
  transactional cleanup, and one persisted final frame are now repository history.
- Current source now contains both final Commit 5 presentation refinements: one shared `... +N more`
  continuation grammar across bounded test-runner lanes, plus one full-width result-colored
  `Cli.Fmt.hr` beneath the final handoff title. It also removes the grid-only partial-running
  fallback in favor of grid + summary, reduced detail, summary-only, or omission.
- Those refinements are implemented and accepted for Commit 5: a named local tone contract uses
  exhaustive dispatch; exact all-lane text/style assertions cover hidden-set-only completion tone,
  every running fallback tier, styled/stripped cell-width parity, and byte-identical spinner/repaint
  transport.
- When a detail section cannot fit truthfully, the terse status remains aggregate truth whenever the
  viewport can fit it; below that lies an explicit physical-impossibility boundary, not permission
  to show an unexplained subset.
- Commit 5's final post-TMIND proof was green: focused handoff/layout/runtime/reporter tests passed
  82 steps; full leak-traced `m.run` passed 134 steps; root presentation passed 9 steps; help/bundle
  parity passed 13 steps; the full Workspace package passed 403 steps; Workspace check, focused
  lint, formatting, and commit diff checks passed; and the workspace-wide dry run passed all 53
  packages. Tests are grouped by semantic contract, redundant assertions were removed, output
  ownership and screen lifecycle are distinct DSL sections, shared cleanup/continuation helpers have
  focused internal modules, and reporter Screen/dependency test construction has one fixture
  authority. A real PTY accepted `100x18 → 40x8 → 64x12 → 100x18`, stayed bounded, and reproduced
  the original frame byte-for-byte on expansion.
- The conditional viewport-session checkpoint is resolved: no shared CLI lifecycle extraction is
  earned now, and all required CLI/Vite prerequisite capabilities are landed.
- The post-Commit5 completion follow-up landed as `35806950a`: the reporter-owned persisted-frame
  receipt preserves omitted reruns, the interactive footer avoids visible duplication, and operator
  report language is now collected/unavailable/not applicable.
- The DMIND completion-column follow-up landed as `f86a5b245`. It replaces flashy row-major
  alternation with a column-major live projection while retaining scheduler-event recency and bottom
  overflow truth.
- The run formatter split landed as `8131b42b5`; formatter responsibilities now live under
  `m.run/u.fmt/` behind the unchanged `WorkspaceRun.Fmt` surface.
- Commit 6 landed as `7fbe8dff0`: authoritative manifest names now flow through run-result truth,
  running/completed projections, concise result tables, and failure headers while exact reruns and
  full diagnostic locations retain workspace paths.
- Final test-runner guidance landed as `234271ba8` before Commit 6 and remains aligned with the
  completed handoff contract.
- The post-identity residue pass landed across `f86a5b245` and `c29462c7a`: active viewport
  budgeting, exhaustive scrollback, shared grid geometry, runtime ownership, and reporter creation
  now live behind `m.run/u.reporter/mod.ts`. It preserves the independent test row-count oracle and
  every existing width, ordering, overflow, color, and receipt contract.
- Scoped spinner-factory testing landed as `ac6e472761`: `FakeSpinner.create()` remains pure while
  `FakeSpinner.stub()` owns deterministic call capture and exact lexical restoration for both
  Workspace consumers.
- Collected-report grammar landed as `6ae1ec804`: the final handoff now renders grammatical
  count-aware phrases such as `1 report collected` and `49 reports collected`.
- Semantic final-handoff coloring landed as `8150b5102`: result-derived green/red marks outcome
  tokens, remaining statistics stay white, and separators stay gray without changing copy or width.
- Failure-footer anchoring landed as `603077d38`: visible live repair actions occupy stable bottom
  rows through exact internal spacer materialization while no-failure frames remain compact.
- Running-grid width fitting landed as `de4718fa6`: bounded running jobs use the greatest complete
  measured cell fit, reduce columns before ellipsizing, and leave unbounded/completed/final grids
  unchanged.
- Semantic handoff wrapping landed as `1d32b2b2f`: statistics wrap only at gray separator boundaries,
  capability phrases remain intact, and capability states stay grouped when the measured width
  permits.
- The arc is complete. A real interactive root run confirms the integrated operator surface: live
  aggregate truth, running context, exhaustive graph-ordered completion projection, semantic
  failure rows, and bottom-anchored exact reruns coexist within the owned viewport.

## Position

Treat the root parallel test command as two consecutive but distinct presentation phases:

1. **live progress** answers both what is happening now and, minimally, what has already failed and
   how to rerun it immediately;
2. **final handoff** confirms the completed outcome and preserves the same minimal repair index for
   interactive output or full diagnostics for logs.

The live reporter must not make the operator wait for the whole workspace before exposing an
actionable package rerun. Its active frame includes a minimal live failure footer beneath the
elastic running/completed region and anchors that footer to the viewport bottom when it fits. That
footer is not a diagnostic breakdown: it contains only package identity, observed failed-test count
or exit/signal fact, and the exact package-local rerun.

The target is a viewport-aware live dashboard with immediate minimal repair actions, followed by one
deterministic final handoff. It is not a general terminal UI framework and it is not an interactive
test watch mode.

## Target operator experience

### Interactive success

The root parallel test task clears an interactive terminal once and renders bounded live progress.
On completion it transfers every completed row to ordinary scrollback, then leaves a concise final
success footer.

```text
✓  @sys/esm 132 tests, 6s                   ✓  @sys/schema 65 tests, 3s
✓  @sys/markdown 44 tests, 5s               ✓  @sys/testing 189 tests, 12s
✓  @sys/yaml 259 tests, 7s                  ✓  @sys/driver-process 73 tests, 5s

Workspace tests done in 22s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6 packages · 762 tests · 6 reports collected
```

### Interactive failure while the run continues

As soon as a package finishes unsuccessfully, record its row in the completed-results recency stream
and render one durable minimal repair footer anchored at the bottom of the owned live viewport.
Remaining packages continue to run. As newer completions arrive, the completed row may age into
truthful overflow; completed detail fills downward through the elastic middle while the separate
repair footer remains stable and actionable.

```text
✕  @sys/crdt 3 tests, 2 failed, 225ms        ✓  @sys/web 2 tests, 442ms
✓  @tdb/slc.fs —, 26ms                       ✓  @sys/dev 0 tests, 112ms
✓  @sys/types 61 tests, 247ms

✕ @sys/crdt · 2 failed tests
  rerun: deno task --cwd ./code/sys/crdt test
```

The live index never renders failed-case identities, assertion messages, output excerpts, stdout, or
stderr. Those details belong in log/full output or the package-local rerun.

### Interactive failure after completion

Final screen output expands every completion and repair item into ordinary scrollback. The compact
footer then remains minimal without repeating the visible rerun:

```text
✕  @sys/crdt 3 tests, 2 failed, 225ms        ✓  @sys/web 2 tests, 442ms
✓  @sys/types 61 tests, 247ms

✕ @sys/crdt · 2 failed tests
  rerun: deno task --cwd ./code/sys/crdt test

Workspace tests failed in 17s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3 ran · 1 failed · 66 tests · 3 reports collected
```

Concise running, completed, repair, and result-table rows use authoritative manifest package names.
Exact reruns, sequential execution logs, full failure details, and grouped output retain workspace
paths. Internal direct-render snapshots defensively fall back to path when no name is supplied;
valid run results require names.

### Non-interactive output

Non-interactive and redirected output is never cleared, never animated by this plan, and never
depends on keyboard input. It emits:

1. deterministic run context;
2. the compact handoff;
3. complete buffered output for failed packages.

CI must retain at least the diagnostic fidelity it has today.

## Baseline reality before implementation

### Process owner

`-scripts/task.test.ts`:

- parses root test arguments;
- defaults to the parallel strategy;
- invokes `Workspace.Run.test(args)`;
- prints `Workspace.Run.Fmt.result(result)`;
- sets `Deno.exitCode`;
- arms completion-hang diagnostics.

It does not currently establish an explicit terminal presentation mode or clear the terminal.

### Live reporter

`code/sys/workspace/src/m.run/u/u.reporter.ts`:

- owns the live spinner and progress model;
- formats running and recently completed package grids;
- stops on the scheduler `done` event;
- then directly emits `formatFailedOutput(event.result)`.

This unbounded post-`done` stream emission crosses the boundary from live progress into final
diagnosis. Removing it must not remove the separate requirement for a bounded, minimal live failure
index inside active progress frames.

### Final formatter

`code/sys/workspace/src/m.run/u.fmt/`:

- exposes the formatter facade from `mod.ts`;
- isolates intro, aggregate result, handoff, failure, telemetry, and shared text concerns in narrow
  `u.*.ts` modules;
- formats every package row and repeats the aggregate summary around long package tables;
- keeps grouped failed output with the failure-formatting domain.

The root parallel dashboard already presents completed package rows, so printing the complete
package table afterward duplicates the least useful information while pushing repair facts away from
the stopping point.

### Failure facts already available

Each failed `WorkspaceRun.Package.Ran` already carries:

- package path;
- exit code or signal;
- elapsed time;
- buffered stdout and stderr in parallel mode;
- native JUnit stats when instrumentation is supported.

Observed JUnit stats already carry exact failed-case identities and messages through
`testStats.failedCases`.

The scheduler may observe more than one failed package because every selected package continues to a
terminal result after earlier failures. The compact handoff must therefore derive failures from all
failed `result.packages`, not only `result.failure`.

Failed packages remain visible through the durable live failure index while later packages continue.
Their completed rows follow the same recency policy as other terminal results rather than being
permanently pinned in the grid. Blocked outcomes, when present in an externally supplied result,
remain aggregate context rather than repair items.

## Canonical viewport reality inherited from Driver Vite

The finalized Vite viewport work establishes shared CLI substrate and reusable invariants, not a
reusable Vite renderer.

Workspace already consumes the canonical cell-aware `Cli.Fmt.Text.Width.*` surface. Continue using
it for every measurement, pad, fit, wrap, and clip decision.

The remaining shared reality that applies here is:

- `Cli.Screen.size()` supplies one explicit initial `{ width, height }` viewport;
- one `Cli.Screen.events(until).resize$` subscription supplies exact accepted `event.after`
  snapshots;
- each render consumes one immutable viewport rather than measuring ambient width in several
  helpers;
- `Cli.Spinner` has a declared stdout target so measurement, writes, Ora, and repaint ownership
  share one stream;
- viewport shrink changes projection, not retained progress state;
- total active-frame rows include spinner/cursor cost and remain height-bounded;
- acquisition and disposal of resize events, subscription, scheduler, and spinner are transactional
  and exact-once;
- runtime code uses only declared spinner members.

Do not import, expose, or extract `DevScreenRuntime` or `DevScreenLayout` as units. Those are
package-private Vite domain implementations with startup/ready, process-log, and keyboard
responsibilities the finite test runner does not share. A smaller domain-free viewport-session
kernel is allowed only when the top-level extraction checkpoint proves it materially identical and
simplifying in both consumers.

Semantic DRY here means common primitives and common invariants with domain-local composition unless
that smaller kernel is empirically earned. It does not mean forcing both reporters through a
premature generic terminal-renderer framework.

Hard prerequisites were satisfied before Commit 5 implementation: the Vite viewport arc's narrow
`CliSpinner.Create.Options` stdout-target capability landed, and the top-level extraction checkpoint
resolved against premature sharing. Workspace must continue consuming that capability rather than
recreating or bypassing it.

## BMIND → DMIND → TMIND continuation-summary review

### First-principles subject

This line is not trailing prose. It is compact projection metadata at the boundary between visible
and retained content. In one scan it must communicate that content is omitted, the quantity is
additional, and the hidden set still carries semantic state.

The durable design separates four layers:

1. retained state owns the complete ordered facts;
2. projection chooses visible and hidden sets without mutation;
3. one formatter maps a positive hidden count, semantic tone, and qualifier to notation;
4. spinner/repaint transport preserves the resulting styled frame byte-for-byte.

The formatter never selects items, derives severity, measures the viewport, or owns indentation.
That separation keeps copy and color changes incapable of corrupting count arithmetic.

### Exact rendered grammar

Canonical suffix payloads are shown below without indentation; every section caller prepends exactly
two ASCII spaces:

```text
... +12 more
... +3 more running
... +1 more failed package
... +2 more failed packages
... +4 more failed tests
```

Rules:

1. Use three ASCII periods: `...`. This decision applies only to bounded continuation summaries; it
   does not redefine canonical path or text ellipsization elsewhere in the frame.
2. Use exactly one ASCII space between `...` and `+N`, and one between `+N` and `more`. The logical
   string must never contain `...+N`, `...and N`, or the single Unicode ellipsis glyph in this lane.
3. Treat `+N` as one atomic styling token, not an unbreakable terminal token. The plus sign, every
   digit, and any deterministic grouping separators receive the same semantic color and italic
   treatment; natural terminal wrapping remains allowed at physically tiny widths.
4. Keep the two-space leading indent unstyled. Compose the suffix from three independently styled
   fragments: a muted gray italic prefix containing `...` plus one trailing ASCII space; a
   semantic-color italic `+N`; then a muted gray italic tail beginning with one ASCII space before
   `more[ qualifier]`. Fragment-local styling prevents ANSI reset bleed across boundaries.
5. Use canonical color composition (`color(italic(token))`) and existing `c` helpers. Never write or
   compare hand-authored escape bytes.
6. The completed continuation derives the `+N` tone from the hidden set only: red when any hidden
   completion failed, otherwise yellow when any hidden completion is blocked or skipped, otherwise
   green. Visible-item or progress-rule severity must not leak into this decision.
7. The running continuation uses cyan. Hidden failed-package and hidden failed-test summaries use
   red. Tone dispatch must be exhaustive over the local union; no catch-all may silently turn a
   future tone into an existing semantic color.
8. Color is redundant signal, never the sole carrier of meaning. ANSI-stripped output retains the
   plus sign, exact count, `more`, and the applicable qualifier.
9. Preserve deterministic count rendering already owned by each caller. Callers pass an unpadded
   qualifier (`running`, `failed package(s)`, or `failed test(s)`), and the helper alone owns the
   separating space. Preserve exact singular/plural grammar and no trailing punctuation. Never
   render a zero or negative continuation count.
10. ANSI styling must not affect cell measurement, row budgeting, truncation, or
    `visible + hidden = retained` arithmetic.

### Projection truth under pressure

Every rendered partial projection must account for every retained item:

- completed: `visible completed + hidden completed = retained completed`;
- running: `visible running + hidden running = current running`;
- live failures: `visible failure actions + hidden failure actions = retained failed packages`;
- full failure details: `visible failed cases + hidden failed tests = observed failure truth`.

The running lane requires an explicit correction during this refinement. When all running items do
not fit, a grid-only fallback is forbidden. Try richer context first, then drop context, then reduce
visible rows until grid plus suffix fits, then render a suffix-only summary with the full running
count. If even that suffix cannot fit, omit the running section rather than show an unexplained
subset; the terse status remains the aggregate source when its shortest truthful metric fits. The
same physical-impossibility rule applies to completed and failure sections. A viewport too small for
the shortest relevant aggregate may omit that fact entirely; the plan must not promise impossible
output.

The shorter notation may legitimately free cells or rows and therefore expose one more retained
item. That is a projection improvement, not reordering: retained identity/order and conservation
must remain unchanged across width/height transitions and repeated renders.

### Ownership and scope

Keep one internal pure `formatContinuationSummary` helper at the run-formatting seam, now isolated
in `m.run/u.fmt/u.continuation.ts`. It receives deterministic count text, one narrow
`'cyan' | 'green' | 'yellow' | 'red'` semantic tone, and an optional already-resolved qualifier; it
returns the unindented suffix. `u.reporter.layout.ts` and the full handoff formatter use that same
grammar while retaining their own projection and severity policies.

This helper is an internal implementation seam only: no public type-plane shape, `WorkspaceRun.Fmt`
member, or generic `Cli.Fmt` API is earned. The layout → formatter dependency means sharing the
exact grammar adds no new dependency direction.

Apply the grammar to all bounded continuation summaries in this test runner:

- hidden running packages;
- hidden completed packages;
- hidden live failed-package actions;
- hidden failed tests in full handoff details.

Including full handoff details removes same-tool residue; the earlier distinction between "layout
metadata" and "diagnostic prose" does not survive BMIND because both lines represent the same
bounded-list continuation concept. Do not alter unrelated path ellipsization or output-excerpt
clipping.

Reject:

- `...and N more`, which reads as sentence residue rather than compact projection metadata;
- `… +N more`, because this surface explicitly chooses ASCII `...`;
- `...+N more`, which collapses omission and quantity into a noisy token;
- a partial grid with no continuation summary;
- all-gray `+N`, which removes semantic color signal;
- recoloring the whole suffix, which makes context compete with the count;
- deriving completed tone from visible or total items rather than the hidden set;
- stripping/rebuilding ANSI between layout, spinner, final-frame persistence, and repaint;
- changing retained selection, ordering, count, or qualifiers as an accidental side effect.

## TMIND review

### Keep

- The topology-safe parallel frontier and job bound.
- Buffered package execution unchanged.
- Structured JUnit facts as the primary source for native test failure summaries.
- The existing width-aware running/completed grid.
- Canonical `Cli.Screen`, `Cli.Fmt.Text`, and stdout-targeted `Cli.Spinner` primitives.
- One domain-local reporter lifecycle for the finite active progress frame.
- Full selected-package execution after failures, with failed actions retained visibly in the
  dedicated live index.
- Full buffered diagnostics in non-interactive output.
- Exact package-local reruns as the fastest repair loop.

### Reject

- Clearing the console inside `Workspace.Run.test` or the scheduler.
- Clearing redirected output, CI output, help output, or sequential runs.
- Calling the live reporter a full-screen TUI; it remains a bounded multiline dashboard.
- Printing buffered failure output from the reporter's `done` event.
- Treating blocked packages as independent failures to fix.
- Guessing a root cause from arbitrary child output.
- Parsing every tool's prose into a synthetic error taxonomy.
- Adding a post-completion keyboard wait to the default test command.
- Reusing Vite's `Shift+I` lifecycle without accounting for the finite test process.
- Adding an alternate-screen buffer; restoring it would remove the useful final handoff.
- Rewriting the scheduler architecture, stats collector, or CLI Screen primitives; failure
  continuation changes only launch and dependency-unlock semantics.
- Importing or generalizing Driver Vite's package-private screen runtime/layout as units.
- Extracting a shared viewport-session kernel before both consumers prove the same domain-free
  mechanism.
- Measuring width and height independently during one frame.
- Keeping Ora on stderr while reporter writes and Screen measurement use stdout.
- Treating viewport shrink as permission to discard completed progress summaries.

### Why the post-run key toggle is deferred

The Vite dev runner is intentionally long-lived, so `Shift+I` can mutate a live screen without
changing process completion semantics.

The workspace test runner is finite. A key toggle available after completion requires one of three
bad defaults:

- hold the failed process open until input arrives;
- linger for an arbitrary timeout;
- exit immediately and make the key unreliable.

None is S-tier behavior for the canonical test command. The first pass must instead make compact
output sufficient and provide an exact package rerun that naturally exposes full package output.

A future explicit inspection/watch mode may earn keyboard controls, but it must be a separately
named lifecycle with deterministic non-interactive behavior. It is not part of this plan's commit
arc.

## Design invariants

### Presentation ownership

1. The root task script owns whether the terminal is cleared and which final formatter is selected.
2. The workspace runner owns scheduling and live progress, not process-level terminal policy.
3. The reporter owns live progress, including the minimal live failure footer anchored beneath the
   elastic running/completed region when failures exist.
4. The final formatter owns post-run presentation and all detailed diagnosis.
5. One failed parallel run produces one final handoff.
6. A failed `finish` event updates the active frame immediately but emits no standalone diagnostic
   block.
7. No failed-case identities, messages, excerpts, stdout, or stderr appear in the live failure
   index.
8. The sequential baseline retains inherited child output and its existing exhaustive result
   formatter.

### Terminal behavior

1. Help never clears the terminal.
2. Sequential mode never clears the terminal because child output is inherited rather than
   screen-managed.
3. Parallel mode clears exactly once only when stdin and stdout are both terminals.
4. Clearing occurs after argument resolution and before graph/loading output.
5. Redirected and CI output is never cleared.
6. One reporter session owns the active progress viewport, resize subscription, redraw scheduling,
   spinner, and exact cleanup.
7. Screen measurement, resize evidence, reporter writes, and Ora target stdout consistently.
8. Every active render consumes one immutable `{ width, height }` snapshot.
9. Resize adopts exact `event.after`; it does not remeasure or compose dimensions from different
   observations.
10. Viewport shrink changes visible projection only and does not delete retained completed
    summaries.
11. The active progress frame budgets spinner/cursor cost and remains bounded by viewport width and
    height.
12. When a live failure footer exists, the active dashboard may consume its full bounded viewport
    capacity and scroll earlier graph/loading prelude lines out of view; preserving absolute
    cursor-Y context is not part of the reporter contract.
13. Exhaustive final completion/repair lists and the root handoff remain in normal terminal
    scrollback.
14. The test command never waits for post-completion keyboard input.

### Failure truth

1. Failed packages are all `ran` package results with `success === false`.
2. The package is always the top-level actionable unit because the rerun boundary is package-scoped.
3. The live index, final screen repair list, and independently actionable compact formatter show
   only package identity, observed failed-test count or exit/signal fact, and exact rerun.
4. Observed failed-test counts are reported without requiring or exposing case identities.
5. Unsupported or unavailable stats never become fictional zero-failure evidence; use exit or signal
   instead.
6. Native failed-case identities, messages, and conservative output excerpts are detailed facts
   reserved for full/log output.
7. Blocked and skipped packages never become repair items.
8. Every failed package gets one exact package-scoped rerun command using Deno's `task --cwd`
   surface rather than shell command chaining.
9. The rerun command derives its final task token from `result.task`; the formatter never hardcodes
   `test`.
10. Rerun paths are workspace-root relative and valid from the same run cwd represented by
    `result.cwd`.
11. Multiple concurrently failed packages remain deterministic in workspace graph order in both live
    and final projections.
12. ANSI is removed before detailed diagnostic selection and reapplied only by the full formatter.

### Bounded output

1. The live failure index, final screen repair list, and compact repair output are single-column at
   every terminal width.
2. Each live/final-screen/compact failed-package item is exactly one fact row plus one rerun row; it
   contains no diagnostic detail rows.
3. Rerun commands wrap but are not semantically truncated.
4. Structured failed cases, messages, excerpts, and buffered output are reserved for explicit full
   detail mode and non-interactive output.
5. Direct compact formatting remains useful even when no structured stats or buffered output exists.
6. Active-frame physical order is status → running packages → completed-results grid → elastic blank
   rows → minimal live failure footer.
7. Height-allocation priority remains status → running packages → live failure footer → completed
   detail, so completed rows contract before an actionable live failure disappears; elastic blank
   rows carry no semantic priority and exist only to bottom-anchor a visible footer.
8. When all live failures cannot fit, show a truthful hidden-package count; final screen scrollback
   then lists every failed package before the compact footer.
9. The completed grid is a recency window: each newly terminal package enters at the top-left,
   existing visible items advance down each column before flowing to the top of the next column, and
   the oldest visible item ages into overflow.
10. The durable failure index, not completed-grid pinning, owns persistent failure visibility;
    failed completed rows obey the same recency policy as successful, skipped, and blocked rows.
11. Timer ticks and resize-only redraws never reorder completions; only terminal package events
    advance the recency window.
12. Completed overflow counts remain truthful even when retained summaries exceed the visible
    viewport.
13. Every bounded continuation summary follows `... +N more[ qualifier]`: muted gray italic framing,
    one semantically colored italic `+N` token, and no loss of count or qualifier truth.
14. A partial running, completed, or live-failure projection never appears without either its exact
    hidden count or a status-level aggregate that makes omission explicit.
15. If a truthful suffix cannot fit, omit that detail section rather than lie with an unexplained
    subset; a viewport smaller than the shortest relevant aggregate is the explicit
    physical-impossibility boundary.
16. Narrowing and shortening never create stale wrapped rows or negative row budgets.
17. When a live failure footer fits, its dashed separator plus visible actions/overflow summary are
    bottom-anchored by exact internal spacer rows; frames without a visible failure footer are not
    padded merely to occupy the viewport.
18. Running-job columns are derived independently from running-item count and measured available
    width; completed active/final column policy remains unchanged.
19. ANSI sequences consume no terminal-cell width and survive spinner, abnormal repaint, and final
    scrollback transport unchanged.

## Target architecture

### 1. Root presentation mode

Resolve one local presentation decision in `-scripts/task.test.ts` after parsing arguments:

```text
parallel-screen
  strategy is parallel
  AND stdin is a terminal
  AND stdout is a terminal

parallel-log
  strategy is parallel
  AND the interactive screen condition is false

sequential
  strategy is not parallel
```

Behavior:

- `parallel-screen` clears once with canonical `Cli.Screen.repaint('')`, passes
  `reporter: 'screen'`, and selects the compact handoff;
- `parallel-log` preserves the terminal, passes `reporter: 'log'`, and selects the full handoff;
- `sequential` preserves inherited child output and the existing exhaustive `Fmt.result` report.

The empty repaint occurs after argument/presentation resolution and before `Workspace.Run.test`, so
Deno wrapper chatter and stale visible rows are removed from stdout without adding a second clear
API or erasing scrollback. It is never used as the active-frame repaint loop.

Keep this decision at the process-owning script and pass it explicitly across the runner boundary.
Do not let the root wrapper and reporter independently infer presentation mode, and do not add
terminal-clearing behavior to the scheduler or package runner.

Add one narrow truthful `WorkspaceRun.Test.Args` input:

```ts
reporter?: 'screen' | 'log';
```

Omission preserves the existing automatic stdout-terminal capability detection for direct API
callers. The root wrapper always passes an explicit reporter mode for parallel execution. This is an
API presentation input, not a user-facing root CLI flag.

The script continues to own exit code and completion-hang warning behavior.

### 2. Reporter boundary

Refactor `createParallelReporter` so a failed package `finish` event means:

1. retain the original failed `Package.Ran` result;
2. update the completed-results grid;
3. rebuild the active frame with the minimal live failure footer below the elastic completed region
   and bottom-anchor it when viewport capacity permits;
4. continue scheduling and rendering remaining packages.

For `done`, apply the final progress event, stop ticker/spinner exactly once, then write exhaustive
screen-mode scrollback: every completion followed by every minimal failed-package repair item. The
root final formatter remains the sole footer and detailed-diagnosis owner. The existing `stop()`
remains idempotent for the surrounding `finally` block.

The real PTY probe proved that Ora removes stale rows correctly across width/height changes and that
its declared `stop()` erases the latest multiline frame. Normal completion now uses that erasure as
the transfer point to ordinary scrollback and does not repaint the bounded frame. An abnormal or
external stop may still preserve the latest bounded frame once through canonical
`Cli.Screen.repaint`. No Ora internals or new CLI API are used.

### 3. Failure projection

Add an internal pure failure projection under `m.run/u/`, preferably `u.failure.ts`.

The projection consumes `WorkspaceRun.Result` and returns a small internal, lossless carrier:

```text
failed packages[]
  package: original WorkspaceRun.Package.Ran result
  rerun
    cwd: workspace-relative package path
    task: original WorkspaceRun.Task
```

Do not copy JUnit fields, stdout, stderr, exit state, or signal state into a shadow diagnostic
schema. Retaining the original failed package result preserves every captured fact and keeps later
contract additions automatically visible to the formatter.

The projection does not manufacture a shell command, slice cases, calculate hidden counts, truncate
text, fit terminal width, or apply color. Those are formatter policies.

Factor the same carrier construction so a failed live `finish` event can retain
`{ package: originalResult, rerun: { cwd, task } }` without waiting for the final
`WorkspaceRun.Result`. Both live and final paths must consume the same carrier and command formatter
rather than copying package facts.

Minimal live/compact selection per failed package:

1. If observed stats report one or more failures, show the exact failed-test count.
2. Otherwise show the package process signal or exit code.
3. Always show the exact package-local rerun.
4. Never show case identities, messages, warnings, excerpts, stdout, or stderr.

Detailed selection is full/log-only:

1. Prefer observed failed-case identities and messages when available.
2. Otherwise prefer a stderr line carrying an explicit error marker.
3. Otherwise use a nonblank stderr line, then a nonblank stdout line.
4. Label excerpts as output evidence and never invent a failure category.
5. Preserve complete grouped streams after the structured detail.

Use canonical string and predicate helpers from the local `common.ts` lane. Do not introduce raw
JSON, filesystem, or path handling.

### 4. Final handoff formatter

Extend the existing public `WorkspaceRun.Fmt` surface with one earned formatter concept:

```ts
handoff(result: Result, options: HandoffOptions): string;
```

Write the exact type shape first in `m.run/t.ts`:

```ts
type HandoffOptions = {
  detail: 'compact' | 'full';
  terminal?: boolean;
  width?: number;
};
```

`detail` is required so callers choose diagnostic fidelity deliberately. `terminal` and `width`
follow existing deterministic CLI formatter seams; they do not alter result semantics. Do not turn
this into a menu of package-table, summary, color, stream, and failure-parser switches.

Resolve handoff width once. Both detail modes begin with one indivisible presentation prefix:

1. one concise run title;
2. one heavy `Cli.Fmt.hr` at exactly the resolved width, green for success or red for failure from
   the same result truth as the title;
3. aggregate package/test/report facts on the next row, with no blank row inside this prefix.

Passing explicit `width` to `Cli.Fmt.hr` is mandatory so the pure formatter never performs a second
ambient Screen measurement. This rule is final string content, not a repaint or spinner frame.

After that shared prefix, `compact` renders:

- failed-package heading when needed;
- one minimal fact row and exact rerun row per failed package;
- no case identities, messages, excerpts, stdout, or stderr.

`full` renders the same minimal repair index plus detailed structured/output evidence, bounded
failed-test continuation through the shared `... +N more` grammar, and complete grouped buffered
output for failed packages. It is the deterministic non-interactive/CI mode.

Keep `Fmt.result` and `Fmt.packages` intact for existing API consumers unless implementation
evidence proves a safe deprecation path. The root parallel test script changes to the new handoff
surface rather than silently redefining the older exhaustive formatter.

### 5. Minimal live and compact failure formatting

Render each failed package exactly:

```text
✕ <package-name> · <N> failed test(s)
  rerun: deno task --cwd ./<workspace-path> <task>
```

Concise running/completed rows and package result tables use the same authoritative package-name
identity. Detailed failure/output headers remain path-oriented. When no positive observed
failed-test count exists, replace the count fact with `exit <code>` or `signal <signal>`. Derive
`<task>` from run truth; do not hardcode `test` in the shared formatter and do not compose reruns
with `cd`, `&&`, or another shell control surface.

The live and compact surfaces intentionally omit:

- native failed-case identities;
- assertion or parser messages;
- output excerpts;
- stdout and stderr;
- inferred failure categories.

Full/log formatting may add bounded structured cases and conservative excerpts before complete
grouped streams. Keep that policy separate from the minimal item formatter so detailed evidence
cannot leak into the active screen.

### 6. Canonical viewport-owned progress reporter

The fifth commit extends the existing single reporter rather than introducing another renderer.

The active progress reporter owns one terminal session:

```text
terminal session
  viewport: one accepted { width, height }
  events: one Cli.Screen.events() handle
  resize: one resize$ subscription
  redraw: one coalescing scheduler plus elapsed tick
  spinner: one Cli.Spinner instance bound to stdout
  cleanup: scheduler → subscription → events → spinner
```

Acquisition begins only in `parallel-screen` mode and is transactional. If event, subscription,
spinner, or first-render acquisition fails, release everything already acquired without masking the
original error. `stop()` adopts stopped state first, then exhaustively attempts cleanup exactly
once. Events or scheduled callbacks after stop are inert.

The default terminal dependency uses only canonical CLI surfaces:

- `Cli.Screen.size()` for the initial viewport;
- `Cli.Screen.events()` for exact resize transitions;
- `Cli.Spinner.create('', { target: 'stdout' })` for active frame ownership;
- `console.info`/stdout for reporter text;
- the existing system scheduling/time surfaces through the local `common.ts` lane.

Keep one cohesive injectable terminal/scheduler dependency for deterministic tests. Do not expose it
publicly.

The pure progress formatter receives explicit viewport and cursor-row inputs. It performs no ambient
Screen measurement. One frame calculation:

1. normalizes width, height, and cursor-row cost;
2. formats status rows at canonical terminal-cell width;
3. projects running rows into remaining capacity;
4. reserves rows for the minimal live failure footer;
5. projects the completed rule/grid into the remaining elastic capacity;
6. composes the completed grid, exact internal spacer rows, and bottom-anchored failure footer;
7. calculates truthful running/completed/failure continuation counts from retained state;
8. applies a final width/height safety bound.

Retain all compact completed-package summaries and original failed-package carriers for the duration
of one workspace run; remove the arbitrary 64-item truncation rather than letting any continuation
summary undercount larger workspaces. Render hidden counts through the exact
`... +N more[ qualifier]` grammar without changing arithmetic. These are small scheduler facts, not
child output logs. Viewport changes alter only visible projection.

For each elastic section, project visible items and its continuation summary as one transaction. If
the summary does not fit, reduce visible detail and recompute the hidden set; never keep a partial
grid while discarding the line that accounts for what it hid. Only an all-visible projection may
render without a continuation summary.

Project completed summaries as an explicit column-major recency window. A terminal package event
inserts the new summary at the top-left; existing summaries advance down each column before flowing
to the top of the next column; items beyond current capacity contribute to the truthful bottom
overflow count. Do not sort retained state by status, path, duration, or test count, and do not pin
failed rows in this grid—the separately reserved live failure index already provides durable
graph-ordered failure visibility. Width/height changes reproject retained order without changing it.

The root's graph/loading intro remains ordinary scrollback context and is not part of retained live
frame state. The root clears once before that context is emitted; the reporter then owns the live
active frame. A bottom-anchored failure frame may consume the full bounded viewport and naturally
scroll earlier intro lines away. Do not query absolute cursor position, reserve speculative prelude
rows, or clear and reconstruct static graph context on each resize.

On resize:

1. adopt `event.after` as the complete next viewport;
2. request coalesced layout work;
3. rebuild the complete active progress frame;
4. update Ora only through its declared `text`, `start`, and `stop` surface.

A real terminal resize probe is a hard acceptance gate. If stdout-targeted Ora cannot remove stale
physical rows when width/height changes, stop and redesign the Workspace-local active-frame sink. Do
not reach through Ora private methods, add an undeclared spinner method, or import Driver Vite
internals.

## File-level implementation map

### Root process boundary

`-scripts/task.test.ts`

- in commit 3, import `Cli` through `./common.ts`;
- in commit 3, resolve `parallel-screen`, `parallel-log`, or `sequential` once after help and
  argument parsing;
- in commit 3, pass explicit `reporter: 'screen' | 'log'` for parallel execution;
- in commit 5, clear once before calling `Workspace.Run.test` only in `parallel-screen` mode;
- in commit 3, print `Workspace.Run.Fmt.handoff` in compact or full mode for parallel runs;
- retain `Workspace.Run.Fmt.result` for the sequential baseline;
- preserve exit-code and completion-hang behavior.

`-scripts/-test/-task.test.test.ts`

- in commit 3, prove help/argument behavior remains intact;
- in commit 3, prove presentation-mode selection with a narrow pure policy;
- in commit 5, prove actual clear ordering and exact-once behavior with a real TTY runtime probe
  rather than a broad injected script-runtime abstraction.

### Workspace types and composition

`code/sys/workspace/src/m.run/t.ts`

- in commit 3, define the narrow `Fmt.handoff` contract and required detail option before
  implementation;
- in commit 3, add `Test.Args.reporter?: 'screen' | 'log'` with omission documented as existing
  stdout-terminal auto-detection;
- document new public contracts at their correct hierarchy level;
- keep new input option properties mutable and reserve `readonly` guarantees for outputs and stored
  state;
- keep internal failure projection and terminal dependency types out of the public type plane.

`code/sys/workspace/src/m.run/u.fmt/`

- compose the compact/full handoff in `u.handoff.ts` and keep minimal/full failure evidence in
  `u.failure.ts`;
- define one internal pure `formatContinuationSummary(countText, tone, qualifier?)` grammar in
  `u.continuation.ts`; retain deterministic count text and exhaustive semantic-tone dispatch without
  adding a public `Fmt` member;
- preserve each caller's count source while styling the complete `+N` token and independently
  styling muted prefix/tail fragments through canonical `c` helpers;
- resolve handoff width once, then render title → full-width `Cli.Fmt.hr` → aggregate summary with
  the rule colored from the same result truth as the title and no intervening blank row;
- keep pure final string formatting free of ambient remeasurement, spinner ownership, and
  `Cli.Screen.repaint` calls;
- retain existing exhaustive `result` and `packages` behavior behind the narrow `mod.ts` facade;
- remove final-output ownership from reporter call sites.

`code/sys/workspace/src/m.run/u.run/u.parallel.ts`

- in commit 2, continue launching selected package tests after failed terminal results;
- unlock dependents after any predecessor terminal result, including failure;
- preserve the job bound, topological readiness, graph-ordered results, and canonical graph-order
  failure selection.

`code/sys/workspace/src/m.run/u.run/u.main.ts`

- resolve an omitted test reporter mode once for direct API callers;
- pass explicit screen/log mode into reporter construction;
- keep graph and runner composition unchanged outside the dedicated scheduler-continuation commit.

`code/sys/workspace/src/m.run/u/u.failure.ts` (landed in commit 1)

- derive deterministic, graph-ordered failed-package carriers;
- retain each original failed `Package.Ran` result rather than copying diagnostic fields;
- derive structured task-truthful rerun inputs `{ cwd, task }`;
- contain no shell command rendering, case limits, terminal fitting, ANSI styling, terminal writes,
  or process behavior.

`code/sys/workspace/src/m.run/u/u.reporter.ts`

- in commit 3, stop emitting `formatFailedOutput` on `done`, render the minimal live failure index
  on failed `finish`, and preserve idempotent stop;
- project retained newest-first completions directly into the column-major visible window; the DMIND
  follow-up supersedes Commit 4's original row-major projection without changing retained recency;
- in commit 5, become the stable internal facade over runtime and pure layout factors.

`code/sys/workspace/src/m.run/u/u.reporter.runtime.ts` (new in commit 5)

- own terminal session acquisition, accepted viewport, resize subscription, redraw scheduling,
  stdout spinner, and exhaustive disposal;
- retain the exact styled frame supplied by layout and pass it unchanged through spinner text and
  final `repaint`; never strip, normalize, or reconstruct ANSI at this boundary;
- depend only on one cohesive injectable terminal/scheduler seam;
- use only declared CLI Screen and Spinner contracts.

`code/sys/workspace/src/m.run/u/u.reporter.layout.ts` (new in commit 5)

- own pure status, running-grid, column-major newest-first completed recency window, minimal
  live-failure index, width, height, and overflow projection;
- reserve failure-index rows before elastic completed detail; the later bottom-anchor follow-up
  materializes unused middle capacity as exact internal blank rows so the footer remains stable;
- move the oldest visible completion into truthful overflow when a newer completion enters; never
  reorder retained completions on timer or resize-only redraws;
- consume the internal `formatContinuationSummary` grammar for running, completed, and
  hidden-failure summaries while keeping hidden-set selection, count arithmetic, and severity in
  domain-specific callers;
- color the complete `+N` token cyan for running, by hidden completion severity for completed, and
  red for failed-package continuation; keep punctuation/context muted gray italic;
- remove the grid-only partial-running fallback: when running items are hidden, fit grid plus
  summary, reduce visible rows, use summary-only, or omit the section in that order;
- keep caller-owned two-space indentation outside the shared continuation-summary helper;
- require explicit viewport/cursor-row input;
- perform no terminal measurement or effects.

`code/sys/workspace/src/m.run/u/u.progress.ts`

- retain completed package summaries and original failed `Package.Ran` results independently from
  viewport projection;
- preserve newest-first terminal-event order for completed summaries and graph order for the
  separate live failure index;
- remove arbitrary truncation that makes overflow counts underreport larger workspaces.

### Focused proof

`code/sys/workspace/src/m.run/-test/-u.failure.test.ts` (landed in commit 1)

- pure projection tests.

`code/sys/workspace/src/m.run/-test/-u.reporter.test.ts`

- in commit 3, prove a failed `finish` immediately renders the minimal package/count-or-exit/rerun
  index beneath completed results;
- prove the active frame excludes case identities, messages, excerpts, stdout, and stderr;
- prove reporter emits no standalone final diagnosis and stop remains idempotent;
- prove newest-first retained recency, column-major projection stability, oldest-item overflow,
  mixed-status parity, and durable separate failure-index behavior;
- in commit 5, keep only reporter-facade integration assertions here; move exact continuation text,
  style, and conservation contracts into focused layout/runtime tests and remove stale
  `...and N more` expectations rather than duplicating them;
- retire this mixed file only if no coherent reporter-facade contract remains.

`code/sys/workspace/src/m.run/-test/-u.reporter.layout.test.ts` (new in commit 5)

- prove immutable viewport input, cell-width bounds, bottom-anchored failure placement, exact spacer
  contraction, failure-index height priority, newest-first column-major recency, overflow truth,
  shrink, and re-expansion;
- prove running-specific columns expand only when complete marker/label/elapsed cells fit, contract
  before shortening readable labels, and do not alter active/final completion geometry;
- extract each rendered continuation line and assert the complete ANSI-stripped line exactly rather
  than relying on substring presence: `... +2 more`, `... +3 more running`,
  `... +1 more failed package`, and `... +2 more failed packages`;
- prove running conservation at each fallback tier: context + grid + summary, grid + summary,
  reduced grid + summary, summary-only, and section omission when even the summary cannot fit;
- prove every partial running/completed/failure projection satisfies `visible + hidden = retained`,
  while all-visible projections render no summary;
- prove completed tone comes from the hidden set only, including green, yellow, and red cases where
  visible severity differs;
- prove exact ANSI composition independently through `c` helpers: unstyled indent, muted gray italic
  framing, and semantic-color italic complete `+N` token for completed, running, and failed package
  states;
- prove styled and stripped continuation lines have identical terminal-cell width, remain within
  physical row budgets at wrap boundaries, and contain neither Unicode `…` nor cramped/old grammar.

`code/sys/workspace/src/m.run/-test/-u.reporter.runtime.test.ts` (new in commit 5)

- prove stdout alignment, exact `event.after` adoption, resize coalescing, transactional
  acquisition, exact cleanup, and inert post-stop callbacks;
- pass a frame styled with canonical `c` helpers and prove spinner text plus persisted repaint equal
  that same string exactly, while using `Cli.stripAnsi` only for the separate text assertion.

`code/sys/workspace/src/m.run/-test/-u.progress.test.ts`

- prove completed summary retention remains independent from visible viewport capacity;
- prove mixed terminal events retain exact newest-first completed order while failed-package
  carriers remain independently graph ordered.

`code/sys/workspace/src/m.run/-test/-u.handoff.test.ts` (new in commit 3)

- public handoff formatting contract;
- compact output contains only minimal package/count-or-exit/rerun items;
- full output adds structured cases, conservative output evidence, and complete streams;
- bounded failed-case details use exact `... +1 more failed test` and `... +2 more failed tests`
  grammar with a red italic complete `+N` token and muted framing;
- failed-case continuation preserves the existing observed-total arithmetic and deterministic count
  formatting; one large observed count proves every grouping separator stays inside the red italic
  `+N` token without allocating thousands of case fixtures;
- success and failure handoffs prove title → exact resolved-width green/red rule → summary ordering,
  including compact/full parity and no extra blank row;
- one terminal-mode measurement probe returns different hypothetical widths on subsequent reads and
  proves handoff width is accepted once, then passed explicitly to the rule with no second Screen
  measurement or repaint effect;
- exact task-truthful reruns and aggregate stats.

`code/sys/workspace/src/m.run/-test/-.test.ts`

- explicit and omitted reporter-mode behavior;
- existing exhaustive formatter and aggregate stats remain truthful.

`code/sys/workspace/src/m.help/yaml/dsl.test.yaml`

- replace the obsolete promise that the reporter prints grouped failure output;
- state that screen-mode failed `finish` events immediately update a minimal live failure index
  below completed results;
- state that live/compact output excludes diagnostic detail while full/log output retains it;
- state that parallel runs return buffered failure streams and the root task renders the final
  handoff;
- in Commit 5, document exact bounded continuation grammar/color ownership and the final title →
  result-colored rule → summary hierarchy without exposing implementation helper names;
- document authoritative package-name running/completed/result/fact rows versus path-owned
  rerun/detail semantics;
- preserve the distinction between the root parallel default and sequential API baseline.

`code/sys/workspace/src/m.help/-bundle/-bundle.json`

- refresh through the package's declared `help:bundle` task; do not edit by hand.

## Commit plan

### Commit 1: isolate failed package diagnostics

- Add pure failed-package projection and focused tests.
- Refactor the existing grouped full-output formatter to consume the projection where useful.
- Preserve current reporter output placement and visible behavior for this commit.
- Do not move ownership until the replacement handoff is complete and tested.

Acceptance:

- projection tests pass;
- existing reporter tests remain green without expectation changes;
- scheduler tests remain unchanged and green;
- no interactive or non-interactive output is lost or reordered.

### Commit 2: continue parallel tests after package failures

- Remove the parallel scheduler's first-failure launch stop.
- Treat every predecessor terminal result as satisfying topological readiness, including failed
  results.
- Continue every selected package test through a terminal result while preserving the configured job
  bound.
- Keep final package results and canonical failure selection in graph order.
- Keep sequential `check`, `dry`, and explicit sequential test behavior unchanged.

Acceptance:

- a failed package does not stop later independent package launches;
- a failed predecessor does not suppress its dependent package test;
- all selected package tests receive terminal results;
- multiple failures remain graph ordered in the final result;
- public `Workspace.Run.test(...)` integration proves continuation, not only the scheduler unit.

### Commit 3: actionable failure handoff

- Define `Fmt.handoff` types first.
- Resolve root `parallel-screen`, `parallel-log`, and `sequential` presentation once and add the
  narrow explicit reporter-mode input; terminal clearing remains commit 5.
- Add minimal compact and detailed full handoff formatting over the proven projection.
- Add the failing reporter tests proving failed `finish` immediately renders the minimal live index
  and `done` does not emit buffered diagnostics.
- Atomically remove unbounded final diagnosis from the reporter, add the bounded active failure
  index, and switch root parallel output to the handoff.
- Retain `Fmt.result` for sequential runs with inherited child output.
- Make reporter stop/final-frame behavior explicit and idempotent.
- Update the workspace test DSL and regenerate its help bundle.
- Preserve complete diagnostics in `parallel-log` mode.

Acceptance:

- live and final compact failures show only package, observed failed count or exit/signal, and exact
  rerun;
- failed-case identities, messages, excerpts, stdout, and stderr never appear in live/compact
  output;
- full/log output preserves structured native detail, honest unsupported/composite evidence,
  stale-lock excerpts, and complete streams;
- multiple failed packages are graph ordered;
- the minimal live failure index remains directly below completed results while every selected
  package continues to completion;
- every failed package renders an exact `deno task --cwd` rerun from structured `{ cwd, task }`
  input;
- full mode contains complete buffered stdout/stderr;
- sequential output remains behaviorally unchanged;
- workspace test DSL guidance matches the new ownership boundary.

### Commit 4: render completed tests as a live recency window

- Keep retained completion state lossless and newest-first; do not introduce a second history or
  mutate scheduler result order.
- Replace status-prioritized completed-grid projection with one explicit newest-first row-major
  window.
- Insert each newly terminal package at top-left, shift prior visible summaries toward bottom-right,
  and move only the oldest visible summary into truthful overflow.
- Let failed completed rows age normally because the dedicated graph-ordered failure index already
  owns durable failure visibility.
- Preserve retained order across timer-only redraws and repeated formatting; no clock, status, path,
  duration, or test-count sort may perturb recency.
- Keep the existing width-derived column count and five-row cap for this commit; physical height
  ownership remains Commit 5.
- Update focused progress/reporter proof and the workspace test DSL, then regenerate bundle parity.
- Do not add Screen events, terminal clearing, resize scheduling, runtime extraction, or spinner
  lifecycle changes.

Acceptance:

- each terminal result appears at top-left on the next frame;
- prior visible summaries shift in row-major order and the oldest visible summary alone enters
  overflow at capacity;
- overflow counts include all retained but hidden summaries and continue increasing truthfully
  beyond 64 completions;
- failure, success, skipped, and blocked summaries obey the same completed-grid recency policy;
- the separate failure index remains graph ordered and actionable after its completed row ages out;
- timer-only/repeated renders preserve completion order exactly;
- live/compact diagnostic boundaries, scheduler behavior, final handoff, sequential output, and
  non-interactive output remain unchanged.

### Commit 5: fit parallel test screen to the terminal viewport — landed `f8775f9d9`

Hard gate resolved before implementation: the Vite viewport arc landed the declared CLI spinner
stdout-target contract, the viewport-session extraction checkpoint rejected premature extraction,
and the durable prerequisite hashes are recorded above.

- Extract the pure progress layout from the effectful reporter runtime behind the stable internal
  reporter facade.
- Preserve the explicit reporter mode established in commit 3 while adding viewport-owned screen
  behavior.
- Add one transactional `parallel-screen` terminal session using `Cli.Screen.size/events` and
  stdout-targeted `Cli.Spinner`.
- Adopt exact resize `event.after` snapshots and coalesce complete active-frame repaint requests.
- Pass one explicit viewport/cursor-row snapshot into pure layout.
- Budget status, running, minimal live failures, and completed rows by terminal-cell width and
  physical height.
- Retain completed summaries and failed-package carriers independently from viewport projection and
  make overflow counts truthful beyond 64 packages.
- Replace every bounded test-runner `...and N more` summary with exact `... +N more[ qualifier]`
  notation using ASCII periods and one shared internal grammar.
- Preserve completed hidden-set severity color; add cyan running-count, red failed-package-count,
  and red failed-test-count signal on the complete italic `+N` token while keeping framing muted
  gray italic.
- Eliminate grid-only partial-running output: conserve visible + hidden running truth through
  grid-plus-summary, reduced-grid, summary-only, and physically impossible omission tiers.
- Preserve styled frame bytes through spinner text and final repaint; ANSI may affect neither width
  measurement nor projection arithmetic.
- Render one full-width `Cli.Fmt.hr({ width, color })` directly beneath every final handoff title,
  using the handoff's already-resolved width and the same result-derived green/red semantic color as
  `Workspace` in the title.
- Keep the final title, rule, and aggregate summary contiguous with no blank row; this is normal
  final output, never another screen repaint.
- Preserve the established newest-first row-major recency window while viewport capacity changes;
  resize-only redraws must not mutate retained order.
- Use the established `parallel-screen` decision to clear exactly once before workspace graph
  output.
- Do not acquire Screen events or clear for help, sequential, redirected, or non-interactive runs.
- Update viewport behavior in the workspace test DSL and regenerate its help bundle.
- Perform wide → narrow → wide and tall → short → tall live terminal proof after deterministic
  focused tests.

Acceptance satisfied before landing:

- the dashboard begins at the top of a clean interactive terminal;
- Deno task wrapper chatter emitted before script execution is cleared;
- one reporter session owns accepted viewport, resize subscription, redraw scheduler, stdout
  spinner, and exact cleanup;
- every active render uses one immutable viewport and stays within terminal-cell width and physical
  row capacity;
- the minimal live failure index stays directly below completed results and survives later
  successful completions;
- completed summaries contract before actionable live failure rows disappear, with truthful overflow
  counts;
- running, completed, hidden failed-package, and bounded failed-test summaries render exact
  `... +N more[ qualifier]` text with ASCII periods, stable spacing, preserved qualifiers, and
  semantic `+N` color that survives exact ANSI contract proof;
- every rendered partial projection conserves visible + hidden truth; no partial running grid can
  silently discard its continuation summary;
- the frame reaching spinner text and persisted repaint is byte-identical to the styled layout
  result;
- success and failure handoffs render an exact-width green/red rule beneath the title from the same
  resolved width and result status, without performing another ambient width measurement or screen
  repaint;
- each terminal result advances a newest-first row-major completed recency window, while timer and
  resize-only redraws preserve order;
- narrowing leaves no stale wrapped rows;
- CI/log capture and sequential behavior remain unchanged and complete;
- final handoff remains in ordinary scrollback.

### Post-Commit5 follow-up: streamline parallel test completion

Proposed commit:

`fix(workspace): streamline parallel test completion`

Status: landed as `35806950a`. The failed-action ownership gate is resolved through a reporter-owned
persisted-frame receipt, and exhaustive rerun actionability remains preserved.

Operator target when the persisted final frame already contains every failed-package action:

```text
Workspace tests failed in 10m
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
53 ran · 3 failed · 10,613 tests · 50 reports collected · 3 not applicable
```

What and why:

- Treat the appended interactive completion block as a footer to the persisted screen frame, not a
  second rendering of the same failed-package repair index.
- For `parallel-screen`, render title → result-colored rule → aggregate summary with no repeated
  actions that are already visible immediately above it.
- Keep noninteractive `parallel-log`, sequential output, full diagnostics, and direct compact
  formatter behavior unchanged; those surfaces do not own a persisted live frame.
- Keep internal telemetry capability kinds unchanged: `observed`, `unavailable`, and `unsupported`
  remain precise machine contracts.
- Standardize operator-facing telemetry language across aggregate result summaries:
  - `observed` → `collected`;
  - `unavailable` → `unavailable`;
  - `unsupported` → `not applicable`.
- Keep each capability-state count explicit without calling non-reportable package tasks “reports.”
  The originally landed `reports: N collected` grammar was later superseded by `6ae1ec804` with the
  grammatical count-first form `N report[s] collected[ · U unavailable][ · S not applicable]`.
- Update the test-runner DSL and bundle so internal capability truth and rendered operator language
  remain visibly distinct.

Failed-action ownership gate:

- A bounded final frame can summarize hidden failed packages as `... +N more failed packages`; in
  that state, replacing the compact handoff with an unconditional summary-only footer would remove
  exact rerun commands.
- Do not infer visibility from paths, remeasure an ambient viewport after reporter shutdown, or
  duplicate layout arithmetic in the root task.
- Selected contract: provide a truthful reporter-owned completion receipt that lets the root append
  only failed actions omitted from the persisted frame. Constrained interactive completion must not
  lose exact reruns.
- The explicit screen reporter input carries an `onComplete` callback; the receipt reports visible
  and total graph-ordered failed-package actions from the exact persisted layout. Run results remain
  presentation-free.
- Compact formatting validates the receipt total against authoritative result failures. A missing or
  inconsistent receipt falls back to every repair action rather than risking omission.

Required proof after the gate is resolved:

- interactive success and all-visible failure end with footer-only title → rule → summary;
- constrained failure either appends only omitted exact actions or documents the explicitly accepted
  downgrade, with no false claim that all actions were shown;
- direct compact formatting remains independently actionable;
- full/log and sequential output remain unchanged;
- aggregate telemetry covers collected-only, mixed unavailable, mixed not-applicable, and states
  with no collected reports in stripped text;
- internal capability discriminants and report collection behavior remain byte-for-byte unchanged;
- DSL source and generated bundle remain identical.

### CLI testing prerequisite: scoped spinner factory stubbing

Proposed commit:

`test(cli): add scoped spinner factory stubbing`

Status: landed as `ac6e472761` after the Workspace handoff and reporter-module commits.

Decision:

- Extend `@sys/cli/testing` at the existing `FakeSpinner` seam rather than propagating direct
  `Object.defineProperty(Cli.Spinner, 'create', ...)` replacement through consumers.
- Add one narrow `FakeSpinner.stub(...)` helper that returns a deterministic fake, records creation
  arguments as readonly observations, and restores the exact original property descriptor through
  `[Symbol.dispose]`.
- Keep helper inputs mutable and output observations readonly.
- Do not introduce a generic property-mocking framework or generalize Screen, viewport, repaint, or
  reporter-runtime policy in this step.
- Land the helper and both Workspace consumer migrations atomically so the testing API has immediate
  use and no direct spinner-factory monkeypatch remains.

Acceptance:

- the stub observes forwarded spinner text and semantic output-target options without exposing Ora
  internals;
- disposal is exact, idempotent, and exception-safe under `using`;
- focused helper tests prove deterministic fake return, call capture, and descriptor restoration;
- CLI tests, check, publish dry-run, formatting, lint, and diff checks pass;
- this commit leaves no direct spinner-factory property replacement in Workspace tests.

Verification:

- focused helper/API proof passed 9 steps;
- the full CLI package passed 206 steps;
- leak-traced Workspace `m.run` passed 150 steps;
- CLI and Workspace checks, CLI publish dry-run, formatting, lint, and diff checks passed.

### DMIND follow-up: stabilize parallel test progress handoff

Proposed commit:

`fix(workspace): stabilize parallel test progress handoff`

Status: landed as `f86a5b245`. This changes live projection order and the completed
screen-to-scrollback transition, so it remains a formal behavior step rather than tidy residue.

Problem:

- Row-major newest-first insertion makes every retained completion alternate between left and right
  columns as newer packages finish.
- Failed package rows make that movement especially conspicuous because their red mark attracts the
  eye even though the separate failure index already owns durable actionability.
- Persisting the last viewport-bounded frame leaves `... +N more` in the completed terminal output
  after animation has ended, even though ordinary scrollback can carry the complete record.

Decision:

- Keep retained scheduler terminal-event recency unchanged and newest-first.
- While active, project completed cells column-major: newest at top-left, then older items down that
  column, then from the top of each column to its right.
- Let one item cross from the bottom of a column to the top of the next only when that column fills;
  do not make every completion alternate columns.
- Keep active output viewport-bounded with exact bottom `... +N more` truth whenever a list is
  partial.
- On `done`, stop animation without repainting the bounded frame and transfer output to ordinary
  scrollback.
- Print every completed package first in newest-first column order, then every failed-package repair
  item in graph order. Final scrollback uses no continuation summary.
- Reduce the final completion column count before shortening package paths; a wider viewport must
  not make package identity less readable by forcing an extra column.
- Insert one dim, dashed, full-width rule exactly when the failed-package repair list is visible.
- Let the root append the ordinary title → result-colored rule → aggregate footer after those full
  lists. The screen completion receipt therefore confirms every failed action as visible.
- Keep running-grid order, scheduler behavior, retained state, noninteractive/full output, and
  sequential output unchanged.

Acceptance:

- a retained failed completion moves downward in one column as newer packages finish, then crosses
  right only at the column boundary;
- every active partial list retains exact `visible + hidden = retained` overflow truth;
- successful and failed screen runs write every completed package to final scrollback with no
  `... +N more` residue;
- every failed-package repair item follows the completed list in graph order before the root footer;
- a dim dashed separator is present if and only if the failed-package repair list is visible;
- final columns yield before a package path is shortened, unless one full-width column still cannot
  carry it;
- normal completion stops the spinner without repainting the bounded frame, while abnormal/external
  stop may still preserve its latest bounded frame;
- the completion callback runs after exhaustive final scrollback and reports all failed actions
  visible;
- timer ticks and resize-only redraws do not reorder retained completions;
- focused layout/reporter/runtime/root/help, type-check, formatting, lint, Workspace tests, and
  publish dry-run pass.

Verification:

- red proof rejected the missing exhaustive-final projection and non-persisting stop contracts
  before implementation;
- focused integration/layout/runtime/reporter proof passed 78 steps, leak-traced `m.run` passed 143
  steps, root presentation passed 10 steps, and help resource/bundle proof passed 8 steps after
  removing prose-mirroring assertions;
- the full Workspace package passed 407 steps;
- Workspace check, publish dry-run, formatting, lint, and staged/unstaged diff checks passed.

### Commit 6: preserve package names in run results

Hard gate satisfied by `f8775f9d9` and remains independent of the completion follow-up. Package-name
identity remains a separate result-contract and failure-presentation change; do not fold it back
into the landed viewport commit.

- Define the public contract first as one flat immutable `WorkspaceRun.Package.Identity`:
  `{ readonly name: t.StringPkgName; readonly path: t.StringPath }`. Compose `Ran`, `Skipped`, and
  `Blocked` from that identity so existing path ergonomics remain stable while `name` becomes a
  required output fact. Keep canonical `Package` namespace ordering and document identity/name/path
  at the public contract level before runtime changes.
- Do not carry the full `t.Pkg` or package version into run results: only authoritative name and
  operational path are used by this contract, so version would be speculative duplicate payload.
- Source `name` only from the package manifest already validated in `RunCandidate.pkg`; never
  derive, normalize, repair, or guess a package name from its directory.
- Add one internal candidate → identity projection at the run-plan boundary. Reporter input, package
  workers, sequential skips, parallel skips, and any future blocked-result constructor consume that
  projection rather than independently pairing `pkg.name` with `dir`.
- Reassert canonical identity at the parallel custom-worker boundary: regardless of an injected
  worker's returned name/path, the scheduler writes the selected candidate's manifest name and path
  into the terminal result before events or aggregation. Preserve all non-identity worker facts.
- Treat the required output field as an intentional result-contract migration and update every
  in-repo result constructor explicitly rather than weakening result truth with an optional field.
  Internal direct-render progress projections may omit names only to exercise the defensive path
  fallback; valid runner results may not.
- Keep scheduler keys, graph order, progress event routing, JUnit artifact lookup, and exact rerun
  `--cwd` behavior path-based. Use manifest names for concise running/completed/result display rows.
- Keep the lossless failed-package carrier over the original `Package.Ran`; do not copy name/path
  into a second shadow identity schema.
- Render running, completed, result-table, and failed-package fact rows with manifest package name
  while exact rerun rows retain workspace paths. Fit names as semantic text with canonical
  cell-width helpers; do not pass scoped package names through filesystem-path formatting merely
  because they contain `/`.
- Keep sequential execution logs, full failure-detail headers, and buffered-output headers
  path-oriented: concise rows already establish package name, while path remains useful operational
  or diagnostic location. Record this boundary explicitly rather than letting formatters diverge.
- Remove `CompletionHang.FormatInput.packages` and `CompletionHang.PackageContext`: once every
  result carries authoritative name/path, that optional side channel becomes a second, potentially
  contradictory identity source. Render warning context directly from result identity.
- Preserve compact/full diagnostic separation, failed-package graph order, viewport priority, and
  all existing count/exit/signal selection.
- Update Workspace test DSL wording and regenerate the embedded help bundle.

Commit 6 implementation seams:

- `m.run/t.ts`: define `Package.Identity`, compose all outcome variants from it, and remove the
  redundant completion-hang package-context input/type.
- `m.run/u/u.plan.ts`: own candidate → result identity projection from validated `pkg.name` + `dir`.
- `m.run/u/u.worker.ts`: emit canonical identity for inherited and buffered package runs.
- `m.run/u.run/u.sequential.ts`: attach canonical identity to skipped outcomes.
- `m.run/u.run/u.parallel.ts`: attach identity to skipped outcomes and overwrite custom-worker
  identity from the selected candidate before terminal/event/result storage.
- `m.run/u/u.progress.ts` and `m.run/u/u.reporter.layout.ts`: retain candidate names in progress and
  render concise running/completed rows from name with a defensive path fallback.
- `m.run/u.fmt/u.failure.ts` and `m.run/u.fmt/u.result.ts`: render package names in minimal failure
  fact headers and package tables while rerun/detail/output paths retain filesystem presentation.
- `m.run/u/u.completion.hang.ts`: derive name/path directly from each ran result and delete the
  side-map merge path.
- Focused fixtures/helpers: accept explicit name/path and use deliberately non-derivable pairs; do
  not create a default helper that reconstructs name from path and masks incomplete migrations.

Acceptance:

- one real sequential and one real parallel run result retain both manifest name and workspace path
  for every produced outcome kind;
- a deliberately mismatched fixture such as `@acme/engine` at `code/internal/runtime` proves no
  path-derived identity shortcut;
- an injected worker returning a false name/path is canonicalized to its selected candidate before
  `finish`, `done`, `packages`, and `failure` observations;
- live and compact output render `✕ @acme/engine · <fact>` followed by
  `deno task --cwd ./code/internal/runtime <task>` at wide and narrow widths without path-formatting
  the package name;
- running, completed, and exhaustive package-table rows use manifest names; an incomplete internal
  display projection falls back to path without inventing a name;
- exact rerun commands remain byte-for-byte unchanged apart from surrounding presentation;
- detailed failure headers and grouped output retain their explicitly path-oriented behavior;
- completion-hang context renders authoritative result name + path with no optional identity map;
- no result constructor, formatter, or warning path invents fallback names or accepts an optional
  result `name`; the internal display fallback returns the retained path as a label rather than
  manufacturing package identity;
- external source compatibility impact, including removal of the redundant completion-hang context
  input, is explicit in type-check failures and migration notes rather than hidden by inference;
- focused result, worker, sequential, scheduler, failure, handoff, reporter, completion-hang,
  help-bundle, and Workspace checks pass.

Current implementation proof:

- focused identity, scheduler, handoff, progress, layout, reporter, and completion-hang proof passed
  92 steps; root presentation passed 10 steps;
- the full Workspace package passed 411 steps; Workspace package check, focused formatting/lint,
  help-bundle parity, publish dry-run, and diff checks passed;
- workspace-wide check validated 52 package checks, including `@sys/workspace`, then stopped on the
  unrelated existing `deploy/@tdb.edu.slug` import of missing `StrBuilder` from `@sys/std`; do not
  fold that external type-export repair into this arc.

### Post-arc DX: clarify collected report summary

Proposed commit:

`fix(workspace): clarify collected report summary`

Status: landed as `6ae1ec804`.

Decision:

- Replace the leftover label/value phrase `reports: N collected` in the concise final handoff with
  grammatical count-first copy: `N report collected` / `N reports collected`.
- Use `Str.plural`; retain `unavailable` and `not applicable` as additive capability-state counts.
- Keep the structured full-result table unchanged because its separate `reports` row label already
  supplies the noun.

Verification:

- focused handoff proof passed 23 steps;
- formatting, lint, and diff checks passed.

### Post-arc live layout: anchor failure actions to the viewport

Proposed commit:

`fix(workspace): anchor live failure actions to viewport`

Status: landed as `603077d38` after hard DMIND/TMIND review.

Hard review result:

- The existing layout already reserves the live failure section before allocating elastic completed
  detail. The defect is not allocation order; it is that unused middle capacity is never
  materialized, so an early footer floats upward and moves as completions arrive.
- Keep status → running → failure → completed allocation priority unchanged. Reversing that policy
  or introducing a second layout pass over retained state would be unnecessary structural churn.
- Treat the separator plus visible failed-package actions/overflow summary as one footer block.
  Measure the already-projected top and footer blocks, then materialize only the exact internal
  blank rows required to place that footer at the bottom of active capacity.
- Apply full-height anchoring only when a non-empty failure footer fits. Success frames and
  physically impossible failure projections remain naturally compact.
- Accept active viewport ownership explicitly: a full-height failure frame may scroll earlier
  graph/loading prelude lines out of view. The runtime knows viewport dimensions but not absolute
  cursor Y. Preserving the prelude while anchoring to the physical bottom would require new
  cursor-origin authority and is rejected for this commit.
- Keep blank rows inside the frame before the footer, never as semantically ambiguous trailing
  whitespace. Existing terminal-cell row measurement remains the single arithmetic authority.
- Do not change retained progress, continuation arithmetic, completion receipts, exhaustive final
  scrollback, root footer, runtime lifecycle, Screen, or Spinner contracts.

Implementation seam:

- `m.run/u.reporter/u.layout.ts` owns footer-block row cost, exact spacer calculation, and bounded
  composition.
- `m.run/u.reporter/u.runtime.ts` remains behaviorally unchanged; it transports the styled frame
  byte-identically.
- `m.run/-test/-u.reporter.layout.test.ts` owns the independent physical-row and footer-position
  oracles.

Acceptance:

- with one visible failure, the separator/header/rerun block occupies the same bottom rows while
  completed rows grow into and consume the spacer above it;
- with multiple failures, the footer grows upward and uses the existing exact hidden-package summary
  when all actions cannot fit;
- the spacer is exactly `capacity - top rows - footer rows`, never negative, and the complete frame
  remains within `viewport.height - cursorRows`;
- tall → short → tall restores the original styled frame byte-for-byte;
- wrapped reruns, tiny viewports, zero-visible-action receipts, and hidden failure counts remain
  truthful;
- no-failure active frames receive no full-height padding;
- final scrollback and completion receipt totals remain unchanged;
- a real TTY probe confirms internal blank rows survive Ora redraw, resize does not leave stale
  rows, and accepted prelude scrolling matches viewport ownership.

Verification:

- focused reporter-layout proof passed 24 steps;
- full leak-traced `m.run` passed 155 steps;
- root presentation passed 10 steps;
- Workspace check, focused formatting/lint, and diff checks passed;
- a real tall → short → tall TTY probe confirmed footer stability, exact restoration, and accepted
  prelude scrolling.

### Post-arc live layout: fit running jobs across available width

Proposed commit:

`fix(workspace): fit running jobs across available width`

Status: landed independently as `de4718fa6` after `603077d38`.

Hard review result:

- The observed three-column ceiling comes from the shared width heuristic, not scheduler state or a
  missing viewport measurement.
- Do not remove the ceiling globally. Active/final completion grids have separate recency and label
  stability contracts and must remain byte-for-byte unchanged in this commit.
- Add a running-specific pure grid projection bounded by `running.length`, available width, indent,
  gutters, marker chrome, complete package label, and elapsed suffix.
- Prefer the greatest row-major column count whose measured full cells fit. Reduce columns before
  shortening readable package identity; ellipsize only when a one-column cell still cannot fit.
- Preserve the existing height fallback ladder: context + grid + summary, grid + summary, reduced
  grid + summary, summary-only, then physically impossible omission with status-level aggregate
  truth.
- Do not distribute cosmetic whitespace merely to fill the row. Existing measured column maxima and
  canonical gutter own horizontal offsets.

Implementation seam:

- `m.run/u.reporter/u.grid.ts` owns running-cell intrinsic width and running-specific column choice.
- `m.run/u.reporter/u.layout.ts` consumes that projection without changing section priority or
  continuation truth.
- No scheduler, progress model, runtime, completed-grid, final-scrollback, or public API change is
  earned.

Acceptance:

- four running jobs render on one row whenever all four complete cells fit the measured width;
- a width that cannot preserve four complete cells reduces to three/two/one columns before label
  ellipsization;
- an overlong one-column label uses the existing terminal-cell-safe ellipsis;
- every partial running projection still satisfies `visible + hidden = retained` with the exact cyan
  continuation summary;
- wide → narrow → wide restores identical order, labels, and geometry;
- active completed recency, completed overflow, final adaptive columns, and final scrollback remain
  unchanged;
- focused width-boundary tests include ANSI-stripped/styled parity and a real wide-terminal probe.

Verification:

- focused reporter-layout proof passed 30 steps;
- full leak-traced `m.run` passed 161 steps;
- root presentation passed 10 steps;
- Workspace check, focused formatting/lint, and diff checks passed;
- a real `130 → 80 → 50 → 130` TTY probe confirmed adaptive contraction and exact restoration;
- final TMIND found and removed quadratic candidate scanning for very large explicit job counts by
  bounding the search with the terminal's maximum possible gutter count;
- a real interactive root run visually confirmed the complete integrated viewport with 53 selected
  packages, two retained failures, exact reruns, semantic colors, and ongoing final work.

### Post-arc final handoff: wrap statistics at semantic boundaries

Status: landed as `1d32b2b2f`.

- Final statistics wrap only between complete ` · `-separated facts, never inside phrases such as
  `not applicable`.
- Report capability states remain together when they fit as a group; narrower widths retain every
  fact over additional semantic rows without ellipsis.
- Exact 40- and 80-column projections, canonical ANSI styling, and physical width bounds are proven.
- Focused handoff proof passed 24 steps; full leak-traced `m.run` passed 162 steps; root presentation
  passed 10 steps; Workspace check, formatting, lint, and diff checks passed.

## Test matrix

### Projection

- one failed package retains its original `Package.Ran` identity;
- required `Package.Identity` carries manifest `name` and workspace `path` through ran, skipped, and
  blocked results without an optional/fallback lane;
- sequential, parallel, scheduler-event, aggregate `packages`, and aggregate `failure` observations
  agree on candidate-owned identity;
- a custom worker cannot override canonical candidate identity, but all non-identity worker result
  facts remain intact;
- completion-hang context consumes result identity directly and has no parallel package-name map;
- observed JUnit cases, counts, warnings, and messages remain reachable without copying or slicing;
- unsupported and unavailable stats remain unchanged;
- raw stdout/stderr, signal, exit, and elapsed facts remain unchanged;
- multiple concurrently failed packages are graph ordered;
- blocked and skipped packages are excluded;
- rerun input carries the workspace-relative cwd and actual result task.

### Formatting

- singular/plural package and test headings;
- live and compact package rows show observed failed count or exit/signal plus exact rerun only;
- live and compact output excludes case identities, messages, excerpts, stdout, and stderr;
- full output may add bounded observed failed cases and conservative ANSI-stripped excerpts;
- compact width at 40, 80, 100, and 160 cells;
- paths requiring width wrapping;
- rerun command remains exact and untruncated, relying on natural terminal wrapping for indivisible
  path tokens;
- compact mode excludes full streams;
- full mode includes complete streams;
- all bounded test-runner continuation summaries use exact `... +N more[ qualifier]` grammar,
  including full-handoff failed-test detail;
- continuation color proves green/yellow/red hidden-completion severity, cyan running state, and red
  hidden-package/failed-test state on the complete italic `+N` token;
- completed tone is derived from hidden items only, including cases where visible severity differs;
- singular/plural failed package and failed test qualifiers remain exact;
- continuation-summary assertions reject `...and`, `...+`, and Unicode `…` without banning canonical
  path ellipsization elsewhere;
- compact and full handoffs prove exact title → full-width result-colored rule → summary order at
  explicit widths for both success and failure;
- ANSI-stripped and canonically styled assertions jointly prevent textual, spacing, indentation,
  rule-width, or color-signal drift;
- authored multiline handoff/frame expectations use one `Str.dedent(...)` template after ANSI
  normalization; exact style assertions remain narrow to the color behavior under test;
- no repair heading on success;
- package-process failure with zero observed test failures remains visibly failed through
  exit/signal truth;
- output assertions normalize ANSI with `Cli.stripAnsi`.

### Lifecycle and viewport

- reporter start → finish → done → stop;
- reporter done → surrounding finally stop;
- duplicate stop is harmless;
- elapsed ticker and pending resize work are cleared;
- initial viewport comes from one Screen snapshot;
- resize adopts exact `event.after` width and height together;
- rapid resize transitions coalesce to the latest accepted viewport;
- failed `finish` immediately adds a minimal live item beneath the completed grid before `done`;
- later successful completions do not remove or obscure retained failed-package actions;
- status and running truth survive first, live failures receive space before elastic completed
  detail;
- a visible failure footer remains on stable bottom rows while completed detail consumes exact
  internal spacer rows above it;
- frames without a visible failure footer remain compact rather than receiving cosmetic height;
- running-specific columns expand to the greatest full-cell fit while completed-grid columns retain
  their existing policy;
- shrink → expansion restores retained completed summaries and live failure actions;
- more than 64 completed summaries produce truthful visible/hidden counts;
- copy/styling changes do not alter `visible + hidden = retained` at any tested viewport;
- constrained running projection never returns a visible subset without its hidden count; it reduces
  detail, renders summary-only, or omits the section, with terse-status truth asserted whenever that
  shortest aggregate physically fits;
- all-visible running/completed/failure projections render no continuation summary;
- styled continuation width equals stripped terminal-cell width at one-row and wrapping boundaries;
- successive terminal results enter the completed grid at top-left, move prior visible summaries
  down a column before flowing right, and move the oldest visible summary into bottom overflow;
- timer ticks and resize-only redraws do not perturb retained completion order;
- tiny width/height produces bounded output without negative budgets;
- acquisition rollback covers event factory, spinner factory, resize subscription, initial size,
  first frame, spinner start, and ticker failures without masking the initiating error; delayed
  redraw scheduling begins only after acquisition and remains cancelable/recoverable;
- no resize, timer, scheduler, or spinner work survives stop;
- final progress render occurs before stop;
- spinner text and persisted final repaint retain the exact styled frame without ANSI stripping or
  reconstruction;
- reporter does not write standalone diagnosis after stop;
- live frames contain no detailed diagnosis;
- completion-hang warning remains armed after final output.

### Root presentation

- help → no clear;
- parallel non-interactive → explicit log reporter + no clear + full handoff;
- parallel interactive → explicit screen reporter + one clear + immediate bottom-anchored minimal
  live failure footer + minimal compact handoff;
- omitted direct-API reporter mode → one automatic capability decision inside Workspace;
- sequential interactive and non-interactive → no reporter-mode effect + no clear + existing
  exhaustive result;
- clear occurs before graph/loading writes;
- success and failure both set the existing exit code correctly.

## Commit 5 original pre-implementation baseline proof

The exact touched seams and landed prerequisites were green before the viewport core implementation:

```text
cd code/sys/workspace
deno task test --trace-leaks \
  ./src/m.run/-test/-u.reporter.test.ts \
  ./src/m.run/-test/-u.progress.test.ts

cd ../../..
deno test -P=test --trace-leaks ./-scripts/-test/-task.test.test.ts

cd code/sys/cli
deno task test --trace-leaks \
  ./src/m.core/m.Screen/-test \
  ./src/m.core/m.Spinner/-test

cd ../../sys.driver/driver-vite
deno task test --trace-leaks \
  ./src/m.vite/-test/-u.dev.screen.runtime.test.ts \
  ./src/m.vite/-test/-u.dev.screen.test.ts
```

Result: Workspace reporter/progress passed 36 steps; the root script passed 5 steps; CLI
Screen/Spinner passed 31 steps; Driver Vite viewport runtime/layout passed 48 steps. This proves the
current recency model, root presentation policy, canonical terminal primitives, and calibrated
reference consumer before viewport ownership changes.

## Verification order

Use the narrowest declared module tasks first:

1. focused red proof for stable bottom footer position, exact spacer contraction, no-failure
   compactness, and resize restoration;
2. focused red proof for a four-job single row, full-cell width preference, narrow fallback, and
   unchanged completed geometry;
3. focused continuation-summary and final-handoff characterization tests;
4. focused reporter layout tests, including all running fallback tiers and hidden-set color cases;
5. focused handoff tests for failed-test continuation grammar/arithmetic plus title → rule → summary
   order, width, and result color;
6. focused reporter runtime proof for byte-identical styled spinner/repaint transport;
7. reporter-facade and progress-retention tests;
8. full `m.run` test subtree through the package task;
9. root script and help tests;
10. a small deliberate failing fixture runtime probe in both TTY and redirected modes;
11. live resize proof wide → narrow → wide and tall → short → tall, including visual confirmation of
    internal spacer clearing, footer stability, running-job columns, semantic count color, and final
    title/rule/summary hierarchy in the actual terminal theme;
12. full `@sys/workspace` test task;
13. root `deno task test` only after all scoped proof is green.

The original Commit 5 red proof established the missing clear, height, Screen-event, resize,
coalescing, stdout-spinner, and retained-reprojection behavior before the staged viewport core was
implemented.

The continuation and final-rule implementation was already present when this renewed review reached
the source, so this review cannot independently attest to its red step. Do not revert correct source
merely to manufacture one; record the red step as skipped unless prior execution evidence is
available.

The proof-hardening and residue-cleanup pass is complete:

- every continuation lane has exact stripped text and canonical style composition proof;
- running projection proves its full fallback ladder and conservation;
- completion tone is derived from hidden items when visible and hidden severities disagree;
- styled/stripped cell-width parity rejects old, cramped, and single-glyph summary grammar;
- styled frames pass byte-identically through spinner text and persisted repaint;
- compact/full title → exact-width result-colored rule → summary behavior is proven at multiple
  widths.

If any new characterization fails, that failure becomes the legitimate red for the smallest required
correction. Scheduler, recency-state, failure-handoff fidelity, sequential behavior, log stream
completeness, and Commit 6 package-name work otherwise remain unchanged.

If a terminal clear cannot be asserted reliably in-process, test the policy and call ordering
deterministically, then record the real TTY runtime probe separately. Do not fake an ANSI transcript
and call it runtime proof.

## Acceptance criteria

The work is complete when:

- interactive root parallel tests begin on a clean terminal;
- no other execution mode is cleared or acquires a resize listener;
- live progress has one viewport/lifecycle owner;
- Workspace uses canonical CLI Screen, Text, and stdout Spinner primitives without importing or
  generalizing Vite internals;
- active frames are width/height bounded and repaint cleanly on resize;
- viewport shrink never destroys completed summary state;
- completed projection is an explicit newest-first column-major recency window with truthful bottom
  overflow;
- a visible live failure footer is bottom-anchored without cursor-position probing, while no-failure
  frames remain compact;
- running jobs use the greatest measured full-cell column fit without changing completed-grid
  geometry;
- every bounded continuation summary uses exact `... +N more[ qualifier]` notation and retains
  semantic count color, qualifier truth, ANSI-safe width, and hidden-count arithmetic;
- running, completed, live-failure, and full failed-test continuation share one internal grammar
  without creating a public formatting API;
- no partial projection silently hides retained items, and impossible tiny viewports omit detail
  rather than misstate it;
- styled active frames survive spinner and final repaint transport byte-for-byte;
- every final handoff begins with title → exact-width result-colored rule → aggregate summary, with
  no second screen repaint;
- final detailed diagnosis has one owner and appears only in full/log output;
- while active, a minimal live failure footer remains below the completed grid and is
  bottom-anchored through exact internal spacer rows when it fits;
- live and final compact items contain only package, failed count or exit/signal, and exact rerun;
- failed native cases use structured identities only in full/log output when available;
- package/tool failures degrade honestly to exit/signal in minimal output and bounded evidence in
  full output;
- failures do not stop remaining selected package tests and stay actionable beneath the live
  completed-results list;
- every failed package can be rerun with one exact task-truthful `deno task --cwd` command without
  rerunning the workspace;
- every package result carries required authoritative manifest name + workspace path, failure fact
  rows use name, operational/detail rows retain their declared path semantics, and no
  completion-hang identity side channel remains;
- non-interactive parallel output retains complete failure streams;
- sequential output and inherited child diagnostics remain unchanged;
- no default test run waits for keyboard input;
- focused, package, script, and final workspace verification pass.

## Deliberate non-goals

- No scheduler architecture redesign beyond continuing launches and unlocking dependents after
  failed terminal results.
- No watch mode.
- No post-run prompt.
- No default keyboard listener.
- No alternate-screen buffer.
- No general child-output parser.
- No persistent failure artifact.
- No changes to JUnit collection capability.
- No changes to Vite dev reporter controls.
- No generic `Cli.Fmt` continuation-summary API, new formatting utility file, or public
  `WorkspaceRun.Fmt` member for the internal `... +N more` grammar.
- No global replacement of canonical path/text ellipsization; ASCII `...` is scoped to bounded
  continuation summaries only.
- No package version or full `t.Pkg` payload in run results, and no optional or path-derived name in
  the result contract. Defensive internal display fallback shows the path itself.
- No conversion of sequential execution logs, detailed failure headers, or buffered-output headers
  from path to package name; concise running/completed/result/repair rows own name presentation.
- No template-repo adoption of the `/sys`-specific parallel operator default; the template retains
  its generic sequential baseline unless that policy is changed separately.
- No replacement of Ora or expansion of `Cli.Screen` unless a concrete final-frame runtime probe
  proves the existing declared surfaces insufficient.
- No cursor-position query, speculative prelude-row budget, alternate-screen buffer, or
  root/reporter ownership bridge merely to preserve intro lines above a bottom-anchored active
  frame.
- No global widening of active/final completed grids as a side effect of running-job layout.
