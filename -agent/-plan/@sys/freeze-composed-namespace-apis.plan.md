freeze-composed-namespace-apis.plan.md
- [x] 003cb3fcd refactor(std): replace namespace monkey-patching test seams
- [x] f634c095e refactor(std): freeze terminal namespace API leaves
- [x] 9a4a782d5 refactor(std): freeze intermediate namespace API composers
- [x] d90e80f3c refactor(std): freeze public namespace API roots
- [x] 001603869 test(std): prove frozen namespace extension compatibility
- [x] 1e45d4902 refactor(tmpl): freeze composed namespace API scaffolds
- [x] 20d850308 refactor(cli): replace namespace monkey-patching test seams
- [x] 25efdf80a refactor(http): replace crypto, CLI, and static-server monkey-patching seams
- [x] f43b726eb refactor(workspace): replace CLI, registry, and prep monkey-patching seams
- [x] a364d00c0 refactor(yaml): replace CLI input monkey-patching seams
- [x] 636a14f41 refactor(sys): freeze foundation namespace APIs
- [x] 816db28ae refactor(sys): freeze platform namespace APIs
- [x] 61e76a351 refactor(sys): freeze application namespace APIs
- [ ] refactor(sys): complete frozen namespace API closure

## Purpose

Make exported singleton namespace APIs immutable across `@sys/std`, the canonical `@sys/tmpl` module
shapes, and every package under `code/sys`.

The invariant is:

> Every exported singleton namespace API under `code/sys` is shallow-frozen at its declaration,
> including each nested namespace object, unless that surface is explicitly documented and tested as
> mutable. Every applicable `@sys/tmpl` module scaffold emits that invariant by default.

`Object.freeze` is shallow. A frozen root such as `Pkg` is insufficient unless namespace-valued
children such as `Pkg.Is`, `Pkg.Subpath`, `Pkg.Dist`, `Pkg.Dist.Is`, `Pkg.Dist.Compat`, and
`Pkg.Dist.Part` are independently frozen.

This plan preserves function identity, property keys, enumerability, getters, call behavior, export
names, and leaf-subpath authority. It changes only the ability to add, replace, reconfigure, or
delete properties on namespace API objects.

## Scope

Bootstrap package:

- `code/sys/std`

Canonical template package:

- `code/-tmpl`

System migration boundary:

- every package root directly under `code/sys`;
- exported singleton namespace APIs composed outside `mod.ts`;
- cross-package extension/override and test-substitution sites.

Plan artifact:

- `-agent/-plan/@sys/freeze-composed-namespace-apis.plan.md`

No package version, dependency, import-map, generated metadata, class, constructed instance, state
container, or standalone function export is changed merely to satisfy this invariant.

The former std-only draft under `-agent/-plan/@sys.std/` is superseded and removed in this
plan-refinement change so two live ledgers cannot diverge.

## Current worktree boundary

Planning initially observed concurrent `@sys/std/pkg` work. MAX review rechecked the live worktree
and reachable history: that work has landed in `eb847da61` and `744caa081`, and the package
implementation now lives under `code/sys/std/src/m.Pkg/m/`. The Pkg freeze boundary is currently
clean, but every resumed item must still recheck ownership.

Final closure review re-attributed the CLI, Server, Cell, Workspace, driver, tools, and media deltas
that are necessary to preserve behavior under frozen providers. The bounded closeout unit contains
only residual namespace freezes, package-owned substitution seams, generated passthrough pin
repairs, downstream compatibility fixes, and closure proof.

Concurrent `start-ui` design work and unrelated security, tools, UI, README-quality, and
proof-fidelity plan artifacts remain outside this plan and outside the closeout boundary. A clean
closeout means a clean target diff; it does not require discarding those independently owned deltas.

## Intermittent campaign contract

This is intentionally a resumable cross-cutting chore, not one uninterrupted implementation
campaign.

- Every arc item is a complete stop point with a clean target diff, green package-local proof, and
  no half-frozen namespace graph inside a touched package.
- Human scheduling may interleave unrelated campaigns between landed items. No later item is implied
  or authorized by completion of an earlier one.
- Before every resumed item, reopen this plan, reconcile its opening arc with reachable history,
  rerun the relevant inventory and mutation searches, and inspect current worktree ownership.
- Keep one package's child → composer → root graph in one commit unless that package has an
  explicitly proven intermediate stop boundary. Never pause with a parent frozen while an in-scope
  namespace child remains unintentionally mutable.
- Each system batch is provisional until its implementation-start inventory. Package membership may
  move between the three system commits when dependency or seam discovery requires it; update the
  opening arc and batch tables explicitly before implementation rather than silently widening a
  commit.
- A clean tree means a clean target boundary, not necessarily a globally empty worktree: unrelated
  concurrent deltas may remain, but no target commit may absorb them.

## Inventory method

Re-run the inventory against the implementation-start snapshot rather than trusting this plan as a
static file list:

```sh
rg -n "export const [A-Za-z0-9_]+:\s*[A-Za-z0-9_.]+\.Lib\s*=" code/sys/std/src --glob '*.ts'
rg -n "export const [A-Za-z0-9_]+:\s*[^=]+\.Lib\['[A-Za-z0-9_]+'\]\s*=" code/sys/std/src --glob '*.ts'
rg -n "Object\.freeze|Object\.isFrozen" code/sys/std/src --glob '*.ts'
```

For each hit, open the implementation and its `t.ts` contract. Classify the value as one of:

1. exported singleton namespace API → freeze;
2. child namespace API participating in a composed `Lib` → freeze independently;
3. mutable registry, builder, handle, constructed instance, or state container → exclude and record;
4. function/class export that does not form a namespace object → exclude;
5. ambiguous late-bound or cycle-sensitive value → stop and resolve before freezing.

A declaration typed through aliases such as `Type.IndexedDb.Lib`, `SemverType.Lib`,
`Semver.Release.Lib`, or `JsrUrl.Pkg.Lib` is in scope even when the annotation does not begin with
`t.`.

## Candidate implementation inventory

### Existing frozen precedent

These declarations already establish the intended direct-at-construction form:

- `code/sys/std/src/m.Bytes/m.Bytes.ts`
- `code/sys/std/src/m.Eql/m.Eql.ts`
- `code/sys/std/src/m.MediaType/m.Fallback.ts`
- `code/sys/std/src/m.MediaType/m.Is.ts`
- `code/sys/std/src/m.MediaType/m.MediaType.ts`
- `code/sys/std/src/m.Path/m/m.Bounded.ts`
- `code/sys/std/src/m.Pkg/m/m.Subpath.ts`

Preserve the form:

```ts
export const X: t.X.Lib = Object.freeze({
  // existing members unchanged
});
```

Do not introduce a freeze helper. `Object.freeze` is the platform primitive, keeps each declaration
locally legible, and avoids creating a new initialization dependency.

### Singleton `Lib` declarations

Audit and freeze every applicable declaration in these exact files:

- `code/sys/std/src/m.Alias/m.AliasResolver.ts`
- `code/sys/std/src/m.Alias/m.Is.ts`
- `code/sys/std/src/m.Arr/m.Arr.ts`
- `code/sys/std/src/m.Args/mod.ts`
- `code/sys/std/src/m.Async.Await/m.Await.ts`
- `code/sys/std/src/m.Async.Schedule/m.Schedule.ts`
- `code/sys/std/src/m.Async/m.Lease.ts`
- `code/sys/std/src/m.Bytes/m.Bytes.ts`
- `code/sys/std/src/m.Delete/Delete.ts`
- `code/sys/std/src/m.Dispose/m.Dispose.ts`
- `code/sys/std/src/m.Effect/m.Causal.ts`
- `code/sys/std/src/m.Effect/mod.ts`
- `code/sys/std/src/m.EffectController/m.EffectController.ts`
- `code/sys/std/src/m.Eql/m.Eql.ts`
- `code/sys/std/src/m.Err/m.Err.ts`
- `code/sys/std/src/m.Err/m.Is.ts`
- `code/sys/std/src/m.Err/m.Name.ts`
- `code/sys/std/src/m.Fn/mod.ts`
- `code/sys/std/src/m.Glob/mod.ts`
- `code/sys/std/src/m.History/m.History.ts`
- `code/sys/std/src/m.Ignore/m.Ignore.ts`
- `code/sys/std/src/m.IndexedDb/m.IndexedDb.ts`
- `code/sys/std/src/m.Is/m.Is.ts`
- `code/sys/std/src/m.Json/m.Json.ts`
- `code/sys/std/src/m.Lazy/m.Lazy.ts`
- `code/sys/std/src/m.Log/m.Log.ts`
- `code/sys/std/src/m.MediaType/m.Fallback.ts`
- `code/sys/std/src/m.MediaType/m.Is.ts`
- `code/sys/std/src/m.MediaType/m.MediaType.ts`
- `code/sys/std/src/m.Num/m.Is.ts`
- `code/sys/std/src/m.Num/m.Num.ts`
- `code/sys/std/src/m.Num/m.Percent/m.Is.ts`
- `code/sys/std/src/m.Num/m.Percent/m.Range.ts`
- `code/sys/std/src/m.Num/m.Percent/mod.ts`
- `code/sys/std/src/m.Num/m.Ratio.ts`
- `code/sys/std/src/m.Obj/m.Obj.ts`
- `code/sys/std/src/m.Obj.Lens/m.Is.ts`
- `code/sys/std/src/m.Obj.Lens/m.Lens.ts`
- `code/sys/std/src/m.Obj.Path/m.Codec.ts`
- `code/sys/std/src/m.Obj.Path/m.CurriedPath.ts`
- `code/sys/std/src/m.Obj.Path/m.Is.ts`
- `code/sys/std/src/m.Obj.Path/m.Mutate.ts`
- `code/sys/std/src/m.Obj.Path/m.Path.ts`
- `code/sys/std/src/m.Obj.Path/m.Rel.ts`
- `code/sys/std/src/m.Path/m/m.Bounded.ts`
- `code/sys/std/src/m.Path/m/m.Fmt.ts`
- `code/sys/std/src/m.Path/m/m.Is.ts`
- `code/sys/std/src/m.Path/m/m.Join.ts`
- `code/sys/std/src/m.Path/m/m.Path.ts`
- `code/sys/std/src/m.Pkg/m/m.Dist.Part.ts`
- `code/sys/std/src/m.Pkg/m/m.Dist.ts`
- `code/sys/std/src/m.Pkg/m/m.Is.ts`
- `code/sys/std/src/m.Pkg/m/m.Pkg.ts`
- `code/sys/std/src/m.Pkg/m/m.Subpath.ts`
- `code/sys/std/src/m.Random/mod.ts`
- `code/sys/std/src/m.Regex/mod.ts`
- `code/sys/std/src/m.Rx/m.Rx.Is.ts`
- `code/sys/std/src/m.Rx/m.Rx.ts`
- `code/sys/std/src/m.Semver/common.ts`
- `code/sys/std/src/m.Semver/m.Is.ts`
- `code/sys/std/src/m.Semver/m.Prefix.ts`
- `code/sys/std/src/m.Semver/mod.ts`
- `code/sys/std/src/m.Semver.Server/mod.ts`
- `code/sys/std/src/m.Shard/m.Sha256.ts`
- `code/sys/std/src/m.Shard/m.Shard.ts`
- `code/sys/std/src/m.Signal/m.Is.ts`
- `code/sys/std/src/m.Signal/m.Signal.ts`
- `code/sys/std/src/m.Str/m.Compare.ts`
- `code/sys/std/src/m.Str/m.Lorem.ts`
- `code/sys/std/src/m.Str/m.Str.ts`
- `code/sys/std/src/m.Testing/m.Bdd.ts`
- `code/sys/std/src/m.Testing/m.Testing.ts`
- `code/sys/std/src/m.Testing.DomMock/m.Fake.ts`
- `code/sys/std/src/m.Testing.DomMock/m.Keyboard.ts`
- `code/sys/std/src/m.Testing.DomMock/m.Mouse.ts`
- `code/sys/std/src/m.Testing.DomMock/mod.ts`
- `code/sys/std/src/m.Testing.Server/mod.ts`
- `code/sys/std/src/m.Time/m.Time.Duration.ts`
- `code/sys/std/src/m.Time/m.Time.ts`
- `code/sys/std/src/m.Time.Date/m.Date.Day.ts`
- `code/sys/std/src/m.Time.Date/m.Date.Format.ts`
- `code/sys/std/src/m.Time.Date/m.Date.Is.ts`
- `code/sys/std/src/m.Time.Date/m.Date.ts`
- `code/sys/std/src/m.Timecode/clock/m.VClock.ts`
- `code/sys/std/src/m.Timecode/clock/m.VTime.ts`
- `code/sys/std/src/m.Timecode/composite/m.Composite.ts`
- `code/sys/std/src/m.Timecode/composite/m.Map.ts`
- `code/sys/std/src/m.Timecode/core.ops/mod.ts`
- `code/sys/std/src/m.Timecode/experience/m.Experience.ts`
- `code/sys/std/src/m.Timecode/m.Timecode.ts`
- `code/sys/std/src/m.Timecode/slice/mod.ts`
- `code/sys/std/src/m.Try/mod.ts`
- `code/sys/std/src/m.Url/m.Url.ts`
- `code/sys/std/src/m.Url.Jsr/m.Url.Pkg.Is.ts`
- `code/sys/std/src/m.Url.Jsr/m.Url.Pkg.ts`
- `code/sys/std/src/m.Url.Jsr/m.Url.ts`
- `code/sys/std/src/m.Xml/m.Is.ts`
- `code/sys/std/src/m.Xml/mod.ts`

### Namespace participants not declared as a standalone `*.Lib`

These values participate in public composed namespace APIs and must be classified explicitly rather
than missed by a narrow `\.Lib =` search:

- `code/sys/std/src/m.IndexedDb/m.IndexedDb.ts`
  - independently freeze inline `IndexedDb.Record` and `IndexedDb.Database` before freezing
    `IndexedDb`;
- `code/sys/std/src/m.Obj.Lens/m.Lens.ts`
  - independently freeze inline `Lens.Readonly` before freezing `Lens`;
- `code/sys/std/src/m.Pkg/m/m.Dist.ts`
  - independently freeze inline `Dist.Compat` and `Dist.Is` before freezing `Dist`;
- `code/sys/std/src/m.Random/common.ts`
  - freeze `Length`, which is the namespace-valued `Random.Length` participant;
- `code/sys/std/src/m.Semver.Server/m.Fmt.ts`
  - freeze `Fmt` before composing the server `Semver` extension;
- `code/sys/std/src/m.Testing.Server/m.HttpServer.ts`
  - freeze `TestHttpServer`, exposed as `Testing.Http`;
- `code/sys/std/src/m.Testing.DomMock/m.Fake.ts`
  - independently freeze `Fake.Media` before freezing `Fake`;
- `code/sys/std/src/m.Time/m.Time.Duration.ts`
  - freeze `To` before freezing `Duration`;
- `code/sys/std/src/m.Timecode/m.Pattern.ts`
  - freeze public `Pattern`; do not treat private `RE` regex instances as namespace APIs;
- `code/sys/std/src/m.Timecode/composite/u.duration.ts`
  - freeze `Durations` before freezing `Composite`;
- `code/sys/std/src/m.Timecode/composite/u.ops.ts`
  - freeze composite `Ops` before freezing `Composite`;
- `code/sys/std/src/m.Timecode/composite/u.time.ts`
  - freeze composite `Time` before freezing `Composite`.

Existing `code/sys/std/src/m.Path/m/m.Bounded.ts` is the model for inline child ordering: freeze
`Bounded.Is`, then the root. Keep the already-frozen `POSIX_PATH` operation object unchanged.

## Composition graph and initialization order

Freeze from leaves toward roots. Do not move composition into `mod.ts`, create wrapper copies, or
change export identity.

Required leaf → root chains include:

- `AliasResolver.Is` → `AliasResolver`;
- `Effect.Controller` and `Effect.Causal` → `Effect`;
- `Err.Is`, `Err.Name`, and `Err.Try` → `Err`;
- `MediaType.Is` and `MediaType.Fallback` → `MediaType`;
- `Num.Percent.Is` and `Num.Percent.Range` → `Num.Percent` → `Num`;
- `Obj.Path.{Rel,Mutate,Is,Codec}` → `Obj.Path`, and `Obj.Lens.{Is,Readonly}` → `Obj.Lens` → `Obj`;
- `Path.{Is,Format,Bounded,Join}` → `Path`;
- `Pkg.Dist.{Is,Compat,Part}` → `Pkg.Dist`, and `Pkg.{Is,Subpath,Dist}` → `Pkg`;
- `Rx.Is` → `Rx`;
- `Semver.{Is,Release,Prefix}` → `Semver`, then `Fmt` plus a spread copy of base `Semver` → server
  `Semver`;
- `Shard.Sha256` → `Shard`;
- `Signal.Is` → `Signal`;
- `Str.{Compare,Lorem}` → `Str`;
- `Testing.Bdd` → `Testing`, then `TestHttpServer` plus a spread copy of base `Testing` → server
  `Testing`;
- `DomMock.Fake.Media` → `DomMock.Fake`, and `Fake`, `Keyboard`, `Mouse` → `DomMock`;
- `Date.{Is,Day,Format}` → `Date`, then `Duration.To` → `Duration`, and `Date`, `Duration` → `Time`;
- `Timecode.{Ops,Pattern,Experience,Slice,VTime,VClock}` and
  `Timecode.Composite.{Ops,Map,Durations,Time}` → `Timecode.Composite` → `Timecode`;
- `JsrUrl.Pkg.Is` → `JsrUrl.Pkg` → `JsrUrl`;
- `Xml.Is` → `Xml`.

`Object.freeze` must execute only after the complete object literal has been assembled. Do not
freeze an empty object and populate it later, and do not add post-declaration mutation to work
around a cycle.

## Downstream extension and override audit

Confirmed direct spread extensions of frozen std namespaces:

- `code/sys/fs/src/m.Path/m.Path.ts`
  - `{ ...StdPath, asDir, cwd, trimCwd }`;
- `code/sys/fs/src/m.Pkg/m.Pkg.ts`
  - `{ ...Base, Dist }`, replacing std `Pkg.Dist` with the filesystem extension;
- `code/sys/fs/src/m.Pkg.Dist/m.Dist.ts`
  - `{ ...Pkg.Dist, Log, Local, Pinned, compute, load, checkSelfReported }`;
- `code/sys/immutable/src/m.url/m.Url.ts`
  - `{ ...UrlBase, ref, dsl }`;
- `code/sys/testing/src/m.server/m.Testing/m.Testing.ts`
  - `{ ...Base, dir, connect }`.

Internal std spread extensions are also in scope and must produce independently frozen result
objects:

- `code/sys/std/src/m.Semver.Server/mod.ts`
- `code/sys/std/src/m.Testing.Server/mod.ts`
- `code/sys/std/src/m.Rx/m.Rx.ts`

Compatibility rule:

- spreading a frozen base remains supported because spread reads enumerable own properties into a
  new object;
- overriding a copied property in the new literal remains supported;
- mutating, deleting, or redefining a property directly on the imported std singleton becomes an
  intentional runtime error in strict ESM;
- freezing a std base does not implicitly freeze a downstream spread clone; downstream packages may
  adopt their own invariant separately, but this plan does not widen production changes beyond
  `@sys/std`.

The downstream proof must preserve:

- distinct root identity between base and extension;
- inherited member identity by reference;
- intentional override identity for `Pkg.Dist`;
- complete base key coverage;
- frozen base status.

Use these existing test surfaces:

- `code/sys/fs/src/m.Path/-.test.ts`
- `code/sys/fs/src/m.Pkg/-test/-Pkg.test.ts`
- `code/sys/fs/src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts`
- `code/sys/immutable/src/m.url/-test/-.test.ts`
- `code/sys/testing/src/m.server/m.Testing/-.test.ts`

Do not assert that downstream extension objects remain unfrozen. That would turn current absence of
a downstream policy into a compatibility promise.

## Mutation, substitution, late-binding, and cycle audit

### Confirmed namespace monkey-patching to remove

`code/sys/std/src/m.Async.Schedule/-test/-.test.ts` repeatedly replaces `Schedule.raf` to count
calls from `Schedule.frames`. Replace this with an internal dependency seam:

- add `code/sys/std/src/m.Async.Schedule/u/u.frames.ts`;
- implement a package-internal frame-loop function parameterized by a `t.ScheduleFn`;
- compose public `Schedule.frames` with the canonical `raf` function without mutating `Schedule`;
- test the frame-loop directly with a counting fake in
  `code/sys/std/src/m.Async.Schedule/-test/-.test.ts`;
- preserve public `Schedule.frames` behavior and `Schedule.raf` identity.

`code/sys/std/src/m.Log/-test/-u.logger.test.ts` repeatedly replaces `Is.browser`. Replace this with
an internal factory seam in `code/sys/std/src/m.Log/u.logger.ts`:

- expose a package-internal logger factory parameterized by the browser predicate;
- compose public `makeLogger` with the real `Is.browser` predicate;
- run CSS/browser cases through the injected factory rather than mutating `Is`;
- keep `Log.logger`'s public signature and identity contract unchanged.

The seam is dependency injection for tests, not a new public API. Do not export it from
`m.Async.Schedule/mod.ts`, `m.Log/mod.ts`, or a package leaf.

### Cyclic initialization

`Err.Try` participates in the existing `Try`/`Err` cycle. Preserve the current import graph and the
existing cycle proof in:

- `code/sys/std/src/-test/-.test.ts`

Wrapping the already-complete declarations with `Object.freeze` is acceptable. Moving freeze logic
to a root barrel, replacing imported objects after initialization, or introducing post-construction
assignment is not.

### Late binding

`Is` exposes accessors for `ErrIs.error`, `ErrIs.errorLike`, and `ErrIs.stdError`. Freezing the `Is`
object preserves accessor invocation; do not eagerly replace getters with captured values.

Methods that refer to their namespace object, such as `Schedule.frames`, `Num.Ratio`,
`Obj.Path.Rel`, `Time.Duration`, and DOM mock helpers, must retain behavior under frozen property
identity. Remove only the two confirmed test substitution dependencies above; do not rewrite
ordinary self-reference without a failing compatibility reason.

## Intentional mutable state and exclusions

Shallow freezing the namespace object must not freeze values produced by its methods or mutable
state intentionally held behind it.

- **Builder:** keep each builder returned by `code/sys/std/src/m.Str/u/u.builder.ts` mutable; freeze
  only `Str`.
- **History state handle:** keep the stack state and cursor returned by
  `code/sys/std/src/m.History/u.stack.ts` mutable; freeze only `History`.
- **Timer/delay handles:** exclude constructed or enriched handles and promises in
  `code/sys/std/src/m.Time/m.Time.Timer.ts`, `code/sys/std/src/m.Time/m.Time.delay.ts`,
  `code/sys/std/src/m.Time/m.Time.interval.ts`, and `code/sys/std/src/m.Time/m.Time.until.ts`.
- **Rx state:** freeze `Rx` and `Rx.Is` in `code/sys/std/src/m.Rx/m.Rx.ts`; do not freeze
  `Rx.noop$`, subjects, observables, schedulers, classes, or constructed subjects.
- **Signal state:** freeze `Signal` and `Signal.Is`; keep signals, listener sets, and lifecycle
  handles from `code/sys/std/src/m.Signal/u.listen.ts`, `code/sys/std/src/m.Signal/u.effect.ts`, and
  `code/sys/std/src/m.Signal/u.walk.ts` mutable.
- **Lens/path instances:** freeze factories in `code/sys/std/src/m.Obj.Path/m.CurriedPath.ts`; do
  not freeze refs or subjects returned through `code/sys/std/src/m.Obj.Lens/u.bindRO.ts` and
  `code/sys/std/src/m.Obj.Lens/u.bindRW.ts`.
- **Logger functions:** keep callable instances from `code/sys/std/src/m.Log/u.logger.ts` extensible
  as currently constructed with `Object.assign`; freeze only `Log`.
- **Lazy memo state:** keep memoized function state in `code/sys/std/src/m.Lazy/u.memo.ts` mutable;
  freeze only `Lazy`.
- **Private cache:** keep the private `Intl.Collator` cache in `code/sys/std/src/m.Str/m.Compare.ts`
  mutable and unreachable; freeze `Compare`.
- **DOM/global state:** keep explicit polyfill lifecycle mutation in
  `code/sys/std/src/m.Testing.DomMock/u.polyfill.ts`; freeze only exported helper namespaces.
- **Data arrays inside shallow APIs:** do not deep-freeze `levels`, `Release.types`, or
  `Testing.FALSY` in `code/sys/std/src/m.Log/common.ts`, `code/sys/std/src/m.Semver/common.ts`, and
  `code/sys/std/src/m.Testing/m.Testing.ts`.
- **Function/class exports:** leave standalone functions, aliases, constructors, and vendor classes
  in `code/sys/std/src/m.Ansi/mod.ts` and `code/sys/std/src/m.Rx/u.Rx.libs.ts` untouched.

If implementation discovers an exported mutable registry itself typed as a namespace `Lib`, stop and
classify it explicitly. Do not silently freeze it or silently exempt it.

## System-wide migration inventory

The initial whole-system search confirms this is broader than a raw mechanical wrapper pass. It
finds exported singleton candidates across `process`, `color`, `fs`, `http`, `markdown`, `testing`,
`event`, `cli`, `immutable`, `schema`, `cell`, `crypto`, `esm`, `server`, `registry`, `yaml`,
`text`, `workspace`, `net`, and `tmpl-engine`, plus existing frozen precedents. `types`, `web`, and
`crdt` currently appear to be searched no-op packages, subject to implementation-start revalidation.

Before each package batch, run the following patterns against one concrete package `src` path:

- raw singleton `Lib` object declarations, including legacy `FooLib` forms:
  `export const [A-Za-z0-9_]+:\s*[^=;]+(?:\.Lib|Lib)\s*=\s*(?:Object\.freeze\()?\{`;
- existing freeze contracts: `Object\.freeze|Object\.isFrozen`;
- mutation candidates:
  `Object\.(assign|defineProperty|defineProperties|setPrototypeOf)\(|Reflect\.set\(|delete\s+[A-Za-z0-9_]+\.`.

Use `rg -n` with `--glob '*.ts' --glob '*.tsx'` and the exact concrete package `src` path. Open
every candidate and classify it under the same singleton/exclusion rules used for std.

The current initial package groups are dependency ordered:

### Foundation batch

- `code/sys/types`
- `code/sys/text`
- `code/sys/color`
- `code/sys/crypto`
- `code/sys/process`
- `code/sys/event`
- `code/sys/immutable`

### Platform batch

- `code/sys/cli`
- `code/sys/fs`
- `code/sys/net`
- `code/sys/http`
- `code/sys/registry`
- `code/sys/testing`
- `code/sys/esm`
- `code/sys/markdown`

### Application batch

- `code/sys/yaml`
- `code/sys/schema`
- `code/sys/tmpl-engine`
- `code/sys/server`
- `code/sys/cell`
- `code/sys/web`
- `code/sys/crdt`
- `code/sys/workspace`

A package with no qualifying runtime singleton remains a searched no-op and is recorded in the batch
proof; do not invent an edit merely to make every package appear in a diff.

This grouping follows the inspected runtime dependency direction: CLI depends on process/color;
filesystem code imports CLI formatting; HTTP depends on event/fs/net; registry depends on HTTP;
schema depends on immutable and YAML; cell depends on CLI/fs/process/schema/YAML/tmpl-engine; server
depends on event/fs/net/HTTP; workspace consumes most lower layers. It is still a review boundary,
not a claim that every package is independent. Within each batch, order package edits by actual
imports and land only when every touched package's tests pass. If a single package proves too large
or contains multiple substitution seams, split it into a package-specific arc item before
implementation. Do not hide a semantic redesign inside a mechanical batch.

## Canonical template adoption

The template item applies only after the std invariant and its downstream compatibility proof are
green. Exact authored template paths:

- `code/-tmpl/-templates/tmpl.m.mod/mod.ts`
- `code/-tmpl/-templates/tmpl.m.mod.ui/mod.ts`
- `code/-tmpl/-templates/tmpl.m.mod.ui.controller/mod.ts`
- `code/-tmpl/src/-tests/-m.mod.test.ts`
- `code/-tmpl/src/-tests/-m.mod.ui.test.ts`
- `code/-tmpl/src/-tests/-m.mod.ui.controller.test.tsx`

Required output shapes:

```ts
export const MyComponent: t.MyComponent.Lib = Object.freeze({ UI });
```

```ts
export const MyCtrl: t.MyCtrl.Lib = Object.freeze({
  controller,
  UI: Object.freeze({ Controlled, Uncontrolled }),
});
```

`tmpl.m.mod/mod.ts` currently imports `t` but emits no runtime `Lib`; leave it as an inert module
boundary rather than inventing a namespace value. Add a root freeze only if that template is first
changed to emit a real runtime API for an independently justified reason.

Template proof must inspect generated bytes and execute generated modules, asserting that the
renamed root API and nested `UI` namespace are frozen. It must also prove generated projects
type-check. Do not edit only snapshots or template source without exercising materialization.

`tmpl.pkg/src/mod.ts` exports `pkg` and a type namespace but composes no singleton `t.*.Lib`; it is
not a freeze target. `tmpl.pkg.help` contains real helper namespaces but is template content for a
specialized generated package, so classify and freeze its `Help` and `RootHelp` surfaces in the same
template item, with generated-package proof:

- `code/-tmpl/-templates/tmpl.pkg.help/src/m.help/mod.ts`
- `code/-tmpl/-templates/tmpl.pkg.help/src/m.help/u/u.load.ts`

## Confirmed cross-package substitution blockers

The whole-system mutation search proves that the later system pass is not immediately mechanical.
Before freezing the affected providers, replace direct singleton mutation with explicit injection,
existing dependency objects, or package-owned disposable test adapters. Confirmed families include:

- `code/sys/cli/src/m.core/m.Input/-test/-.test.ts` mutating `Cli.Prompt.Select.prompt`;
- `code/sys/cli/src/m.core/m.Spinner/-test/-.test.ts` mutating `Spinner.start`;
- `code/sys/cli/src/m.testing/m.FakeSpinner.ts` mutating `Spinner.create` as a reusable
  cross-package test helper; because workspace tests consume it, replace this with an explicit
  factory dependency before `Spinner` is frozen;
- `code/sys/http/src/http.client/m.HttpFetch/-test/-policy.test.ts` mutating `Hash.sha256`;
- `code/sys/http/src/http.server/m.HttpStatic/-test/-m.cli.test.ts` mutating `HttpStatic.start`;
- `code/sys/server/src/m.server.dist/-test/-server.serve.test.ts` mutating `Cli.Is.interactive`;
- `code/sys/workspace/src/m.run/-test/-.test.ts` and
  `code/sys/workspace/src/m.run/-test/-u.handoff.test.ts` mutating `Cli.Screen`;
- `code/sys/workspace/src/m.ci/-.test.ts` mutating `WorkspacePrep.Graph.ensure`;
- `code/sys/workspace/src/m.ci/m.Jsr/-.test.ts` mutating `Jsr.Fetch.Pkg.versions`;
- `code/sys/workspace/src/m.bump/-test/-u.run.test.ts` and `code/sys/workspace/src/m.cli/-test/*`
  mutating `Cli.Input` prompts;
- `code/sys/yaml/src/m.cli/m.YamlConfig/-test/-u.menu*.test.ts` mutating `Cli.Input` prompts.

The seam commit must search again and may add newly discovered sites. It must not freeze provider
roots until all direct mutation consumers of those roots have migrated. Prefer injecting the narrow
operation at the existing orchestration boundary; do not create a global mutable test registry or a
universal mocking abstraction.

Function-object augmentation that is itself the intended API shape, such as BDD `.skip`/`.only`, is
not automatically a namespace mutation defect. Classify it against the function-export exclusion
rather than freezing it mechanically.

## System batch contract

For each package in a system batch:

1. inventory all singleton `Lib` roots and namespace-valued children, including compositions outside
   `mod.ts` and alias-typed contracts;
2. audit direct mutation, extension, monkey-patching, substitution, late binding, and cycles;
3. migrate blockers before freezing the provider;
4. freeze terminal children before composers and roots, preserving identity and descriptors;
5. add a focused package-local `Object.isFrozen` contract matrix;
6. run the package's declared `check`, targeted tests, full tests, and `dry` task;
7. run residue searches and inspect the final target diff;
8. stop cleanly before moving to another package or campaign.

Do not assume tests "should just pass." After substitution blockers are removed, the wrappers should
be mechanically simple, but every package must establish actual green proof.

## Commit path allocation

A file may appear in two adjacent graph layers when it currently declares an inline child inside its
parent object. The first commit freezes or factors only the child; the next wraps the unchanged
parent. This repetition is deliberate and keeps each intermediate repository state valid.

### Terminal leaves

The terminal-leaf commit owns these exact paths:

- `code/sys/std/src/-test/-namespace.freeze.test.ts`
- `code/sys/std/src/m.Alias/m.Is.ts`
- `code/sys/std/src/m.Arr/m.Arr.ts`
- `code/sys/std/src/m.Args/mod.ts`
- `code/sys/std/src/m.Async.Await/m.Await.ts`
- `code/sys/std/src/m.Async.Schedule/m.Schedule.ts`
- `code/sys/std/src/m.Async/m.Lease.ts`
- `code/sys/std/src/m.Bytes/m.Bytes.ts`
- `code/sys/std/src/m.Delete/Delete.ts`
- `code/sys/std/src/m.Dispose/m.Dispose.ts`
- `code/sys/std/src/m.Effect/m.Causal.ts`
- `code/sys/std/src/m.EffectController/m.EffectController.ts`
- `code/sys/std/src/m.Eql/m.Eql.ts`
- `code/sys/std/src/m.Err/m.Is.ts`
- `code/sys/std/src/m.Err/m.Name.ts`
- `code/sys/std/src/m.Fn/mod.ts`
- `code/sys/std/src/m.Glob/mod.ts`
- `code/sys/std/src/m.History/m.History.ts`
- `code/sys/std/src/m.Ignore/m.Ignore.ts`
- `code/sys/std/src/m.IndexedDb/m.IndexedDb.ts` — inline `Record` and `Database` only
- `code/sys/std/src/m.Is/m.Is.ts`
- `code/sys/std/src/m.Json/m.Json.ts`
- `code/sys/std/src/m.Lazy/m.Lazy.ts`
- `code/sys/std/src/m.Log/m.Log.ts`
- `code/sys/std/src/m.MediaType/m.Fallback.ts`
- `code/sys/std/src/m.MediaType/m.Is.ts`
- `code/sys/std/src/m.Num/m.Is.ts`
- `code/sys/std/src/m.Num/m.Percent/m.Is.ts`
- `code/sys/std/src/m.Num/m.Percent/m.Range.ts`
- `code/sys/std/src/m.Num/m.Ratio.ts`
- `code/sys/std/src/m.Obj.Lens/m.Is.ts`
- `code/sys/std/src/m.Obj.Lens/m.Lens.ts` — inline `Readonly` only
- `code/sys/std/src/m.Obj.Path/m.Codec.ts`
- `code/sys/std/src/m.Obj.Path/m.CurriedPath.ts`
- `code/sys/std/src/m.Obj.Path/m.Is.ts`
- `code/sys/std/src/m.Obj.Path/m.Mutate.ts`
- `code/sys/std/src/m.Obj.Path/m.Rel.ts`
- `code/sys/std/src/m.Path/m/m.Bounded.ts` — retain already-frozen `Is` and `POSIX_PATH`
- `code/sys/std/src/m.Path/m/m.Fmt.ts`
- `code/sys/std/src/m.Path/m/m.Is.ts`
- `code/sys/std/src/m.Path/m/m.Join.ts`
- `code/sys/std/src/m.Pkg/m/m.Dist.Part.ts`
- `code/sys/std/src/m.Pkg/m/m.Dist.ts` — inline `Compat` and `Is` only
- `code/sys/std/src/m.Pkg/m/m.Is.ts`
- `code/sys/std/src/m.Pkg/m/m.Subpath.ts`
- `code/sys/std/src/m.Random/common.ts`
- `code/sys/std/src/m.Regex/mod.ts`
- `code/sys/std/src/m.Rx/m.Rx.Is.ts`
- `code/sys/std/src/m.Semver/common.ts`
- `code/sys/std/src/m.Semver/m.Is.ts`
- `code/sys/std/src/m.Semver/m.Prefix.ts`
- `code/sys/std/src/m.Semver.Server/m.Fmt.ts`
- `code/sys/std/src/m.Shard/m.Sha256.ts`
- `code/sys/std/src/m.Signal/m.Is.ts`
- `code/sys/std/src/m.Str/m.Compare.ts`
- `code/sys/std/src/m.Str/m.Lorem.ts`
- `code/sys/std/src/m.Testing/m.Bdd.ts`
- `code/sys/std/src/m.Testing.DomMock/m.Fake.ts` — inline `Media` only
- `code/sys/std/src/m.Testing.DomMock/m.Keyboard.ts`
- `code/sys/std/src/m.Testing.DomMock/m.Mouse.ts`
- `code/sys/std/src/m.Testing.Server/m.HttpServer.ts`
- `code/sys/std/src/m.Time/m.Time.Duration.ts` — `To` only
- `code/sys/std/src/m.Time.Date/m.Date.Day.ts`
- `code/sys/std/src/m.Time.Date/m.Date.Format.ts`
- `code/sys/std/src/m.Time.Date/m.Date.Is.ts`
- `code/sys/std/src/m.Timecode/clock/m.VClock.ts`
- `code/sys/std/src/m.Timecode/clock/m.VTime.ts`
- `code/sys/std/src/m.Timecode/composite/m.Map.ts`
- `code/sys/std/src/m.Timecode/composite/u.duration.ts`
- `code/sys/std/src/m.Timecode/composite/u.ops.ts`
- `code/sys/std/src/m.Timecode/composite/u.time.ts`
- `code/sys/std/src/m.Timecode/core.ops/mod.ts`
- `code/sys/std/src/m.Timecode/experience/m.Experience.ts`
- `code/sys/std/src/m.Timecode/m.Pattern.ts`
- `code/sys/std/src/m.Timecode/slice/mod.ts`
- `code/sys/std/src/m.Try/mod.ts`
- `code/sys/std/src/m.Url/m.Url.ts`
- `code/sys/std/src/m.Url.Jsr/m.Url.Pkg.Is.ts`
- `code/sys/std/src/m.Xml/m.Is.ts`

### Intermediate composers

The intermediate-composer commit extends the same freeze test and owns these exact paths:

- `code/sys/std/src/-test/-namespace.freeze.test.ts`
- `code/sys/std/src/m.Num/m.Percent/mod.ts`
- `code/sys/std/src/m.Obj.Lens/m.Lens.ts`
- `code/sys/std/src/m.Obj.Path/m.Path.ts`
- `code/sys/std/src/m.Path/m/m.Bounded.ts`
- `code/sys/std/src/m.Pkg/m/m.Dist.ts`
- `code/sys/std/src/m.Semver/mod.ts`
- `code/sys/std/src/m.Testing/m.Testing.ts`
- `code/sys/std/src/m.Testing.DomMock/m.Fake.ts`
- `code/sys/std/src/m.Time/m.Time.Duration.ts`
- `code/sys/std/src/m.Time.Date/m.Date.ts`
- `code/sys/std/src/m.Timecode/composite/m.Composite.ts`
- `code/sys/std/src/m.Url.Jsr/m.Url.Pkg.ts`

### Public roots

The root-composer commit completes the same freeze test and owns these exact paths:

- `code/sys/std/src/-test/-namespace.freeze.test.ts`
- `code/sys/std/src/m.Alias/m.AliasResolver.ts`
- `code/sys/std/src/m.Effect/mod.ts`
- `code/sys/std/src/m.Err/m.Err.ts`
- `code/sys/std/src/m.IndexedDb/m.IndexedDb.ts`
- `code/sys/std/src/m.MediaType/m.MediaType.ts`
- `code/sys/std/src/m.Num/m.Num.ts`
- `code/sys/std/src/m.Obj/m.Obj.ts`
- `code/sys/std/src/m.Path/m/m.Path.ts`
- `code/sys/std/src/m.Pkg/m/m.Pkg.ts`
- `code/sys/std/src/m.Random/mod.ts`
- `code/sys/std/src/m.Rx/m.Rx.ts`
- `code/sys/std/src/m.Semver.Server/mod.ts`
- `code/sys/std/src/m.Shard/m.Shard.ts`
- `code/sys/std/src/m.Signal/m.Signal.ts`
- `code/sys/std/src/m.Str/m.Str.ts`
- `code/sys/std/src/m.Testing.DomMock/mod.ts`
- `code/sys/std/src/m.Testing.Server/mod.ts`
- `code/sys/std/src/m.Time/m.Time.ts`
- `code/sys/std/src/m.Timecode/m.Timecode.ts`
- `code/sys/std/src/m.Url.Jsr/m.Url.ts`
- `code/sys/std/src/m.Xml/mod.ts`

The already-frozen `MediaType` and `Bounded` declarations remain in their graph layers for contract
coverage even when implementation bytes do not change.

## Implementation contracts

### `refactor(std): replace namespace monkey-patching test seams`

Paths:

- `code/sys/std/src/m.Async.Schedule/m.Schedule.ts`
- `code/sys/std/src/m.Async.Schedule/u/u.frames.ts`
- `code/sys/std/src/m.Async.Schedule/-test/-.test.ts`
- `code/sys/std/src/m.Log/u.logger.ts`
- `code/sys/std/src/m.Log/-test/-u.logger.test.ts`

Outcome:

- no test assigns to `Schedule.raf` or `Is.browser`;
- public behavior and signatures are unchanged;
- package-internal factories are not exported;
- focused tests prove the injected fake path and the real public composition.

Rollback boundary: revert this commit independently if dependency injection changes runtime
semantics. No freeze depends on accepting a behavior change; it depends only on removing mutation as
a test mechanism.

### `refactor(std): freeze terminal namespace API leaves`

Freeze the exact terminal path allocation above. Start
`code/sys/std/src/-test/-namespace.freeze.test.ts` with a public-leaf matrix asserting
`Object.isFrozen(value) === true`. This layer includes both standalone public APIs and childless
namespaces that feed later composers.

Do not alter object members, ordering, documentation, or exports while adding wrappers.

Rollback boundary: this commit is a mechanical leaf-policy unit. Reverting it restores leaf
mutability without affecting later composers or downstream tests, which must remain later arc items.

### `refactor(std): freeze intermediate namespace API composers`

Freeze the exact intermediate path allocation only after its terminal children are frozen. Extend
`code/sys/std/src/-test/-namespace.freeze.test.ts` with complete checks for each intermediate graph,
including:

- `Num.Percent.Is`, `Num.Percent.Range`, and `Num.Percent`;
- `Obj.Path.{Rel,Mutate,Is,Codec}` and `Obj.Path`;
- `Pkg.Dist.{Is,Compat,Part}` and `Pkg.Dist`;
- `Time.Date.{Is,Day,Format}` and `Time.Date`;
- `Timecode.Composite.{Ops,Map,Durations,Time}` and `Timecode.Composite`;
- `DomMock.Fake.Media` and `DomMock.Fake`.

Rollback boundary: revert intermediate composers as one graph layer while retaining terminal leaf
freezes.

### `refactor(std): freeze public namespace API roots`

Freeze the exact public-root path allocation after all terminal and intermediate children are
frozen, including spread-built std extensions. Complete
`code/sys/std/src/-test/-namespace.freeze.test.ts` with root and nested graph assertions reached
through public leaf exports.

The test must assert values, not implementation syntax. At minimum it covers every candidate from
the final inventory and proves representative complete graphs for `Obj`, `Path`, `Pkg`, `Semver`,
`Testing`, `Time`, `Timecode`, and `JsrUrl`.

Retain existing identity tests in module-local suites. Add explicit identity assertions only where a
freeze wrapper could accidentally produce a second object.

Rollback boundary: revert root freezes without reverting leaf freezes if a specific composition
cycle fails. That leaves a safe partial state and makes the failing root identifiable.

### `test(std): prove frozen namespace extension compatibility`

Production paths are expected to remain unchanged. Strengthen only the existing downstream tests
listed above to prove that each std base is frozen and each spread/override extension retains its
current key and reference contract.

If a downstream production edit appears necessary, stop. A required edit means the compatibility
assumption is false and the affected package needs a separately bounded implementation decision, not
an opportunistic expansion of this test commit.

Rollback boundary: this is test-only downstream proof. It can be reverted independently without
changing runtime policy.

### `refactor(tmpl): freeze composed namespace API scaffolds`

Apply the canonical template adoption contract above. This item depends on complete std policy and
compatibility proof so templates encode a proven shape rather than a proposal.

From `code/-tmpl`, run:

```sh
deno task test --trace-leaks ./src/-tests/-m.mod.test.ts
deno task test --trace-leaks ./src/-tests/-m.mod.ui.test.ts
deno task test --trace-leaks ./src/-tests/-m.mod.ui.controller.test.tsx
deno task check
deno task test
deno task dry
```

Rollback boundary: this commit changes future generated output only. Reverting it does not unfreeze
already migrated runtime packages.

### `refactor(sys): replace cross-package namespace monkey-patching seams`

Remove all confirmed direct singleton substitutions and every additional site found by the refreshed
whole-system audit. This is the semantic prerequisite for the mechanical system batches.

Required behavior:

- injection remains narrow and package-owned;
- public APIs do not gain test-only options;
- reusable fakes return explicit dependencies or disposable adapters rather than modifying canonical
  singleton descriptors;
- tests retain the exact behavior they intended to observe;
- direct namespace assignment, deletion, and descriptor replacement residue is zero except for
  explicitly classified non-namespace interop and function-object cases.

The implementation is split into provider-led commits in dependency order:

1. `refactor(cli): replace namespace monkey-patching test seams` owns the `Cli.Prompt.Select`,
   `Spinner.start`, and `Spinner.create` substitutions, including the reusable `FakeSpinner`
   adapter.
2. `refactor(http): replace crypto, CLI, and static-server monkey-patching seams` owns the
   `Hash.sha256`, `Cli.Keyboard.bind`, `Process.sh`, and `HttpStatic.start` substitutions.
3. `refactor(workspace): replace CLI, registry, and prep monkey-patching seams` owns the
   `Cli.Input`, `Cli.Screen`, `WorkspacePrep.Graph.ensure`, and `Jsr.Fetch.Pkg.versions`
   substitutions.
4. `refactor(yaml): replace CLI input monkey-patching seams` owns YAML CLI prompt substitutions
   after the CLI provider seam is established.

The previously confirmed `Cli.Is.interactive` server seam is now absent from the implementation
snapshot after the independently landed server browser-policy work; do not reopen or absorb that
server change. Re-run the mutation audit before each item, keep each provider-led boundary
independently reversible, and add a new ordered arc item before implementation if a newly discovered
namespace substitution cannot be attributed to one of these boundaries.

Rollback boundary: each provider-led seam commit must be independently revertible before its
provider namespace is frozen.

### `refactor(sys): freeze foundation namespace APIs`

Migrate the foundation package group. Freeze each package's complete namespace graph and add focused
contract proof. Existing frozen surfaces remain precedents and test-table entries, not churn
targets.

Rollback boundary: revert one package's attributed delta and proof together. Do not roll back other
foundation packages that have independently passed.

### `refactor(sys): freeze platform namespace APIs`

Migrate the platform package group after foundation APIs are frozen. Re-run extension and mutation
audits against the now-frozen dependencies before each package.

Rollback boundary: package-local, with no weakening of landed foundation freezes.

### `refactor(sys): freeze application namespace APIs`

Migrate the application package group after foundation and platform APIs are frozen. Treat server,
YAML, cell, and workspace test seams as high-risk consumers of CLI and registry namespaces; require
the seam commit to be reachable before freezing them.

Rollback boundary: package-local, preserving lower-layer invariants.

### `refactor(sys): complete frozen namespace API closure`

Complete the final whole-system residue and downstream compatibility pass. The closeout unit owns
the production repairs that are inseparable from proving the already-landed frozen-provider
contract; it must not weaken or revert any freeze to make a consumer pass.

The bounded implementation includes:

- residual singleton namespace leaves in std, Cell, Server, Workspace, and YAML that the final
  inventory classified after the three system batches;
- package-owned dependency seams for select prompts, process inheritance/invocation, Vite startup,
  Server materialization/serving, Cell formatting, and deploy menus;
- downstream compatibility repairs in `driver-process`, `driver-pi`, `driver-vite`, `sys.tools`, and
  `@tdb/slc`, without restoring shared-singleton mutation;
- atomic generated-source contract updates that keep Pi/Tmpl passthrough pins anchored to their
  internal runners; and
- durable source-to-runtime closure proof rather than reliance on manually curated freeze matrices.

The closure proof must:

- inventory public and package-internal exported singleton namespace candidates;
- require every candidate to be classified as a namespace participant or a reviewed exclusion;
- compare every classified participant with an explicit runtime `Object.isFrozen` assertion;
- fail when a new candidate has no classification; and
- remain shallow and non-recursive so classes, functions, instances, state containers, and returned
  values are not mistaken for namespace children.

Rollback boundary: revert the final residual freezes, their package-owned compatibility seams, and
the closure proof as one closeout unit. Earlier foundation, platform, and application commits remain
independently reversible.

## Focused freeze contract

Create:

- `code/sys/std/src/-test/-namespace.freeze.test.ts`

Test design:

- import through published leaf entrypoints represented by `code/sys/std/deno.json` wherever
  possible;
- use a table of stable labels and values, with one assertion loop for shallow-frozen status;
- enumerate nested namespace objects explicitly rather than recursively traversing arbitrary object
  values;
- do not recurse into arrays, class constructors, function objects, subjects, promises, signals,
  handles, or returned instances;
- preserve existing module identity assertions;
- include `Err.Try === Try` cycle identity and representative spread-composition identities where
  useful, but do not duplicate broad behavior suites;
- use `.eql(true)` for the boolean result, matching repository test convention.

A recursive deep-freeze test is forbidden: it would misclassify mutable state containers and vendor
objects as namespace children.

## Compatibility analysis

### Preserved

- ESM export identity: `imported.X === internal X` remains true.
- Public keys and `Object.keys` order remain unchanged.
- Property values and function references remain unchanged.
- Getters remain getters and execute on access.
- Spread/override composition remains valid.
- Shallow mutable values behind the namespace remain mutable.
- Classes, constructors, returned builders, lifecycle handles, promises, and state containers retain
  their current behavior.

### Intentionally incompatible

Consumers can no longer:

- assign `Namespace.member = replacement`;
- add `Namespace.extra = value`;
- delete a namespace member;
- redefine a namespace property with `Object.defineProperty`;
- change the namespace prototype.

In strict ESM these operations throw. This is the desired contract: test substitution and extension
must use dependency injection or a new spread composition, not mutation of a shared singleton.

### Version and publication risk

`@sys/std` is `0.0.x`, but this is still observable runtime hardening. `deno task dry` must pass,
and release notes or commit body should name direct monkey-patching as the deliberate
incompatibility. No version bump or publication is part of this plan.

## Risks and mitigations

- **Missed alias-typed `Lib`:** a singleton remains mutable. Re-run broad annotation searches for
  `Type.*`, `Semver.*`, and indexed participant forms; require zero unexplained hits.
- **Shallow-freeze confusion:** a frozen root retains a mutable child namespace. Enumerate and
  assert every namespace-valued child independently.
- **Accidental deep freeze:** state or vendor objects stop working. Freeze only named namespace
  objects and use an explicit non-recursive test table.
- **Test monkey-patching:** suites fail before contract assertions. Land Schedule and Log injection
  seams first.
- **Cycle drift:** `Err.Try` or another cycle captures `undefined`. Freeze at existing declarations,
  retain cycle identity proof, and never compose at the root barrel.
- **Getter drift:** freezing captures a current getter value. Preserve object literals and
  descriptors byte-for-byte except wrappers.
- **Spread override drift:** a frozen base is treated as unspreadable. Prove distinct clone
  identity, complete keys, reference sharing, and overrides downstream.
- **Concurrent package changes:** freeze edits overwrite another campaign. Reopen each target path,
  recheck status/history, require clear ownership, and preserve current deltas; Pkg is currently
  clean, while CLI formatting and HTTP server currently have unrelated changes.
- **Oversized mechanical commit:** review cannot isolate failures. Keep seams, terminal leaves,
  intermediate composers, public roots, template adoption, and package batches separate. The final
  closeout may span packages only where residual freezes and downstream compatibility repairs are
  inseparable from the closure proof; review that unit by semantic family and package-owned gates.
- **Dependency-order drift:** a consumer freezes before its provider seam or lower-level package is
  stable. Reinspect imports at each resumed batch and update package order before implementation.
- **Generated-template false confidence:** template source looks frozen while materialized output is
  stale or renamed incorrectly. Inspect generated bytes, import the generated module, and assert
  root/nested freeze status.
- **False-green contract test:** partial enumeration misses a leaf. Build the test table from the
  final inventory and residue-search every declaration.

## Formatting and proof gates

Run the narrowest tests first from each owning module.

### `@sys/std` focused tests

From `code/sys/std`:

```sh
deno task test --trace-leaks ./src/m.Async.Schedule/-test/-.test.ts
deno task test --trace-leaks ./src/m.Log/-test/-u.logger.test.ts
deno task test --trace-leaks ./src/-test/-namespace.freeze.test.ts
deno task test --trace-leaks ./src/-test/-.test.ts
```

Then package proof:

```sh
deno task check
deno task test
deno task dry
```

### Downstream focused tests

From `code/sys/fs`:

```sh
deno task test --trace-leaks ./src/m.Path/-.test.ts
deno task test --trace-leaks ./src/m.Pkg/-test/-Pkg.test.ts
deno task test --trace-leaks ./src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts
deno task check
deno task test
deno task dry
```

From `code/sys/immutable`:

```sh
deno task test --trace-leaks ./src/m.url/-test/-.test.ts
deno task check
deno task test
deno task dry
```

From `code/sys/testing`:

```sh
deno task test --trace-leaks ./src/m.server/m.Testing/-.test.ts
deno task check
deno task test
deno task dry
```

### Formatting

Use the root formatter configuration (`singleQuote: true`, `lineWidth: 100`) from the workspace
root:

```sh
deno fmt --check code/sys/std/src code/sys/fs/src/m.Path/-.test.ts code/sys/fs/src/m.Pkg/-test/-Pkg.test.ts code/sys/fs/src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts code/sys/immutable/src/m.url/-test/-.test.ts code/sys/testing/src/m.server/m.Testing/-.test.ts
```

If formatting is required, run the same command without `--check`, then reopen every changed file
and verify that only formatter-owned layout changed.

### Template proof

From `code/-tmpl`, after std proof and before system batches:

```sh
deno task check
deno task test
deno task dry
```

### Per-package system proof

From each concrete package root under `code/sys`, use its declared tasks:

```sh
deno task check
deno task test
deno task dry
```

Run the narrowest affected test paths first. If a package lacks one of these tasks, stop and resolve
task authority rather than substituting an ad hoc command.

### Workspace capstone

From the repository root, after all package-local proof is green:

```sh
deno task check
deno task test
deno task dry
```

Do not bypass dependency-age, provenance, sandbox, signing, network, or publication checks. A policy
failure is a hard stop and must be reported as such.

### Final closure evidence

The final closeout review established:

- `deno test -A --trace-leaks ./-scripts/-test/-namespace.freeze-closure.test.ts` passes its complete
  source/runtime inventory and classification assertion;
- full `check`, `test`, and `dry` gates pass for the final downstream repair owners: `@sys/cli`,
  `@sys/driver-process`, `@sys/driver-pi`, `@sys/driver-vite`, `@sys/tools`, and `@tdb/slc`;
- Server and Workspace package-local proof remains green after their residual closure repairs;
- exact target formatting and diff whitespace checks pass; and
- no root `test` or `dry` result after the final downstream repairs is claimed here. Those workspace
  capstone runs remain required before plan closeout.

## Residue searches

From the repository root after std, then again after every system batch and at final closure:

```sh
rg -n "export const [A-Za-z0-9_]+:\s*[A-Za-z0-9_.]+\.Lib\s*=\s*\{" code/sys/std/src --glob '*.ts'
rg -n "export const [A-Za-z0-9_]+:\s*[^=]+\.Lib\['[A-Za-z0-9_]+'\]\s*=\s*\{" code/sys/std/src --glob '*.ts'
rg -n "\(Schedule as any\)\.raf\s*=|\(Is as any\)\.browser\s*=" code/sys/std/src --glob '*.ts'
rg -n "\.\.\.(Base|StdPath|UrlBase)([,}])" code/sys/fs/src code/sys/immutable/src code/sys/testing/src code/sys/std/src --glob '*.ts'
rg -n "Object\.freeze|Object\.isFrozen" code/sys/std/src --glob '*.ts'
rg -n "export const [A-Za-z0-9_]+:\s*[^=;]+(?:\.Lib|Lib)\s*=\s*\{" code/sys --glob '*.ts' --glob '*.tsx'
rg -n "Object\.defineProperty\([A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)*|Reflect\.set\([A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)*" code/sys --glob '*.ts' --glob '*.tsx'
rg -n "\b[A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)*\.[A-Za-z_][A-Za-z0-9_]*\s*=" code/sys --glob '*.ts' --glob '*.tsx'
```

Expected results:

- the first two searches return no unexplained singleton namespace declarations using a raw object
  literal;
- the monkey-patching search returns no hits;
- spread hits remain at the documented extension sites and are covered by compatibility tests;
- freeze hits cover every final inventory entry and every independently named child namespace;
- the whole-system raw `*.Lib`/`*Lib` search has no unexplained singleton object literal;
- direct assignment and descriptor searches have no namespace mutation hits; remaining hits are
  explicitly classified function-object, instance, platform-global, fixture-data, or interop cases.

Also inspect all broad mutation candidates rather than assuming assignment syntax is the only risk:

```sh
rg -n "Object\.(assign|defineProperty|defineProperties|setPrototypeOf)\(|Reflect\.set\(|delete\s+[A-Za-z0-9_]+\." code/sys --glob '*.ts' --glob '*.tsx'
```

Classify each hit against the intentional-mutable exclusions or the namespace invariant. No
unexplained namespace mutation may remain.

## GO / NO-GO criteria

### GO to begin implementation

- the live candidate inventory is reconciled with this plan;
- the superseded std-only plan has been removed so this file is the sole live ledger;
- Schedule and Log test seams remain package-internal and behavior-preserving;
- no exported `Lib` has been identified as an intentional mutable registry;
- no namespace requires post-construction mutation or unresolved late binding;
- the first commit boundary can be implemented without touching unrelated worktree deltas;
- before every layer reaches a target package, current ownership is clear and no unrelated delta
  would be absorbed.

### NO-GO to begin or continue

- any candidate cannot be classified without guessing;
- a resumed system batch has not refreshed package dependency order and direct-mutation residue;
- a consumer requires direct mutation rather than spread composition or injection;
- freezing exposes an unresolved cyclic-initialization dependency;
- a proposed fix deep-freezes state, arrays, instances, classes, or vendor objects;
- target edits would overwrite or absorb concurrently owned work;
- a downstream production change is required but has not received a separate scope decision.

### GO to land each commit

- its exact path set contains only target-attributed deltas;
- focused tests for that boundary pass;
- the freeze contract table is complete for every object frozen in that commit;
- object identity, keys, getters, and member references remain unchanged;
- formatting is stable.

### GO to close each intermittent arc item

- the item is fully landed or fully unstarted; no half-frozen package graph remains;
- every touched package's focused tests, check, full tests, and dry-run pass;
- target deltas are isolated from concurrent campaigns;
- residue searches are clean for the touched boundary;
- the plan opening arc is reconciled before pausing.

### GO to close the plan

- the final closeout commit is landed and its opening-arc item records the exact hash and subject;
- every candidate and nested namespace participant across `code/sys` is frozen or explicitly
  documented as excluded;
- applicable `@sys/tmpl` generated namespace APIs are frozen by default and proven after
  materialization;
- both raw-object residue searches have no unexplained hits;
- namespace monkey-patching residue is zero;
- std focused, package, dry-run, template, every system-package, and workspace capstone gates pass;
- downstream spread/override compatibility proofs pass;
- final diff inspection finds no unrelated or concurrent deltas;
- each arc commit remains independently reviewable and reversible.

### NO-GO to close

- any proof is skipped without a recorded, externally imposed reason;
- any expected frozen object lacks an `Object.isFrozen` assertion;
- any downstream spread loses a base key or reference identity;
- any direct namespace mutation survives in tests or production;
- any policy/provenance gate is bypassed or weakened.

## Rollback strategy

Rollback is commit-bounded and dependency ordered:

1. final closure closeout reverts residual freezes, package-owned compatibility seams, generated pin
   repairs, downstream fixes, and proof together;
2. one application, platform, or foundation package can revert with its local proof while unrelated
   landed packages remain frozen;
3. template adoption can revert without unfreezing existing runtime packages;
4. std downstream proof can revert alone because it changes tests only;
5. std public roots can revert while retaining frozen intermediate composers and terminal leaves;
6. std intermediate composers can revert while retaining terminal leaves;
7. std terminal leaves can revert without removing injection seams;
8. provider-led substitution seams can revert only while no dependent provider namespace has landed
   frozen; Schedule/Log seams can revert last within the std bootstrap if behavior proves defective.

Do not respond to one failing namespace by removing freeze globally. Revert or repair the narrowest
commit/object graph that fails, retain passing leaf invariants, and add a regression test for the
specific compatibility defect.

## BMIND / DMIND / TMIND / STIER final review

### BMIND

The final review reopened the subject from first principles: the invariant belongs to authored
singleton namespace objects, not to arbitrary objects reachable through them. The correct boundary
is shallow, leaf-first, and explicit. Classes, constructed instances, adapters, caches, data
constants, and runtime state remain mutable unless they independently form an exported namespace
API.

The large closeout fan-out is semantically one unit rather than a collection of feature changes:
every production delta either closes a residual namespace classification, replaces a substitution
that frozen providers made invalid, preserves generated pin authority, or proves the resulting
contract. Unrelated active plan and UI work remains outside that boundary.

### DMIND

The implementation form invites correct use:

- namespaces are frozen directly where authored with the platform primitive;
- every namespace-valued child is frozen independently before its parent;
- public APIs keep their names, identities, signatures, getters, metadata, and call behavior;
- tests receive explicit package-owned dependencies or async-scoped effects instead of mutating
  canonical singletons; and
- mutable instances and state remain behind the frozen method namespace rather than being
  deep-frozen.

### TMIND

The adversarial review challenged the closeout from competing failure viewpoints:

- **false closure:** source inventory, classification accounting, stale-exclusion detection, and
  runtime imports fail when a new raw singleton candidate escapes review;
- **shallow-freeze drift:** explicit nested matrices and runtime `Object.isFrozen` checks prevent a
  frozen parent from masking a mutable namespace child;
- **behavior regression:** focused and full package suites exercise identities, getters, rendering,
  process invocation, server lifecycle, generated templates, and downstream spread/override use;
- **test concurrency:** async-local seams isolate prompt and process substitutions without global
  mutation or restoration races;
- **generated-source drift:** prep targets and tests move atomically with Pi/Tmpl internal runners;
- **scope contamination:** final target attribution excludes concurrent plan/UI work; and
- **policy self-deception:** root capstone results are not inferred from package-local green proof.

### STIER

The residue pass found no unresolved namespace-contract defect in the bounded closeout:

- raw singleton candidates are classified as frozen participants or explicit mutable exclusions;
- direct imported-singleton mutation that failed under frozen providers is replaced by narrow seams;
- closure proof, affected package checks/tests/dry-runs, exact formatting, and diff whitespace checks
  pass; and
- rollback remains bounded by the previously landed arcs plus one cohesive final closeout unit.

Review conclusion: **GO for the bounded final commit** using
`refactor(sys): complete frozen namespace API closure`. This is not yet a plan-close or
repository-release GO: the final root `test` and `dry` capstone results and the landed commit hash are
not claimed by this review.

## Implementation calibration

The final item combines mechanical residual freezing with semantic downstream compatibility repair.
Highest-effort review is required because a false green could come from incomplete inventory,
shared-mutation leakage, generated pin drift, or package-local proof being mistaken for workspace
proof. The BMIND → DMIND → TMIND → STIER cycle above is the final calibrated review record.

Implementation: gpt-5.6-sol • max
