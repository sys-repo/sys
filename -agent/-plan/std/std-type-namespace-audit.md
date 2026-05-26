# std type namespace audit

## Intent

Audit `@sys/std` type spines for flat exported contracts that should be
namespace-owned, matching the runtime noun surface.

This follows the pattern already applied to:

- `ArgsLib` → `Args.Lib`
- `PathLib` / `Path*` support types → `Path.Lib`, `Path.Is.Lib`, `Path.Join.Lib`, etc.

Greenfield rule: no compatibility aliases and no deprecated scar tissue.
Fix callsites in the same refactor slice.

## Thinking level protocol

When executing a planned group via `GO <commit message>`, use exactly this top-level flow:

1. HIGH — implement the scoped group to completion.
2. XHIGH — final STIER review before commit/DONE.

MED is not a required phase. It is only an optional sub-mode inside HIGH for dead-obvious
mechanical callsite rewrites after the namespace shape is already locked.

Use XHIGH outside implementation for initial design, group boundaries, namespace ownership
decisions, and the final gate. At the final gate, after checks/tests/dry pass, review
against canon and `/sys` standards before marking DONE.

## Canon anchor

Relevant canon: `sys.canon/-canon/protocol.types.md`.

Key points:

- public type spines are contract surfaces;
- public namespace `Lib` appears first;
- root contract types precede subordinate/detail/helper types;
- public root namespaces and public sub-namespaces use multiline JSDoc;
- ordinary leaf members stay single-line when one sentence is enough.

## Already in good shape

These already have a proper root namespace shape:

- `Args` → `Args.Lib`, `Args.Parse.*`, `Args.Alias.*`
- `Path` → `Path.Lib`, `Path.Is.Lib`, `Path.Join.Lib`, etc.
- `Glob` → `Glob.Lib`
- `Bytes` → `Bytes.Lib`
- `Time` → `Time.Lib`, `Time.Delay.*`, etc.

Completed by this plan:

- `Num` already had `namespace Num`; the cleanup completed its subcontracts:
  - `Num.IsLib` → `Num.Is.Lib`
  - `Num.Random` → `Num.Random.Fn`
  - `Num.RandomOptions` → `Num.Random.Options`
  - `Num.RandomSource` → `Num.Random.Source`

## Completed namespace refactor: root surfaces

Completed flat-to-namespace root contract maps:

```text
ArrayLib              → Arr.Lib
AwaitLib              → Await.Lib
SchedulerLib          → Schedule.Lib
DeleteLib             → Delete.Lib
DisposeLib            → Dispose.Lib
EffectLib             → Effect.Lib
EffectControllerLib   → EffectController.Lib
ErrLib                → Err.Lib
FnLib                 → Fn.Lib
HistoryLib            → History.Lib
IgnoreLib             → Ignore.Lib
IndexedDbLib          → IndexedDb.Lib
StdIsLib              → Is.Lib
JsonLib               → Json.Lib
LazyLib               → Lazy.Lib
LogLib                → Log.Lib
ObjLib                → Obj.Lib
ObjPathLib            → Obj.Path.Lib
ObjLensLib            → Obj.Lens.Lib
PkgLib                → Pkg.Lib
RandomLib             → Random.Lib
RegexLib              → Regex.Lib
RxLib                 → Rx.Lib
SemverLib             → Semver.Lib
SemverServerLib       → Semver.Server.Lib
ShardLib              → Shard.Lib
SignalLib             → Signal.Lib
StrLib                → Str.Lib
TestingLib            → Testing.Lib
TestingHttpLib        → Testing.Server.Lib
DomMockLib            → DomMock.Lib
TryLib                → Try.Lib
UrlLib                → Url.Lib
JsrUrlLib             → JsrUrl.Lib
```

## Completed namespace refactor: sub-surfaces

Completed flat-to-namespace sub-surface maps:

```text
StrLoremLib           → Str.Lorem.Lib
StrCompareLib         → Str.Compare.Lib
ErrIsLib              → Err.Is.Lib
ErrNameLib            → Err.Name.Lib
SemverIsLib           → Semver.Is.Lib
SemverReleaseLib      → Semver.Release.Lib
SemverPrefixLib       → Semver.Prefix.Lib
ShardSha256Lib        → Shard.Sha256.Lib
SignalIsLib           → Signal.Is.Lib
SignalValueHelpersLib → Signal.Value.Lib
DateLib               → Date.Lib
DayLib                → Date.Day.Lib
DateIsLib             → Date.Is.Lib
DateFormatLib         → Date.Format.Lib
IndexedDbRecord       → IndexedDb.Record.Lib
IndexedDbDatabase     → IndexedDb.Database.Lib
```

## Completed source-guided refactor chunks

This was completed in small, independently verifiable commits, avoiding a repo-wide mega-rename.

The completed order followed runtime noun, module folder, and direct type-dependency edges rather
than alphabetical order:

- Use the exported runtime noun as the namespace owner:
  - `ArrayLib` becomes `Arr.Lib`, not `Array.Lib`.
  - `SchedulerLib` becomes `Schedule.Lib`, not `Scheduler.Lib`.
  - `StdIsLib` becomes `Is.Lib`, not `StdIs.Lib`.
- Keep nested runtime nouns nested:
  - `ObjPathLib` → `Obj.Path.Lib`, not `ObjPath.Lib`.
  - `ObjLensLib` → `Obj.Lens.Lib`, not `ObjLens.Lib`.
  - `TestingHttpLib` → `Testing.Server.Lib`.
- Keep value-noun exceptions honest:
  - `DomMockLib` should stay `DomMock.Lib`; execute it with the Testing chunk because
    the source lives under `m.Testing.DomMock` and is exported from `testing/server`.
  - `JsrUrlLib` should stay `JsrUrl.Lib`; the runtime value is `JsrUrl`, even though
    it is implemented under `m.Url.Jsr`.
- Do not use broad example groups like `ArrayLib + AwaitLib + SchedulerLib` as a
  commit unit. `ArrayLib` is core data utility work; `AwaitLib` and `SchedulerLib`
  are async/runtime work.

Completed commit sequence:

    [x] refactor(std): namespace number type contracts — 16bca8910
    [x] refactor(std): namespace leaf type contracts — 4ea97ec75
    [x] refactor(std): namespace error type contracts — 13d098075
    [x] refactor(std): namespace is type contract — ca5c09a8c
    [x] refactor(std): namespace core data type contracts — 0dab53745
    [x] refactor(std): namespace object type contracts — a136c8026
    [x] refactor(std): namespace string type contracts — 92a460fc3
    [x] refactor(std): namespace lifecycle type contracts — 31993e447
    [x] refactor(std): namespace effect type contracts — 9e7513c84
    [x] refactor(std): namespace runtime utility type contracts — bc1620289
    [x] refactor(std): namespace testing type contracts — d28fa7b13
    [x] refactor(std): namespace package type contracts — 73598740d
    [x] refactor(std): namespace semver type contracts — d69dbbb75
    [x] refactor(std): namespace url type contracts — aa9346fa2
    [x] refactor(std): namespace signal type contracts — 3c81db3d8
    [x] refactor(std): namespace structured type contracts — c8fe9865e
    [x] refactor(std): namespace date type contracts — 50dbd63bd
    [x] refactor(std): namespace timecode type contracts — 1743da4a5
    [x] refactor(std): namespace alias resolver type contracts — d41b7b26d
    [x] refactor(std): namespace async lease type contract — f335ab7d0
    [x] refactor(std): namespace testing bdd type contract — 7ea3eeb04
    [x] refactor(std): namespace number ratio type contract — 57bc7eaa6
    [x] refactor(std): namespace number percent type contracts — 5d8a61ba7
    [x] refactor(std): namespace dom mock type contracts — b4f91ed2b
    [x] refactor(std): update lease type callsite — 2c3543592

Follow-on tail cleanup:

- Leave `RLib` as-is. It is an internal-ish Ramda adapter surface and not exported through
  `@sys/std/t` as a named public type.
- Clean up the remaining public flat `*Lib` contracts that became visible after the main
  namespace surface was made consistent:
  - `AliasResolverLib` → `AliasResolver.Lib`
  - `AliasResolverIsLib` → `AliasResolver.Is.Lib`
  - `LeaseLib` → `Lease.Lib`
  - `BddLib` → `Bdd.Lib`
  - `RatioLib` → `Num.Ratio.Lib`
  - `PercentLib` → `Num.Percent.Lib`
  - `PercentRangeLib` → `Num.Percent.Range.Lib`
  - `DomMockKeyboardLib` → `DomMock.Keyboard.Lib`
  - `DomMockFakeLib` → `DomMock.Fake.Lib`
  - `DomMockFakeMediaLib` → `DomMock.Fake.Media.Lib`

### 0. Num partial cleanup

`Num` already has a namespace, but source still has flat subcontracts:

- `Num.IsLib` → `Num.Is.Lib`
- `Num.Random` → `Num.Random.Fn`
- `Num.RandomOptions` → `Num.Random.Options`
- `Num.RandomSource` → `Num.Random.Source`

Why this chunk:

- It is already namespace-shaped and low-risk.
- It establishes the nested namespace convention before the wider root renames.

Expected commit:

```text
refactor(std): namespace number type contracts
```

### 1. Leaf root contracts

Targets:

- `RegexLib` → `Regex.Lib`
- `FnLib` → `Fn.Lib`
- `DeleteLib` → `Delete.Lib`
- `LazyLib` → `Lazy.Lib`
- `HistoryLib` → `History.Lib`
- `RandomLib` → `Random.Lib`

Why this chunk:

- Source hits are mostly module-local implementation annotations.
- `RandomLib` has one useful edge into `TestingLib.slug`; repair that reference in
  this same slice without renaming `TestingLib` yet.

Expected commit:

```text
refactor(std): namespace leaf type contracts
```

### 2. Error and try contracts

Targets:

- `TryLib` → `Try.Lib`
- `ErrLib` → `Err.Lib`
- `ErrIsLib` → `Err.Is.Lib`
- `ErrNameLib` → `Err.Name.Lib`

Why this chunk:

- `Err.Lib` exposes `Err.Is`, `Err.Name`, and `Err.Try` together in source.
- `Is.Lib` delegates its error guards to the Err contracts, so land this before the
  central `Is` rename to reduce conceptual backtracking.

Expected commit:

```text
refactor(std): namespace error type contracts
```

### 3. Central guard contract

Targets:

- `StdIsLib` → `Is.Lib`

Why this chunk:

- `Is` is central and has downstream hits outside std (`http`, `immutable`).
- It also feeds async/Rx contracts (`Await.isPromise`, `Rx.Is.observable/subject`),
  so complete it before the async and Rx slices.

Expected commit:

```text
refactor(std): namespace is type contract
```

Downstream checks likely needed:

- `code/sys/http`
- `code/sys/immutable`

### 4. Small core data roots

Targets:

- `ArrayLib` → `Arr.Lib`
- `JsonLib` → `Json.Lib`

Why this chunk:

- These are core utilities but source-local enough to keep together.
- Keep them separate from `Obj` and `Str`, which each have their own sub-surfaces.

Expected commit:

```text
refactor(std): namespace core data type contracts
```

### 5. Object family

Targets:

- `ObjLib` → `Obj.Lib`
- `ObjPathLib` → `Obj.Path.Lib`
- `ObjLensLib` → `Obj.Lens.Lib`
- Same-folder subcontracts should move with this slice after exact shape review:
  - `ObjPathIsLib` → `Obj.Path.Is.Lib`
  - `ObjPathRelLib` → `Obj.Path.Rel.Lib`
  - `ObjPathCodecLib` → `Obj.Path.Codec.Lib`
  - `ObjPathMutateLib` → `Obj.Path.Mutate.Lib`
  - `CurriedPathLib` → `Obj.Path.Curried.Lib`
  - `ObjLensIsLib` → `Obj.Lens.Is.Lib`

Why this chunk:

- Runtime source already exposes `Obj.Path` and `Obj.Lens` through `Obj.Lib`.
- Splitting the root from `Path`/`Lens` would create avoidable intermediate churn.

Expected commit:

```text
refactor(std): namespace object type contracts
```

### 6. String family

Targets:

- `StrLib` → `Str.Lib`
- `StrLoremLib` → `Str.Lorem.Lib`
- `StrCompareLib` → `Str.Compare.Lib`

Why this chunk:

- `Str.Lib` owns both `Str.Lorem` and `Str.Compare` in one `m.Str/t.ts` spine.
- The implementation has many small helper annotations; keep review focused on text utilities only.

Expected commit:

```text
refactor(std): namespace string type contracts
```

### 7. Dispose and Rx lifecycle bridge

Targets:

- `DisposeLib` → `Dispose.Lib`
- `RxLib` → `Rx.Lib`

Why this chunk:

- `Rx.Lib` directly re-surfaces multiple `Dispose.Lib` lifecycle methods.
- `Rx.Is` also depends on the central `Is.Lib` observable/subject guards, so run this
  after the `Is` slice.

Expected commit:

```text
refactor(std): namespace lifecycle type contracts
```

### 8. Effect family

Targets:

- `EffectControllerLib` → `EffectController.Lib`
- `EffectLib` → `Effect.Lib`
- Include local `EffectCausalLib` → `Effect.Causal.Lib` if completing the full effect spine.

Why this chunk:

- `Effect.Lib` directly owns `Effect.Controller` and `Effect.Causal`.
- It is control-plane work, but independent of `Err/Try` and `Dispose/Rx`.

Expected commit:

```text
refactor(std): namespace effect type contracts
```

### 9. Async and runtime utility contracts

Targets:

- `AwaitLib` → `Await.Lib`
- `SchedulerLib` → `Schedule.Lib`
- `LogLib` → `Log.Lib`

Why this chunk:

- `Await` and `Schedule` both live under the async runtime folder family.
- `Await.Lib` references `Is.Lib['promise']`, so run after the central `Is` slice.
- `Log` is small and runtime-adjacent enough to ride with this slice.

Expected commit:

```text
refactor(std): namespace runtime utility type contracts
```

### 10. Testing family

Targets:

- `TestingLib` → `Testing.Lib`
- `TestingHttpLib` → `Testing.Server.Lib`
- `DomMockLib` → `DomMock.Lib`

Why this chunk:

- `Testing.Server.Lib` extends `Testing.Lib` in source.
- `DomMock` is exported from `testing/server`, so downstream review belongs with Testing
  even though the namespace owner remains the runtime value `DomMock`.

Expected commit:

```text
refactor(std): namespace testing type contracts
```

Downstream checks likely needed:

- `code/sys/testing`

### 11. Package and ignore contracts

Targets:

- `PkgLib` → `Pkg.Lib`
- `IgnoreLib` → `Ignore.Lib`
- Same-folder package subcontracts should move with this slice after exact shape review:
  - `PkgIsLib` → `Pkg.Is.Lib`
  - `PkgDistLib` → `Pkg.Dist.Lib`
  - `PkgDistIsLib` → `Pkg.Dist.Is.Lib`
  - `PkgDistCompatLib` → `Pkg.Dist.Compat.Lib`
  - `PkgDistPartLib` → `Pkg.Dist.Part.Lib`

Why this chunk:

- `fs` extends/re-exports both package and ignore contracts, so verify that boundary once.
- Package has nested runtime nouns (`Pkg.Is`, `Pkg.Dist`, `Pkg.Dist.Part`) that should not
  be stranded behind flat `*Lib` names.

Expected commit:

```text
refactor(std): namespace package type contracts
```

Downstream checks likely needed:

- `code/sys/fs`

### 12. Semver family

Targets:

- `SemverLib` → `Semver.Lib`
- `SemverServerLib` → `Semver.Server.Lib`
- `SemverIsLib` → `Semver.Is.Lib`
- `SemverReleaseLib` → `Semver.Release.Lib`
- `SemverPrefixLib` → `Semver.Prefix.Lib`

Why this chunk:

- `Semver.Server.Lib` extends `Semver.Lib`.
- `Semver.Lib` owns `Is`, `Release`, and `Prefix` in the same source spine.

Expected commit:

```text
refactor(std): namespace semver type contracts
```

### 13. URL family — DONE `aa9346fa2`

Final map:

- `UrlLib` → `Url.Lib`
- `JsrUrlLib` → `JsrUrl.Lib`
- `JsrUrlPkgLib` → `JsrUrl.Pkg.Lib`
- `JsrUrlRef` → `JsrUrl.Ref`

Why this chunk:

- `Url.Lib` had downstream hits in `http` and `immutable`.
- `JsrUrl.Lib` had downstream hits in `registry`.
- The completed slice also repaired downstream references in `text`.

Completed commit:

```text
aa9346fa2 refactor(std): namespace url type contracts
```

Downstream checks run:

- `code/sys/http`
- `code/sys/immutable`
- `code/sys/registry`
- `code/sys/text`

### 14. Signal family — DONE `3c81db3d8`

Final map:

- `SignalLib` → `Signal.Lib`
- `SignalIsLib` → `Signal.Is.Lib`
- `SignalValueHelpersLib` → `Signal.Value.Lib`

Why this chunk:

- `Signal.Lib` is a composed type (`Signal` core and value helpers).
- `Signal.Value.Lib` won over `ValueHelpers` as the clearer public noun.
- The completed slice repaired downstream references in `ui-react`.

Completed commit:

```text
3c81db3d8 refactor(std): namespace signal type contracts
```

### 15. Self-contained structured roots — DONE `c8fe9865e`

Final map:

- `IndexedDbLib` → `IndexedDb.Lib`
- `IndexedDbRecord` → `IndexedDb.Record.Lib`
- `IndexedDbDatabase` → `IndexedDb.Database.Lib`
- `ShardLib` → `Shard.Lib`
- `ShardSha256Lib` → `Shard.Sha256.Lib`

Why this chunk:

- Source hits were std-local and mechanically similar.
- The combined commit stayed coherent and did not require a domain split.

Completed commit:

```text
c8fe9865e refactor(std): namespace structured type contracts
```

### 16. Date/time family — DONE `50dbd63bd`

Final map:

- `DateLib` → `Date.Lib`
- `DayLib` → `Date.Day.Lib`
- `DateIsLib` → `Date.Is.Lib`
- `DateFormatLib` → `Date.Format.Lib`

Why this chunk:

- The source spine is `m.Time.Date/t.ts`, but the runtime value exposed is `Date`.
- This stayed separate from `Timecode`; both are temporal, but the source modules and
  contracts are independent.

Completed commit:

```text
50dbd63bd refactor(std): namespace date type contracts
```

### 17. Timecode family — DONE `1743da4a5`

Final map:

- `TimecodeLib` → `Timecode.Lib`
- `TimecodeOpsLib` → `Timecode.Ops.Lib`
- `TimecodeSliceLib` → `Timecode.Slice.Lib`
- `TimecodeCompositeLib` → `Timecode.Composite.Lib`
- `TimecodeCompositeMapLib` → `Timecode.Composite.Map.Lib`
- `TimecodeExperienceLib` → `Timecode.Experience.Lib`
- `VTimeLib` → `VTime.Lib`
- `VirtualClockLib` → `VirtualClock.Lib`

Final file shape:

- Timecode namespace contracts are centralized in `m.Timecode/t.namespace.ts`.
- Runtime-value namespaces `VTime` and `VirtualClock` stay in their clock spines.
- Obsolete flat-contract files were removed:
  - `m.Timecode/t.lib.ts`
  - `m.Timecode/core.ops/t.ts`
  - `m.Timecode/composite/t.map.ts`
  - `m.Timecode/experience/t.lib.ts`

Completed commit:

```text
1743da4a5 refactor(std): namespace timecode type contracts
```

## Per-slice execution protocol

For each slice:

1. Read the relevant `t.ts` and runtime implementation files.
2. Design the namespace shape before editing.
3. Edit the type spine first.
4. Update implementation annotations.
5. Update downstream callsites in the same commit.
6. Search for removed flat names.
7. Run the narrowest relevant tests.
8. Run package checks for touched packages.
9. Commit only associated files.

## Historical search probes

These probes drove the completed slices. Keep them as historical audit tooling for future checks.
Prefer source folders first, then widen to `code/sys` for downstream repairs. Examples:

```sh
rg "\bNum\.IsLib\b|\bNum\.Random\b|\bNum\.RandomOptions\b|\bNum\.RandomSource\b" code/sys/std/src
```

```sh
rg "\bRegexLib\b|\bFnLib\b|\bDeleteLib\b|\bLazyLib\b|\bHistoryLib\b|\bRandomLib\b" code/sys
```

```sh
rg "\bErrLib\b|\bErrIsLib\b|\bErrNameLib\b|\bTryLib\b" code/sys
```

```sh
rg "\bStdIsLib\b" code/sys
```

```sh
rg "\bArrayLib\b|\bJsonLib\b" code/sys
```

```sh
rg "\bObjLib\b|\bObjPath[A-Za-z0-9_]*Lib\b|\bObjLens[A-Za-z0-9_]*Lib\b|\bCurriedPathLib\b" code/sys/std/src
```

```sh
rg "\bStrLib\b|\bStrLoremLib\b|\bStrCompareLib\b" code/sys
```

```sh
rg "\bDisposeLib\b|\bRxLib\b" code/sys
```

```sh
rg "\bEffectLib\b|\bEffectControllerLib\b|\bEffectCausalLib\b" code/sys/std/src
```

```sh
rg "\bAwaitLib\b|\bSchedulerLib\b|\bLogLib\b" code/sys
```

```sh
rg "\bTestingLib\b|\bTestingHttpLib\b|\bDomMockLib\b" code/sys
```

```sh
rg "\bPkgLib\b|\bPkg[A-Za-z0-9_]*Lib\b|\bIgnoreLib\b" code/sys/std/src code/sys/fs/src
```

```sh
rg "\bSemverLib\b|\bSemverServerLib\b|\bSemverIsLib\b|\bSemverReleaseLib\b|\bSemverPrefixLib\b" code/sys
```

```sh
rg "\bUrlLib\b|\bJsrUrlLib\b" code/sys
```

```sh
rg "\bSignalLib\b|\bSignalIsLib\b|\bSignalValueHelpersLib\b" code/sys
```

```sh
rg "\bIndexedDbLib\b|\bIndexedDbRecord\b|\bIndexedDbDatabase\b|\bShardLib\b|\bShardSha256Lib\b" code/sys
```

```sh
rg "\bDateLib\b|\bDayLib\b|\bDateIsLib\b|\bDateFormatLib\b" code/sys
```

```sh
rg "\bTimecode[A-Za-z0-9_]*Lib\b|\bVTimeLib\b|\bVirtualClockLib\b" code/sys/std/src/m.Timecode code/sys
```

Old std flat names from the main completed slices have no active std source hits.
Historical plan notes may be ignored deliberately. Remaining broad-probe hits are unrelated
non-std/domain-local names such as registry `*.Fetch.PkgLib` or registry-owned `UrlLib` aliases;
do not rename non-std contracts just because a broad probe finds them.

Follow-on tail probes:

```sh
rg "\bAliasResolverLib\b|\bAliasResolverIsLib\b" code/sys/std/src
```

```sh
rg "\bLeaseLib\b" code/sys/std/src
```

```sh
rg "\bBddLib\b" code/sys/std/src
```

```sh
rg "\bRatioLib\b" code/sys/std/src
```

```sh
rg "\bPercentLib\b|\bPercentRangeLib\b" code/sys/std/src
```

```sh
rg "\bDomMockKeyboardLib\b|\bDomMockFakeLib\b|\bDomMockFakeMediaLib\b" code/sys/std/src
```

## Final verification state

Final sweep after `1743da4a5`:

- `code/sys/std`: `deno task check` passed.
- `code/sys/std`: `deno test -P=test src/m.Timecode` passed after final formatting.
- `code/sys/std`: `deno task test` passed during the final timecode sweep.
- `code/sys/std`: `deno task dry` passed after all namespace commits.
- No compatibility aliases or deprecated flat std contract aliases were kept.

## Verification baseline

Optimize verification for isolated `@sys/std` type-surface refactors. Do not run
expensive sys-wide test/check loops while iterating on isolated std modules.

During each refactor slice, start with the owning std package check:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task check
```

Run narrow package-local tests only when the slice touches behavior or when a type
change needs a nearby test proof. Prefer the smallest relevant std module path.

Then run checks for downstream packages touched by callsite repair, for example:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task check
```

After the refactor slice is complete, run the std test suite once:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task test
```

Only after the std check/test pass, run the compatibility dry-run:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task dry
```

`deno task dry` is the wide public package-surface compatibility step for these
refactors. Use it to catch broken exports/package publication shape and callsite-visible
surface mistakes without running expensive full `/sys` workspace tests.

Do not run full-workspace `/sys` tests as the default verification for each slice.
Only run package-local checks/tests, touched downstream checks, then final `deno task dry`
from `code/sys/std` unless a specific failure or dependency path justifies more.

Completion gate:

1. `@sys/std` `deno task check` passes.
2. Touched downstream package checks pass.
3. Completed slice: `@sys/std` `deno task test` passes.
4. Final compatibility: `@sys/std` `deno task dry` passes.
5. Only then mark DONE / STIER complete.
6. Do an STIER review against canon and `/sys` standards to verify all callsites are
   correctly factored and no compatibility aliases or namespace scar tissue remain.

Do not use compatibility aliases to make checks pass. Fix the real callsites.

## Non-goals

- Do not change runtime behavior.
- Do not rename runtime values unless explicitly required by a separate design decision.
- Do not add deprecated aliases.
- Do not collapse unrelated domains into one giant namespace.
- Do not combine this with semantic API changes.
