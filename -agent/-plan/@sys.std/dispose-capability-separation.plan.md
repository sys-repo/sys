dispose-capability-separation.plan.md
- [ ] [dispose-native-protocol-alignment.plan.md](dispose-native-protocol-alignment.plan.md)
- [ ] refactor(sys): route observable lifetimes through lifecycle factories
- [ ] fix(std): normalize until through terminal lifecycle truth
- [ ] refactor(std): retire unearned disposal factory surfaces
- [ ] refactor(types): separate disposal authority from observable lifecycles
- [ ] chore(deps): align disposal capability release authority
- [ ] docs(std): define disposal capability boundaries

## Status

Adjudicated future arc. It preserves the selected capability design while the native campaign is
fresh and supersedes nothing until `dispose-native-protocol-alignment.plan.md` completes its opening
arc and exit criteria.

An independent maximum-effort review rejected the earlier hard factory cut and non-sticky
`UntilInput` carry-forward. The corrections below retain the type-plane reduction, retire unearned
public factories rather than manufacturing authority-only products, and make already-terminal stop
truth consistent across normalized inputs.

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
construction barriers, first-reason rule, Promise identity, rejection truth, and event semantics.
Do not publish an authority-plus-observation intermediate type merely to describe a private kernel.

`toLifecycleView()` currently has no production caller. Retire it and its `Rx` alias unless the exact
post-predecessor tree supplies an earned caller before this item begins. Keep `omitDispose()`, whose
runtime projection has production callers and actually removes or masks direct/native authority.

Do not move observation onto `.dispose.$`. `dispose$` belongs to the resource lifecycle, which may be
entered through direct, native, bridge, delegated, or lexical cleanup.

## `LifecycleView`

`LifecycleView` is a public observation-and-state contract. It lets an API request lifecycle truth
without requesting disposal methods.

It is not a runtime sanitizer. Structural assignment of a full `Lifecycle` to `LifecycleView` does
not remove methods from the object. At an ownership boundary where runtime authority must actually be
removed, return a freshly constructed view or use the earned `omitDispose()` projection. Never claim
a `Pick`, annotation, or cast removed runtime authority.

Passing a full `Lifecycle` to an internal API accepting `LifecycleView` is valid when that API merely
observes it; this narrows the callable contract but does not project the object.

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

Add the earned `Is.lifecycleView` predicate and use it in `Is.until`, `Is.untilInput`, normalization,
and existing hand-written lifecycle checks. `Is.disposable` becomes authority-only and must prove
callable direct/native authority plus opposite-protocol exclusion by value; masked `undefined`
properties are not callable protocols.

### Already-terminal truth

Normalize already-terminal lifecycle views consistently with already-aborted `AbortSignal` inputs.
When `view.disposed === true`, queue one stop emission through the same construction-safe microtask
boundary used for a pre-aborted signal.

This synthesis belongs only to `until` normalization. It does not make `dispose$` sticky or
replaying, alter the lifecycle stream, recover a historical reason, or change later live emissions.
Use `undefined` when no terminal reason remains available.

Harden async overload parsing so a non-function first argument that is not a valid `UntilInput` fails
clearly rather than silently dropping the lifetime bridge.

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
invoking getters.

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

### Release and documentation

Treat the native and capability arcs as separate source histories but one external release train when
both complete before publication. Do not intentionally publish the predecessor's transitional
`Disposable + dispose$` contract between them. If that contract has already been externally
published when this arc activates, report the second source break explicitly rather than claiming a
single migration.

Align release authority in dependency order:

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

Re-run the search against the completed predecessor tree before implementation; this list is evidence,
not a frozen substitute for compiler/search proof.

Structural and adjacent surfaces include:

- DevHarness `BusConnection`, `DevEvents`, `DevContext`, and `DevCtx`;
- `EffectAdapter`, `EffectController`, and `OmitLifecycle` construction;
- CLI screen termination normalization;
- `toLifecycle`, `toLifecycleView`, and `omitDispose`;
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
- async lifecycle object is rejected directly while its `dispose$` remains accepted;
- invalid async overload input fails clearly;
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
`@sys/ui-components`, `@sys/driver-monaco`, and `@sys/driver-automerge`. Carry forward any additional
packages exposed by the completed predecessor tree.

From the workspace root run:

```sh
deno task check
deno task test
deno task dry
deno task lint
deno fmt --check code/sys/types code/sys/std code/sys/cli code/sys.ui/ui-dom code/sys.ui/ui-dev code/sys.ui/ui-react code/sys.ui/ui-components code/sys.driver/driver-monaco code/sys.driver/driver-automerge
```

Use the predecessor's external-resolution proof when candidate versions cross package boundaries.

## Adjudicated review decisions

- **Confirmed:** `Disposable` becomes authority-only; `Lifecycle` owns observation/state.
- **Modified:** retire unearned disposable factories instead of narrowing them into unused products.
- **Modified:** `LifecycleView` is a contract; runtime removal requires a real projection.
- **Rejected:** preserve non-sticky behavior inside `UntilInput`; already-terminal inputs normalize to
  queued stop truth without changing `dispose$` itself.
- **Confirmed:** no new permanent observation hierarchy.
- **Confirmed:** omission names return to literal capability semantics.
- **Deferred:** direct kernel-state optimization; measured convenience does not justify reopening
  established async event ordering in this arc.
- **Confirmed:** sync/async types both split; async completion remains explicit in the Promise return,
  not a symmetry-only factory tier.

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
