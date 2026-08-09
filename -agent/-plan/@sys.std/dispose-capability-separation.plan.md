dispose-capability-separation.plan.md
- [x] [dispose-native-protocol-alignment.plan.md](dispose-native-protocol-alignment.plan.md)
- [x] 41160c75d refactor(sys): route observable lifetimes through lifecycle factories
- [x] d6c1e8e4d fix(std): normalize until through terminal lifecycle truth
- [x] ee0b3a04d refactor(std): retire unearned disposal factory surfaces
- [x] b1de27d15 refactor(types): separate disposal authority from observable lifecycles
- [x] 398c1174c refactor(types): separate disposal authority from observable lifecycles
- [x] c7c71f9c5 docs(std): define disposal capability boundaries
- [x] e86082399 fix(std): keep async projections outside lifecycle normalization

## Status

The opening block records the reviewed capability-separation arc and its confirmed final-review
correction. The completed native implementation arc remains the source of truth for its own commits;
its separate post-publication closure ledger remains authoritative for retirement readiness.

No `chore(deps)` implementation commit belongs to this arc. Local package resolution and the absence
of a publication carrying this capability split made dependency or version mutation unnecessary.
Reachable commits `f7014a4ba` and `336992bb2` are outside this arc: the former is unrelated npm
dependency maintenance, and the latter is a lockfile-only follow-up after the documentation commit.
Neither proves disposal release alignment.

The final 3X audit completed one cold arc-wide primary review and one independent holistic review of
the same disposal source snapshot before cross-model adjudication. It confirmed one runtime guard
mismatch at the async omission boundary and one plan-provenance defect. Focused post-fix review then
rechecked projection descriptors, getter safety, guard classification, dynamic normalization,
overload grammar, active consumers, and residue; the corrected package and downstream proof remained
green. Review is an exit criterion, not a commit item or gate.

An earlier independent maximum-effort review rejected the hard factory cut and non-sticky
`UntilInput` carry-forward. The landed corrections retain the type-plane reduction, retire unearned
public factories rather than manufacturing authority-only products, and make already-terminal stop
truth consistent across normalized inputs.

## Review economics and decision gates

Do not inherit the predecessor's review intensity uniformly. That campaign changed construction
ordering, Promise truth, rejection ownership, and third-party resource composition; this arc
concentrates semantic risk at already-terminal normalization, private-kernel preservation, and the
canonical authority/lifecycle split. Exhaustive search, compiler, package, and release proof is
stronger than another model pass for closed mechanical fallout.

Review classes retain the predecessor's meanings:

- **Full 3X:** primary-model maximum-effort design pass, implementation and deterministic proof,
  cold primary-model maximum-effort post-review, independent maximum-effort review, and explicit
  cross-model adjudication;
- **Focused 2X:** primary-model design and post-review, with independent review of the containing
  semantic checkpoint rather than the individual commit;
- **Deterministic:** high-reasoning implementation plus exhaustive compiler, test, check, dry-run,
  formatting, residue, and dependency-graph proof; escalate only when the evidence exposes semantic
  ambiguity.

| Arc item                                                                  | Principal risk                                                                | Class              | Independent review                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------ | ----------------------------------- |
| `refactor(sys): route observable lifetimes through lifecycle factories`   | Closed cross-package migration ledger and accidental behavior drift           | Focused 2X         | Sample in the final arc review      |
| `fix(std): normalize until through terminal lifecycle truth`              | Terminal-state synthesis, microtask timing, recursive inputs, and guard truth | Full 3X            | Standalone                          |
| `refactor(std): retire unearned disposal factory surfaces`                | Public API removal and private sync/async kernel preservation                 | Full 3X / combined | Batch with the canonical type split |
| `refactor(types): separate disposal authority from observable lifecycles` | Foundational public type break, guards, projections, and structural fallout   | Full 3X / combined | Batch with factory retirement       |
| `docs(std): define disposal capability boundaries`                        | Whole-arc semantic fidelity and future publication ordering                   | Final 3X audit     | Final holistic independent review   |

Review checkpoints:

1. **Migration:** prove the exhaustive source/test ledger, package behavior, compiler truth, and
   residue; perform a cold primary review and escalate only if ownership or behavior becomes
   ambiguous.
2. **Terminal normalization:** require red-to-green proof for already-disposed, already-aborted,
   live, recursive, invalid-overload, and reason-fidelity cases; complete a standalone Full 3X
   checkpoint before proceeding to public type removal.
3. **Capability split:** keep factory retirement and canonical type separation as distinct green
   source history, then independently review their combined public and runtime truth. Prove kernel
   identity and ordering through lifecycle products, removed exports, guard alignment, omission
   semantics, and structural fallout.
4. **Release and documentation:** confirm the local dependency graph and future publication order
   without requiring a version bump, then perform one cold arc-wide primary review and one holistic
   independent review of the completed code, documentation, and external-release account.

Before each item starts, recalibrate the exact model and effort from the current tree rather than
binding the whole roadmap in advance. Use the higher-capability tier where correctness depends on
finding hidden semantic interactions; use the lower-cost tier where an exhaustive migration ledger
or dependency graph already constrains the answer. Escalate any item that introduces a new state
machine, construction ambiguity, Promise/error-policy change, authority leak, compatibility surface,
or unplanned ownership transfer.

The independent review protocol is evidence-driven: freeze and identify the reviewed tree, require
canon-access disclosure, complete the primary cold review before reading the independent conclusion,
adjudicate every finding as confirmed, rejected with reason, or accepted hardening, and rerun the
affected proof. Use `BLOCK`, `MATERIAL CONCERN`, or `READY` as verdict vocabulary.

## Position

There are two primary concepts:

```text
Disposable = disposal authority
Lifecycle  = disposal authority + observation + state
```

`LifecycleView` is the observation-and-state contract of a lifecycle without disposal members in its
surface:

```text
LifecycleView = observation + state
```

These are capability contracts, not three independent runtime systems. Direct and native authority
continue to delegate one kernel established by the predecessor.

## Final type plane

Conceptually:

```ts
export type Disposable = globalThis.Disposable & {
  readonly [Symbol.asyncDispose]?: never;
  dispose(reason?: unknown): void;
};

export type DisposableAsync = globalThis.AsyncDisposable & {
  readonly [Symbol.dispose]?: never;
  dispose(reason?: unknown): Promise<void>;
};

export type Lifecycle = Disposable & {
  readonly dispose$: t.DisposeObservable;
  readonly disposed: boolean;
};

export type LifecycleAsync = DisposableAsync & {
  readonly dispose$: t.Observable<t.DisposeAsyncEvent>;
  readonly disposed: boolean;
};

export type LifecycleView = Pick<Lifecycle, 'dispose$' | 'disposed'>;
```

The `Promise<void>` returned by async authority is its completion truth; no separate public
completion capability noun is required. Async lifecycle telemetry remains distinct from raw Promise
settlement. Do not add `LifecycleViewAsync`, a public observation atom, or a parallel hierarchy
without an earned caller.

## Public construction tier

`Disposable` and `DisposableAsync` are earned boundary types, not public factory products. Current
production evidence shows every sync `Dispose.disposable()` / `Rx.disposable()` caller consumes
`dispose$` directly or passes the value as an observable lifetime, while `disposableAsync()` has no
production caller outside `lifecycleAsync()`.

The final primitive owner-factory tier is therefore:

```text
Dispose.lifecycle()      → Lifecycle
Dispose.lifecycleAsync() → LifecycleAsync
```

Earned composition factories such as `abortable()` and `toLifecycle()` remain because they return or
construct full lifecycle contracts.

Retire:

```text
Dispose.disposable()
Dispose.disposableAsync()
Rx.disposable()
Rx.disposableAsync()
```

Privatize the existing sync/async kernels and preserve their tested direct/native identity,
construction barriers, first-reason rule, Promise identity, rejection truth, and event semantics. Do
not publish an authority-plus-observation intermediate type merely to describe a private kernel.

`toLifecycleView()` currently has no production caller. Retire it and its `Rx` alias unless the
exact post-predecessor tree supplies an earned caller before this item begins. Keep `omitDispose()`,
whose runtime projection has production callers and actually removes or masks direct/native
authority.

Do not move observation onto `.dispose.$`. `dispose$` belongs to the resource lifecycle, which may
be entered through direct, native, bridge, delegated, or lexical cleanup.

## `LifecycleView`

`LifecycleView` is a public observation-and-state contract. It lets an API request lifecycle truth
without requesting disposal methods.

It is not a runtime sanitizer. Structural assignment of a full `Lifecycle` to `LifecycleView` does
not remove methods from the object. At an ownership boundary where runtime authority must actually
be removed, return a freshly constructed view or use the earned `omitDispose()` projection. Never
claim a `Pick`, annotation, or cast removed runtime authority.

Passing a full `Lifecycle` to an internal API accepting `LifecycleView` is valid when that API
merely observes it; this narrows the callable contract but does not project the object.

## `UntilInput`

Preserve `UntilInput` as an ergonomic normalization boundary for anything, or recursive collections
of things, that can safely produce stop truth.

Replace authority-based classification:

```text
Before: Disposable    → observe dispose$
After:  LifecycleView → observe dispose$ and already-terminal state
```

Conceptually:

```ts
export type DisposeInput =
  | t.UntilObservable
  | t.LifecycleView
  | AbortSignal
  | undefined
  | DisposeInput[];

export type Until = t.UntilObservable | t.LifecycleView | AbortSignal | Until[];
```

A full synchronous `Lifecycle` structurally satisfies `LifecycleView`, so `until: life` remains
valid. Raw `life.dispose$` remains valid through the observable branch. Authority-only `Disposable`
objects are not observable lifetimes. Async lifecycle objects remain outside the direct object
branch; callers may pass their `dispose$` explicitly.

Add the earned `Is.lifecycleView` predicate and use it in `Is.until`, `Is.untilInput`,
normalization, and existing hand-written lifecycle checks. `Is.disposable` becomes authority-only
and must prove callable direct/native authority plus opposite-protocol exclusion by value; masked
`undefined` properties are not callable protocols.

### Already-terminal truth

Normalize already-terminal lifecycle views consistently with already-aborted `AbortSignal` inputs.
When `view.disposed === true`, queue one stop emission through the same construction-safe microtask
boundary used for a pre-aborted signal.

This synthesis belongs only to `until` normalization. It does not make `dispose$` sticky or
replaying, alter the lifecycle stream, recover a historical reason, or change later live emissions.
Use `undefined` when no terminal reason remains available.

Harden async overload parsing so a non-function first argument that is not a valid `UntilInput`
fails clearly rather than silently dropping the lifetime bridge.

## Omission and projection utilities

After the split:

```text
OmitDisposable<T> = remove direct and native disposal authority
OmitLifecycle<T>  = remove authority, dispose$, and disposed
```

Delete the old unused middle meaning that removed authority plus `dispose$` while retaining only
`disposed`. Align `OmitDisposable<T>` with the runtime semantics of `omitDispose()`.

Retarget `omitDispose()` to earned observable lifecycle inputs rather than authority-only disposable
values. Its output preserves `dispose$`, `disposed`, unrelated descriptors, accessors, and prototype
behavior while removing or masking `.dispose`, `Symbol.dispose`, and `Symbol.asyncDispose` without
invoking getters. An asynchronous projection retains an own undefined `Symbol.asyncDispose` category
marker: it grants no callable authority and prevents async telemetry from satisfying the synchronous
`Is.lifecycleView` predicate after projection.

## Commit boundaries

### `refactor(sys): route observable lifetimes through lifecycle factories`

- migrate the closed production set from `Dispose.disposable*` / `Rx.disposable*` to lifecycle
  factories;
- include both direct `dispose$` consumers and values passed as `UntilInput`;
- use exhaustive symbol search as the migration ledger because the old types cannot produce compiler
  failures yet;
- preserve all public types, factories, guards, and behavior in this commit;
- keep the commit independently green without casts.

### `fix(std): normalize until through terminal lifecycle truth`

- replace the `Disposable` input branch with `LifecycleView`;
- add and prove `Is.lifecycleView`;
- move `Is.until` / `Is.untilInput` and hand-written terminal checks to lifecycle observation;
- queue stop truth for already-disposed views, matching pre-aborted signals;
- reject invalid async overload inputs instead of silently ignoring them;
- preserve non-replaying lifecycle streams and construction barriers.

This behavior commit precedes the type split so each state remains coherent and testable.

### `refactor(std): retire unearned disposal factory surfaces`

- remove the four public `Dispose` / `Rx` disposable factory entries;
- privatize their kernels beneath `lifecycle*()`;
- retain lifecycle state derivation through the established event path unless a separate proof shows
  a kernel-state optimization preserves sync and async event-time truth;
- retire `toLifecycleView()` and its alias if it remains without a production caller;
- move or preserve kernel behavior tests through the public lifecycle surface.

Retiring factories before tightening canonical types avoids a temporary public
`Disposable & { dispose$ }` intersection.

### `refactor(types): separate disposal authority from observable lifecycles`

- make canonical sync/async disposable types authority-only;
- make lifecycle types explicitly own observation and state;
- update `Is.disposable` to the authority-only predicate;
- align omission utilities and `omitDispose()` constraints;
- simplify structural lifecycle implementers such as DevHarness contexts and bus connections;
- use the compiler as the exhaustive structural ledger;
- add no migration casts or permanent compatibility hierarchy.

The type split landed in two consecutive commits with the same subject: `b1de27d15` carries the
substantive capability separation, and `398c1174c` carries the final Rx API-test and module-doc
casing cleanup. The duplicated subject is historical record, not a second substantive type split.
Preserve both identities in the opening arc; do not rewrite or collapse landed history.

### Release and documentation

Treat the native and capability arcs as separate source histories but one external release train at
the next publication boundary. Live `@sys/types@0.0.300` and `@sys/std@0.0.377` JSR documentation
inspected during the final review still exposed the predecessor's transitional contract. The types
package defined `Disposable` with `dispose$`; the std package documented that shape together with
retired factory and projection surfaces. The next publication must therefore report this capability
split as a second public break rather than claim one continuous unpublished migration.

The local packages also remain at those already-published versions; neither is a publication
candidate merely because source work landed, and neither may be republished without a version bump.
No dependency or version artifact is required while the workspace resolves local packages and no
publication is being prepared. Version bumps are publication operations, not implementation proof or
readiness gates. At a future publication boundary, bump and align release authority in dependency
order:

```text
@sys/types → @sys/std → affected dependents
```

Document:

```text
Disposable                  = native + reason-aware disposal authority
Lifecycle                   = Disposable + dispose$ + disposed
LifecycleView               = observation + state contract
Dispose.lifecycle*          = public constructor tier
UntilInput LifecycleView    = normalized stop truth, including already-terminal state
```

## Fallout ledger

Initial production migration set for `Dispose.disposable()` / `Rx.disposable()`:

- `code/sys.ui/ui-dom/src/m.Keyboard/m/m.Keyboard.Monitor.ts`
- `code/sys.ui/ui-react/src/use/use.ObservableRev/use.ObservableRev.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.RxBus/u.bus.connect.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Bus/Bus.Events.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/ui/ModuleList/use.ScrollController.ts`
- `code/sys.ui/ui-components/src/ui.react/ui/Media.Config/ui.Filters.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Media.Config/ui.Zoom.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Player.Video.Element/use.FileSize.ts`
- `code/sys/std/src/m.Rx/u.time.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/use.Yaml.ts`
- `code/sys.driver/driver-monaco/src/ui/-dev/ui.YamlObjectView.tsx`
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/ui.tsx`

The completed migration was rechecked against active `code/**` and `deploy/**` sources. This initial
list remains historical evidence rather than a substitute for the compiler and residue proof.

Structural and adjacent surfaces include:

- DevHarness `BusConnection`, `DevEvents`, `DevContext`, and `DevCtx`;
- `EffectAdapter`, `EffectController`, and `OmitLifecycle` construction;
- CLI screen termination normalization;
- `toLifecycle`, retired `toLifecycleView` residue, and `omitDispose`;
- predecessor-listed structural test doubles;
- both `Dispose` and `Rx` public spellings.

Do not invent a canonical observation-only resource noun merely because wider APIs expose a
`dispose$` field. A field-level observable remains an ordinary explicit signal unless a repeated
cross-boundary contract earns promotion.

## Runtime invariants

Preserve every predecessor invariant except the explicit `UntilInput` already-terminal correction:

- direct and symbolic disposal share one operation;
- first reason wins and lexical cleanup supplies no reason;
- async calls return one canonical completion;
- raw rejection and normalized lifecycle telemetry remain distinct;
- construction barriers and floating rejection ownership remain unchanged;
- lifecycle state is truthful during terminal event observation;
- sync/async protocol exclusivity remains unchanged;
- authority-free runtime projections expose no callable direct/native disposal path;
- no shim, fallback, or parallel disposal authority is introduced.

Any other state-machine, Promise-ordering, event, reason, bridge, or third-party ownership change is
outside this arc and requires reassessment.

## Proof

At minimum prove:

- authority-only sync/async values satisfy canonical disposable contracts without observation/state;
- lifecycle values require and expose authority, observation, and state;
- `LifecycleView` exposes observation/state and promises no disposal members;
- `omitDispose()` removes own and inherited direct/native authority without getter execution;
- runtime authority removal is never claimed from type narrowing alone;
- already-disposed lifecycle input → one queued stop request;
- already-aborted signal → the existing one queued stop request;
- live lifecycle, observable, abort, nested, and undefined inputs retain their behavior;
- authority-only disposable input is rejected as `UntilInput`;
- async lifecycle object and its authority-free projection are rejected directly while an explicit
  `dispose$` remains accepted;
- invalid direct `until` and async overload inputs fail clearly;
- `Is.disposable`, `Is.lifecycleView`, `Is.until`, and `Is.untilInput` agree with their predicates;
- opposite native protocols remain rejected by value;
- retired factory and alias exports are absent;
- no public authority-plus-observation intermediate contract remains;
- no `as t.Disposable`, `as t.Lifecycle`, `unknown as`, or equivalent migration cast suppresses
  fallout.

Name and update at least:

- `code/sys/types/src/t/-test/-.test.ts`
- `code/sys/std/src/m.Is/-test/-.test.ts`
- `code/sys/std/src/m.Dispose/-test/-u.until.test.ts`
- `code/sys/std/src/m.Dispose/-test/-u.lifecycle.test.ts`
- `code/sys/std/src/m.Dispose/-test/-u.dispose.test.ts`
- `code/sys/std/src/m.Dispose/-test/-u.omitDispose.test.ts`
- `code/sys/std/src/m.Rx/-test/-m.Rx.api.test.ts`
- `code/sys/std/src/m.Rx/-test/-m.Rx.disposable.test.ts`
- `code/sys/std/src/m.Rx/-test/-m.Rx.withinTimeThreshold.test.ts`

Run focused tests first, then package test/check/dry in every touched module. At minimum include
`@sys/types`, `@sys/std`, `@sys/cli`, `@sys/ui-dom`, `@sys/ui-dev`, `@sys/ui-react`,
`@sys/ui-components`, `@sys/driver-monaco`, and `@sys/driver-automerge`. Carry forward any
additional packages exposed by the completed predecessor tree.

From the workspace root run:

```sh
deno task check
deno task test
deno task dry
deno task lint
deno fmt --check code/sys/types code/sys/std code/sys/cli code/sys.ui/ui-dom code/sys.ui/ui-dev code/sys.ui/ui-react code/sys.ui/ui-components code/sys.driver/driver-monaco code/sys.driver/driver-automerge
```

Use the predecessor's external-resolution proof only when candidate versions actually cross package
boundaries during publication preparation.

Observed proof on the current source and documentation snapshot:

- `@sys/types`: 21 tests / 72 steps, check, and dry publish passed;
- `@sys/std`: 174 tests / 2,192 steps, check, dry publish, and three documentation examples passed;
- `@sys/ui-dev`: 18 tests / 158 steps, check, and dry publish passed;
- `@sys/driver-monaco`: 26 tests / 348 steps, check, and dry publish passed;
- relevant downstream package proof passed;
- workspace dry publish passed all 53 packages;
- changed documentation is formatter-stable and contains no retired factory or projection names.

The root workspace test exceeded its 300-second bound without a reported failure. Root lint and
`deno doc --lint` retain unrelated baseline debt; package checks and publish simulation remain
green.

## Adjudicated review decisions

- **Confirmed:** `Disposable` becomes authority-only; `Lifecycle` owns observation/state.
- **Modified:** retire unearned disposable factories instead of narrowing them into unused products.
- **Modified:** `LifecycleView` is a contract; runtime removal requires a real projection.
- **Rejected:** preserve non-sticky behavior inside `UntilInput`; already-terminal inputs normalize
  to queued stop truth without changing `dispose$` itself.
- **Confirmed:** no new permanent observation hierarchy.
- **Confirmed:** omission names return to literal capability semantics.
- **Deferred:** direct kernel-state optimization; measured convenience does not justify reopening
  established async event ordering in this arc.
- **Confirmed:** sync/async types both split; async completion remains explicit in the Promise
  return, not a symmetry-only factory tier.
- **Confirmed (final 3X):** an async `omitDispose()` projection lost the only runtime evidence that
  distinguished `DisposeAsyncEvent` telemetry from synchronous `LifecycleView` events. Preserve an
  undefined async-protocol category marker, reject it by presence in `Is.lifecycleView`, and prove
  direct dynamic `until` rejects malformed inputs.
- **Accepted hardening (final 3X):** enforce the declared async lifecycle overload grammar rather
  than silently replacing or ignoring handlers supplied through JavaScript or `any` boundaries.
- **Rejected (final 3X):** add runtime tombstone key sets for retired APIs; typed object literals,
  compiler checks, and active-source residue searches already prove absence without brittle key
  snapshots.
- **Rejected (final 3X):** make `toLifecycle()` installations configurable solely to permit repeated
  rebinding; repeated mutation is an unearned API and weakens the construction boundary.
- **Rejected (final 3X):** rename `BusConnection.isDisposed`; that state is deliberately separate
  from canonical lifecycle telemetry and preserves the established bus API.
- **Confirmed (final 3X):** both governing plan artifacts must become reachable history anchors, and
  the external release account must name both published transitional packages.

## Non-goals

- no public authority-only disposal factory without an earned caller;
- no public `DisposeObservation`, `ObservableDisposable`, or equivalent intermediate hierarchy;
- no `dispose.$`;
- no claim that TypeScript narrowing removes runtime authority;
- no sticky/replay mutation of `dispose$` itself;
- no direct async lifecycle-object branch in `UntilInput`;
- no mass explicit-to-lexical rewrite;
- no unrelated `DisposableLike`, `CanDispose`, `LifeLike`, service, or Rx-alias redesign;
- no unproven kernel-state optimization;
- no casts to suppress structural fallout;
- no reopening of the native runtime-floor decision.
