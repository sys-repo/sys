# `@sys/std/eql` helper plan

## Commit ledger

- [x] `84d5316b7` — `fix(std): harden structural equality kernel`
- [x] `09f8e7707` — `feat(std): add Eql helpers`
- [x] `8481ceea1` — `refactor(std): route R equality facade through Eql kernel`

## Final status

Complete. `@sys/std/eql` exists, and the equality helper owner is now `m.Eql`.
The module method surface lives in `m.Eql/m.Eql.ts`; the bounded structural equality kernel is split across `m.Eql/u.kernel.*.ts`.
The legacy `R` equality facade now routes directly through the `m.Eql` method surface for `equals`, `uniq`, and `uniqBy`.

Retirement posture: `@sys/std/r` is now thin compatibility only. Equality and structural-dedupe callers should migrate to `Eql.deep`, `Eql.unique`, `Eql.uniqueBy`, `Obj.eql`, or `Arr.uniq` by intent. After downstream usage is gone, remove the legacy `R` facade in a separate focused retirement commit.

## Position

Add a small public equality namespace that gives maintained code a deliberate replacement for legacy structural
`R.equals`, `R.uniq`, and `R.uniqBy` usage without creating a second deep-equality implementation.

There are two surfaces over one equality truth:

```txt
m.Eql/m.Eql.ts           module method surface: deep, unique, uniqueBy
m.Eql/u.kernel.*.ts      internal bounded pure-data equality kernel
@sys/std/eql             public leaf surface; consumer-facing equality truth
```

The kernel files are the buck-stops-here implementation for general structural equality. Public APIs may surface or
alias the `m.Eql.ts` methods, but no API surface owns a second equality or structural-dedupe algorithm.

Quality thesis: this is not equality-for-everything. It is a mathematically clean equality algebra for the supported
pure data domain. Unsupported behavioral or opaque values compare by identity rather than by accidental shape. False
negatives are acceptable at unsupported boundaries; false positives are not.

Desired source graph:

```txt
m.Eql/m.Eql.ts
├─ deep       → Eql.deep / Obj.eql / legacy R.equals
├─ unique     → Eql.unique / legacy R.uniq
└─ uniqueBy   → Eql.uniqueBy / legacy R.uniqBy

m.Eql/u.kernel.ts
└─ u.kernel.*.ts  → internal deep equality parts: domain, graph, descriptors, bytes, collections
```

`@sys/std/eql` formalizes the kernel publicly as a named equality surface. It should not introduce a new algorithm,
a Ramda-shaped facade, or broad helper churn. The first commit hardened and documented the raw kernel; the second
commit moves it into the `m.Eql` owner module and exposes the public leaf; the third commit DRYs existing legacy API
surfaces back onto that source.

## Hard constraints

- This work is part of removing the `R` structures. `@sys/std/r` is a compatibility bridge only, not a source of truth.
- `m.Eql/**` must not import Ramda, `@sys/std/r`, or `common/libs.R.ts`.
- Do not surface Ramda through a new name. `Eql` is a native `@sys` equality surface.
- Correctness outranks convenience and performance shortcuts. No JSON-stringify equality, hash-only dedupe,
  enumerable-only object comparison, or greedy unordered matching unless backed by proof and tests.
- If the current kernel cannot satisfy the semantic contract below, fix the kernel before publishing `@sys/std/eql`.

## Goals

- Publish a clear leaf export: `@sys/std/eql`.
- Add a compact namespace: `Eql`.
- Make `m.Eql/m.Eql.ts` the module method source for `deep`, `unique`, and `uniqueBy`, backed by `u.kernel.*.ts`.
- Route all general-purpose deep structural equality through that kernel.
- Preserve first-occurrence structural dedupe behavior for object/array values.
- Duplicate structural-dedupe loops have been removed from legacy API surfaces.
- Give downstream R-retirement commits an obvious target helper instead of temporary local functions.
- Keep `Arr.uniq` semantics unchanged; it remains the primitive/identity-oriented array helper.

## Non-goals

- Do not remove `@sys/std/r` in this helper sequence; remove it later after callers migrate.
- Do not migrate broader workspace `R` callsites in this helper sequence.
- Do not add a second public deep-equality implementation.
- Do not leave local fallback equality or structural-dedupe loops beside the raw kernel.
- Do not make broad `src/common/**` barrels depend on `m.Eql`; direct legacy-facade imports may target the `m.Eql/m.Eql.ts` method surface when no cycle is introduced.
- Do not fold in Obj type namespace cleanup.
- Do not broaden the root `@sys/std` barrel; root stays minimal.
- Do not touch `-tmp/-archive/**`.

## Supported equality algebra

The public claim must be explicit and no larger than the implementation can prove:

```txt
primitive values        Object.is
plain records           descriptor-aware own-property data equality
arrays                  descriptor-aware indexed + own-property data equality
Date                    time-value equality plus own descriptor state
RegExp                  source + flags equality plus own descriptor state
ArrayBuffer/views       byte-content equality with constructor/shape checks plus own descriptor state
Map                     unordered structural entry equality plus own descriptor state
Set                     unordered structural member equality plus own descriptor state
cycles/shared refs      terminating, topology-preserving graph comparison
opaque/behavioral       identity-only unless explicitly supported
Proxy                   outside the pure no-user-code guarantee
```

This is the essence boundary. `Eql.deep` must not imply Ramda compatibility, JSON equivalence, class-instance
introspection, host-object inspection, or universal JavaScript object equality.

## Desired public API

Preferred shape:

```ts
import { Eql } from '@sys/std/eql';

Eql.deep(a, b);
Eql.unique(values);
Eql.uniqueBy((value) => key, values);
```

Meaning:

```txt
Eql.deep(a, b)
  Deep structural equality using m.Eql/m.Eql.ts::deep.

Eql.unique(values)
  Returns a new array containing the first value from each structural-equality class.

Eql.uniqueBy(fn, values)
  Returns a new array containing the first item for each structurally unique key produced by fn.
```

Expected contracts:

- `Eql.deep` uses `Object.is` primitive semantics, including `NaN === NaN` and `0 !== -0`.
- Supported value classes are explicit; do not claim generic support for opaque host objects or hidden internal slots.
- Data object comparison includes explicit prototype policy, own string keys, symbols, non-enumerable own keys, and property descriptor shape.
- Accessor properties do not invoke user code; compare accessor descriptors by getter/setter identity and flags.
- Arrays compare indexed elements plus extra own properties and descriptors.
- Date, RegExp, ArrayBuffer, typed-array, Map, and Set support includes intrinsic value plus own descriptor state.
- Unsupported opaque objects with internal/private state are identity-only unless an explicit handler is added.
- Map and Set comparison is structural, order-insensitive, cyclic-safe, and globally correct under ambiguous matches.
- Cyclic structures preserve graph topology and shared-reference aliasing through a bijective left↔right mapping.
- Failed pair assumptions do not leak across candidate branches.
- `Eql.unique` and `Eql.uniqueBy` preserve input order and first occurrence.
- Inputs are mutable `T[]` per canon input-parameter policy; returned arrays are new mutable arrays, matching existing std helper style.
- Helpers are pure and deterministic: no IO, no clock, no mutation of input values, and no user-code invocation.

## Algorithmic quality gate

Before publishing the leaf, audit `m.Eql/m.Eql.ts` and `m.Eql/u.kernel.*.ts` as a real equality kernel surface, not as a convenient legacy
compatibility shim. The implementation must define and preserve the equality relation it claims:

- reflexive, symmetric, and stable for supported deterministic data graphs;
- terminating for cyclic object, array, Map, and Set graphs;
- topology-preserving for shared references and cycles;
- descriptor-aware for object/array own properties and explicit about prototype equality;
- identity-only for unsupported opaque values rather than returning false positives from empty own-key sets;
- unordered Map/Set matching with rollback/backtracking or an explicit proof that the implemented matcher cannot
  produce false positives or false negatives under supported cyclic graphs;
- structural dedupe implemented by equality, not by lossy serialization or hashing shortcuts.

Hard computer-science warning: unordered cyclic Map/Set equality approaches graph-isomorphism territory when many
candidate matches are structurally ambiguous. Do not hide that behind a greedy loop. Either implement a correct
backtracking/search strategy with rollback and tests, or narrow the supported contract before exposing the public leaf.

If any of these points are too broad for the first landing, narrow the public contract before implementation. Do not
publish a broad equality claim and rely on undocumented exceptions.

## Candidate implementation files

```txt
code/sys/std/src/m.Eql/m.Eql.ts                   # module method surface: deep, unique, uniqueBy
code/sys/std/src/m.Eql/u.kernel.ts                # internal kernel entry
code/sys/std/src/m.Eql/u.kernel.*.ts              # domain, graph, descriptor, byte, built-in, collection parts
code/sys/std/src/m.Eql/-test/-u.kernel.test.ts    # module helper/kernel contract tests
code/sys/std/src/m.Eql/mod.ts
code/sys/std/src/m.Eql/t.ts                       # public Lib shape
code/sys/std/src/m.Eql/-test/-.test.ts            # public leaf contract tests
code/sys/std/src/types.ts                         # export m.Eql/t.ts
code/sys/std/deno.json                            # add "./eql": "./src/m.Eql/mod.ts"
```

Keep implementation dependency-light:

```txt
m.Eql/m.Eql.ts
└─ imports deepEquals from ./u.kernel.ts
```

If a local `m.Eql/common.ts` is added, keep it tiny and type-only where possible. Do not route through a broad barrel
that pulls unrelated std modules into the equality leaf export. The legacy `R` facade may import the module method
directly, but must not make `m.Eql` import `R` or inherit `R` semantics.

## Candidate implementation sketch

Sketch only; the deep-equality implementation must satisfy the algorithmic quality gate above.

Module method surface:

```ts
export function deep(a: unknown, b: unknown): boolean {
  return deepEquals(a, b, { left: new WeakMap(), right: new WeakMap() });
}

export function unique<T>(values: T[]): T[] {
  const res: T[] = [];
  for (const value of values) {
    if (!res.some((existing) => deep(existing, value))) res.push(value);
  }
  return res;
}

export function uniqueBy<T>(fn: (value: T) => unknown, values: T[]): T[] {
  const res: T[] = [];
  const seen: unknown[] = [];
  for (const value of values) {
    const key = fn(value);
    if (seen.some((existing) => deep(existing, key))) continue;
    seen.push(key);
    res.push(value);
  }
  return res;
}

export const Eql: Type.Eql.Lib = Object.freeze({ deep, unique, uniqueBy });
```

Final public function names are `deep`, `unique`, and `uniqueBy`; `uniq` remains legacy `R` vocabulary only.
The module method names live in `m.Eql/m.Eql.ts`; kernel implementation detail stays under `u.kernel.*.ts`.

## Relationship to existing helpers

Keep these distinctions explicit:

```txt
m.Eql/m.Eql.ts      module source for general structural equality helpers
Eql.deep           public general deep structural equality
Eql.unique          public structural dedupe
Eql.uniqueBy        public structural key-based dedupe

Obj.eql             object namespace alias to the same deep equality primitive
R.equals            legacy alias to the same deep equality primitive
R.uniq              legacy alias to the same structural dedupe helper
R.uniqBy            legacy alias to the same structural key-dedupe helper
Arr.equal           strict index-wise array equality via Object.is
Arr.uniq            existing array dedupe helper; do not silently redefine it as structural
Obj.Path.eql        ordered object-path segment equality
Semver.Is.eql       semver-normalized version equality
```

Domain-specific equality remains valid when it has a narrower contract. It should not duplicate or fork the general
structural algorithm. If a future helper needs general structural equality, the default answer is `Eql` publicly and
`m.Eql/m.Eql.ts` internally.

## Tests

Add focused tests under the new module:

```txt
code/sys/std/src/m.Eql/-test/-.test.ts
```

Minimum public leaf coverage:

- API shape exposes `Eql.deep`, `Eql.unique`, and `Eql.uniqueBy`.
- `Eql.deep` delegates equivalent behavior to the shared deep equality primitive.
- `Eql.unique` dedupes structurally equal objects and arrays while preserving first occurrence.
- `Eql.uniqueBy` dedupes structurally equal keys while preserving first occurrence.
- Primitive edge behavior follows `Object.is` semantics.
- No mutation of input arrays.

Keep lower-level raw kernel tests in:

```txt
code/sys/std/src/m.Eql/-test/-u.kernel.test.ts
```

Minimum module helper coverage:

- `unique` preserves first occurrence for structurally equal objects and arrays.
- `uniqueBy` preserves first occurrence for structurally equal keys.
- `unique` and `uniqueBy` return new arrays and do not mutate input arrays.

Minimum algorithm hardening coverage:

- Accessor properties are compared without invoking getters.
- Descriptor differences that matter to the contract are observed.
- Arrays with extra own string/symbol properties are compared correctly.
- Unsupported opaque values such as `URL`, `Promise`, `WeakMap`, or host objects do not compare equal merely because
  their own-key sets are empty.
- Map and Set tests include cyclic and ambiguous-candidate cases that would fail under unsafe greedy matching.

Do not duplicate the full deep-equality matrix in `m.Eql/-test/-.test.ts`; keep `m.Eql` tests as public API contract
and wiring tests.

## Stage ledger

### Stage 0: harden raw equality kernel

Landed: `84d5316b7` — `fix(std): harden structural equality kernel`.

Final reality:

- supported equality algebra was defined in the kernel contract and tests;
- primitives use `Object.is` semantics;
- own property descriptors, non-enumerable keys, symbols, array holes, and accessors are covered without getter invocation;
- Date, RegExp, ArrayBuffer/views, Map, Set, cycles, and shared-reference topology are supported inside the bounded data domain;
- opaque/behavioral/internal-slot objects are identity-only rather than accidentally equal by empty shape;
- unordered Map/Set matching uses backtracking with rollback rather than unsafe greedy matching.

### Stage 1: add public Eql leaf

Landed: `09f8e7707` — `feat(std): add Eql helpers`.

Final reality:

- `@sys/std/eql` exports the `Eql` namespace;
- `src/m.Eql/m.Eql.ts` owns `deep`, `unique`, and `uniqueBy`;
- `src/m.Eql/u.kernel.ts` owns the canonical supported-domain contract;
- the internal kernel is split into inspectable `u.kernel.*.ts` parts;
- `Obj.eql` routes to `m.Eql.deep`;
- old common equality ownership was removed instead of kept as a shim.

### Stage 2: route legacy R facade through the kernel

Landed: `8481ceea1` — `refactor(std): route R equality facade through Eql kernel`.

Final reality:

```txt
legacy R.equals      → m.Eql.deep, surfaced publicly as Eql.deep
legacy R.uniq        → m.Eql.unique, surfaced publicly as Eql.unique
legacy R.uniqBy      → m.Eql.uniqueBy, surfaced publicly as Eql.uniqueBy
Obj.eql              → object-namespace alias to m.Eql.deep
Signal.cycle         → structural compare/dedupe via m.Eql.deep / m.Eql.unique
```

Downstream `R` retirement should prefer:

```txt
R.equals(a, b)       → Eql.deep(a, b) or Obj.eql(a, b) by local vocabulary
R.uniq(values)       → Eql.unique(values) when values may be objects/arrays
R.uniqBy(fn, values) → Eql.uniqueBy(fn, values)
```

Use `Arr.uniq(values)` only when primitive/identity dedupe is intended.

## Retirement readiness

This helper sequence is complete. The next work is caller migration and legacy facade deletion, not more equality-design work.

Current compatibility state:

- `code/sys/std/deno.json` still exposes `"./r": "./src/-exports/-r.ts"`.
- `code/sys/std/src/-exports/-r.ts` exports `R` from `../common/libs.R.ts`.
- `code/sys/std/src/common/libs.ts` re-exports `R` from `./libs.R.ts`.
- `code/sys/std/src/common/t.ts` still owns the legacy `RLib` type.
- `R.equals`, `R.uniq`, and `R.uniqBy` are now thin aliases to `m.Eql` methods.

Retirement preconditions:

- No downstream runtime imports of `@sys/std/r`, `R`, or `RLib` remain outside intentional compatibility tests/docs.
- General structural equality callers use `Eql.deep` or `Obj.eql`.
- Structural dedupe callers use `Eql.unique` or `Eql.uniqueBy`.
- Primitive/reference dedupe callers use `Arr.uniq`.
- Domain-specific equality remains local only when its contract is narrower than general structural equality.

Candidate retirement cleanup after preconditions pass:

- remove the `"./r"` export from `code/sys/std/deno.json`;
- remove `code/sys/std/src/-exports/-r.ts`;
- remove `code/sys/std/src/common/libs.R.ts`;
- remove the `R` re-export from `code/sys/std/src/common/libs.ts`;
- remove `RLib`, `RProp`, and `RSortBy` from `code/sys/std/src/common/t.ts` if no remaining callers need them;
- remove or rewrite `code/sys/std/src/common/-test/-libs.R.test.ts`.

Suggested retirement commit:

```txt
refactor(std): retire legacy R facade
```

## Final validation

Recorded validation for this plan:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task check
deno task test --trace-leaks ./src/m.Eql ./src/common/-test/-libs.R.test.ts ./src/m.Obj ./src/m.Signal ./src/m.Random
deno task test --trace-leaks
deno task test --trace-leaks ./src/m.Eql ./src/common/-test/-libs.R.test.ts ./src/m.Obj ./src/m.Signal ./src/m.Arr ./src/m.Semver ./src/m.Obj.Path
```

Observed final results:

- targeted Stage 2 validation: `23 passed (194 steps), 0 failed`;
- full suite: `156 passed (2110 steps), 0 failed`;
- BMIND/TMIND equality-surface scan suite: `32 passed (547 steps), 0 failed`;
- `deno task check` passed after final adapter-boundary polish.

Final review gates:

- no Ramda import or dependency path is introduced;
- `@sys/std/r` remains a temporary compatibility bridge and does not define equality semantics;
- no root `@sys/std` export was added for `Eql`;
- no local structural equality or structural-dedupe loop remains in changed public API surfaces after Stage 2;
- `Arr.equal`, `Arr.uniq`, `Obj.Path.eql`, and `Semver.Is.eql` remain valid narrower domain helpers, not competing general structural equality kernels.

## Commit shapes

Landed:

```txt
fix(std): harden structural equality kernel
feat(std): add Eql helpers
refactor(std): route R equality facade through Eql kernel
```

Plan finalization:

```txt
docs(std): finalize Eql helper plan
```

Future retirement:

```txt
refactor(std): retire legacy R facade
```
