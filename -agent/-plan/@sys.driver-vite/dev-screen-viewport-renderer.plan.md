# Vite dev screen viewport renderer plan

- [x] b052e4f83 refactor(cli): isolate screen measurement and resize observation
- [x] 0e56910b9 fix(cli): emit truthful terminal size transitions
- [x] 3c48e8586 fix(cli): make terminal text fitting cell-aware
- [x] 87f4b4ea9 refactor(cli): canonicalize table type namespace
- [x] 9833f2132 refactor(cli): canonicalize helper type namespaces
- [x] 9de396c5c refactor(cli): canonicalize formatter type namespaces
- [x] 1a806c709 refactor(cli): namespace text width and wrapping helpers
- [x] 67fe9739a feat(cli): render styled ellipses without sentinels
- [x] 2deec18c5 refactor(driver-vite): centralize dev screen render lifecycle
- [x] 777afd0d8 feat(driver-vite): fit dev screen rendering to the terminal viewport
- [x] 221426360 feat(process): expose canonical host stdout
- [x] d325aae92 feat(cli): repaint terminal frames without blanking
- [x] 9588b4e45 fix(driver-vite): avoid clear-before-render dev frames

Plan status: **complete**. The responsive Driver Vite renderer, canonical host stdout, stateless CLI
repaint, and semantic Driver repaint integration have landed through `9588b4e45`. Focused proof,
package checks, dry-publishes, and live resize review are complete. Live review confirms that
terminal-native resize reflow and Ora coordination may still produce visible flicker; the accepted,
portable guarantee is narrower and truthful: Driver Vite never issues a whole-screen clear or a
separable blank frame before rendering replacement content.

Execution status: **TMIND closed**. One reporter remains the sole phase, scheduler, spinner,
terminal-effect, acquisition, resize, and disposal owner. No retained renderer, debounce,
alternate-screen mode, terminal-specific branch, or generic TUI framework is justified by the
accepted residual presentation behavior.

## Purpose

Harden `Cli.Screen` as a truthful, lifecycle-safe resize substrate, then make the Vite dev reporter
a single responsive screen renderer whose width and height behavior remains correct throughout
startup, ready-state logging, user actions, terminal resize, and disposal.

The target is an S-tier internal architecture. The final viewport behavior must extend the landed
single-reporter lifecycle, not become an isolated resize callback beside it. A repaint may replace
one complete frame with another, but must never publish an empty intermediate screen.

## Scope

Packages:

- `@sys/process`
- `@sys/cli`
- `@sys/driver-vite`

Primary files involved across the landed arc and final viewport cut:

- `deps.yaml`
- `code/sys/process/README.md`
- `code/sys/process/src/common/libs.ts`
- `code/sys/process/src/m.process/-test/-u.stdout.test.ts`
- `code/sys/process/src/m.process/m.Process.ts`
- `code/sys/process/src/m.process/mod.ts`
- `code/sys/process/src/m.process/t.proc.ts`
- `code/sys/process/src/m.process/t.ts`
- `code/sys/process/src/m.process/u/u.stdout.ts`
- `code/sys/process/src/mod.ts`
- `code/sys/process/src/types.ts`
- `imports.json`
- `deno.lock`
- `code/sys/cli/src/common/libs.ts`
- `code/sys/cli/src/m.core/t.ts`
- `code/sys/cli/src/m.core/m.Cli/t.ts`
- `code/sys/cli/src/m.core/m.Screen/t.ts`
- `code/sys/cli/src/m.core/m.Keyboard/t.ts`
- `code/sys/cli/src/m.core/m.Input/t.ts`
- `code/sys/cli/src/m.core/m.Input/t.menu.ts`
- `code/sys/cli/src/m.core/m.Prompt/t.ts`
- `code/sys/cli/src/m.core/m.Is/t.ts`
- `code/sys/cli/src/m.core/m.Table/t.ts`
- `code/sys/cli/src/m.core/m.Spinner/t.ts`
- `code/sys/cli/src/m.core/m.Spinner/mod.ts`
- `code/sys/cli/src/m.core/m.Spinner/-test/-.test.ts`
- `code/sys/cli/src/m.core/u/t.ts`
- `code/sys/cli/src/m.shell/t.ts`
- `code/sys/cli/src/m.core/m.Fmt/t.ts`
- `code/sys/cli/src/m.core/m.Fmt/t.help.ts`
- `code/sys/cli/src/m.core/m.Fmt/t.commit.ts`
- `code/sys/cli/src/m.core/m.Fmt.Code/t.ts`
- `code/sys/cli/src/m.core/m.Fmt.Chapters/t.ts`
- `code/sys/cli/src/m.core/m.Screen/u.measure.ts`
- `code/sys/cli/src/m.core/m.Screen/u.platform.ts`
- `code/sys/cli/src/m.core/m.Screen/u.size.ts`
- `code/sys/cli/src/m.core/m.Screen/u.events.ts`
- `code/sys/cli/src/m.core/m.Screen/u.repaint.ts`
- `code/sys/cli/src/m.core/m.Screen/-test/-u.repaint.test.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/u.width.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/u.ellipsize.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/t.ts`
- `code/sys/cli/src/m.core/m.Screen/mod.ts`
- `code/sys/cli/src/m.core/m.Cli/-test/-.test.ts`
- `code/sys.driver/driver-vite/deno.json`
- `code/sys.driver/driver-vite/src/m.vite/t.internal.ts`
- `code/sys.driver/driver-vite/src/m.vite/u/u.dev.ts`
- `code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.ts`
- `code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.layout.ts`
- `code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.runtime.ts`
- `code/sys.driver/driver-vite/src/m.vite/u/u.dev.output.ts`
- `code/sys.driver/driver-vite/src/m.vite/u/u.keyboard.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/-u.dev.screen.runtime.test.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/-u.dev.screen.test.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/-dev.test.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/-u.keyboard.test.ts`

The Vite implementation now has definite internal factor boundaries:

- `u.dev.screen.ts` - stable internal facade;
- `u.dev.screen.layout.ts` - frame layout and formatting owner;
- `u.dev.screen.runtime.ts` - phase, scheduler, terminal sink, spinner, and disposal ownership.

Commit `777afd0d8` added resize and explicit viewport ownership to those established boundaries.
Commit `9588b4e45` changed only the terminal commit effect.

Do not create a new public module or package. The amendment added only canonical
`Process.stdout.isTerminal()`/`write(text)` transport and the stateless `Cli.Screen.repaint(frame)`
operation on existing modules.

## Current reality

### `Cli.Screen`

The public shape now includes:

```ts
Cli.Screen.size();
Cli.Screen.events(until).resize$;
Cli.Screen.repaint(frame);
```

Commit `b052e4f83` landed the behavior-preserving isolation seam. Commit `0e56910b9` then landed
truthful transition semantics:

- `u.measure.ts` is the single owner of raw finite-positive terminal-dimension normalization;
- `u.platform.ts` owns Deno/Node measurement and explicit attached/unsupported resize observation;
- `u.size.ts` applies deterministic per-dimension fallback without turning fallback into transition
  evidence;
- `u.events.ts` attaches before baseline measurement, emits only complete changed sizes, updates
  accepted state before delivery, and owns exact-once teardown;
- manual, upstream, prior, synchronous, unsupported, re-entrant, initialization-failure, and
  late-subscriber lifecycle cases are proven;
- focused Screen verification at landing passed with leak tracing: 4 files, 25 steps;
- the latest landed full CLI proof passed: 34 tests, 191 steps.

The measurement, observation, and Text substrate is complete. Commit `67fe9739a` landed canonical
clipped-part rendering and removed sentinel substitution before the Driver Vite lifecycle cut.
Commit `221426360` then landed canonical `Process.stdout`, and commit `d325aae92` landed
`Cli.Screen.repaint(frame)` over that substrate. Repaint replaces stdout terminal rows without
publishing a blank intermediate screen, but Driver Vite does not yet call it.

### Vite dev reporter

Commit `2deec18c5` landed the behavior-preserving lifecycle centralization:

- one reporter owns the explicit `startup → ready → disposed` state machine;
- `u.dev.screen.runtime.ts` solely owns scheduling, spinner state, presentation state, terminal
  effects, transitions, and disposal;
- `u.dev.screen.layout.ts` owns startup and ready frame construction and formatting;
- `u.dev.ts` reports domain events without startup/ready repaint routing;
- content work coalesces, layout work dominates it, readiness absorbs stale startup work, and
  post-disposal operations are inert;
- production uses only declared `Cli.Spinner.Instance` members, with transactional acquisition and
  exhaustive cleanup.

Commit `777afd0d8` landed the viewport implementation directly on that lifecycle:

- one reporter-owned `Cli.Screen.events(until).resize$` subscription adopts independent exact copies
  of `event.after` and coalesces rapid transitions as dominant layout work;
- runtime retains one exact viewport snapshot and feeds it explicitly into every frame calculation;
- layout performs no ambient Screen measurement and reconstructs complete startup or ready output;
- startup regions share one calculation that budgets header, spinner, cursor, metadata, separator,
  and elastic logs from generated region lengths rather than mirrored row-count constants;
- ready layout budgets generated core, operational options, extended workspace detail, and
  retained-log projection by explicit priority;
- shrink alters projection only, so expansion reveals retained recent output again;
- clearing, Ora, startup output, and ready output share stdout through the declared
  `CliSpinner.Create.Options` target;
- resize acquisition, scheduling, spinner state, and cleanup remain transactional and terminal.

The transport defect was live-confirmed before integration: human resizing exercised the original
split clear/print path and showed repeated blank flashes, especially while shrinking combined
terminal reflow with resize-driven clear operations. The landed runtime exposes one terminal
`repaint(frame)` effect backed by `Cli.Screen.repaint`, repaints startup headers only after stopping
Ora, and commits each ready frame through one repaint. Production dev-screen runtime and focused
proof contain no split clear/print effect. Post-integration live review still observes flicker while
resizing. TMIND accepts this as terminal-native reflow, optional synchronized-output support, and
Ora's independently owned startup rows—not evidence that Driver Vite publishes the removed
application-level blank state.

## TMIND design review

### Keep

- `Cli.Screen` as the owner of terminal size and resize observation.
- `{ before, after }` as the size-transition payload.
- `resize$` as the focused consumer stream.
- Consumer-owned coalescing; the Screen primitive must not debounce OS events.
- Pure width-aware formatting and ANSI-visible-width checks.
- Bounded retained output independent from the number of rows currently visible.
- Raw Vite passthrough behavior outside parent-owned screen mode.

### Reject

- Adding an isolated resize subscription beside the existing startup and ready handles.
- Registering one resize listener per reporter phase.
- Teaching `u.dev.ts` how startup terminal repaint mechanics work.
- Leaving startup header repaint as a special-case callback.
- Reaching into optional/private spinner methods.
- Measuring terminal dimensions independently in several functions during one frame.
- Treating configured `logLines` as a fixed row count that can force vertical overflow.
- Discarding retained log rows merely because the terminal is temporarily short.
- Building a general terminal UI framework for this one reporter.

## Design invariants

### Screen observation

1. A platform resize notification means "remeasure", not "size changed".
2. `size:changed` emits only when width or height differs from the last accepted measurement.
3. `before` is the last accepted measured size; `after` is the new measured size.
4. Failed or unavailable measurements do not create fictional transitions.
5. Lifecycle cleanup is registered before upstream `until` binding or platform listener attachment.
6. Listener attachment precedes baseline measurement so the observation window is not opened late.
7. No transition emits until one complete valid baseline exists.
8. Exactly one platform listener exists per live event handle.
9. Disposal removes that listener exactly once and explicitly completes the event subject.
10. Early and late stream subscribers observe lifecycle completion.
11. An already-terminated stateful input, such as a disposed lifecycle or aborted signal, never
    leaves a listener attached or an apparently live stream. A non-replaying observable cannot
    reveal emissions that occurred before subscription and is not treated as stateful.
12. Known lack of platform resize support returns a valid inert event handle; arbitrary registration
    failures are not silently swallowed.
13. Listener acquisition is transactional: an initialization failure disposes constructed state
    before the error is rethrown.
14. The production adapter and transition kernel are separable enough for deterministic tests
    without sending process-global signals.

### Screen repaint

1. Repaint accepts one complete frame and targets the same stdout terminal used for measurement and
   resize observation.
2. TTY repaint publishes one preconstructed write payload and never emits erase-entire-display
   before frame content.
3. Each frame row is addressed and erased before replacement; terminal rendition is reset around
   authored styled rows, and stale rows below the complete frame are erased afterwards.
4. Repaint leaves the cursor at column one on the first row below the frame, matching one explicit
   sink cursor row in layout budgets.
5. Synchronized-output control brackets a TTY payload but is never required for nonblank fallback
   correctness.
6. Repaint is a full-visible-viewport operation whose caller owns terminal rows from origin; it is
   not an inline-region or prompt-preserving writer.
7. Repaint does not hide/show the cursor, enter alternate-screen mode, clear scrollback, measure the
   viewport, clip text, retain a prior frame, or schedule work.
8. Non-TTY repaint strips ANSI and emits plain frame text plus one newline with no terminal-control
   sequences.
9. Production writing and pure payload construction are separable for deterministic one-write and
   byte-order tests.

### Dev screen runtime

1. One reporter session owns startup, ready transition, resize observation, redraw scheduling,
   spinner lifecycle, terminal output, and cleanup.
2. `u.dev.ts` reports domain events such as output change and readiness; it does not choose terminal
   repaint mechanics.
3. One resize subscription exists for the reporter session.
4. One coalescing scheduler exists for the reporter session.
5. Layout invalidation dominates content-only invalidation when both are pending.
6. Pending work never captures a stale phase; each flush reads current reporter state.
7. `ready()` absorbs or cancels pending startup work before one immediate ready render.
8. A render uses one immutable viewport snapshot: width and height come from the same accepted
   screen size.
9. Pure layout functions receive the viewport explicitly and perform no ambient terminal
   measurement.
10. Startup → ready is an explicit one-way transition; disposed is terminal.
11. Disposal first marks the reporter disposed, then exhaustively attempts pending-work
    cancellation, resize unsubscription/event disposal, and spinner stop even if an earlier cleanup
    action fails.
12. Runtime rendering uses only declared dependency contracts.
13. Each resize adopts an independent exact copy of `event.after` before requesting layout work.
    Rapid transitions may coalesce, but the eventual repaint always uses the latest accepted
    viewport.
14. Runtime exposes one semantic repaint effect; separable clear and print effects are absent from
    its terminal dependency.
15. The existing bounded scheduler remains the first pacing policy. Timing changes require a
    separate failing live proof after nonblank transport is installed.

### Viewport layout

1. Every rendered row is bounded by terminal-cell width, not JavaScript string length.
2. Total physical frame rows, including sink newline/cursor cost, are bounded by terminal height.
3. Viewport observation, nonblank repaint, spinner output, startup output, and ready output belong
   to one stdout terminal session.
4. Core package identity and URL/input/output metadata have higher vertical priority than optional
   detail and logs.
5. `logLines` remains the operator-configured maximum, not a promise to render that many rows.
6. Visible log rows are:

```text
min(configured log maximum, rows remaining after fixed frame content)
```

7. Startup budgeting includes its header, primary rule, spinner row, sink cursor cost, metadata,
   separator, and visible logs.
8. Ready budgeting includes header, sink cursor cost, optional detail/options content, metadata,
   separator, and visible logs.
9. Logs are the first elastic region: shrinking the terminal hides older visible rows before fixed
   frame structure is allowed to overflow.
10. Optional detail is locally bounded after logs reach zero; it must not displace core metadata.
11. Height adaptation changes presentation only. It does not delete rows from `DevOutputLog`;
    expanding the terminal can reveal the retained recent rows again.
12. A final frame clip remains a safety invariant for extremely small viewports, not the normal
    log-fitting mechanism.
13. ANSI sequences never count as visible width.

## Target architecture

### 1. Truthful Screen measurement and observation

Keep `Cli.Screen.size()` as the stable formatting convenience, including its deterministic fallback,
but separate internal measurement truth from fallback selection.

The resize observer consumes a raw measurement function that can represent unavailable or partial
dimensions. Public `Cli.Screen.size()` remains fallback-resolved; `Cli.Screen.events()` must not
consume that fallback. On each platform notification:

1. measure;
2. ignore unavailable or partial results;
3. adopt the first complete valid result as baseline without emitting;
4. compare width and height with the last accepted measurement;
5. ignore an identical result;
6. update accepted state before notifying subscribers, preserving truth under re-entrant delivery;
7. emit one real transition with exact `{ before, after }` snapshots.

The internal observation seam returns an explicit discriminated result:

- attached, with one attachment-specific cleanup function; or
- unsupported, for a known absence of resize capability.

This avoids overloading `undefined` or a swallowed exception with multiple meanings. A known
unsupported runtime returns a valid inert lifecycle whose streams emit nothing and complete on
disposal. Missing Deno signal capability and Windows `SIGWINCH` are known unsupported cases. Any
error thrown while registering an otherwise supported observer remains legible and is rethrown after
local construction cleanup.

Use `Rx.lifecycle()` without passing `until` during construction. Register Screen cleanup first,
then bridge `until` through the canonical `Dispose.until(...)` normalization. This is required
because `Rx.lifecycle(until)` may observe a synchronous upstream termination before Screen has
installed listener cleanup. Keep this two-phase ownership local to Screen; do not broaden this
commit into a general `@sys/std` lifecycle refactor.

Construction order is part of the contract:

1. create the lifecycle, event subject, and read-only event streams;
2. register idempotent subject completion and deferred listener cleanup;
3. inspect already-terminated stateful `until` inputs;
4. bind remaining `until` sources, handling synchronous emission before subscription retention;
5. return the already-completed handle when construction was terminated;
6. attach the platform listener and retain its cleanup through the deferred cleanup slot;
7. if disposal occurred during attachment, invoke the newly returned cleanup exactly once and return
   completed;
8. for supported observation, establish the first complete valid baseline after attachment;
9. recheck disposal before returning the active handle.

The deferred cleanup slot has two operations: retain one cleanup and release once. Retaining after
release immediately invokes the cleanup. This closes the disposal-during-attachment race without
timers, flags spread across callbacks, or process-global test signals.

The event subject itself is completed during disposal. `$` and `resize$` derive from that subject
and do not rely on a non-replaying `dispose$` plus `takeUntil` for terminal completion.

### 2. Single Vite screen reporter session

Replace the overlapping startup and ready handles with one internal reporter controller.

The handle should expose domain-level operations rather than generic renderer wiring, for example:

```ts
outputChanged(): void;
ready(): void;
clearLog(): void;
toggleOptions(): void;
toggleExtended(ws: t.ViteDenoWorkspace): void;
dispose(): void;
```

Exact names may be tightened during implementation, but the boundary must preserve this intent:

- process output changed;
- process became ready;
- user changed reporter state;
- reporter disposed.

The reporter controller owns:

- phase: `startup | ready`;
- latest accepted viewport;
- one resize event handle;
- one pending redraw timer;
- pending invalidation strength;
- startup spinner state;
- options/workspace presentation state;
- all terminal repaint effects.

`u.dev.ts` then becomes structurally simpler:

- create one reporter after the process lifetime exists;
- push output into `DevOutputLog`;
- call `reporter.outputChanged()`;
- call `reporter.ready()` after readiness and HTTP confirmation;
- dispose one reporter during cleanup.

### 3. Explicit invalidation model

Keep invalidation internal to the reporter:

- `content`: output changed without changing frame structure or viewport;
- `layout`: viewport, phase, or presentation structure changed.

The scheduler coalesces rapid updates using the existing bounded short delay. If a layout
invalidation arrives while content is pending, the pending work becomes layout work. This is
latest-state frame pacing with bounded latency, not a trailing debounce: continuous resize remains
responsive and cannot starve the final frame.

Ready-state rendering always recalculates and repaints the full frame.

Startup behavior remains efficient without leaving stale structure:

- content invalidation updates the spinner-owned body through its declared surface;
- layout invalidation stops the spinner, repaints a freshly sized header without a preceding blank
  screen, installs the freshly sized body, and restarts the spinner;
- the ready transition stops the spinner once and performs one full ready-frame repaint.

Remove the optional `spinner.render?.()` reach-through. If immediate render is genuinely required,
first make it a truthful `@sys/cli` spinner contract backed by Ora; do not retain an undeclared
local method.

### 4. Explicit terminal sink

The reporter runtime owns one terminal sink. Stdout is the canonical target because screen-mode
selection, `Cli.Screen` measurement fallback, repaint, and ready output use stdout. The sink
contract makes these mechanics explicit:

- `Cli.Screen.size()` and one `Cli.Screen.events(until)` handle for the terminal session;
- one semantic stdout `repaint(frame)` effect rather than separable clear/print effects;
- one cursor row below each committed frame;
- spinner creation bound explicitly to stdout.

Keep Ora authoritative through `Cli.Spinner.create(...)`. Add only the truthful missing creation
contract needed to select stdout, under `CliSpinner.Create.Options`; map that semantic target to
Ora's declared `stream` option inside the CLI spinner owner. Do not expose Node stream objects,
reach through the returned spinner instance, or build a Driver-owned spinner implementation.

The default sink remains injectable as one cohesive runtime dependency for deterministic tests. Do
not mix startup stderr, ready stdout, an implicit Ora target, and an independently selected clear
stream.

### 5. Pure frame layout

Factor frame computation from terminal effects.

The pure layout layer should accept:

- package and dist metadata;
- paths and URL;
- retained output snapshot;
- reporter presentation state;
- explicit `{ width, height }` viewport;
- configured maximum log rows;
- startup or ready phase.

It should return either:

- a complete ready frame; or
- startup regions with one source of truth for both snapshot tests and runtime output, such as
  `{ header, body }` plus known spinner-row accounting.

Do not maintain one height formula for `startupToString()` and another for the live spinner
renderer.

### 6. Height-aware log projection

Preserve `DevOutputLog` as retained recent-output state. Apply viewport height only while selecting
the visible suffix.

For each phase:

1. render or count fixed frame rows from the same layout structure used for output;
2. subtract fixed rows from viewport height;
3. clamp available log rows to zero or greater;
4. select the newest `min(logLines, availableRows)` retained rows;
5. render and perform the final width/height safety clip.

Tests must cover terminal shrink and re-expansion to prove that hidden rows were not deleted.

## Implementation status

All substrate and lifecycle commits are landed through
`2deec18c5 refactor(driver-vite): centralize dev screen render lifecycle`. The public Screen grammar
is stable, resize transitions are truthful, terminal text fitting and clipping are cell-aware,
helper and formatter namespaces are canonical, styled clipping has no sentinel substitution, and
Driver Vite now has one reporter lifecycle and resize owner, exact viewport-driven layout, derived
height budgeting, stdout stream alignment, and focused/live proof. The observed resize flash leaves
one final transport amendment: replace split `clear()`/`print()` effects with a nonblank
complete-frame repaint, then repeat live startup and ready resize acceptance.

## DMIND namespace-conformance review

### Completed `@sys/cli` type-plane result

The package-wide audit and migration are complete:

1. helper and formatter modules each own one canonical domain namespace with `Lib` first;
2. focused Help, Commit, Text, Code, Chapters, Path, Url, and Tree contracts remain in their
   established owner files;
3. root `Cli.*` and `Cli.Fmt.*` paths are exact projections rather than copied shapes;
4. `Text.Width` and `Text.Wrap` now exist on both the runtime and type planes with exact operation
   identities;
5. superseded flat names are absent, and the base formatter entrypoint still excludes Code.

The Driver Vite responsive viewport implementation is complete. Unrelated workspace plan edits
remain outside this arc.

### Cross-package canonical reference set

The namespace shape was cross-checked against seven maintained `@sys` exemplars:

- `code/sys/std/src/m.Obj/t.ts` — `Lib` first, nested runtime sub-libraries, and alias projection of
  separately owned type modules;
- `code/sys/fs/src/m.Pkg/t.ts` — same-noun type/namespace composition and deep subordinate runtime
  namespaces;
- `code/sys/http/src/http.client/m.HttpClient/t.ts` — operation-owned option/result contracts under
  `HttpClient.Wait`;
- `code/sys/crypto/src/m.Hash/t.ts` — root contracts before subordinate `Shorten` and runtime `Is`
  namespaces;
- `code/sys/workspace/src/m.run/t.ts` — deep state/result families grouped by stable domain
  ownership rather than long prefixed names;
- `code/sys/markdown/src/m.Markdown/t.ts` — imported subsystem contracts projected by exact aliases
  rather than duplicated shapes;
- `code/sys/color/src/m.Ansi/t.ts` — a shallow namespace that does not over-factor trivial leaf
  types.

These references establish the package rules:

1. one singular domain namespace per runtime/module concept;
2. `Lib` first in every public runtime-bearing namespace;
3. concise leaf names inside the namespace instead of repeating the full domain prefix;
4. nested `Lib` only when a matching runtime sub-library exists in that landed commit;
5. operation-specific options/results live under the operation namespace when that improves
   ownership, such as `Wait.Options` or `Shorten.Options`;
6. root and aggregate namespaces project canonical contracts by exact aliases and never copy shapes;
7. legacy flat names are removed in the owning commit after a repository-wide usage scan; any real
   in-repository call sites migrate atomically to canonical paths;
8. type spines remain type-plane pure and runtime identity/output remain unchanged;
9. do not create namespaces for every trivial leaf merely for visual symmetry;
10. file boundaries remain domain-owned; do not consolidate the package into a monolithic `t.ts`.

### Scope decision

The CLI namespace work landed as independently truthful commits:

- the `CliTable` nominal-instance and canonical public-surface edge as a standalone anchor;
- the non-formatter helper namespaces as a mechanical follow-on;
- formatter namespaces and aggregate projections;
- matching `Text.Width`/`Text.Wrap` runtime namespaces.

This is **not** authorization for unrelated public export surgery. Module entrypoints that currently
re-export local type spines raise a separate export-discipline question and remain unchanged here.
Runtime behavior, dependency wiring, Screen semantics, and Vite production code are also excluded.

Truthfulness rule:

- type-only commits may namespace only contracts that describe runtime surfaces present in the same
  landed commit;
- `CliFormatText.Width.Lib` and `CliFormatText.Wrap.Lib` must not exist before runtime `Text.Width`
  and `Text.Wrap`;
- the runtime namespace commit adds those `Lib` contracts and matching runtime properties
  atomically.

### STIER 100-year review verdict

The revised namespace program is approved as a bounded canon-conformance refactor:

- **cohesion:** helper, formatter, and Text runtime changes are separated by ownership and behavior
  plane;
- **truthfulness:** every commit leaves type contracts aligned with runtime values present at that
  boundary;
- **canonical finality:** legacy flat names are removed rather than carried as a parallel migration
  surface, with in-repository consumers updated atomically;
- **navigability:** module-owned contracts and root `Cli.*` projections have one source of truth;
- **restraint:** trivial leaves, file layout, module exports, dependencies, and unrelated runtime
  code are not normalized merely for symmetry;
- **proof strength:** exact type equality, aggregate identity, legacy-name absence scans, full CLI
  verification, downstream checks, and dry-publish cover both source and published surfaces.

The canonical `CliTable` hard gate landed as `87f4b4ea9` without casts or widening. The helper
namespace rewrite then landed as `9833f2132` with exact module/root/public projections and no legacy
helper residue. The formatter namespace cut landed as `9de396c5c` with exact base and isolated Code
contracts. The Text runtime namespace cut landed as `1a806c709`, clipped-part hardening landed as
`67fe9739a`, and the Driver Vite lifecycle cut landed as `2deec18c5`. The subsequent viewport and
repaint work stayed within the established runtime/layout boundary.

## Commit sequence

### 1. `b052e4f83 refactor(cli): isolate screen measurement and resize observation`

Status: landed.

- Add `m.Screen/u.platform.ts` as the internal Deno/Node adapter for raw dimension measurement and
  resize listener attachment/removal.
- Refactor `u.size.ts` to separate raw measurement from deterministic `80 x 24` fallback selection.
- Preserve the existing per-dimension Deno fallback and Deno-failure-to-Node behavior exactly.
- Add an internal injectable size constructor for deterministic tests.
- Refactor `u.events.ts` around an internal `createEvents` dependency seam while preserving current
  event semantics.
- Preserve the public `Cli.Screen.size()` and `Cli.Screen.events(until)` grammar.
- Add focused tests for platform priority, fallback behavior, event forwarding, listener teardown,
  and `Cli.Screen` aggregate identity.
- Use characterization proof rather than a red bug test because this is behavior-preserving seam
  extraction.

Strict exclusions for this commit:

- do not suppress identical-size events yet;
- do not replace `Rx.abortable` yet;
- do not fix prior-disposal or late-subscriber completion yet;
- do not classify unsupported `SIGWINCH` yet;
- do not change public Screen types;
- do not change terminal text-width semantics;
- do not touch Vite.

### 2. `0e56910b9 fix(cli): emit truthful terminal size transitions`

Status: landed.

Implementation cut:

- Keep `Cli.Screen.size()` and its deterministic per-dimension fallback unchanged.
- Change `createEvents` to consume raw measurement rather than fallback-resolved `size()`.
- Accept only complete positive dimensions as transition evidence.
- Replace the observer cleanup-or-throw ambiguity with the internal attached/unsupported result.
- Treat absent Deno signal capability and Windows `SIGWINCH` as known unsupported; rethrow
  unexpected registration failures.
- Replace `Rx.abortable(until)` with an unbound `Rx.lifecycle()`, then bind `until` only after
  cleanup exists.
- Use one deferred cleanup slot to close disposal before, during, and after listener attachment.
- Establish baseline after attachment; do not emit for baseline acquisition, repeated measurements,
  partial measurements, or unavailable measurements.
- Update accepted size before publishing one exact transition, making nested synchronous
  notification safe.
- Complete the event subject explicitly during disposal so early and late subscribers terminate.
- Keep disposal, upstream termination, and attachment cleanup idempotent.
- Preserve the public Screen types and aggregate identity.
- Do not change text-width behavior, Vite code, or generic `@sys/std` lifecycle semantics in this
  commit.

Red-first focused proof:

1. listener attachment occurs before baseline measurement;
2. the first complete measurement establishes baseline without emission;
3. width-only and height-only changes emit exact transitions;
4. identical notifications do not emit;
5. unavailable and partial measurements do not emit or replace the accepted baseline;
6. the first complete measurement after an unavailable baseline establishes baseline only;
7. a pre-disposed lifecycle and pre-aborted signal install no listener and expose completed streams;
8. a synchronously emitting `until` source terminates before listener attachment;
9. disposal during attachment invokes the returned cleanup exactly once;
10. repeated manual or upstream disposal removes once;
11. early and late subscribers to both streams observe completion;
12. known unsupported observation returns a live inert handle that completes on disposal;
13. unexpected registration failure cleans local construction and rethrows;
14. root `Cli.Screen` aggregate identity remains unchanged.

Expected implementation paths:

- `code/sys/cli/src/common/libs.ts`, only if `Dispose` must be surfaced through the local common
  boundary;
- `code/sys/cli/src/m.core/m.Screen/u.measure.ts`;
- `code/sys/cli/src/m.core/m.Screen/u.platform.ts`;
- `code/sys/cli/src/m.core/m.Screen/u.size.ts`;
- `code/sys/cli/src/m.core/m.Screen/u.events.ts`;
- `code/sys/cli/src/m.core/m.Screen/-test/-u.platform.test.ts`;
- `code/sys/cli/src/m.core/m.Screen/-test/-u.events.test.ts`;
- existing aggregate tests only if an assertion is missing.

Proof sequence:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task test --trace-leaks ./src/m.core/m.Screen
deno task check
deno task test
```

The red tests were observed failing before implementation. Local verification is green:

- focused Screen tests with leak tracing: 4 files, 25 steps;
- `deno task check`;
- full CLI tests: 30 passed, 176 steps.

### 3. `3c48e8586 fix(cli): make terminal text fitting cell-aware`

Status: landed.

#### Substrate decision

The repository has no existing `@sys/*` terminal-cell-width primitive. The official
`@std/cli@1.0.32/unicode-width` implementation was inspected and deterministically probed, but it is
not sufficient as the sole primitive for this contract because it sums code-point widths rather than
terminal grapheme widths:

```text
input       @std/cli  string-width@8.2.2
界          2         2
e + ◌́       1         1
👨‍👩‍👧‍👦      8         2
🇳🇿          2         2
1️⃣          1         2
```

Use maintained `string-width@8.2.2`, which is already present transitively in `deno.lock` and uses
grapheme segmentation, RGI emoji handling, East Asian width, and ANSI stripping. Declare it directly
rather than relying on transitive availability:

1. add `npm:string-width@8.2.2` to the root `deps.yaml`;
2. run `deno task prep:imports` from `/Users/phil/code/org.sys/sys`;
3. accept only the expected generated `imports.json` and `deno.lock` dependency delta;
4. surface the default export as a truthful named dependency through
   `code/sys/cli/src/common/libs.ts`.

Do not add local Unicode tables, emoji regexes, width heuristics, or a second width package.

#### Exact formatter contract

- Change `Cli.Fmt.Text.visibleWidth(input)` to return terminal cells through the canonical
  `stringWidth` dependency. ANSI escapes remain zero-width and ambiguous-width characters use the
  dependency's narrow default.
- Keep `padEnd`, `maxVisibleWidth`, `fitWidth`, and `wrapLines` APIs stable. Their cell correctness
  should flow from the one `visibleWidth` boundary rather than duplicated calculations.
- Add one narrow `Cli.Fmt.Text.ellipsize(input, width, options?)` primitive for balanced middle
  ellipsis of **plain text**. Support the existing custom-ellipsis/sentinel use case needed by Vite.
- Segment clipping input with `Intl.Segmenter` at `granularity: 'grapheme'`; measure each segment
  and the ellipsis with the same `visibleWidth` primitive.
- Never split a grapheme cluster, never exceed the normalized non-negative cell budget, return the
  original input when it already fits, and handle budgets smaller than the ellipsis without
  overflow.
- Keep ANSI ownership explicit: measurement is ANSI-aware, while ellipsizing accepts plain text.
  Vite already strips styles before clipping and reapplies one coherent style afterward; do not
  build an ANSI state machine in this commit.
- Keep `Str.ellipsize` unchanged. It remains a general code-unit string helper; terminal layout must
  move to `Cli.Fmt.Text.ellipsize` in the later Vite viewport commit.

The one justified new factor is `u.ellipsize.ts`; keep grapheme segmentation and budget allocation
local to it. Do not create a generic Unicode package, `u.grapheme.ts`, or helper-file cascade.

#### Red-first proof

1. `visibleWidth` preserves ASCII and ANSI results;
2. CJK/full-width text consumes two cells per rendered glyph;
3. decomposed combining sequences consume one cell;
4. RGI ZWJ emoji, flags, skin-tone sequences, and keycaps consume two cells per rendered grapheme;
5. `padEnd` adds spaces by missing cells, not code units;
6. `maxVisibleWidth` compares rendered cells;
7. prose wrapping makes break decisions by cells while preserving the existing over-width-word
   atomicity rule;
8. middle ellipsis preserves exact ASCII behavior for ordinary budgets;
9. clipping never returns a string wider than its budget;
10. clipping never cuts a combining sequence, surrogate pair, flag, keycap, or ZWJ family;
11. zero and sub-ellipsis budgets remain bounded;
12. custom ellipsis width is included in the same cell budget;
13. the `Cli.Fmt.Text` aggregate exports the new primitive without adding a new package surface.

Expected implementation paths:

- `deps.yaml`;
- generated `imports.json` and `deno.lock`;
- `code/sys/cli/src/common/libs.ts`;
- `code/sys/cli/src/m.core/m.Fmt.Text/t.ts`;
- `code/sys/cli/src/m.core/m.Fmt.Text/u.width.ts`;
- `code/sys/cli/src/m.core/m.Fmt.Text/u.ellipsize.ts`;
- `code/sys/cli/src/m.core/m.Fmt.Text/m.Text.ts`;
- focused tests under `code/sys/cli/src/m.core/m.Fmt.Text/-test/`.

Strict exclusions:

- no Screen changes;
- no Vite production-code migration yet;
- no change to `Str.ellipsize` or broad `@sys/std` semantics;
- no ANSI-preserving clipping parser;
- no character-by-character wrapping of atomic words;
- no local Unicode data or ad hoc emoji classification.

Proof sequence:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task test --trace-leaks ./src/m.core/m.Fmt.Text
deno task check
deno task test
```

Then verify every direct downstream consumer of `Cli.Fmt.Text`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check
deno task test
```

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task check
deno task test
```

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cell
deno task check
deno task test
```

Red tests were observed failing against code-unit width and the initial clipping stub. Local
verification is green:

- focused `Cli.Fmt.Text` tests with leak tracing: 4 files, 43 steps;
- CLI check, dry publish, and full suite: 31 tests, 186 steps;
- `@sys/driver-vite` check and full suite: 56 tests, 304 steps;
- `@sys/workspace` check and full suite: 56 tests, 330 steps;
- `@sys/cell` check and full suite: 29 tests, 228 steps;
- changed TypeScript formatting and repository whitespace checks.

This viewport prerequisite is landed. The Vite renderer must consume its canonical nested API before
claiming width correctness.

### 4. `87f4b4ea9 refactor(cli): canonicalize table type namespace`

Status: landed.

Establish the canonical Table contract before the package-wide mechanical cleanup:

```text
CliTable
├── Lib
└── Instance

Cli.Table
├── Lib
└── Instance
```

Exact contract:

- Convert the module contract to a canonical-only `CliTable` namespace with `Lib` first and
  `Instance` equal to the actual Cliffy table instance type.
- Remove the flat `CliTableLib` alias and former `CliTable` instance type; repository inspection
  proves neither has a production type consumer.
- Preserve Cliffy's protected-member nominal constraints through `CliTable.Instance` so a merely
  similar structural object does not become a valid table instance.
- Make `CliTable.Lib.create` return canonical `CliTable.Instance` and keep `cellGap` unchanged.
- Project `Cli.Table.Lib` and `Cli.Table.Instance` as exact aliases of the module-owned contracts.
- Type the existing runtime `Table` value with `t.CliTable.Lib` without changing its implementation
  or aggregate identity.
- Keep only canonical module, root projection, and published type-entry paths; do not add a legacy
  alias layer.
- Use this landed shape as the reference for all subsequent helper namespace conversions.

Red-first proof:

1. `t.CliTable.Lib`, `t.CliTable.Instance`, `t.Cli.Table.Lib`, and `t.Cli.Table.Instance` are
   initially absent and the focused type test fails before implementation;
2. `expectTypeOf(Table).toEqualTypeOf<t.CliTable.Lib>()` passes;
3. `Table.create()` is exactly `t.CliTable.Instance`, `t.Cli.Table.Instance`, and the Cliffy table
   instance type;
4. canonical module, root projection, and published contracts are mutually type-equal without `any`,
   casts, or widened fallback shapes;
5. the runtime `Table` export, `Cli.Table` identity, `cellGap`, constructor behavior, and table
   rendering remain unchanged;
6. canonical `@sys/cli/t`, `@sys/cli/types`, package check, full tests, and dry-publish are green.

Expected implementation paths:

- `code/sys/cli/src/m.core/m.Table/t.ts`;
- `code/sys/cli/src/m.core/m.Table/mod.ts`;
- `code/sys/cli/src/m.core/m.Table/-test/-.test.ts` or the narrowest existing Table API test;
- `code/sys/cli/src/m.core/m.Cli/t.ts` for exact root projections.

Strict exclusions:

- no other helper namespace conversion;
- no runtime Table or Cliffy behavior changes;
- no dependency changes;
- no legacy Table type aliases;
- no casts or structural widening to force the merge;
- no formatter, Screen, shell, Vite, or module-export changes.

Proof sequence:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task test --trace-leaks ./src/m.core/m.Table
deno task check
deno task test
deno task dry
```

Then type-check direct downstream consumers before landing:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check

cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task check

cd /Users/phil/code/org.sys/sys/code/sys/cell
deno task check
```

Failure of the exact Table canonical/nominal proof is a hard stop. Revise the namespace strategy
before touching the remaining helper contracts.

The red proof failed only on the absent `CliTable.Lib` and `CliTable.Instance` namespace members.
Local verification is green:

- focused Table test with leak tracing: 1 file, 5 steps;
- exact canonical module, root projection, `@sys/cli/t`, and `@sys/cli/types` equality;
- repository-wide scan proving no `CliTableLib` or former flat `CliTable` type consumer remains;
- mapped public-shape rejection proving Cliffy's protected nominal member remains load-bearing;
- CLI check, dry-publish, and full suite: 31 tests, 187 steps;
- Driver Vite, Workspace, and Cell downstream checks;
- changed TypeScript formatting and repository whitespace checks.

### 5. `9833f2132 refactor(cli): canonicalize helper type namespaces`

Status: landed.

Normalize every remaining non-formatter helper contract that still uses long flat names while
preserving runtime values and one canonical type surface:

```text
CliScreen
├── Lib
├── Size
├── Events
├── Event
└── SizeChanged

CliKeyboard
├── Lib
├── Event
└── Bind
    ├── Options
    └── Handle

CliInput
├── Lib
└── Menu
    ├── ResultKind
    └── Result

CliPrompt.Lib
CliIs.Lib

Cli
├── KeepAlive.Options
└── CopyToClipboard.Result

Shell.Plan.Lib
```

Exact contract:

- Give Screen, Keyboard, Input, Prompt, and Is one canonical module namespace each, with `Lib` first
  and concise nested names.
- Keep `CliSpinner`, `FakeSpinner`, and the existing Shell root/sub-namespaces unchanged where they
  already conform; replace `Shell.PlanLib` with `Shell.Plan.Lib` and remove the flat name.
- Move keyboard binding policy under `CliKeyboard.Bind` because it belongs to the `bind` operation,
  not the keyboard root.
- Keep menu result contracts under `CliInput.Menu`; retain the literal-derived `MenuResultKind`
  constant only as the type-plane-safe source of its union.
- Keep `t.menu.ts` as the owner of that constant only. Derive `CliInput.Menu.ResultKind` from it in
  `m.Input/t.ts` through a type-only import, define `CliInput.Menu.Result` there, and do not
  introduce a flat bridge type or runtime import into the type spine.
- Move root-operation contracts to `Cli.KeepAlive.Options` and `Cli.CopyToClipboard.Result`, make
  `Cli.Lib` consume those canonical paths, remove their flat names, and retire the obsolete
  `m.core/u/t.ts` type spine.
- Project each module contract through the existing root consumer namespace, for example
  `Cli.Screen.Size = CliScreen.Size` and `Cli.Keyboard.Bind.Options = CliKeyboard.Bind.Options`.
- Treat the landed `CliTable` namespace and exact root projections as the known-good pattern for
  this mechanical follow-on; do not reopen or modify its contract.
- Update all affected `@sys/cli` implementation annotations to canonical paths such as
  `t.CliScreen.Size` and `t.CliKeyboard.Bind.Options`.
- Atomically migrate the three real `@sys/tools` menu-result consumers from flat `MenuResult` and
  `MenuResultKind` imports/usages to `CliInput.Menu.Result` and `CliInput.Menu.ResultKind`.
- Remove every superseded flat helper name after a repository-wide usage scan and migrate any real
  in-repository consumers in the same commit. Do not retain or duplicate legacy shapes.
- Use multiline JSDoc for each public root/sub-namespace, keep `Lib` first, and keep leaf docs
  concise.

Red-first proof:

1. all canonical paths compile through the local `t` pool, `@sys/cli/t`, and `@sys/cli/types`;
2. `Screen`, `Keyboard`, `Input`, `Prompt`, `Is`, `Spinner`, `FakeSpinner`, and `Shell` remain
   exactly typed by their canonical `Lib` contracts;
3. root `Cli.*` projections are exactly type-equal to their module-owned contracts;
4. superseded flat helper names are absent from the published type surface and CLI source;
5. the landed `CliTable` canonical module, root projection, and runtime contracts remain unchanged;
6. no runtime export, aggregate identity, function signature, or output changes;
7. a repository-wide source scan finds no superseded helper type names, and `@sys/tools` compiles
   through the canonical menu-result paths;
8. package dry-publish reports no slow-type errors and contains only the intended canonical surface.

Expected implementation paths:

- `code/sys/cli/src/m.core/m.Screen/t.ts` and type annotations under `m.Screen/`;
- `code/sys/cli/src/m.core/m.Keyboard/t.ts` and type annotations under `m.Keyboard/`;
- `code/sys/cli/src/m.core/m.Input/t.ts`, `t.menu.ts`, and `m.Input/mod.ts`;
- `code/sys/cli/src/m.core/m.Prompt/t.ts` and `mod.ts`;
- `code/sys/cli/src/m.core/m.Is/t.ts` and its runtime annotations;
- remove `code/sys/cli/src/m.core/u/t.ts` and its aggregation entry after moving canonical contracts
  to `m.Cli/t.ts`;
- `code/sys/cli/src/m.core/u/u.keepAlive.ts` and `u.clipboard.ts`;
- `code/sys/cli/src/m.core/m.Cli/t.ts`;
- `code/sys/cli/src/m.shell/t.ts` and `m.Shell.ts`;
- one focused helper-contract test under `code/sys/cli/src/m.core/m.Cli/-test/`, plus the existing
  Screen and Shell API tests;
- `code/sys.tools/src/common/t.ts`;
- `code/sys.tools/src/cli.crdt/cmd.doc.graph/t.hook.ts`;
- `code/sys.tools/src/cli.crdt/m.cli.ts`.

Strict exclusions:

- no runtime object-shape or behavior changes;
- no prompt, keyboard, Screen, shell, or lifecycle semantic changes;
- no changes to the landed Table namespace or Cliffy dependency;
- no module-entrypoint/type-export policy changes;
- no runtime import from `m.Input/t.ts` or replacement flat menu-result bridge type;
- no formatter type changes;
- no file-boundary consolidation beyond removing the emptied root-utility type spine;
- no Vite production changes.

Proof sequence:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task test --trace-leaks ./src/m.core/m.Cli/-test ./src/m.core/m.Screen ./src/m.shell/-test
deno task check
deno task test
deno task dry
```

Then type-check direct downstream consumers before landing:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task check

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check

cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task check

cd /Users/phil/code/org.sys/sys/code/sys/cell
deno task check
```

The red-first helper contract proof failed only because the canonical module, root, and published
helper namespaces were absent. Local verification is green:

- focused helper, Screen, and Shell tests with leak tracing: 9 files, 10 tests, 42 steps;
- exact local, root projection, `@sys/cli/t`, and `@sys/cli/types` equality;
- exact literal-derived menu result union and operation-owned keyboard/root contracts;
- CLI check, dry-publish, and full suite: 32 tests, 188 steps;
- `@sys/tools`, Driver Vite, Workspace, and Cell checks;
- repository-wide scan proving all superseded helper type names are absent; the remaining
  `MenuResult` in Driver Pi is an unrelated domain-local contract;
- removed `m.core/u/t.ts` with no stale aggregation or published residue;
- changed TypeScript and plan formatting plus repository whitespace checks.

### 6. `9de396c5c refactor(cli): canonicalize formatter type namespaces`

Status: landed.

Normalize the remaining formatter contracts around stable domain namespaces:

```text
CliFormatHelp
├── Lib
├── Input
├── InputBase
├── InputSections
├── InputShorthand
├── Section
├── Pair
├── Option
├── Tone
└── LayoutOptions

CliFormatCommit
├── Lib
├── Options
├── Title
└── Text

CliFormatText
├── Lib
├── Width.Fit.Options
├── Wrap
│   ├── Options
│   ├── Preserve
│   └── PreserveFn
└── Ellipsize.Options

CliFormatCode
├── Lib
├── Fmt.Lib
├── LayoutOptions
├── Tone
├── Block.Options
└── Highlight
    ├── Options
    ├── ShikiOptions
    └── ShikiOptionsWithDefaultTheme

CliFormat
├── Lib
├── Path.Lib
├── Url.Lib
└── Tree.Lib
```

Canonical ownership stays in the existing focused type files: Help in `t.help.ts`, Commit in
`t.commit.ts`, Text in `m.Fmt.Text/t.ts`, Code in `m.Fmt.Code/t.ts`, and the base aggregate plus
Path/Url/Tree in `m.Fmt/t.ts`. Do not consolidate those files.

Superseded names removed in this cut:

```text
CliFormatHelpLib
CliFormatHelpInput
CliFormatHelpInputBase
CliFormatHelpInputSections
CliFormatHelpInputShorthand
CliFormatHelpSection
CliFormatHelpPair
CliFormatHelpOption
CliFormatHelpTone
CliFormatHelpLayoutOptions

CliFormatCommitLib
CliFormatCommitTitle
CliFormatCommitText

CliFormatTextLib
CliFormatTextFitOptions
CliFormatTextWrapOptions
CliFormatTextPreserve
CliFormatTextPreserveFn
CliFormatTextEllipsizeOptions

CliFormatCode.BlockOptions
CliFormatCode.HighlightOptions
ShikiCodeToTokensOptions
ShikiCodeToTokensOptionsWithDefaultTheme
```

Exact contract:

- Convert Help and Commit from flat prefixed types to `CliFormatHelp` and `CliFormatCommit`,
  extracting the currently inline commit options as `CliFormatCommit.Options` without changing the
  call signature.
- Reorganize Text under `CliFormatText`, but keep `CliFormatText.Lib` equal to the current flat
  runtime shape in this commit.
- Do not declare dormant `CliFormatText.Width.Lib` or `CliFormatText.Wrap.Lib`; those become
  truthful only with runtime `Text.Width` and `Text.Wrap` in the next commit.
- Keep width-source policy in `CliFormatText.Width.Fit.Options`, prose policy in
  `CliFormatText.Wrap.*`, and marker policy in `CliFormatText.Ellipsize.Options`.
- Tighten the already namespaced Code surface by moving operation-specific options under `Block` and
  `Highlight`; keep `CliFormatCode.Fmt.Lib` as the extended runtime formatter contract.
- Give `CliFormat.Path`, `Url`, and `Tree` explicit `Lib` contracts instead of inline object shapes
  inside `CliFormat.Lib`; annotate their runtime values directly with the owning `*.Lib` paths.
- Keep `CliFormatChapters` and `CliFormat.Hr` structures that already conform; update only
  references and projections required by canonical ownership.
- Project every base formatter contract by exact alias through the truthful root path: all Help
  members including `InputBase`; `Commit.{Lib, Options, Title, Text}`;
  `Text.{Lib, Width.Fit.Options, Wrap.*, Ellipsize.Options}`; and `Path.Lib`, `Url.Lib`, plus
  `Tree.Lib`, while preserving existing Chapters projections.
- Keep Code on its established extension entrypoint. `CliFormatCode` remains exported from
  `@sys/cli/fmt/code` only; do not add it to `@sys/cli/t`, `@sys/cli/types`, base `Cli.Fmt`, or the
  base `@sys/cli/fmt` entrypoint.
- Within `CliFormatCode`, replace `BlockOptions` with `Block.Options`, replace `HighlightOptions`
  with `Highlight.Options`, and move the exported Shiki contracts to `Highlight.ShikiOptions` and
  `Highlight.ShikiOptionsWithDefaultTheme`.
- Update all CLI formatter implementation/test annotations to canonical paths such as
  `t.CliFormatHelp.Input`, `t.CliFormatCommit.Options`, `t.CliFormatText.Width.Fit.Options`,
  `t.CliFormatText.Wrap.Options`, and `CliFormatCode.Highlight.Options`.
- Remove every superseded flat formatter type name after a repository-wide usage scan and migrate
  any real in-repository consumers in the same commit. The audit found no flat formatter type
  consumers outside `@sys/cli`; existing downstream `Cli.Fmt.*` paths are already canonical and do
  not require source migration in this cut.
- Preserve all runtime formatter aggregates, identities, signatures, and rendered output.

Red-first proof:

1. canonical Help, Commit, Text, Path, Url, Tree, and root `Cli.Fmt.*` paths compile through the
   local `t` pool, `@sys/cli/t`, and `@sys/cli/types`;
2. canonical Code paths compile through the existing `@sys/cli/fmt/code` entrypoint without leaking
   into the base type entrypoints;
3. `Help`, `Commit`, `Text`, `Chapters`, `Code`, Path, Url, Tree, and base/extended `Fmt` values
   remain exactly typed by their canonical `Lib` contracts;
4. every root projection is exactly type-equal to its module-owned contract, including Help
   `InputBase`, Commit, the Text policy namespaces, and Path/Url/Tree `Lib`;
5. superseded formatter names are absent from the published type surface and repository source;
6. no `Width.Lib`, `Wrap.Lib`, `Text.Width`, or `Text.Wrap` surface exists prematurely;
7. existing formatter runtime identity assertions and output expectations remain unchanged; only
   necessary type annotations in those tests migrate;
8. package dry-publish reports no slow-type or public-surface breakage.

Expected implementation paths:

- `code/sys/cli/src/m.core/m.Fmt/t.ts`, `t.help.ts`, and `t.commit.ts`;
- formatter implementations/tests that currently reference flat Help or Commit types;
- `code/sys/cli/src/m.core/m.Fmt.Text/t.ts` and its implementation/test annotations;
- `code/sys/cli/src/m.core/m.Fmt.Code/t.ts`, `u.block.ts`, `u.highlight.ts`, and focused Code type
  proof annotations;
- `code/sys/cli/src/m.core/m.Fmt.Chapters/t.ts` where Help input is referenced;
- `code/sys/cli/src/m.core/m.Fmt/m.Fmt.ts`, `m.Fmt.Url.ts`, and `m.Fmt.Tree.ts` for direct owning
  `Path.Lib`, `Url.Lib`, and `Tree.Lib` annotations;
- `code/sys/cli/src/m.core/m.Cli/t.ts` root formatter projections;
- focused exact-equality proofs under `m.Fmt/-test`, `m.Fmt.Text/-test`, and `m.Fmt.Code/-test`.

Strict exclusions:

- no runtime object-shape, formatting, wrapping, clipping, or width changes;
- no `Text.Width` or `Text.Wrap` runtime values;
- no unrelated type removal beyond superseded names replaced by the declared canonical namespaces;
- no module-entrypoint/type-export policy changes;
- no dependency or Screen changes;
- no downstream source migration unless a direct removed-name consumer is discovered during the
  final scan;
- no Code type export through base `@sys/cli/t`, `@sys/cli/types`, or `@sys/cli/fmt`;
- no Vite production changes.

Proof sequence:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task test --trace-leaks ./src/m.core/m.Fmt/-test ./src/m.core/m.Fmt.Text/-test ./src/m.core/m.Fmt.Chapters/-test ./src/m.core/m.Fmt.Code/-test
deno task check
deno task test
deno task dry
```

Then type-check direct downstream consumers before landing:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task check

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check

cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task check

cd /Users/phil/code/org.sys/sys/code/sys/cell
deno task check
```

The red-first formatter proofs failed with 98 type errors solely on the absent canonical namespaces,
root projections, and Code operation paths. Local verification is green:

- focused formatter, Text, Chapters, and Code tests with leak tracing: 17 tests, 133 steps;
- exact local, root projection, `@sys/cli/t`, and `@sys/cli/types` equality for every base formatter
  contract;
- exact Code equality through the isolated `@sys/cli/fmt/code` entrypoint;
- explicit preservation proofs for Help, Commit, Text wrapping, and Code option leaf semantics;
- CLI check, dry-publish, and full suite: 34 tests, 190 steps;
- `@sys/tools`, Driver Vite, Workspace, and Cell checks;
- repository-wide scan proving every superseded formatter type name is absent;
- no premature `Width.Lib`, `Wrap.Lib`, `Text.Width`, or `Text.Wrap` surface;
- Code remains absent from base type and formatter entrypoints;
- formatter namespace and primary `Lib` JSDoc audited for ownership, semantics, units, defaults, and
  projection boundaries under the canonical type-plane hierarchy rules;
- changed TypeScript and plan formatting plus repository whitespace checks.

### 7. `1a806c709 refactor(cli): namespace text width and wrapping helpers`

Status: landed.

Extend the type grammar and runtime surface atomically:

```text
CliFormatText
├── Lib
├── Width
│   ├── Lib
│   └── Fit.Options
├── Wrap
│   ├── Lib
│   ├── Options
│   ├── Preserve
│   └── PreserveFn
└── Ellipsize
    └── Options
```

```ts
Text.Width.measure(input);
Text.Width.padEnd(input, width);
Text.Width.max(inputs);
Text.Width.fit(options);

Text.Wrap.text(input, options);
Text.Wrap.lines(input, options);

Text.ellipsize(input, width, options);
```

Exact contract:

- Add `CliFormatText.Width.Lib` and `CliFormatText.Wrap.Lib` with `Lib` first in each public
  sub-namespace.
- Extend `CliFormatText.Lib` with readonly `Width` and `Wrap` properties in the same commit that
  adds the runtime objects.
- Extend the `Cli.Fmt.Text.Width` and `Cli.Fmt.Text.Wrap` type projections with their canonical
  `Lib` aliases in that same commit.
- `Text.Wrap.text` is the existing `wrap` function and returns one newline-joined string.
- `Text.Wrap.lines` is the existing `wrapLines` structural primitive and returns
  `readonly string[]`.
- `Text.Width.measure`, `padEnd`, `max`, and `fit` are the existing width helpers by identity; do
  not add wrappers.
- Keep `Text.ellipsize` at the root because it transforms text rather than merely measuring or
  resolving width.
- Remove the flat `visibleWidth`, `padEnd`, `maxVisibleWidth`, `fitWidth`, `wrap`, and `wrapLines`
  members after introducing their canonical nested replacements.
- Let `u.width.ts` and `u.wrap.ts` own their exact contract-bound sub-libraries; keep `m.Text.ts` as
  the composition facade and do not create a helper-file cascade or callable function-object
  namespace.
- Migrate all in-repository CLI, Workspace, Cell, Driver Vite, and other direct consumers to
  `Text.Width.*` and `Text.Wrap.*` in this same commit.
- Keep that cross-package migration strictly mechanical; do not mix viewport behavior or unrelated
  formatting changes.

Red-first proof:

1. `Text.Width` and `Text.Wrap` are exported through `Text`, `Fmt.Text`, and `Cli.Fmt.Text` by
   aggregate identity;
2. every nested member is identity-equal to its focused implementation function;
3. superseded flat runtime members are absent from `Text` and repository source;
4. `Wrap.text` and `Wrap.lines` preserve exact existing output semantics;
5. all in-repository production callers use the canonical nested grammar after migration;
6. focused, full CLI, dry-publish, and direct downstream verification remain green.

Expected implementation paths:

- `code/sys/cli/src/m.core/m.Fmt.Text/m.Text.ts`;
- `code/sys/cli/src/m.core/m.Fmt.Text/t.ts`;
- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-.test.ts`;
- CLI-owned formatter callers under `code/sys/cli/src/m.core/m.Fmt/` and `m.Fmt.Chapters/`.

Strict exclusions:

- no width, wrapping, clipping, or Screen semantic changes;
- no runtime API removal beyond the superseded flat Text members replaced in this commit;
- no cross-package changes beyond direct canonical Text call-site migration;
- no Vite behavior migration;
- no generic text or Unicode package extraction;
- no unrelated CLI type-plane or module-export normalization.

Proof sequence:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task test --trace-leaks ./src/m.core/m.Fmt.Text
deno task check
deno task test
deno task dry
```

Then verify each migrated direct downstream consumer:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check
deno task test

cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task check
deno task test

cd /Users/phil/code/org.sys/sys/code/sys/cell
deno task check
deno task test
```

The red-first Text proofs failed with 34 type errors solely on the absent nested operation
contracts, runtime namespaces, focused function names, and public projections. Local verification is
green:

- focused Text, formatter type, Help, and Chapters tests with leak tracing: 7 tests, 78 steps;
- exact runtime keys for `Text`, `Text.Width`, and `Text.Wrap`, with every nested operation
  identity-equal to its focused implementation function;
- exact `CliFormatText`, root `Cli.Fmt.Text`, `@sys/cli/t`, and `@sys/cli/types` equality for `Lib`,
  `Width.Lib`, `Wrap.Lib`, and all retained policy contracts;
- CLI check, dry-publish, and full suite: 34 tests, 190 steps;
- Driver Vite focused output tests: 8 tests, 52 steps; full suite: 56 tests, 304 steps;
- Workspace focused reporter test: 1 test, 25 steps; full suite: 56 tests, 330 steps;
- Cell full suite: 29 tests, 228 steps;
- `@sys/tools`, Driver Vite, Workspace, and Cell checks;
- repository-wide direct-consumer migration with no superseded flat Text member, declaration, or
  utility export residue;
- BMIND JSDoc audit covering canonical ownership and projections, terminal-cell and ANSI semantics,
  plain-text clipping responsibility, width selection and normalization, and wrapping overflow,
  whitespace, indentation, and preservation invariants;
- targeted local `deno doc` rendering plus live JSR score/docs inspection; published `0.0.303`
  remains the pre-refactor surface and must not be represented as containing these local docs;
- changed TypeScript and plan formatting plus repository whitespace checks.

### 7a. `67fe9739a feat(cli): render styled ellipses without sentinels`

Status: landed.

- Add canonical clipped-part rendering to `Cli.Fmt.Text.ellipsize` with exact
  `{ head, ellipsis, tail }` contracts.
- Keep clipping and terminal-cell budgeting inside CLI while callers add styling only.
- Remove private-use sentinel substitution from CLI, Driver Vite, and Cell formatting.
- Let focused width and wrapping modules own their exact contract-bound runtime objects.
- Keep mutable input requirements free of `readonly`; retain immutability on outputs and stored
  state.
- Centralize Driver Vite clipping helpers and migrate all direct call sites atomically.
- Preserve visible text, ANSI intent, grapheme safety, and terminal-cell bounds.

Verification at landing was green:

- CLI full suite: 34 tests, 191 steps;
- Driver Vite full suite: 57 tests, 318 steps;
- Cell full suite: 29 tests, 228 steps;
- CLI, Driver Vite, and Cell checks and dry-publishes;
- repository scan contains no sentinel constant or private-use marker residue;
- changed-file formatting and repository whitespace checks.

### 8. `2deec18c5 refactor(driver-vite): centralize dev screen render lifecycle`

Status: landed.

#### DMIND subject, need, and fit

The subject is one long-lived parent-owned dev-screen session, not two render helpers coordinated by
`u.dev.ts`. The session needs one phase authority, one redraw scheduler, one spinner owner, one
presentation state, and one terminal-effect boundary so callers can report domain events without
choosing repaint mechanics.

The internal handle is intentionally narrow:

```ts
type DevScreenReporter = {
  outputChanged(): void;
  ready(): void;
  clearLog(): void;
  toggleOptions(): void;
  toggleExtended(ws: t.ViteDenoWorkspace): void;
  dispose(): void;
};
```

Do not retain `redraw`, `redrawSoon`, `createStartup`, a caller-visible phase flag, or generic
invalidation methods. The form should invite only valid domain operations.

#### Runtime state machine

The runtime owns one explicit phase:

```text
startup ── ready() ──> ready ── dispose() ──> disposed
   └──────────────── dispose() ─────────────> disposed
```

`ready()` is a one-way, idempotent transition. Every operation is inert after disposal. Transition
order is contractual:

1. adopt the new phase first;
2. cancel and clear pending work;
3. stop the spinner at most once when leaving startup;
4. perform the immediate render required by the new phase;
5. never allow a canceled startup callback to paint after readiness.

Disposal likewise adopts `disposed` first, cancels pending work, clears pending invalidation state,
and stops the spinner at most once. Scheduled callbacks read current state at flush time; they never
capture a phase-specific renderer.

#### Invalidation and render matrix

Keep two internal invalidation strengths:

```text
content < layout
```

Rapid output changes request deferred `content` work through the existing 50 ms coalescing delay. An
immediate structural action merges as `layout`, cancels the pending delay, and flushes once.
`ready()` uses that same dominance rule while forcing an immediate ready render.

Render behavior for this refactor is exact:

| Phase    | Content flush                            | Layout flush                                               |
| -------- | ---------------------------------------- | ---------------------------------------------------------- |
| startup  | update declared spinner `text` only      | stop if running, clear, print header, update body, restart |
| ready    | clear and print the complete ready frame | clear and print the complete ready frame                   |
| disposed | no effect                                | no effect                                                  |

Assigning declared spinner `text` is the only startup content-update affordance. Remove the optional
`spinner.render?.()` reach-through and do not broaden `Cli.Spinner.Instance` merely to preserve an
implementation detail.

#### Ownership and file boundaries

- `t.internal.ts` is the scoped, non-public type owner for retained dev-output contracts, dev-screen
  render phases and output projection, effect seams, lifecycle contracts, and frame inputs;
  `m.vite/common.ts` exposes that pool only inside the Vite implementation area.
- `u.dev.screen.ts` remains the stable internal facade: reporter policy, `logLines`, runtime
  composition, and snapshot helpers.
- `u.dev.screen.runtime.ts` becomes the sole effectful owner of phase, invalidation, scheduling,
  spinner lifecycle, presentation state, clear/print effects, and disposal.
- `u.dev.screen.layout.ts` receives a mechanical extraction of the existing frame and formatting
  logic so runtime and layout cannot become mutually recursive. Rendered text, ANSI structure, and
  row ordering must remain unchanged; explicit viewport input is deferred to the next commit.
- `u.dev.ts` owns process orchestration only. It creates one reporter after the process lifetime
  exists, forwards output through `outputChanged()`, forwards readiness through `ready()`, gives the
  same handle to keyboard actions, and disposes that one handle during cleanup.
- `u.keyboard.ts` retains its narrow structural capability contract; it does not learn phases,
  scheduling, spinners, or terminal effects.

Use one runtime dependency object for clear, phase-aware print, spinner creation, and delayed-work
scheduling. Preserve the current startup/ready stream behavior in this refactor; explicit stream
identity and spinner-stream alignment belong to the viewport commit, where they can be changed and
proven together.

Reporter acquisition must be transactional. If initial startup rendering or spinner start fails,
stop any acquired spinner without masking the original error. Place reporter acquisition inside the
existing `u.dev.ts` guarded cleanup path so the child process and bootstrap authority are still
released. Cleanup must attempt reporter, process, and bootstrap release even when an earlier cleanup
step throws.

#### Red-first proof

Add the narrow runtime tests before implementation and observe failure solely because the unified
session contract is absent:

1. `DevScreen.create(...)` immediately renders startup and returns `outputChanged()` plus `ready()`;
2. `DevScreen.createStartup` is absent;
3. repeated output changes retain one scheduled task and produce one startup body update;
4. a pending content update followed by `ready()` is canceled and absorbed into one immediate ready
   frame with no stale startup flush;
5. `ready()` and spinner stop are idempotent;
6. ready-state output changes coalesce into one complete repaint;
7. clear/options/extended actions dominate pending content, preserve state semantics, and repaint
   immediately;
8. disposal cancels pending work, stops the spinner exactly once, and makes all later operations
   inert;
9. runtime behavior depends only on declared spinner members and leaves an injected fake's
   Ora-compatible `render()` count untouched;
10. startup and ready snapshot strings remain unchanged under the extracted layout owner.

Use a deterministic injected scheduler with explicit schedule, flush, and cancel evidence. Do not
sleep real time or assert private closure fields.

#### Strict exclusions

- no `Cli.Screen.events()` subscription or resize listener;
- no viewport snapshot contract, width/height policy, or row-budget change;
- no startup height correction, log projection change, or TTY task;
- no terminal stream unification or `Cli.Spinner` API change;
- no visible frame, ANSI, ordering, readiness, URL, process spawn, port, or raw reporter change;
- no public Driver Vite type, option, entrypoint, dependency, or export;
- no compatibility `createStartup` bridge;
- no scheduler, phase, or spinner ownership left in `u.dev.ts`.

#### Proof sequence

From `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`, run the red test first, then:

```sh
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.runtime.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.output.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-u.keyboard.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts
deno task check
deno task test
deno task dry
```

Residue scans from `/Users/phil/code/org.sys/sys`:

```sh
rg -n "createStartup|StartupHandle|StartupDeps|StartupSpinner|render\?\." code/sys.driver/driver-vite/src/m.vite/u
rg -n "let ready|ready \?|startup\?\.redrawSoon|screen\?\.redrawSoon" code/sys.driver/driver-vite/src/m.vite/u/u.dev.ts
rg -n "Time\.delay" code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.runtime.ts code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.ts

deno fmt --check -- code/sys.driver/driver-vite/src/common/t.ts code/sys.driver/driver-vite/src/m.vite/common.ts code/sys.driver/driver-vite/src/m.vite/t.internal.ts code/sys.driver/driver-vite/src/m.vite/u/u.dev.ts code/sys.driver/driver-vite/src/m.vite/u/u.dev.output.ts code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.ts code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.layout.ts code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.runtime.ts code/sys.driver/driver-vite/src/m.vite/-test/u.fixture.dev-screen.ts code/sys.driver/driver-vite/src/m.vite/-test/-u.dev.screen.test.ts code/sys.driver/driver-vite/src/m.vite/-test/-u.dev.screen.runtime.test.ts code/sys.driver/driver-vite/src/m.vite/-test/-u.keyboard.test.ts ./-agent/-plan/@sys.driver-vite/dev-screen-viewport-renderer.plan.md
git diff --check
```

Baseline before implementation is green: focused dev-screen, output-log, and keyboard coverage
passes with leak tracing at 3 files and 36 steps; Driver Vite check and dry-publish pass.

The red-first runtime proof failed with 15 type errors solely on the absent unified session methods
and dependency seams. Verification at landing was green:

- focused runtime state-machine suite with leak tracing: 1 file, 16 steps;
- combined runtime, layout, output-log, and keyboard suite with leak tracing: 4 files, 50 steps;
- real Vite dev integration: 1 file, 3 steps;
- full Driver Vite suite: 57 tests, 318 steps;
- Driver Vite check and dry-publish;
- exact startup → ready absorption, synchronous and deferred scheduler behavior, layout dominance,
  exact-once spinner ownership, construction rollback, cancellation-failure cleanup, and terminal
  disposal proofs;
- existing startup and ready layout snapshots unchanged after mechanical extraction;
- scoped `t.ViteDev.Output` and `t.ViteDev.Screen` own the internal output, render-phase, and
  lifecycle contracts without widening the package's public `t.Vite` surface, importing types from
  runtime modules, or deriving shared contracts through `ReturnType`;
- styled middle clipping routes through canonical `Cli.Fmt.Text.ellipsize` clipped-part rendering;
  private-use sentinel strings and duplicated clipping wrappers are absent;
- retained output captures mutable filtering input without retaining or mutating caller-owned
  collections or regular expressions;
- production runtime still creates Ora through `Cli.Spinner.create` and uses only declared
  `Cli.Spinner.Instance` members; the fake's Ora-compatible `render()` hook remains untouched;
- production residue scans show one reporter creation, one delay owner, no phase routing in
  `u.dev.ts`, and no `createStartup`, startup handle, or spinner reach-through;
- changed TypeScript and plan formatting plus repository whitespace checks.

#### TMIND hostile review gate

Hard-stop and revise the design if any implementation leaves:

- two live handles, timers, spinner owners, or phase selectors;
- a callback that can render startup after `ready()` or anything after disposal;
- scheduler state retained after synchronous flush, cancellation, readiness, or disposal;
- spinner start/stop imbalance or undeclared method access;
- reporter acquisition outside process/bootstrap cleanup ownership;
- layout behavior changes hidden inside the mechanical extraction;
- a resize/viewport feature smuggled into this refactor;
- a compatibility facade that preserves the dual grammar.

Landed verdict: **STIER-A**. The package-internal lifecycle surface, scheduler, transitions, spinner
ownership, acquisition, and disposal are bounded by deterministic state-machine proofs. The viewport
feature extends this owner without reopening the lifecycle architecture.

### 9. `221426360 feat(process)` → `d325aae92 feat(cli)` nonblank repaint substrate

Status: landed. Commit `221426360` exposes canonical host stdout; commit `d325aae92` exposes
stateless terminal-frame repaint over it. Focused Process stdout and Screen verification plus both
package checks and dry-publishes are green.

Failure that motivated the substrate:

- Driver Vite calculates a complete frame correctly but commits it through `clear → print`;
- a terminal emulator may paint the clear before receiving or presenting the replacement;
- the existing 50ms scheduler is bounded latest-state frame pacing, not a trailing debounce, so a
  resize storm can expose that blank intermediate state repeatedly;
- sleeping after clear, adding a speculative 30ms debounce, or introducing a retained-mode TUI does
  not repair the transport invariant.

MAX verdict:

1. The complete frame string is already the back buffer. Do not add a row-diff model or stateful TUI
   framebuffer.
2. Preserve the prior complete frame until the next complete frame is ready, then replace terminal
   rows without a leading full-screen clear.
3. Add exactly one stdout-owned terminal capability:

   ```ts
   Cli.Screen.repaint(frame: string): void;
   ```

4. Keep this primitive stateless. It is explicitly a full-visible-viewport operation whose caller
   owns rows from terminal origin. It owns terminal transport only: no model, viewport, scheduler,
   phase, logs, spinner, Vite policy, inline-region preservation, or retained front-buffer state.
5. On a TTY, construct the complete control sequence before writing and issue one stdout write:
   - enable synchronized output as a progressive enhancement;
   - address each frame row from terminal origin;
   - erase that row, then write its complete styled content;
   - place the cursor on the first row below the frame;
   - erase stale content from that cursor to the end of the display;
   - disable synchronized output;
   - never issue erase-entire-display before frame content.
6. Unsupported synchronized-output mode must degrade to visible top-to-bottom row replacement, not a
   blank screen. Do not use alternate-screen mode, clear scrollback, hide/show the cursor, or assume
   synchronized-output support.
7. On a non-TTY, strip ANSI and emit the plain frame followed by one newline without
   terminal-control sequences.
8. Preserve authored ANSI styling and row text exactly on a TTY. Repaint owns positioning and
   stale-row removal, not clipping, wrapping, or content normalization.
9. Implement the public operation through a testable `u.repaint.ts` adapter seam, parallel to the
   existing Screen measurement/event adapter seams. Production binds terminal detection and one
   logical write through canonical `Process.stdout` from `@sys/process`, imported through CLI's
   local `common.ts`. No host runtime stream or direct platform import crosses into CLI.
10. Keep the unavoidable Deno stdout adaptation inside `@sys/process`, remove its upward
    `@sys/cli/fmt` dependency in favor of the lower-level `@sys/color/ansi` owner, and expose only
    `isTerminal()` plus `write(text)`—not a Deno or Node stream.
11. Project the operation through canonical `CliScreen.Lib` and `Cli.Screen.Lib` only. Do not add an
    options namespace or semantic target: `Cli.Screen` measurement and repaint are one stdout
    terminal session.

TTY payload grammar:

```text
CSI ?2026h                         synchronized output on
CSI 0m                             reset terminal rendition
for each frame row at 1-based r:
  CSI r;1H                        cursor position
  CSI 2K                          erase complete row
  <styled row>
  CSI 0m                          prevent style leakage
CSI (frame-row-count + 1);1H       cursor below frame
CSI 0J                            erase stale content below
CSI ?2026l                         synchronized output off
```

An empty frame skips row replacement, positions at row one, and erases downward. A trailing input
newline represents an explicit empty frame row; repaint adds no implicit TTY content row. Non-TTY
fallback strips ANSI and writes the plain input frame plus one sink newline.

Required red-first CLI proof:

- `Cli.Screen.repaint` is absent before implementation;
- TTY repaint performs exactly one write;
- the payload replaces rows without an erase-entire-display prefix;
- synchronized-output enable/disable brackets the complete payload;
- every prior-row tail is erased before new content and rows below the frame are erased afterwards;
- the final cursor is one row below the frame;
- empty, one-line, multiline, ANSI-styled, narrower, and shorter frames are deterministic;
- non-TTY output contains no control sequences and ends with one newline;
- the root CLI runtime and canonical type projections expose the exact operation.

Implementation proof:

- the canonical substrate proof failed first on absent `Process.stdout`, `t.Process.Stdout`, and
  `u.stdout.ts` contracts;
- `@sys/process` now owns terminal detection, UTF-8 encoding, and complete synchronous host stdout
  writing (including partial-write continuation and zero-progress failure) behind `Process.stdout`,
  with no runtime stream leakage;
- the former `@sys/process → @sys/cli/fmt` dependency is removed, preserving the lower-level
  `@sys/process → @sys/color/ansi` direction required before CLI can consume Process safely;
- repaint red proof failed on the absent `u.repaint.ts` module and `CliScreen.Lib.repaint` contract;
- TTY proof covers one-write addressed replacement, synchronized-output bracketing, rendition reset,
  no erase-entire-display sequence, explicit empty rows, final cursor placement, and stale-content
  erasure;
- non-TTY proof covers ANSI stripping, plain output, empty output, and one sink newline;
- canonical runtime assembly and exact type identity are green;
- focused Process stdout verification passes with leak tracing: 1 file, 2 steps;
- focused Screen verification passes with leak tracing: 5 files, 29 steps;
- Process and CLI checks and dry-publishes pass.

Landed boundaries:

- `221426360 feat(process): expose canonical host stdout` contains the narrow host stdout capability
  and removes the process-to-CLI color dependency before CLI consumes it;
- `d325aae92 feat(cli): repaint terminal frames without blanking` contains only the Screen contract,
  implementation, assembly, exact type projection, and focused proof;
- plan artifacts remain outside implementation commits;
- the human operator owns all Git staging and commits.

### 10. `777afd0d8 feat(driver-vite)` → `9588b4e45 fix(driver-vite)` responsive repaint

Status: complete. Viewport ownership, responsive layout, lifecycle integration, and focused proof
landed in `777afd0d8`. Semantic repaint integration landed in `9588b4e45` over the Process/CLI
substrate. Deterministic proof, package check, dry-publish, and live resize review are complete.

The viewport portions of decisions 1–11 and the sample-task portion of decision 15 landed in
`777afd0d8`. The repaint binding in decision 1 and decisions 12–14 landed in `9588b4e45`. Live
review closes decision 15 with the documented terminal-native and Ora flicker residual.

Hard decisions:

1. Add one cohesive terminal dependency to the reporter runtime. Production binds its measurement,
   resize events, complete-frame repaint, cursor-row policy, and Ora creation to stdout.
2. Extend only `CliSpinner.Create.Options` with a semantic stdout/stderr target and bind Ora through
   that declared creation option. Keep `CliSpinner.Instance` unchanged.
3. Pass `proc.dispose$` into reporter creation. Acquire one `Cli.Screen.events(until)` handle and
   one resize subscription transactionally; release both on rollback and disposal.
4. Subscribe to resize transitions before taking the initial formatting snapshot. Seed the viewport
   from an independent exact copy of `Cli.Screen.size()`, then adopt an independent exact copy of
   each `event.after` snapshot without remeasuring or applying geometry policy in runtime.
5. Make viewport input mandatory in frame contracts. Remove every ambient `Cli.Screen.size()` call
   from `u.dev.screen.layout.ts`.
6. On resize, adopt the latest viewport and request coalesced `layout` invalidation. A flush
   rebuilds every startup region or the complete ready frame; no row-level patching is permitted.
7. Return startup regions from one layout calculation so runtime output and snapshot composition
   share header, body, spinner-row, and cursor-row accounting. Derive fixed row budgets from those
   generated regions rather than mirrored numeric constants.
8. Define physical content capacity as `max(0, viewport.height - sinkCursorRows)`. Startup also
   subtracts header and spinner rows before projecting logs.
9. Build ready layout from core, optional, and log regions. Logs contract first; after logs reach
   zero, extended workspace detail contracts before the shorter operational-options panel. Core
   package and URL/input/output metadata remain ahead of both.
10. Keep `DevOutputLog` retention independent from projection. Shrink hides older visible rows;
    expansion reveals retained rows again.
11. Disposal becomes exhaustive across scheduled work, resize subscription, event handle, and
    spinner, while preserving terminal phase adoption and exact-once ownership.
12. Replace the injected terminal's separable `clear()` and phase-aware `print()` effects with one
    `repaint(frame)` capability backed by `Cli.Screen.repaint(frame)`. Phase remains reporter state,
    not a terminal transport argument. Ready rendering always commits one complete frame; startup
    layout stops Ora, repaints the header without blanking, installs the new body, and restarts Ora
    through declared spinner members only.
13. Retain the existing bounded 50ms latest-state frame pacing for the first nonblank implementation
    and rename its constant from redraw terminology to explicit repaint-delay terminology. Do not
    add trailing debounce, maximum-wait timers, or tune to 30ms before live proof isolates a
    remaining frequency problem from the repaired transport problem.
14. If repaint integration still exposes startup-only flicker, treat Ora coordination as a separate
    proven defect. Do not reach into private Ora methods, widen `CliSpinner.Instance`, or invent a
    generic terminal transaction without a failing proof that the narrow repaint cannot satisfy.
15. Add the declared sample `dev` task and complete the live wide → narrow → wide and tall → short →
    tall TTY proof with no blank intermediate frame before calling the arc finished.

Red-first proof must cover initial acquisition, exact `event.after` snapshot ownership, rapid-resize
coalescing, startup full rebuild, ready full repaint, readiness absorbing pending resize work,
shrink/re-expansion without retention loss, options/workspace pressure, tiny viewports, acquisition
rollback, one repaint per complete ready render, no clear-before-frame effect, and no resize-driven
output after disposal.

Driver test migration:

- replace separate clear and print counters with ordered semantic repaint records;
- initial startup acquisition performs one startup repaint before starting Ora;
- startup content-only work changes declared spinner text without repainting;
- startup layout work stops Ora, performs one startup repaint, then restarts Ora exactly once;
- ready transition and every ready invalidation perform one ready repaint;
- repaint failure participates in transactional acquisition/transition cleanup without masking the
  first error;
- rapid resize still schedules once and commits the independently retained latest viewport;
- runtime production residue contains no `console.clear`, split terminal `clear`/`print`, second
  scheduler, debounce timer, private Ora method, or frame-diff state.

Verification constraint: run only tests related to Screen observation, Spinner targeting, Driver
Vite dev-screen runtime/layout, keyboard integration, and the real Vite dev path. Do not rerun
entire package test suites.

Landed viewport proof before repaint integration is green:

- red-first CLI proof failed on the absent spinner creation target;
- red-first Driver Vite proof failed on the absent terminal/resize harness;
- focused CLI Screen and Spinner suites: 5 files, 27 steps;
- focused Driver Vite runtime, layout, keyboard, and real dev suites: 4 files, 51 steps;
- CLI and Driver Vite checks and dry-publishes;
- deterministic proof covers synchronous initial resize, independent exact `event.after` snapshot
  ownership, rapid resize coalescing, startup full rebuild, ready full repaint, readiness
  absorption, optional-panel state, generated physical row budgets, shrink/re-expansion, tiny
  viewports, rollback, cancellation failure, and terminal disposal;
- a real pseudo-TTY run proved ready-state viewport rerendering from 100 columns to 50 and then 120,
  with matching complete primary rules and retained frame content, but still through the landed
  split clear/print transport;
- the pseudo-TTY harness itself crashes when changing dimensions while Ora is actively spinning, so
  startup-phase acceptance was supplied by final human live review rather than imagined automated
  evidence;
- no probe-owned child process remains after either pseudo-TTY attempt;
- visible clear-before-print flashing was the outstanding runtime proof at landing;
- after `221426360` and `d325aae92` landed but before Driver integration, repository inspection
  found no production Driver Vite repaint call and still found the split
  `console.clear`/`console.info` terminal transport;
- the pre-integration human baseline confirmed the blank flash remained and was more visible while
  shrinking; that observation did not exercise `Cli.Screen.repaint`.

Post-integration implementation proof is green:

- red proof failed on the absent `Runtime.Terminal.repaint` contract;
- the terminal seam now exposes only semantic `repaint(frame)` alongside measurement, events,
  cursor-row policy, and spinner creation; `RenderPhase`, terminal `clear`, and terminal `print` are
  removed;
- initial startup ordering is `repaint → spinner:start`; startup layout ordering is
  `spinner:stop → repaint → spinner:start`; ready transition ordering is `spinner:stop → repaint`;
- startup content-only work does not repaint; ready invalidations perform one complete repaint;
- acquisition and ready-transition repaint failures preserve the first error, phase adoption,
  spinner ownership, and terminal-event cleanup;
- focused CLI Screen and Spinner dependency suites pass with leak tracing: 6 files, 31 steps;
- focused Driver Vite runtime, layout, keyboard, and real dev suites pass with leak tracing: 4
  files, 53 steps; focused runtime proof contributes 23 steps;
- Driver Vite check and dry-publish pass;
- production runtime and focused proof contain no `console.clear`, `console.info`, split terminal
  clear/print, `RenderPhase`, second scheduler, new debounce, private Ora method, or frame-diff
  state;
- human startup and ready resize review confirms the final frame remains correct while visible
  terminal-native/Ora flicker persists during active resizing.

Landed commit boundary:

- `9588b4e45 fix(driver-vite): avoid clear-before-render dev frames` replaces only the split
  terminal transport, migrates focused runtime proof to semantic repaint records, and preserves the
  landed lifecycle, viewport, scheduler, layout, Ora, retention, process, URL, and port behavior;
- plan artifacts remain outside the implementation commit;
- the human operator owns all Git staging and commits.

## Proof plan

### `@sys/cli`

From `/Users/phil/code/org.sys/sys/code/sys/cli`:

```sh
deno task test --trace-leaks ./src/m.core/m.Screen
```

```sh
deno task test --trace-leaks ./src/m.core/m.Spinner
```

```sh
deno task check
deno task dry
```

Required focused proofs:

- `Cli.Screen` is assembled on the root CLI surface;
- TTY repaint emits one complete stdout write and never clears the entire display before content;
- repaint brackets row replacement with synchronized-output control as a progressive enhancement;
- repaint resets terminal rendition around styled rows, erases each addressed row before writing,
  leaves the cursor one row below the frame, and erases stale content below;
- non-TTY repaint emits plain frame text plus one newline without control sequences;
- repaint preserves ANSI-styled frame content and handles empty, shorter, and narrower frames;
- stable measurement produces no resize event;
- width-only and height-only changes emit exact `{ before, after }` transitions;
- unavailable measurement produces no event and preserves the last accepted baseline;
- repeated notifications do not duplicate transitions;
- manual disposal removes the listener once and completes streams;
- upstream disposal removes the listener once;
- an already-disposed lifetime installs no lasting listener;
- early and late subscribers observe completion;
- known unsupported observation returns an inert, disposable handle whose streams complete;
- unexpected platform registration failure remains legible;
- ANSI text preserves existing width behavior;
- CJK, emoji, combining marks, and grapheme clusters use rendered-cell width;
- cell-aware clipping never splits a grapheme cluster;
- spinner creation maps the declared semantic stdout target to Ora without widening the spinner
  instance contract or changing default stderr behavior.

### `@sys/driver-vite`

From `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`:

```sh
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.runtime.test.ts
```

```sh
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.test.ts
```

```sh
deno task test --trace-leaks ./src/m.vite/-test/-u.keyboard.test.ts
```

```sh
deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts
```

```sh
deno task check
deno task dry
```

Required focused proofs:

- one reporter owns startup and ready phases;
- one resize observer and one redraw scheduler exist per reporter session;
- one terminal session owns viewport observation, while stdout owns nonblank repaint and spinner
  output;
- content invalidations coalesce;
- layout invalidation dominates pending content invalidation;
- readiness absorbs pending startup work without a stale startup flush;
- resize uses the latest width and height together;
- startup resize rebuilds header, rule, body, and spinner ownership without a full-screen blank;
- ready resize performs one complete semantic repaint with no separable clear effect;
- no render occurs after disposal;
- ready transition and spinner stop are idempotent;
- all rows remain within viewport width;
- total startup and ready rows remain within viewport height;
- reducing height removes oldest visible log rows first;
- increasing height reveals retained recent rows again;
- options and extended-information modes recalculate the log budget;
- tiny viewports remain bounded without negative row counts or exceptions.

### Runtime TTY proof

The landed renderer provides this package task in `deno.json`:

```json
"dev": "deno run -P=dev ./-scripts/task.main.ts --cmd=dev --dir=./src/-test/vite.sample-1"
```

From `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`:

```sh
deno task dev
```

While the sample dev server is running:

1. resize wide → narrow → wide and verify every rule, metadata row, and log row converges to the
   accepted viewport without stale wrapped residue or an application-issued whole-screen clear;
2. resize tall → short and verify recent logs contract before the frame overflows;
3. resize short → tall and verify retained recent logs reappear;
4. resize during startup and after readiness and verify neither phase issues a separable
   clear-before-render operation;
5. sustain a resize storm and verify bounded responsive frame pacing plus one latest final frame;
6. toggle options and extended information, then resize again;
7. quit and verify no further repaint or signal-listener activity occurs.

Live outcome: startup and ready frames converge correctly, retained output survives projection, and
no application whole-screen clear remains. Visible flicker persists during active resizing because
terminal resize reflow precedes application notification, synchronized output is optional, and Ora
owns independently cleared startup rows. This residual is accepted. Universal compositor-atomic
rendering is not promised by the portable stateless repaint contract.

## Non-goals

- No legacy alias layer: superseded flat type and Text runtime names are removed in their owning
  commit after repository-wide usage scans and atomic in-repository migration.
- No redesign of package/module type-export entrypoints; namespace conformance is separate from
  export-discipline migration.
- No runtime CLI API changes beyond the landed Text namespace replacement, the narrow
  `CliSpinner.Create.Options` output-target contract, and stateless `Cli.Screen.repaint(frame)`.
- No downstream migration beyond direct consumers of names removed by this namespace program.
- No change to raw reporter output.
- No change to Vite readiness detection, URL resolution, process spawning, or port policy.
- No public Vite option beyond the existing `reporter` and `logLines` controls.
- No deletion of retained log rows in response to viewport shrink.
- No scrolling, paging, terminal alternate-screen mode, clear-scrollback behavior, retained frame
  diffing, or general TUI framework.
- No wrapping of log rows; retain bounded single-line middle ellipsis behavior.
- No broad rewrite of `Cli.Spinner` unless a truthful missing contract is proven necessary.

## S-tier acceptance record

Complete with all of the following established:

- `Cli.Screen.events()` emits semantic size transitions rather than raw signal notifications.
- Screen listener ownership and stream completion are deterministic under manual, upstream, prior,
  late-subscriber, and unsupported lifetimes.
- Terminal text fitting uses rendered-cell width and grapheme-safe clipping.
- Every runtime-bearing CLI helper/formatter type module has one canonical domain namespace with
  `Lib` first.
- Canonical helper and formatter contracts project through `Cli.*` by exact aliases rather than
  copied shapes.
- Superseded flat names are absent from the published surface and repository source after each
  owning commit.
- No type-only commit advertises a runtime sub-library that does not yet exist.
- `@sys/cli/t`, `@sys/cli/types`, package checks/tests, and dry-publish all prove the canonical type
  surface.
- The Vite reporter has one lifecycle owner, one phase state, one resize observer, and one
  scheduler.
- `u.dev.ts` contains no startup-vs-ready repaint branching.
- Pure layout contains no ambient screen measurement or terminal effects.
- One terminal session owns viewport observation, while stdout owns nonblank repaint and spinner
  output.
- `Cli.Screen.repaint` commits one complete payload, never clears the entire display before content,
  and leaves one cursor row below the frame.
- Runtime code does not call undeclared spinner methods.
- Startup and ready rendering share one viewport model.
- Width and height are both responsive.
- `logLines` is a maximum and visible logs elastically fit remaining height.
- Core metadata survives before optional detail and logs under vertical pressure.
- Sink newline/cursor cost is included in physical row budgeting.
- Shrinking the terminal does not destroy retained output.
- No application-issued whole-screen clear, separable clear-before-render effect, or stale wrapped
  line remains after narrowing; terminal-native and Ora resize flicker is an accepted residual.
- No scheduled or signal-driven render survives disposal.
- Focused Screen/Spinner/Driver Vite tests, package checks and dry-publishes, the previously landed
  full-suite baseline, and the live TTY review are complete under the documented portable guarantee.

## TMIND failure review

- **Raw-signal confusion:** filtering the observable after emitting fictional `size:changed` events
  is insufficient. Equality belongs before event creation.
- **Fallback confusion:** `80 x 24` is a formatting fallback, not evidence of a measured terminal
  transition.
- **Prior-disposal leak:** attaching after a non-replayed disposal can leave a process-global signal
  listener alive.
- **Late-subscriber hang:** `takeUntil` alone does not make a non-replaying disposed lifetime
  complete streams for later subscribers; complete the event subject explicitly.
- **Baseline race:** measuring before listener attachment opens a window in which the first real
  resize can be missed.
- **Dual-owner race:** separate startup and ready resize subscriptions can clear or repaint over
  each other during handoff.
- **Resize-only patch:** invalidating only startup body content would not repaint its separately
  printed header.
- **Mixed viewport race:** measuring width and height in separate render helpers can compose a frame
  from different terminal states.
- **Spinner reach-through:** optional use of an undeclared `render()` method makes correctness
  depend on implementation detail.
- **Split-stream drift:** measuring stdout while startup renders through stderr/Ora makes viewport
  ownership ambiguous.
- **Implicit-newline overflow:** a sink-appended final newline can scroll a frame that was
  calculated as exactly terminal height.
- **Code-unit width:** ANSI-stripped `.length` does not prove terminal-cell fit and can split
  grapheme clusters during clipping.
- **Vertical off-by-chrome:** startup body budgeting must include header, spinner, and sink cursor
  rows, not only metadata and logs.
- **Destructive fitting:** viewport shrink must alter projection, not retained output state.
- **Optional-panel pressure:** options or extended workspace content can consume vertical space;
  recalculate log capacity from the actual fixed frame rather than a constant estimate.
- **Tiny-terminal masking:** final clipping must not hide a bad normal-case row budget. Assert
  calculated visible-log counts directly as well as final frame bounds.
- **False type/runtime symmetry:** declaring `Width.Lib` or `Wrap.Lib` before the runtime namespace
  exists makes the contract plane lie.
- **Alias drift:** retaining legacy and canonical names creates parallel public grammars; remove
  superseded names after repository-wide usage proof.
- **Namespace maximalism:** trivial leaves do not each deserve a namespace; group by stable
  ownership and runtime/operation boundaries.
- **Table nominality loss:** replacing the former `CliTable` instance type carelessly can
  structurally widen Cliffy compatibility; prove canonical `CliTable.Instance` retains the
  protected-member constraint.
- **Type-plane scope creep:** namespace conformance does not authorize module-export redesign,
  dependency changes, or runtime cleanup.
- **Blank publication:** `clear → print` exposes an invalid intermediate screen even when both calls
  occur synchronously in JavaScript.
- **False atomicity:** placing erase-entire-display before frame text in one write still permits a
  non-synchronized terminal to paint blank first; replace addressed rows instead.
- **Synchronization dependence:** DEC synchronized output is a progressive enhancement, not a
  portable visual-atomicity guarantee. Unsynchronized terminals may visibly process addressed row
  erasure and replacement even though Driver Vite issues one logical payload and no whole-display
  clear.
- **Naive newline addressing:** full-width rows and terminal auto-wrap make relative newline
  movement fragile; use explicit row addressing and place the final cursor deliberately.
- **Debounce category error:** timing cannot repair an invalid terminal transaction. Preserve the
  bounded scheduler until live proof demonstrates a separate pacing problem.
- **Trailing-debounce starvation:** resetting one timer forever during continuous resize can prevent
  any responsive frame; do not add quiescence semantics without a separately proven need and bounded
  latency.
- **Ora cursor collision:** repaint while Ora owns hooked streams can trigger undeclared
  clear/render behavior; stop through the declared contract before repaint and restart afterwards.
- **Non-TTY escape leakage:** forced screen mode must not emit cursor-control sequences into logs or
  pipes.
- **Over-abstraction:** `Cli.Screen.repaint(frame)` is a stateless terminal capability; one reporter
  controller and one pure layout boundary remain sufficient. Do not grow scheduling, model,
  retained-state, or Vite policy into a generic terminal rendering framework.
