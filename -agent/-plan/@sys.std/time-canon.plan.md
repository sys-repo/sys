time-canon.plan.md
- [x] 94917be13 fix(std): settle rejected Schedule queue tasks
- [x] b7ddde994 fix(std): own delayed callback settlement
- [x] dc85b0f21 fix(std): terminate failed intervals
- [x] d744cf8cb fix(std): align scoped timers with root lifecycle contracts
- [x] a1823bd7f fix(std): enforce Time polling deadlines and cancellation
- [x] 5ebceb344 fix(std): correct Time instant and timer ownership
- [x] 3a1c2ee58 fix(std): normalize duration parsing and validity
- [x] a7b42e3eb refactor(std): tighten Time type-plane contracts

## Purpose

Bring the `@sys/std/time` primitives to canon-level contract truth, lifecycle safety, and API
clarity without forcing broad consumer rewrites. Preserve the common scheduling and elapsed-time
call shapes, correct landed behavioral defects beneath them, and isolate semantic changes that
genuinely require a migration.

This plan governs `Schedule.queue` failure settlement, `Time`, `Time.Delay`, `Time.Duration`, and
the `Time.Date` composition boundary. Other public Schedule callback/hop contracts remain unchanged.
`Timecode` is out of scope except for preserving the intentional `@sys/std/time` export composition.

Planning, review, and readiness do not authorize implementation or Git mutation.

## Related ownership

Canonical timer-domain behavior landed as
`8caa9bd21 fix(std): bound timer-backed scheduling
durations`, supporting the later
`d3e926627 fix(process): terminate owned child handles without
ambient run authority` item from
[`finite-chrome-process-authority.plan.md`](../@sys.testing/finite-chrome-process-authority.plan.md).
The Process dependency is satisfied. `Time.Delay.MAX` and its normalization helper are now baseline
contracts consumed by `Async.Schedule`, `Time.Delay`, and `Time.interval`; this plan must preserve
that one semantic owner rather than reopen or duplicate the landed policy.

The later `423f37fd8 tidy(std): house delay behavior under Time.Delay` and
`255e92c97
refactor(std): organize Time module boundaries` commits changed structural ownership
without changing the reviewed behavior. Plan targets below follow those current boundaries.

## Baseline contract

The compatibility baseline includes these established call shapes:

- `await Time.wait(msecs)`;
- `Time.Delay.create(msecs, callback?)` and its `Time.delay(...)` compatibility alias, returning a
  cancellable Promise handle;
- `Time.interval(msecs, callback, options?)` with an explicit cancellable handle;
- `Time.until(until).delay(...)`, `.wait(...)`, and `.interval(...)`;
- `Time.now.timestamp` and `Time.utc(input).format(template)`;
- `Time.elapsed(start, end?)`, `Time.duration(input)`, and `Time.timer()`;
- `Time.Date` plus the top-level `Date` and `Duration` compatibility exports.

Representative consumers use these shapes for process deadlines, readiness polling, UI teardown, CLI
spinners, build timing, retry loops, and date labels. Internal correction must not turn those
consumers into a repository-wide migration campaign.

## Design posture

### Kernel boundary

Keep the primitive vocabulary small:

- calendar operations belong to `Time.Date`;
- timer-domain policy and one-shot cancellable delays belong to `Time.Delay`;
- finite elapsed amounts belong to `Time.Duration`;
- recurring timers and polling compose under `Time` over `Async.Schedule` and `Time.Delay`;
- lifecycle composition belongs to `Time.until`;
- wall-clock wrappers and elapsed recorders must state their clock and timezone semantics honestly.

Do not add Temporal, a generic clock framework, a scheduler policy framework, or a parallel timer
family without a concrete consumer and owner-level proof.

### S-tier future-nimbleness criterion

Clean the present contract without imitating a future Temporal-shaped API. Future flexibility comes
from honest semantic boundaries and a pure public type surface, not from a speculative abstraction.

- Keep `date-fns` and every other formatting substrate as contained implementation detail; public
  contracts must not inherit dependency types, overloads, or extension systems automatically. Own the
  selected semantics explicitly, including existing format-token behavior retained for compatibility.
  Removing dependency type imports alone does not make formatting substrates interchangeable.
- Keep host scheduling, elapsed amounts, instants, calendar values, formatting, and timezone
  authority as distinct concepts even when the compatibility namespace composes them.
- State Unix timestamp units, timezone behavior, validity, and ownership at every public boundary.
- Own mutable `Date` inputs internally and do not leak mutable implementation state through outputs.
- Keep duration amounts distinct from date-time instant inputs and from calendar-aware duration
  concepts that this library does not implement.
- Preserve one canonical implementation behind compatibility aliases; aliases must not become
  parallel semantic owners.
- Do not widen inputs to speculative date-like unions or expose hypothetical Temporal adapters.
- Keep contract tests substrate-independent so a later earned Temporal adapter or implementation can
  be additive and selective rather than a repository-wide migration.

A future Temporal adoption is admissible only when supported runtimes, a concrete current consumer,
the lowest truthful owner, compatibility behavior, and owner-level proof establish it. Until then,
absence is deliberate architectural cleanliness rather than a missing feature.

### Compatibility strategy

Classify every change before implementation:

1. repair behavior already promised by the public contract beneath the existing call shape;
2. refine types or docs when runtime behavior is already supported;
3. add a new canonical noun only when an existing need cannot be named truthfully in place;
4. retain a narrow compatibility alias when removing it would create broad mechanical churn;
5. treat the selected Queue, Delay, and polling settlement corrections below as explicit behavioral
   changes within this arc; other settlement, timezone, or signed-duration changes require a
   separate migration decision;
6. treat the selected Date formatting type narrowing below as an intentional pre-1.0 source change,
   not cosmetic annotation cleanup. Repository usage bounds local migration proof, not all published
   consumers.

Compatibility aliases must project exactly from their canonical owner and be documented as such. Do
not maintain two independent implementations. Preserved call shapes do not imply unchanged failure
channels or resource ownership. Prove those selected changes at their consumers rather than calling
them cosmetic maintenance.

## Selected semantics

These decisions are implementation constraints. Changing one requires an evidence-based plan
refinement before implementation.

### Cancellation and abort

- Manual `Delay.cancel()` remains quiet, idempotent, and resolving for compatibility.
- `Time.delay` and `Time.wait` retain quiet signal cancellation before callback admission. Their
  handle state distinguishes cancellation from completion.
- `Time.waitFor<T>` rejects with the signal's abort reason because abort cannot resolve its
  `Promise<T>` without a `T`. The current repository has no production signal-bearing `waitFor`
  consumer, so this selection has no production migration surface.
- A pre-aborted signal prevents predicate or callback admission.
- Once a Delay callback has been admitted, its returned completion or failure owns settlement; later
  cancellation cannot relabel that outcome. A callback that never settles can keep that Delay
  Promise pending; its `timeout` field is scheduling metadata, not a callback-execution deadline.

A future breaking change that makes all signal cancellation reject is outside this arc.

### Polling observation and deadlines

`Time.waitFor` owns an observation window, not execution or cleanup of the caller's predicate.
Unlike Delay, it must settle on abort or deadline without waiting for an admitted asynchronous
predicate to settle. It never claims that rejecting the waiter cancels that predicate's work.

- Snapshot predicate, interval, timeout, and signal once at invocation. Preserve defaults of 30 ms
  between false results and a 2,000 ms total timeout. Normalize the polling interval through the
  existing timer-domain owner.
- Admit `timeout` as a finite non-negative millisecond amount no greater than
  `Number.MAX_SAFE_INTEGER`; fractional amounts remain supported. Invalid timeout values reject with
  `RangeError` before predicate admission. Zero permits no predicate admission. This logical-budget
  boundary is distinct from permissive host-delay normalization.
- Use one captured `performance.now` clock for the complete operation in supported Deno/browser
  hosts, including predicate execution and interval waits. Do not silently substitute wall time.
  Compare elapsed time with the original budget rather than relying on an unsafe deadline sum.
- Own a deadline wake independently of the predicate. Round a positive remaining wake delay upward
  before applying the existing `Time.Delay.MAX` ceiling, recheck the same budget when it wakes, and
  rearm if necessary. Never clamp a long logical timeout to one host-timer period or reset its
  budget after a predicate or sleep. Timer delivery is a wake-up opportunity, not deadline
  authority.
- At admission, on wake-up/abort, and when observing either predicate fulfillment or rejection, use
  this precedence: retain an already selected terminal outcome; otherwise observed abort selects the
  signal's exact reason; otherwise elapsed time greater than or equal to timeout selects the
  existing timeout Error; otherwise admit work or process the predicate outcome. This defines the
  tie when abort and expiry are first observed together, not their unknowable physical ordering.
- A truthy value or original predicate failure observed within that window settles the waiter. False
  values schedule the next interval only while the window is live. A result observed exactly at or
  beyond the deadline cannot win, even if its timer callback has not run.
- Admit at most one predicate at a time. Attach both outcome observers when its returned work is
  admitted. Abort/timeout stops all further admission; late fulfillment is ignored and late
  rejection is consumed without changing the selected result or creating another error report.
- Release owned timers, interval waits, signal listeners, and references to operation state when the
  waiter settles. Do not accumulate reactions by repeatedly racing each poll against one shared
  never-settled cancellation Promise. A pending caller Promise may retain minimal outcome observers
  detached from completed operation state; this does not mean the reactions were removed from that
  Promise or its work terminated.
- Predicate invocation and thenable assimilation can execute synchronous caller code. Neither a
  timer nor abort can preempt that code or a blocked event loop. Recheck authority when control
  returns; do not claim a hard wall-clock settlement bound.
- `T` remains opaque. The waiter does not call `dispose`, abort a request, or cancel a late value's
  body. Predicates returning resources must retain caller-owned cleanup for false or late results.
  Source-compatible resource-producing callers require a targeted ownership check; ordinary
  condition polling does not acquire a resource-management API.

### Callback and failure ownership

- Delay callbacks may complete synchronously or asynchronously; the returned decorated Promise
  settles from that callback outcome and is caller-owned. Ignore ordinary return values while
  observing returned asynchronous completion. As with synchronous callback throws today, discarding
  a rejecting delay Promise remains a caller error. Delay must consume its scheduled adapter's
  outcome so a callback rejection reaches only the returned Delay Promise, not Queue's host
  reporter.
- Interval callbacks remain synchronous. A scheduled callback throw stops the interval, records a
  failed terminal state, and is rethrown to the host exactly once. An immediate callback throw first
  cleans all acquired resources and then rethrows synchronously from `Time.interval`.
- A thenable returned from an interval callback is unsupported: stop the interval, consume the
  thenable solely to prevent a second rejection channel, and report one contract `TypeError`.
- `Schedule.queue` continues to admit maybe-async tasks and returns only its cancellation lifecycle.
  Disposal suppresses task admission, not work already admitted. An admitted task remains observed
  through settlement; disposal during its execution cannot suppress its later failure report.

### Queue error reporting

For `Schedule.queue` only, the selected failure path is:

```text
task failure → attempt lifecycle disposal → enqueue one unguarded macrotask → throw original failure
```

Use the existing package-internal `makeScheduleFn('macro')` without a lifecycle argument. It already
uses the host `setTimeout` captured by `u.scheduleFunction.ts`; reuse that binding rather than
importing the composed Schedule namespace back into Queue or adding another capture implementation.
The reporting callback is synchronous and throws the original value, including non-Error thrown
values. Task failure itself must not reject the internal async observer. Dispatch must occur even
when lifecycle disposal throws; preserve that disposal-origin failure separately.

Reporting always takes this path, regardless of the task's original queue and regardless of whether
`queueMicrotask` was available at module initialization. There is no Promise-rejection fallback for
this report. A usable captured host timer is a substrate requirement; do not add a silent console,
`reportError`, Promise, or public error-bus fallback. Host shutdown or stalled execution can prevent
report delivery; the library promises one dispatch on a functioning substrate, not durable
telemetry.

The reporting turn is deliberately outside the disposed task lifecycle. Neither repeated disposal
nor subsequent cancellation can retract it. Caller disposal-observer and subscription-teardown
failures retain the existing Dispose/Rx behavior, not relabeled or counted as task failures.
Ordinary observer callback throws retain Rx's host-error channel. A subscription teardown that
throws synchronously out of automatic disposal may reject Queue's internal observer with Rx's
original `UnsubscriptionError`, preserving its contained failure identities. This is an explicit,
human-approved exception to Queue's nonrejection guarantee, not a Promise fallback for task
reporting. Suppressing, converting, or eliminating disposal-origin failures requires a separately
scoped Dispose decision; this item does not redesign Dispose/Rx.

Public `Schedule.micro`, `macro`, `raf`, `make`, and their callback-versus-awaitable and
Promise-fallback semantics are not changed. In particular, raw `Schedule.micro(callback)` without
`queueMicrotask` retains its existing rejection channel; this arc does not silently repair that
distinct contract.

### Date-time and elapsed ownership

- Omitted input and epoch zero are distinct; numeric input means Unix timestamp milliseconds.
- Date-time construction represents invalid input without throwing so existing finite-timestamp
  guards remain valid. An invalid instance owns an invalid cloned `Date`, exposes `timestamp: NaN`,
  and throws a stable `RangeError` when formatting is requested.
- Wrappers clone mutable `Date` values both in and out.
- `Time.utc` retains its established local-zone formatter behavior in this arc and is documented as
  a compatibility-named constructor, never as a UTC calendar formatter.
- `Time.now` remains the valid current-time getter over the same DateTime construction path.
- `Time.timer` keeps wall-clock semantics, but `startedAt` and `elapsed` describe the same reset
  generation and do not depend on caller mutation.
- A monotonic stopwatch, explicit UTC formatter, instant constructor, or other new noun requires a
  separate additive item only after a concrete consumer earns it.

### Duration validity

- Duration parsing consumes the complete input string against one documented decimal grammar.
- The grammar accepts leading zeros, a leading or trailing decimal point with at least one digit,
  optional whitespace between amount and unit, and the existing case-insensitive units. It rejects
  signs, exponent notation, numeric separators, malformed suffixes, and internal numeric whitespace.
- Finite zero and positive amounts are valid; non-finite and malformed inputs are invalid. Negative
  zero normalizes to zero.
- Existing negative-invalid compatibility remains, including reversed `elapsed` values. Signed
  durations require a separate additive contract rather than an in-place semantic flip.
- Every invalid instance has `ok: false` and the numeric sentinel `-1` for `msec`, `sec`, `min`,
  `hour`, and `day`; no derived field retains `NaN`, `Infinity`, or `-0`.
- Duration-amount input and elapsed-instant input receive distinct type names even when
  compatibility aliases remain.

### Timer-domain policy

- `Time.Delay`, `Time.interval`, and `Async.Schedule` preserve their permissive timer boundary:
  negative, fractional, non-finite, and unsafe-integer inputs normalize to zero; valid integers
  above `Time.Delay.MAX` clamp to the ceiling.
- Process remains a stricter owner and rejects out-of-domain public deadlines before child
  acquisition.
- This boundary-specific asymmetry is explicit compatibility policy, not divergent timer ownership.

## Invariants

- Every public overload has matching runtime behavior and owner-level proof.
- Every terminal selection settles the public Promise exactly once with an outcome its contract
  represents. Delay may remain pending on an admitted non-settling callback; polling need not wait
  for that caller work.
- Parent disposal and caller abort compose without dropping either authority.
- Child completion, cancellation, abort, timeout, and failure release parent-child lifecycle bridges
  immediately.
- A failed repeating task cannot remain `running`, report `cancelled`, or execute again.
- Corrected Queue and Time wrappers leave no library-internal, caller-unreachable rejection from
  task or callback failure. Queue preserves the explicit disposal-teardown exception above. A
  caller-owned rejecting Delay Promise and the unchanged raw Schedule fallback remain distinct.
- Terminal Time operations release their owned timers and lifecycle bridges. Queue failure retains
  only its one scheduled reporting turn until dispatch. Borrowed pending work may retain minimal
  outcome observers, never continued polling or a growing per-poll observer list; do not claim that
  standard Promises support detaching reactions or terminating arbitrary caller work.
- Timer-domain normalization has one implementation owner and one stated policy per public boundary.
- Wall-clock, monotonic, timezone, timestamp-unit, and mutable-value semantics are explicit.
- Inputs remain permissive only where runtime semantics are defined; outputs and stored state remain
  readonly and owned.
- Public types flow through the canonical type plane; implementation overload parsing contains no
  `any`.
- Common consumer call shapes remain source-compatible throughout this arc.

## `fix(std): settle rejected Schedule queue tasks`

### Target surface

- `code/sys/std/src/m.Async.Schedule/u/u.queue.ts`;
- `code/sys/std/src/m.Async.Schedule/t.ts`;
- `code/sys/std/src/m.Async.Schedule/-test/-queue.test.ts` and the existing host-error authority
  fixtures.

### Required behavior

- Preserve cancellation before task admission and exactly-once lifecycle disposal effects.
- Observe admitted synchronous or asynchronous task settlement internally, even after caller
  disposal; never use a post-admission disposed check to drop failure evidence.
- Implement the selected Queue error-reporting contract through one unguarded internal macro
  scheduler after attempting disposal, including when disposal throws. Task failure must not reject
  the scheduled wrapper; rethrow it only in the separate synchronous host callback.
- Preserve disposal-origin failures separately under the explicit teardown exception above. Expose
  no speculative result or error API on the returned lifecycle. Do not change unrelated raw
  scheduling contracts or Dispose/Rx behavior.
- Preserve every queue mode, admission order, and timer-domain behavior.

### Proof

Prove synchronous throw, asynchronous rejection, disposal before admission and during execution,
exactly-once disposal effects, every queue mode, original failure identity (including non-Error
values), and disposal observed before one host error. Cover a task that disposes its own lifecycle
before rejecting. Repeat with `queueMicrotask` absent at module initialization and with ambient
`setTimeout` replaced after initialization; report dispatch must still use the captured timer.

Extend the existing isolated host-error fixtures, not a new process framework. Observe both `error`
and `unhandledrejection`, count events rather than only collecting unique values, and retain the
observers through the controlled reporting turn so duplicate reports fail. The existing Set-based
`observeValues` helper alone cannot prove exactly-once delivery. Task failure produces one `error`
and no task-origin internal `unhandledrejection`; retain the existing raw micro-fallback test with
its distinct expected rejection. Exercise throwing observer callbacks and throwing subscription
teardown for both synchronous task throws and asynchronous rejections. Count task reports
independently from disposal-origin errors/rejections and preserve both failure identities.

For ordinary task failures, establish disposed state and exactly-once disposal effects before the
fixture's first post-settlement disposal call. Subsequent disposal must not retract the report.
Settle the report and remove test listeners/timers before fixture completion. Prove listener
inactivity with post-cleanup sentinels and inspect outstanding fixture timers before clearing their
bookkeeping; assigned cleanup flags alone are not evidence. Fixture cleanup must release listeners
and timers even when disposal throws, including timers acquired during disposal, while preserving
the disposal failure.

## `fix(std): own delayed callback settlement`

### Target surface

- `code/sys/std/src/m.Time/m.Delay/u.delay.ts`;
- `code/sys/std/src/m.Time/m.Delay/t.ts`;
- `Time.Delay` callback, Promise, handle, and status contracts;
- representative asynchronous-callback consumer behavior.

### Required behavior

- Replace ad hoc booleans with one explicit pending → running → terminal transition owner.
- Observe a returned callback's asynchronous completion and propagate its rejection through only the
  caller-owned Delay Promise; the Schedule adapter must not also reject into Queue's host reporter.
  Keep ordinary value-returning callbacks source-compatible and ignore their values.
- Let cancellation win only before callback admission.
- Prevent callback-triggered abort or cancellation from swallowing callback failure after admission.
- Keep manual and pre-admission signal cancellation quiet and idempotent.
- Remove abort listeners and scheduling lifecycles on every terminal path. Cleanup bookkeeping must
  not attach an abandoned rejecting `finally` chain or swallow the caller-visible rejection.
- Preserve the decorated Promise call shape and timeout metadata. A returned non-settling callback
  keeps the admitted Delay pending rather than manufacturing cancellation or completion.

### Proof

Prove synchronous and asynchronous success/failure, ordinary ignored callback values, manual
cancellation, pre-abort, abort at callback admission, callback-triggered abort, callback-triggered
cancellation followed by throw, repeated cancellation, late abort, exact terminal flags, and
listener teardown. With the caller observing rejection, assert no Queue host report and no internal
unhandled rejection. Use a controlled pending callback to prove post-admission cancellation cannot
settle it, then release it and join the actual outcome.

## `fix(std): terminate failed intervals`

### Target surface

- `code/sys/std/src/m.Time/u/u.interval.ts`;
- `code/sys/std/src/m.Time/t.ts` for `Time.Interval` callback, handle, and status contracts;
- interval behavior and host-error tests under `code/sys/std/src/m.Time/-test/`.

### Required behavior

- Add `is.failed` so failure is not misreported as cancellation.
- For a scheduled synchronous throw, stop and clean the interval, mark one failed terminal state,
  then rethrow the original error to the host exactly once.
- For an immediate synchronous throw, release every acquired listener and timer before rethrowing
  synchronously from `Time.interval`; no handle is returned on that throwing call.
- Treat a returned thenable as unsupported synchronous-interval misuse: stop, consume it solely to
  prevent a second rejection channel, and report one contract `TypeError`. Observe resolver-driven
  settlement and any Promise returned by the invoked `then` method, preserving one getter read and
  the original receiver.
- Retain abort-listener teardown authority through registration completion, including synchronous
  notification before acquisition and registration that throws after acquisition.
- Preserve pre-abort and cancellation behavior and fixed-interval timing semantics.

### Proof

Prove immediate and scheduled throws, original error identity where supported, exactly one report,
no later tick, truthful failed/cancelled flags, thenable misuse, pre-abort, cancel/failure races,
listener teardown, and no timer or rejection leak. Cover async `then` methods whose returned Promises
reject immediately or after controlled release, before or after resolver settlement. Assert terminal
state and released resources before that release and before fixture cancellation. Exercise listener
registration re-entry, including throws before and after acquisition; prove listener inactivity with
an abort sentinel before fixture intervention.

## `fix(std): align scoped timers with root lifecycle contracts`

### Target surface

- `code/sys/std/src/m.Time/u/u.until.ts`;
- package-private owners in `m.Time/m.Delay/u.delay.ts` and `m.Time/u/u.interval.ts`, shared by root
  and scoped calls so argument parsing and settlement each retain one owner;
- scoped delay, wait, and interval contract tests under `code/sys/std/src/m.Time/-test/`.

### Required behavior

- Implement every root overload promised by `Time.Until`, including options-first interval calls.
- Preserve options and direct `AbortSignal` or `AbortController` inputs through scoped calls.
- Compose parent lifetime and caller signal without losing either authority or terminal state.
- Ensure pre-disposed parents and pre-aborted callers suppress callback admission. Project known
  terminal state from lifecycle-view and signal lifetime inputs before immediate admission; preserve
  Dispose's emission semantics for observable-only lifetime inputs, which carry no past state.
- Bind parent cancellation before callback admission and release its subscription inside the root
  owner's terminal cleanup. Keep parent binding package-private, with no public hook or second
  observer attached to the caller-owned Promise.
- Release parent subscriptions when a child completes, cancels, aborts, times out, or fails;
  interval termination must not retain an unconditional parent subscription. Scoped cleanup must
  preserve the one caller-owned Delay rejection without an abandoned Promise chain or a second Queue
  host report.
- Keep parent and child disposal idempotent under races. Parent disposal cannot relabel an already
  admitted Delay callback's outcome or claim that it terminated the callback's external work.

### Proof

Build one runtime/type matrix covering each delay, wait, and interval overload in root and scoped
forms. Prove callback-first and options-first interval calls, direct signal/controller forms,
pre-termination, child-first termination, parent-first termination, simultaneous races, and teardown
through observable subscription counters rather than Rx implementation internals. Cover synchronous
notification during parent subscription and caller-listener acquisition, including registration
throws and throwing bridge teardown. Establish child-first bridge release before fixture disposal;
for interval failures, establish it before host reporting. Reuse the root host-error fixtures for
scoped failures and preserve canonical timer normalization and microtask-versus-timer scheduling.

## `fix(std): enforce Time polling deadlines and cancellation`

### Target surface

- `code/sys/std/src/m.Time/u/u.wait.ts` and the package-private owner in `u/u.waitFor.ts`, with
  internal effect types in `u/t.waitFor.ts`;
- `code/sys/std/src/m.Time/-test/-Time.wait.ts`, renamed to `-Time.wait.test.ts` atomically with the
  behavior correction;
- `code/sys/std/src/m.Time/-test/-Time.waitFor.test.ts` and `u.fixture.waitFor.ts` for controlled
  clock/delivery ordering and the real-host capstone;
- `code/sys/std/src/m.Time/t.ts` where polling options or failure documentation require correction;
- the two readiness probes named below, their local `u.serve.waitFor.ts` helpers, and owning
  `-test/-serve.polling.test.ts` suites.

### Required behavior

- Replace the dead suite's stale quiet-abort assertion and its type shape that omits `signal`.
- Implement the selected polling observation contract and exact terminal precedence above, including
  finite logical-budget admission and independently owned deadline wake-ups.
- Reject for pre-abort without invoking the predicate. Stop admission and settle the waiter on abort
  or deadline during either a predicate or interval wait, without awaiting a pending predicate.
- Preserve the predicate's truthy `T` or original rejection only when observed before terminal
  selection and within the budget. Observe both late outcomes without another result or error
  report.
- Keep one predicate in flight and bounded operation bookkeeping; prevent both an aborted-delay hot
  loop and reaction accumulation on a shared pending cancellation Promise.
- Clean owned wake-ups/listeners and detach references to finished operation state. Never dispose
  opaque predicate values or claim to abort borrowed work.

### Proof

Use a package-internal clock/wake-up/cancellation effect seam for deterministic deadline ordering.
Owner tests may import that helper directly, but it must not enter public `m.Time/t.ts`, `mod.ts`,
`-exports/-time.ts`, or the package type pool. Do not introduce a public clock API or global mutable
test hook. Keep one real-host capstone for event delivery and ordinary Promise behavior.

The internal owner captures the monotonic clock and host wake handles, using the existing Delay
normalizer for host durations. Its borrowed-Promise observer lives in a separate function scope and
retains only an observer cell that terminal cleanup empties; no per-poll cancellation Promise or
shared pending race is needed. Controlled tests distinguish clock advancement from timer delivery
and assert release before fixture disposal or borrowed-work settlement. These are bounded resource
and reference-ownership proofs, not a universal heap-leak guarantee.

Prove test discovery; invalid, zero, fractional, and above-`Time.Delay.MAX` logical budgets;
pre-abort; abort during sleep and an in-flight predicate; exact abort-reason identity; predicate
failure before expiry; and a predicate pending beyond both timeout and abort. Prove outcomes before,
at, and after the deadline with delayed timer delivery, early wake/rearming, wall-clock changes,
both abort/deadline observation orders, callback-triggered abort followed by throw, and synchronous
work returning after expiry. After termination, release the controlled predicate with success and
rejection separately: neither changes the result, admits another poll, nor creates an unhandled
rejection. Assert bounded active timers/listeners over many false results, no retained per-poll
cancellation reactions, and truthy generic-result preservation.

Audit the concrete resource-producing readiness probes at
`code/sys.driver/driver-pi/-scripts/-test.external/-task.serve.process-proof.ts` and
`code/sys.driver/driver-vite/src/-entry/-test.external/-serve.cached.process.ts`. At baseline these
returned `Response` values from asynchronous predicates. Keep request/body ownership in those
callers: consume successful bodies inside the predicate, cancel false and late response bodies, and
abort the caller-owned request when the observation window ends. Prove these paths through each
probe's local helper, including timeout during body consumption. Do not add a generic result-disposer
option, move fetch ownership into Time, or claim that a rejected waiter alone aborted a request.

## `fix(std): correct Time instant and timer ownership`

### Target surface

- `code/sys/std/src/m.Time/u/u.utc.ts`;
- `code/sys/std/src/m.Time/u/u.timer.ts`;
- `code/sys/std/src/m.Time/t.ts` for corresponding DateTime and Timer contracts;
- tests under `code/sys/std/src/m.Time/-test/`;
- `m.Time.Date` only where formatting semantics must be stated truthfully.

### Required behavior

- Treat `0` and negative finite timestamps as explicit Unix-millisecond values rather than omitted
  input.
- Represent invalid input without throwing during construction; preserve `timestamp: NaN`, return
  cloned invalid `Date` values, and throw one stable `RangeError` from `format()`.
- Clone valid input and output `Date` values so caller mutation cannot alter stored state.
- Record that numeric `YYYYMMDD` currently parses as an ISO basic date and is deliberately corrected
  to Unix-millisecond semantics; no current production consumer passes a number.
- Make `timer.reset()` update public `startedAt` and elapsed origin as one generation.
- Prevent mutation of a supplied or returned start Date from changing elapsed measurement.
- State that `Time.utc(...).format(...)` and `Time.now` use the existing local-zone date formatter;
  do not claim UTC calendar behavior.

### Proof

Prove omitted input, epoch zero, negative and ordinary millisecond timestamps, `YYYYMMDD`
correction, invalid inputs, stable format failure, input/output Date mutation, reset and repeated
reset, wall-clock regression, and `Time.now` coupling. Assert formatter parity directly, then run
the focused UTC suite from the host under both `TZ=UTC` and `TZ=Pacific/Auckland`; this does not
widen package test permissions or spawn a child from the test.

## `fix(std): normalize duration parsing and validity`

### Target surface

- `code/sys/std/src/m.Time/m.Duration/m.Duration.ts`;
- `code/sys/std/src/m.Time/m.Duration/t.ts`, where `Duration.To.min`, `.hour`, and `.day` currently
  return `t.Secs`;
- `code/sys/std/src/m.Time/m.Duration/-test/-.test.ts`.

### Required behavior

- Replace prefix extraction with one anchored full-string grammar implementing the selected syntax.
- Distinguish valid inputs currently rejected (`03s`, `3.0s`, `1.50s`, `2.50h`, `007`, `12.`) from
  valid inputs silently mis-valued (`.5s` currently yields `0.5ms` rather than `500ms`).
- Reject malformed suffixes, signs, exponent notation, numeric separators, numeric whitespace,
  `NaN`, and infinities.
- Produce the selected all-`-1` invalid sentinel without `NaN`, `Infinity`, or `-0` fields.
- Separate duration-amount inputs from elapsed-instant inputs in the contract plane.
- Correct minute, hour, and day conversion vocabulary at the owning `Time.Duration.To` surface.
- Preserve negative-invalid behavior and aliases until a separate signed-duration design is
  accepted.

### Proof

Use a grammar table covering both failure families, integers, decimal forms, leading zeros,
whitespace, every supported unit, unknown and partial units, empty input, signs, exponent notation,
numeric separators, negative and non-finite values, ISO instant inputs, and reversed elapsed
instants. Constrain the `To` implementation with `satisfies`; global unit aliases all resolve to
`number`, so this is vocabulary truth rather than distinguishable nominal type proof.

## `refactor(std): tighten Time type-plane contracts`

### Target surface

- `code/sys/std/src/m.Time/t.ts` and module runtime surfaces;
- `code/sys/std/src/m.Time/m.Delay/t.ts`;
- `code/sys/std/src/m.Time/m.Duration/t.ts`;
- `code/sys/std/src/m.Time.Date/t.ts`;
- `code/sys/std/src/-exports/-time.ts` and `code/sys/std/src/types.ts`;
- `code/sys/types/src/t/t.Time.ts` only where system-owned DateTime contracts require refinement;
- public JSDoc, API identity tests, and representative consumers;
- `code/sys/std/README.md` for concise pre-1.0 migration guidance covering `FrameOptions` removal
  and the selected Date formatting type narrowing.

### Required behavior

- Make frozen `Lib` members readonly and keep input options aligned with canon input policy.
- Type every overload parser without `any` or broad unsafe assertions.
- Add compile-time positive and negative overload parity tests.
- Remove unused `FrameOptions` and record the public pre-1.0 type removal in release guidance.
- Introduce no new canonical noun in this arc; explicit UTC formatting, monotonic stopwatch, instant
  construction, and signed differences remain unearned follow-up candidates.
- Ensure `Time`, `Date`, `Duration`, and nested namespace identities remain intentionally frozen.
- Keep `Timecode` composition explicit without pulling it into the Time ontology.
- Remove `date-fns` and other implementation-substrate leakage from public Time and Date contracts;
  expose only system-owned semantic types under the selected Date boundary below. Do not copy the
  dependency's type graph or hide it behind `Parameters`, `ReturnType`, or renamed re-exports.
- Keep timestamp, calendar, formatting, timezone, duration, and scheduling concepts distinct enough
  that a future earned Temporal adapter can be additive rather than substitutive.
- Document local-zone DateTime formatting, wall-clock Timer behavior, boundary-specific timer
  normalization, invalid-value behavior, and compatibility aliases from proven runtime truth.

### Selected Date formatting boundary

Own the modest API already exercised by this repository; do not recreate date-fns's extension
system merely to remove its imports. Preserve existing Date members and compatibility aliases;
absence of a production caller does not authorize wholesale API removal.

The public `Date.Format` contract is:

- `toString(date, pattern): string`, also exposed as `Date.format`, with no options parameter;
- `distance(date, baseDate, options?): string`, with only `addSuffix?: boolean` in its options;
- `relative(date, baseDate): string`, with no options parameter;
- `subDays(date, amount): Date`, with no options parameter or generic subtype-return guarantee.

Retain the existing `Date | UnixTimestamp | string` input family for these operations; numbers mean
Unix milliseconds. A Date subclass remains structurally admissible as a Date, but the public return
contract does not preserve its subtype. Do not normalize inputs or replace runtime constructors just
because the exposed return type is Date. Keep amount semantics as calendar-day subtraction, not an
elapsed-millisecond operation.

Withdraw locale objects, context functions (`in`), custom-Date return inference, and unselected
formatting options from the supported type surface. This includes `includeSeconds`, week-rule
options, and additional-token flags. Retain the observed `addSuffix` control; invent no replacement
locale, timezone, context, or formatter abstraction. Consumers requiring dependency-specific
extensions should use that dependency directly rather than an `unknown`/`any` escape hatch here.

Keep current local-zone defaults, format-token behavior, string interpretation, and invalid-input
behavior; do not narrow patterns to an enum of repository examples. In particular, Date formatting
strings and `Time.utc` ISO construction are not interchangeable parsing contracts. Describe the
selected behavior rather than promising isolation from dependency-wide ambient defaults that the
runtime does not provide.

Keep direct implementation bindings where they satisfy the explicit signatures, preserving public
alias identity and frozen namespace identity. Type narrowing does not reject extra JavaScript
arguments or strip option fields at runtime; TypeScript structural typing is not exact-object
validation. Add no enforcement wrapper and do not claim the underlying extension behavior has been
removed at runtime. Replace dependency-derived `parse`, `difference`, `Day`, `Is`, and constant
declarations with explicit system-owned contracts without removing those members or redesigning
their behavior.

### Repository usage evidence and Date proof

Source searches covered `code/`, `deploy/`, and `-scripts/`, including named imports/re-exports,
Date/Format aliases, direct dependency imports, and formatting-option names. Inspected callers are:

- `code/sys/fs/src/m.Pkg.Dist/u.log/u.dist.ts`: build Unix milliseconds with
  `y MMM d, h:mmaaa` and no options;
- `code/sys.driver/driver-vite/src/m.fmt/u.Dist.ts`: Unix milliseconds with
  `d MMM y, h:mmaaa`, `d MMM, h:mmaaa`, and `h:mmaaa`, without options;
- `code/sys.driver/driver-vite/src/-test/-sample-imports.ts`: a Date with `E MMM do, yyyy`;
- `code/sys/std/src/m.Time/u/u.utc.ts`: an owned Date plus the supplied template or `yyyy-MM-dd`;
- `code/sys/std/src/m.Time.Date/-.test.ts`: quoted-literal formatting, relative labels, day subtraction,
  and distance with `addSuffix: true`.

No source caller requiring the withdrawn options or custom-Date return contract was found in that
scan. This is repository evidence, not an audit of external published consumers. Duration arithmetic
and workspace reporting also consume Date's millisecond constants; preserve those values and names.

Add positive type proofs for these call shapes, all retained input kinds, alias equivalence, and the
ordinary Date return. Add negative proofs for fresh literals containing withdrawn distance options,
extra options arguments on the other formatters, and reliance on a subclass-specific return member.
Do not assert that Date subclass inputs are forbidden or that structural typing rejects every object
carrying extra fields.

Prove observable formatting results, `addSuffix` behavior, relative labels, and non-mutating
calendar-day subtraction through the public surface, not only equality with dependency functions.
Keep the existing DateTime ownership/error tests and local-zone checks under UTC and
Pacific/Auckland. Compile and exercise the concrete FS and Vite label consumers without mechanical
rewrites; cached-only environment limits must be reported rather than treated as product failures.
Document the exact withdrawn type guarantees and the direct-dependency migration route in the
package README; do not imply that unknown published consumers are unaffected.

### Representative consumer proof

Compile and run focused consumers covering:

- process deadlines and timeout validation;
- HTTP and network readiness polling;
- UI component and hook disposal;
- CLI and build spinner intervals;
- retry delays;
- elapsed build/report formatting;
- date-time parsing, validity guards, and labels.

No repository consumer should require a mechanical rewrite merely to absorb the stabilization arc.
The selected public type withdrawals retain their explicit external migration caveat.

### Type-plane implementation and verification evidence

The selected Date boundary retains direct runtime bindings, readonly owned callables, editable caller
options, explicit AbortController wait support, guarded option parsing, and documented pre-1.0
withdrawals. Positive/negative Time and Date contract tests cover the public surface; a focused
Player.Video.Element hook test proves delayed admission and effect-cleanup cancellation. The
implementation required no production consumer rewrites or dependency changes. The ten-file commit
contains the reviewed implementation, the formatter-error correction, and the final prose polish;
public export composition and shared `code/sys/types/src/t/t.Time.ts` remain unchanged.

Implementation verification:

- Full `@sys/std` test task: **207 tests / 2,820 steps**, all passed with checking, frozen/cached-only
  resolution, and leak tracing.
- Final Time type, Date contract, and UTC tests under UTC: **4 tests / 50 steps**; Date contract and
  UTC tests under Pacific/Auckland: **3 tests / 47 steps**. Both passed.
- Package check and changed-file format/lint checks passed. Attributable whitespace checks passed;
  the final polish did not claim whole-worktree cleanliness or repair unrelated plan whitespace.
- Focused FS Dist, Vite output-width/build-elapsed/polling, Process operation/owned-child,
  HTTP readiness/cancellation, and Net connect consumer suites passed.
- Workspace phase/reporter/formatting consumers: **4 tests / 60 steps**, passed.
- UI component/hook consumers: **3 tests / 20 steps**, passed; adjacent effect-controller lifecycle:
  **1 test / 7 steps**, passed. These use the DOM mock, not a real-browser compatibility claim.
- Self-review covered declarations, parser guards, aliases, direct bindings, exports, docs,
  type misuse proofs, and the UI cancellation consumer. Independent review is recorded separately
  below rather than inferred from this self-review.

Independent review and final correction:

- The supplied fresh-session review found no unintended call-shape, lifecycle, alias, or ownership
  regression. It reported full std verification at **207 tests / 2,820 steps**, focused
  types/overloads at **3 tests / 145 steps**, Date/UTC coverage under UTC and Pacific/Auckland at
  **4 tests / 69 steps each**, and focused downstream consumers at **13 tests / 135 steps**.
- Its sole P3 finding was an overly broad formatter-error promise. Invalid dates throw `RangeError`,
  but pattern errors propagate from the retained binding; the empty pattern currently throws
  `TypeError`. The correction preserves that runtime behavior and adds an explicit regression
  assertion. Focused Date verification passed at **1 test / 9 steps**, with format/lint and scoped
  whitespace checks passing.
- The final polish clarified snapshots, amounts, calendar operations, callback settlement, and
  cancellation ownership without further signature or behavioral changes. It removed mechanical
  branch commentary and made test descriptions behavioral. The final full std rerun passed at
  **207 tests / 2,820 steps** with checking, frozen/cached-only resolution, and leak tracing.
  The focused UI cancellation suite passed at **1 test / 2 steps**; changed-file format/lint and
  scoped whitespace checks also passed. This polish was self-reviewed, not a second blind pass.

### Verification limits and retirement boundary

The focused consumer proofs do not establish a real-browser result or compatibility for unknown
published consumers. The selected pre-1.0 type withdrawals and direct-dependency migration route
remain documented in `code/sys/std/README.md`.

Earlier external polling process proofs retain their environmental limits: the Vite cached-only
child lacked `prosemirror-view@1.42.4`, and Pi live serving was blocked by an external listener on
`127.0.0.1:8080`. Pi prepared-Dist/refusal checks and both drivers' focused polling suites passed;
these do not prove the blocked end-to-end runs succeeded. No cache population, dependency upgrade,
permission widening, or interference with the listener was used to resolve those limits.

The opening arc is the landing ledger. Preserve this reconciled plan as the final completion
snapshot with `plan(done): time-canon.plan.md` before removing it in a separate
`plan(archived): time-canon.plan.md` commit. Archival must leave that snapshot recoverable from
reachable history; preparing this file authorizes neither Git mutation nor removal.

## Validation and landing

For each item:

1. demonstrate the narrow regression before its correction when practical;
2. run the focused Time, Date, Duration, Schedule, and lifecycle tests relevant to that item;
3. run `deno task check` from `code/sys/std`;
4. run formatter and lint checks through the owning task surfaces when available;
5. run `git diff --check` and inspect the exact attributable diff;
6. land one semantic commit and then reconcile its reachable hash in the opening arc.

After the final item, run the full `@sys/std` test task and focused representative-consumer suites,
then perform a final S-tier residue pass over source, types, tests, JSDoc, exports, retained
aliases, and leak/race proof.

## Non-goals

- broad repository call-site renaming;
- Temporal adoption;
- a generic scheduler or clock framework;
- changing all signal cancellation to rejection;
- changing `Time.utc` in place to UTC calendar formatting;
- making existing Duration instances signed;
- an async repeating-work orchestration API;
- removing top-level Date, Duration, or Timecode compatibility exports;
- reopening or duplicating the landed `Time.Delay` timer-domain policy;
- unrelated `@sys/std`, Rx, UI, Process, HTTP, or workspace cleanup.
