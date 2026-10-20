@sys.cli
system-owned-spinner.plan.md
- [ ] feat(process): expose canonical stderr output
- [ ] fix(driver-vite): stop build feedback before failure output
- [ ] fix(tools): stop daemon feedback before clearing the terminal
- [ ] refactor(cli): replace Ora with an owned spinner runtime
- [ ] chore(deps): remove Ora from the workspace graph

## Purpose

Replace Ora behind `@sys/cli`'s existing spinner API with a small system-owned renderer and
lifecycle owner. Preserve established caller shapes and observed repository use while making
terminal ownership, redirected output, cleanup, Unicode width, resize behavior, and unsupported
concurrency explicit.

The target is a narrow spinner, not a terminal framework. Planning, review, and readiness do not
authorize implementation, dependency mutation, generated-file mutation, or Git mutation.

## Reviewed position

### DMIND

The real subject is not animation. It is one honest owner for transient terminal output. The simple
path should remain `Cli.spinner(text)` or `Cli.Spinner.with(...)`; deeper behavior belongs behind
that surface and must not leak streams, timers, Ora types, or a new renderer vocabulary into
callers.

System ownership is a good fit only while the implementation remains smaller in responsibility than
Ora. A symmetric stderr capability in `@sys/process` is earned because the spinner already promises
semantic stdout/stderr targeting and duplicating complete-write logic inside `@sys/cli` would create
a second process-output owner.

### TMIND adjudication

Adversarial review found material corrections to the preliminary design:

- Exclusive-output ownership is not yet true for every known consumer. In
  `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts`, failure diagnostics and an optional direct
  `Deno.exit(1)` occur before the outer `finally` stops the spinner. In
  `code/sys.tools/src/cli.crdt/cmd.repo.daemon/u.daemon.ts`, a later screen refresh can call
  `console.clear()` while the existing spinner is active. Ora currently masks both gaps by hooking
  process streams. Those callers must hand off the terminal before Ora is removed.
- Redirected-output deduplication based on equal labels was rejected. Equal text can identify two
  real retries, and Ora currently emits one append-only start record per invocation. Preserve that
  event boundary while deliberately stripping ANSI from redirected output.
- Universal resize correctness was rejected as an overclaim. Relative cursor clearing cannot prove
  every terminal emulator's reflow behavior after a resize. The supported model is a normal
  reflowing terminal, with deterministic virtual-terminal proof and live smoke evidence. Existing
  full-screen owners continue to stop the spinner before repainting on layout changes.
- Automatic coexistence with arbitrary writes was rejected because it recreates Ora's stream hooks,
  partial-write deferral, backpressure handling, and global coordination. Known callers must hand
  off explicitly; unknown concurrent output remains unsupported.
- Spinner removal does not prove broad Pi-help import isolation or remove Chalk inherited through
  upstream Pi. The spinner module receives its own cold-import proof; broader help-graph isolation
  remains separately owned.

**Review result:** proceed with the corrected bounded design. Stop and reconsider Ora if the
consumer audit finds a required output source that cannot be made to hand off narrowly, or if
supported live terminals cannot clear resized multiline frames without damaging prior output.

## Baseline contract

Preserve these public types and call shapes from `code/sys/cli/src/m.core/m.Spinner/t.ts`:

- `Spinner.create(text?, { target? })` returns a dormant instance;
- `Spinner.start(text?, { target?, silent? })` creates and conditionally starts one instance;
- `Spinner.with(text, run, options?)` always calls `stop()` after the callback settles;
- `Instance.text` remains mutable;
- `start`, `stop`, `succeed`, and `fail` remain fluent and return the same instance;
- output target remains `'stdout' | 'stderr'`, defaulting to stderr;
- `silent` suppresses only the helper's initial automatic `start`; it does not permanently silence
  the returned instance.

No Ora type, raw stream, frame configuration, interval configuration, cursor option, or `isSpinning`
property enters the public type plane.

Observed consumers additionally establish these compatibility requirements:

- an active `start(text)` updates text without creating another timer;
- a stopped instance can start again and resets animation to its first frame;
- repeated `stop`, including after `succeed` or `fail`, is safe;
- dormant `succeed` and `fail` still persist a result;
- multiline and ANSI-styled labels are supported, including labels with leading or trailing newlines
  from `Cli.Fmt.spinnerText`;
- long-lived instances can serve sequential phases;
- explicit stdout spinners can be coordinated with `Cli.Screen.repaint` by stopping first;
- the spinner never captures, reads, pauses, or otherwise owns stdin.

## Selected design

### Host output

Add `Process.stderr` as the symmetric counterpart of `Process.stdout`:

- both expose only `isTerminal(): boolean` and complete synchronous UTF-8 `write(text): void`;
- both hide the raw host stream;
- terminal-query failure returns false;
- partial writes are completed or fail with a stable output-neutral error;
- constructing/importing the capability does not query terminal state or write bytes.

Refactor only enough shared implementation to prevent duplicated encoding and write-all logic.
Preserve `Process.stdout` identity, call shape, behavior, and source compatibility.

### Runtime boundary

Keep the spinner's effect adapter package-private and injectable. It resolves:

- the selected `Process.stdout` or `Process.stderr` capability;
- one spinner terminal result through `Cli.Is.terminal(target)`;
- width through `Cli.Fmt.Text.Width.fit({ stream: target, terminal })`, passing that resolved result
  rather than probing terminal state twice;
- recurring animation through `Time.interval`;
- complete output through the selected process capability.

Module evaluation and `Spinner.create` perform no write, terminal query, size query, timer creation,
stdin access, environment read, or signal registration. The first effectful terminal method resolves
the runtime facts it needs.

### TTY rendering

Preserve the current fixed animation rather than importing capability-detection policy:

- frames: `⠋`, `⠙`, `⠹`, `⠸`, `⠼`, `⠴`, `⠦`, `⠧`, `⠇`, `⠏`;
- interval: 80 ms;
- frame color: cyan;
- success marker: green `✔`;
- failure marker: red `✖`.

The current wrapper supplies its own Unicode frame object to Ora, so Ora's spinner-level Unicode
fallback is already bypassed. Do not add locale or environment probing to guess Unicode support.

For an idle TTY instance, `start(text?)`:

1. applies an explicitly supplied text value;
2. acquires the process-local spinner lease before cursor or timer acquisition;
3. hides the cursor and renders frame zero immediately;
4. starts exactly one interval only after the first render succeeds.

For an already-active instance, `start(text?)` only applies supplied text and returns. Direct text
assignment and active `start(text)` become visible on the next scheduled frame, matching Ora's
bounded update latency without timer churn. Starting after `stop` reacquires ownership and begins at
frame zero.

Each render writes one synchronized-output transaction that clears the previous transient region,
writes the next frame, and resets terminal styling. `stop` cancels the interval before output
cleanup, clears the transient region, restores the cursor, releases the lease, and returns the
instance. `stop` is idempotent.

`succeed(text?)` and `fail(text?)` select the supplied text when present or current text otherwise,
perform complete stop cleanup, then write one persistent newline-terminated result. A trailing
newline already present in the label remains meaningful spacing, matching current formatter use.
Calling either method while dormant still writes its result, and a later `stop` remains a no-op.

### Row accounting and resize

Retain the exact last rendered presentation text. For each explicit newline-delimited row:

- measure visible terminal cells with `Cli.Fmt.Text.Width.measure`;
- ignore ANSI presentation sequences through that canonical owner;
- count at least one physical row;
- account for natural wrapping against a positive current width;
- include leading, blank, and trailing logical rows.

Before clearing after a width change, recompute the previous frame's physical occupancy at the
current width, reflecting normal terminal reflow. Do not subscribe to resize events inside the
spinner; the 80 ms render loop and final cleanup remeasure as needed, while existing full-screen
reporters retain their explicit resize lifecycle.

This plan does not promise correctness for non-reflowing emulators, cursor-position-changing label
control sequences, content taller than the viewport, or alternate-screen ownership. Do not add
viewport truncation, hard-wrap rewriting, absolute cursor positioning, terminal queries through
stdin, or a generic layout engine. Existing whole-screen consumers must continue fitting their own
frames to the viewport.

### Redirected output

When the selected target is not a TTY:

- create no timer and emit no cursor or ANSI control sequences;
- each `start()` invocation with non-empty current text writes one plain `- text\n` record, even if
  the same text was previously emitted;
- direct `text` assignment emits nothing;
- `stop()` emits nothing;
- `succeed()` writes one plain `✔ text\n` record;
- `fail()` writes one plain `✖ text\n` record;
- strip ANSI from the complete emitted record while preserving caller newlines and Unicode text.

This intentionally preserves Ora's per-start append-only event boundary while correcting redirected
ANSI leakage. No hidden label-equality deduplication or synthetic persistent activity state is
added.

### Ownership and concurrency

Only one TTY spinner may be active in the process across stdout and stderr. A second distinct
instance attempting to start while the lease is held throws one stable ownership error before
acquiring a cursor or timer and leaves the first spinner untouched. Repeated `start` on the owning
instance remains idempotent. Redirected instances do not take the TTY lease.

An active spinner exclusively owns transient terminal presentation. Do not monkeypatch
`console.log`, `console.info`, `console.error`, stdout, stderr, or arbitrary third-party streams.
Callers must stop before console output, screen clear/repaint, inherited child output, prompts, or a
direct process exit. The implementation audit must revisit every repository spinner consumer; any
additional real handoff correction requires a truthful owner-scoped arc refinement before the Ora
replacement lands.

### Failure and cleanup

- First-render failure performs best-effort cursor restoration and lease release, creates no timer,
  and rethrows the original failure.
- A scheduled render failure cancels its interval, performs best-effort transient clear and cursor
  restoration, releases the lease, then rethrows to the host exactly once.
- Cleanup attempts interval cancellation, clear, cursor restoration, and lease release even when an
  earlier step fails; it rethrows the first cleanup failure after later cleanup attempts.
- Final-result write failure occurs only after active resources and the cursor have been released.
- No spinner-owned interval, resize listener, signal listener, stream hook, drain listener, or stdin
  resource survives a terminal path.
- `Spinner.with` retains ordinary `try/finally` behavior and does not invent a new dual-failure
  error contract.

Do not install process-exit or signal handlers. Cooperative owners must call `stop` or use `with`;
the consumer corrections remove the known direct-exit violation before this capability is dropped.

### Import and dependency isolation

Add a denied-permissions process fixture proving that importing the Spinner module and constructing
a dormant instance causes no output, timer, terminal query, stdin access, environment access,
process launch, or Pi launch. Keep this claim narrow: broad `@sys/cli` and Driver Pi help graphs
have other owners and pre-existing initialization behavior.

After the runtime replacement is proved, remove Ora only through canonical dependency authority:
edit `deps.yaml`, run the root `deno task prep`, and inspect generated outputs. Do not hand-edit
`imports.json`, generated package metadata, or lockfile entries. Prove Ora is absent from the
`@sys/cli` graph. Do not claim Chalk is absent from the workspace while upstream Pi still owns it.

## Invariants

- Existing public spinner signatures and fluent identity remain source-compatible.
- The default target is stderr; stdout is selected only explicitly.
- Import and creation are cold; terminal effects begin only at an effectful instance method.
- No code path references or owns stdin.
- One instance owns at most one interval and one process-local TTY lease.
- Every acquired timer, cursor-hide state, and lease has exactly one terminal cleanup owner.
- Repeated stop and post-result stop cannot clear unrelated output or restore another owner's
  cursor.
- ANSI-aware Unicode cell width has one owner: `Cli.Fmt.Text`.
- Complete host writes have one owner: `@sys/process`.
- Redirected output is append-only, control-free, and animation-free.
- TTY repaint payloads are synchronized and never publish a standalone whole-screen clear.
- Known screen owners stop before `Cli.Screen.repaint` or `console.clear`.
- Unknown concurrent writes and multiple independently animated spinners are rejected or outside the
  contract, never silently advertised as supported.
- Removing Ora does not widen the spinner API or the Pi/help isolation claim.

## `feat(process): expose canonical stderr output`

### Target surface

- `code/sys/process/src/m.process/t.proc.ts`;
- `code/sys/process/src/m.process/m.Process.ts`;
- the existing `code/sys/process/src/m.process/u/u.stdout.ts` implementation boundary, generalized
  or complemented without parallel write-all logic;
- process output and namespace-freeze tests.

### Required behavior

Expose a frozen `Process.stderr` capability symmetric with `Process.stdout`. Preserve stdout
identity and behavior, keep raw runtime streams private, complete partial UTF-8 writes, fail on
stalled writes, and defer terminal detection until `isTerminal()` is called. Name shared behavior as
host text output rather than making stderr pretend to be stdout.

### Proof

Prove stdout and stderr assembly, public types, frozen composition, selected stream isolation,
terminal true/false/throw behavior, Unicode encoding, partial writes, stalled writes, and zero
writes or terminal queries during import/construction. Run focused proof, `deno task check`,
`deno task test`, and `deno task dry` from `code/sys/process`.

## `fix(driver-vite): stop build feedback before failure output`

### Target surface

- `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts`;
- focused build failure/lifecycle tests under `code/sys.driver/driver-vite/src/m.vite/-test/`.

### Required behavior

Cancel elapsed feedback and stop the spinner before any Vite failure diagnostic reaches stderr and
before optional `Deno.exit(1)`. Preserve successful cleanup, failure result shape, exact
diagnostics, exit policy, and idempotent outer-finally cleanup. Do not refactor build orchestration
or change child capture policy.

### Proof

Use injected or captured events to prove timer cancellation and spinner stop precede the first
failure write and direct exit, each cleanup occurs at most once semantically, success remains
unchanged, and cleanup still runs for thrown computation failures. Run focused proof,
`deno task check`, and `deno task test` from `code/sys.driver/driver-vite`.

## `fix(tools): stop daemon feedback before clearing the terminal`

### Target surface

- `code/sys.tools/src/cli.crdt/cmd.repo.daemon/u.daemon.ts`;
- the narrowest CRDT daemon presentation test seam under `code/sys.tools/src/cli.crdt/`.

### Required behavior

When a refresh will clear the terminal, stop the active spinner before `console.clear()`, then
render or restart from the new state. Preserve retry timing, event logging, no-clear mode, shutdown,
long-lived repository ownership, and the existing alive/stalled screen. Do not build a shared screen
coordinator merely to test this transition.

### Proof

Prove clear is never called while spinner feedback is active, repeated stalled refreshes restart one
spinner cleanly, the alive transition stops before static output, no-clear mode avoids unnecessary
clear ownership, and shutdown leaves feedback stopped. Run focused proof, `deno task check`, and
`deno task test` from `code/sys.tools`.

## `refactor(cli): replace Ora with an owned spinner runtime`

### Target surface

- `code/sys/cli/src/m.core/m.Spinner/mod.ts` and package-private implementation seams beneath it;
- `code/sys/cli/src/m.core/m.Spinner/t.ts` documentation without widening its type surface;
- `code/sys/cli/src/m.core/m.Spinner/-test/` deterministic runtime, rendering, lifecycle, and import
  proofs;
- `code/sys/cli/src/m.testing/m.FakeSpinner.ts` only if contract parity requires a correction;
- representative stdout screen and sequential-phase consumer tests.

### Required behavior

Implement the selected TTY, redirected, lifecycle, lease, resize, Unicode, and failure semantics
over `Process.stdout`, `Process.stderr`, `Time.interval`, `Cli.Is`, `Cli.Screen`, and
`Cli.Fmt.Text`. Keep pure layout/state logic separate from injected effects, but do not publish a
renderer, stream, timer, or platform API. Remove every Ora import and Ora-internal test dependency,
including `NODE_ENV` mutation and `_stream` inspection.

### Deterministic proof

Use injected writers, terminal predicates, width sources, timers, and a bounded virtual-terminal
model to prove:

- exact default stderr and explicit stdout selection;
- zero effects at import and creation;
- first-frame timing, all frame transitions, cyan frame output, active-start idempotency, text
  update, stop/restart, and one-timer ownership;
- leading, blank, trailing, multiline, wrapped, and ANSI-styled labels;
- combining marks, variation selectors, emoji sequences, CJK, Hangul, and exact-width boundaries;
- wide-to-narrow and narrow-to-wide reflow clearing without stale rows in the supported terminal
  model;
- synchronized payload ordering, ANSI reset, success/failure persistence, and fluent identity;
- exact redirected stdout/stderr bytes, repeated equal starts, ANSI stripping, and no control bytes;
- silent helper semantics and dormant result methods;
- idempotent stop, post-result stop, stop/restart, and `with` resolve/reject cleanup;
- competing-instance rejection without disturbing the owner;
- first-write, partial-write, scheduled-render, clear, cursor-restore, and final-write failures;
- best-effort cleanup ordering, exactly-once asynchronous failure publication, and no timer/lease
  leak;
- absence of stdin, signal, stream-hook, drain, and resize-listener activity.

### Runtime and consumer proof

- Run a denied-permissions cold-import fixture with no prompt and all read, write, net, env, sys,
  run, and FFI authority denied.
- In a real supported terminal, exercise default stderr and explicit stdout, multiline labels,
  trailing-newline spacing, resize in both directions, restart, success, failure, thrown `with`
  work, and first-interrupt `Ctrl+C`; record cursor restoration and absence of stale rows.
- Re-audit all repository spinner consumers for console writes, clear/repaint, inherited stdio,
  direct exit, multiple active instances, and timers acquired before spinner start.
- Re-run representative stdout reporter tests in `@sys/workspace`, `@sys/cell`, and
  `@sys/driver-vite`, plus sequential-phase and dynamic-label consumers in `@sys/workspace`,
  `@sys/tools`, and `@sys/driver-deno`.
- Run focused Spinner tests, then `deno task check`, `deno task test`, and `deno task dry` from
  `code/sys/cli`.

## `chore(deps): remove Ora from the workspace graph`

### Target surface

- canonical `deps.yaml`;
- generated dependency artifacts produced by the root preparation task;
- `@sys/cli` and workspace dependency graphs.

### Required behavior

Remove the Ora declaration only after no source or test imports it. Run the root `deno task prep` to
regenerate dependency surfaces, preserve unrelated dependency versions, and remove only Ora and
transitives that no remaining graph reaches. Do not hand-edit generated outputs and do not remove or
relabel Chalk when it remains reachable through upstream Pi.

### Proof

From the repository root, run `deno task prep`, `deno task check:graph`, and the final workspace
check. Inspect `deno info code/sys/cli/src/mod.ts` and canonical/generated dependency deltas.
Confirm no `ora` import remains in source, `deps.yaml`, `imports.json`, or reachable lock graph,
while every remaining removed transitive is genuinely unreachable. Re-run `@sys/cli` check, tests,
and dry publication after regeneration.

## Verification order

Run the narrowest owner proof first, then owner package proof, then dependents:

1. `@sys/process` output tests, check, full tests, and dry publication;
2. Driver Vite build-failure tests, check, and full tests;
3. Sys Tools CRDT daemon tests, check, and full tests;
4. `@sys/cli` Spinner tests, denied-permissions entry proof, check, full tests, and dry publication;
5. representative and then full tests for `@sys/workspace`, `@sys/cell`, `@sys/driver-deno`,
   `@sys/driver-vite`, `@sys/tools`, and Driver Pi profiles/help;
6. root dependency preparation, graph inspection, and final workspace check.

Record exact commands and outcomes actually observed. Do not infer TTY behavior from injected tests,
infer import isolation from source inspection alone, infer dependency absence from `deps.yaml`
alone, or present Pi's retained Chalk dependency as spinner residue.

## Planning baseline

A pre-plan `@sys/cli` test invocation completed with 50 passed and 0 failed. The attempted forwarded
Spinner scope expanded through the package's composite `test` task into the broader CLI suite, so it
is a green package baseline, not focused Spinner proof.

The worktree already contains unrelated tracked and untracked changes. Preserve them and establish
path/hunk attribution before any future implementation or plan reconciliation. This plan grants no
Git-mutation authority.

## Strongest case for retaining Ora

Retain Ora if the actual contract requires transparent coexistence with arbitrary stdout/stderr
writes, multiple animated instances, inherited child output, partial-line deferral, stream
backpressure/drain handling, viewport truncation, automatic Unicode-capability selection, or
process-exit cursor restoration. Ora already owns those behaviors and their cross-platform edge
cases. Reimplementing them would turn this plan into a terminal coordination framework, erase the
maintenance advantage, and make the dependency removal aesthetic rather than architectural.

The replacement is justified only for controlled system CLIs whose owners can hand off the terminal
explicitly and accept the bounded supported-terminal model.

## Non-goals

- no new public spinner options, events, state getters, frame configuration, or renderer surface;
- no stdin capture, keyboard ownership, signal handling, process-exit hook, or alternate-screen
  mode;
- no monkeypatching of console or process streams;
- no arbitrary concurrent-write or multi-spinner compositor;
- no generic terminal lease, logging bus, viewport renderer, or output transaction framework;
- no label control-sequence sanitizer or change to existing trust assumptions for caller text;
- no viewport-height truncation or promise for content taller than the terminal;
- no broad prompt, Screen, formatter, workspace reporter, or daemon redesign;
- no claim that every terminal emulator reflows identically;
- no broad Driver Pi help-import restructuring or permission-policy redesign;
- no removal of Chalk or other dependencies still reached independently of Ora;
- no manual edits to generated dependency files;
- no unrelated consumer cleanup without a demonstrated spinner-ownership requirement.
