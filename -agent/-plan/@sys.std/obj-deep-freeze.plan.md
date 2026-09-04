obj-deep-freeze.plan.md
- [x] 69a00d48f fix(types): preserve DeepReadonly tuple structure
- [x] 80ede9a0b feat(std): add typed deep-freeze primitive
- [x] 503c8c900 refactor(fs): use Obj deep freeze for admitted manifests
- [x] 67eca63e1 refactor(driver-pi): adopt Obj deep freeze in GUI reset data
- [x] 4e8fff8a4 fix(std): capture deep-freeze runtime intrinsics

## Purpose

Add one canonical `Obj.deepFreeze` primitive for deeply immutable, caller-owned plain-data graphs.
Make the runtime guarantee and the existing `t.DeepReadonly<T>` contract meet at one public
boundary, then remove the proven local implementation and the motivating nested-freeze noise.

The result should make the simple case read as one intention:

```ts
const KEYS = Obj.deepFreeze({
  BUSY: ['kind', 'index', 'path'],
  FAILED: ['kind', 'completed', 'unattempted', 'failure', 'changed'],
  FAILURE: ['name', 'operation', 'kind', 'committed'],
  ITEM: ['index', 'path', 'kind'],
  SETTLED: ['kind', 'results'],
  TARGET: ['index', 'path'],
});
```

Planning, review, and readiness do not authorize implementation or Git mutation.

## Genesis and earned admission

The original callsite is `code/sys.driver/driver-pi/-scripts/task.start.gui.reset.ts`, the `KEYS`
constant introduced by reachable commit
`23b18c40d refactor(driver-pi): consume leased owned-tree batch removal in GUI reset`. Its outer
record and every tuple had to be frozen independently because native `Object.freeze` is shallow.

Repository inspection established the shared primitive rather than a cosmetic wrapper:

- before this arc, `code/sys/std/src/m.Obj/t.ts` and `m.Obj.ts` exposed no deep-freeze operation;
- `code/sys/types/src/t/t.Readonly.ts` already owns the compile-time noun `t.DeepReadonly<T>`;
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.pinned.manifest.ts` contained the only located handwritten
  recursive implementation, `freezeJsonTree`, including cycle and deep-stack handling;
- the Driver Pi reset projection repeated nested `Object.freeze` over owned result arrays;
- other nested freezes divide into plain-data candidates, capability namespace composition,
  generated source, or graphs containing opaque runtime objects. They are not one undifferentiated
  migration.

This satisfies primitive admission: current consumers exist, `Obj` is the lowest truthful runtime
owner, the API is narrower than either workflow, owner-level proof is possible, and both originating
consumers adopted it in this arc.

## Selected public contract

Add exactly one method to `t.Obj.Lib`:

```ts
deepFreeze<const T extends t.JsonLikeU>(input: T): t.DeepReadonly<T>;
```

Contract decisions:

- the public spelling is `Obj.deepFreeze`;
- no standalone alias, `Obj.freeze`, `freezeDeep`, option bag, mode flag, or second recursive input
  type is introduced;
- `t.JsonLikeU` remains the one permissive input vocabulary for mutable or readonly JSON-like data,
  including `undefined`;
- `t.DeepReadonly<T>` remains the one output vocabulary;
- the `const` type parameter preserves literal object and tuple inference for direct literals, so
  the motivating callsite needs no nested `as const` assertions;
- `t.DeepReadonly` preserves direct tuple types and canonical open-array element surfaces; custom
  properties intersected onto array or tuple containers are not retained by that output type and
  should be modeled on a containing record when their static visibility matters;
- array projection distributes per union member; equivalent projected members are mutually
  assignable but are not promised to normalize to one exact `t.Type.Equal` identity;
- the operation mutates the supplied graph by freezing it and returns the same root identity;
- primitive roots are returned unchanged;
- the operation never clones, serializes, normalizes, sanitizes, or admits data.

A call through a pre-existing mutable alias still freezes that aliased runtime graph. The returned
surface is deeply readonly, but the helper cannot erase another variable's previously declared
mutable static type. Documentation must state this distinction without implying copy isolation.

## Supported graph

The runtime contract is deliberately narrower than arbitrary JavaScript object graphs.

Supported nodes:

- ordinary base arrays whose immediate prototype is the array prototype of their realm, including
  cross-realm base arrays;
- realm-local plain objects whose prototype is `Object.prototype` or `null`;
- already-frozen supported nodes, whose descendants are still traversed;
- shared references and cycles.

Supported leaves are exactly the primitive domain represented by `t.JsonLikeU`: string, number,
boolean, `null`, and `undefined`.

Every own string-keyed data property participates, including non-enumerable data properties. Array
`length` is ordinary descriptor data for traversal purposes. The prototype itself is not part of the
owned graph and is not frozen.

Reject before mutating an ordinary supported node with
`TypeError('Obj.deepFreeze expected primitive leaves in a data-property graph of plain objects and arrays.')`
when the reachable graph contains:

- a class instance, including an `Array` subclass, `Date`, `RegExp`, `Map`, `Set`, `WeakMap`,
  `WeakSet`, Promise, Error, typed array, ArrayBuffer, DOM/host object, or another non-plain object;
- a function;
- a bigint or symbol value;
- a symbol-keyed own property; or
- an accessor property.

Accessors are rejected rather than invoked or silently skipped: a getter can expose mutable state
that no one-time traversal can truthfully make deeply frozen. `Map` and `Set` are rejected because
freezing their wrapper object does not disable internal-slot mutation. These exclusions protect the
meaning of `t.DeepReadonly<T>` instead of presenting shallow integrity as deep immutability.

Proxies and deliberately forged prototype chains are not an admission or security boundary this
browser-safe primitive can authenticate. Document that callers must supply trusted, caller-owned
data. Do not add a server-only detector or claim atomic behavior against hostile traps or forged
prototypes. Module evaluation is the intrinsic trust anchor: the kernel must retain the runtime
authority it captures then, while realms compromised before evaluation remain outside the contract.

## Runtime algorithm

Implement `deepFreeze` in `code/sys/std/src/m.Obj/u/u.deepFreeze.ts` without recursion.

Use two synchronous phases:

1. Traverse and validate the complete reachable graph with an explicit worklist and identity set.
   Inspect own keys and property descriptors without reading properties or invoking getters. Record
   each supported node once.
2. Freeze the recorded nodes in reverse discovery order and return the original root.

Required properties:

- time is linear in reachable nodes plus own keys;
- auxiliary memory is linear in reachable nodes;
- cycles and shared references terminate and preserve identity;
- depth does not consume the JavaScript call stack;
- unsupported ordinary graphs fail validation before this invocation freezes any mutable node;
- an already-frozen parent does not hide a mutable descendant;
- repeated calls are idempotent;
- no source property is read through ordinary lookup;
- no input collection or property is rewritten, copied, or reordered.

Use canonical `Is` predicates for initial value guards and array classification. Require an
array-valued immediate prototype for base-array admission, including cross-realm base arrays, and
apply the explicit captured `Object.prototype | null` contract to non-array objects. Keep the kernel
callback-free. Capture every mutable ambient authority used by traversal, identity tracking,
freezing, and contract-error construction when the module evaluates; later ambient replacement must
not redirect execution. Avoid dynamic array prototype operations in private worklists. Proxies,
deliberately forged prototype chains, and realms already compromised when the module evaluates
remain outside this primitive's trust boundary.

The implementation may use one contained final assertion from `T` to `t.DeepReadonly<T>` after every
recorded node has frozen; TypeScript cannot infer a recursive runtime effect. No consumer assertion,
node-shape assertion, or second type owner is permitted.

## `fix(types): preserve DeepReadonly tuple structure`

### Target surface

- `code/sys/types/src/t/t.Readonly.ts`;
- `code/sys/types/src/t/-test/-t.Readonly.test.ts`.

### Required change

Replace the mutable-array-only `Array<infer U> → ReadonlyArray<...>` collapse with structure-aware
array handling: map tuple-shaped arrays homomorphically, route open mutable and readonly arrays
through lazy `ReadonlyArray<DeepReadonly<Element>>` recursion, and map other non-primitives
homomorphically. Detect tuple metadata from its inferred sequence shape—empty, required-tail, or
declared numeric slots—not from whole-type assignability or the accepted element-value set. This
must retain optional, fixed, homogeneous variadic, and leading- or trailing-rest tuples.

Open arrays keep the standard callable `ReadonlyArray` surface and deeply readonly elements. Custom
properties intersected onto array or tuple containers are deliberately projected away: TypeScript
cannot generically preserve every decorated tuple identity and numeric-literal refinement while also
retaining exact plain arrays, callable readonly methods, absent mutators, and lazy recursive
instantiation. Model metadata on a containing record when it must survive in the static output.
Runtime traversal may freeze more own data properties than this canonical sequence projection
exposes; that asymmetry is safe and must not be described as static preservation. Projection remains
distributive over unions; equivalent projected union members must be mutually assignable but need
not normalize to one exact `t.Type.Equal` identity. Replace the old element-only array interface and
duplicated object mapping; retain only private structural helpers that each own one real branch,
eliminate duplication, or encode the tuple boundary.

The lazy open-array branch is required for recursive aliases such as `t.Json`; a direct homomorphic
mapping over every array exceeds TypeScript's instantiation depth. Do not introduce
`ObjDeepReadonly`, copy `DeepReadonly`, or broaden this item into Date, Map, Set, function, Promise,
or collection-policy design. Those values are outside `Obj.deepFreeze`'s selected input domain.

### Type proof

Prove exact types for:

- mutable arrays → readonly arrays with deeply readonly elements;
- readonly arrays remaining readonly;
- mutable and readonly tuples retaining positional and literal information;
- optional tuple elements, empty tuples, homogeneous variadic tuples, and leading and trailing tuple
  rest elements;
- each decorated array and tuple intersection projecting explicitly to a canonical readonly array
  with deeply readonly elements, including string, symbol, numeric-literal, length, and method
  decorations that are not retained;
- unions of equivalent decorated projections remaining mutually assignable to their canonical array
  without requiring whole-union exact identity;
- nested records and arrays;
- every recursive JSON-family alias in `t.Json.ts`, including `t.Json`, `t.JsonLikeU`, and `t.CBOR`,
  instantiating without `TS2589`, rejecting both `never` and `any` false greens, and exposing
  readonly recursive object and array branches;
- a recursive tuple/open-array alias preserving its exact readonly shape;
- existing `t.DeepReadonly<t.DistPkg>` consumers remaining assignable, with explicit non-`never` and
  nested readonly-array proof.

Use `@ts-expect-error` only for actual forbidden writes and canonical type equality helpers for
positive shape proof. Do not use assertions to manufacture the expected type, and do not rely on an
`Extends<never, Projection>` check that can pass vacuously.

## `feat(std): add typed deep-freeze primitive`

### Target surface

- `code/sys/std/src/m.Obj/u/u.deepFreeze.ts`;
- `code/sys/std/src/m.Obj/t.ts`;
- `code/sys/std/src/m.Obj/m.Obj.ts`;
- `code/sys/std/src/m.Obj/-test/-u.deepFreeze.test.ts`;
- `code/sys/std/src/m.Obj/-test/-t.test.ts`;
- existing Obj API and namespace-freeze tests.

`code/sys/std/src/m.Obj/mod.ts`, package exports, and dependency files require no new surface: the
method composes through the existing frozen `Obj` namespace and `@sys/std/obj` export.

### Runtime proof

Prove:

- primitive roots preserve their exact value;
- ordinary local and cross-realm base arrays are accepted, while a statically admissible `Array`
  subclass is rejected before it or its containing ordinary graph is frozen;
- a direct literal returns the same root and freezes every nested object and array;
- mutation attempts fail for root fields, nested fields, arrays, and tuple positions;
- shared nodes are frozen once and retain shared identity;
- object and array self-cycles terminate;
- a graph at least 20,000 nodes deep completes without recursive stack failure;
- null-prototype records and sparse arrays retain shape and become deeply frozen;
- already-frozen roots with mutable descendants become deeply frozen;
- repeated calls return the same root and remain stable;
- non-enumerable data-property descendants are traversed;
- accessors are rejected without invoking their getter or setter;
- symbol keys and every unsupported leaf/node family are rejected with the exact contract error;
- ordinary invalid graphs are not partially frozen when validation fails;
- the exported `Obj` namespace remains frozen and its module identity remains canonical.

### Type proof

Prove:

- direct object/tuple literals retain exact literals without `as const`;
- mutable variables return `t.DeepReadonly<T>`;
- `t.JsonLikeU` and `t.DistPkg` inputs are accepted without casts;
- readonly inputs remain compatible;
- Date, Map, Set, function, bigint, symbol, and typed-array inputs fail at compile time;
- `Obj.deepFreeze` has exactly the signature declared by `t.Obj.Lib`.

Runtime hostile-input tests may cross the static boundary only at the test seam. Keep any assertion
there narrow and explanatory; production consumers must not cast into eligibility.

## `refactor(fs): use Obj deep freeze for admitted manifests`

### Target surface

- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.pinned.manifest.ts`;
- `code/sys/fs/src/m.Pkg.Dist/-test/-pinned.verify.manifest.test.ts`;
- existing Pkg Dist verification type and integration tests.

### Required change

Replace `freezeJsonTree(dist)` with `Obj.deepFreeze(dist)` and delete the private helper completely.
`Obj` is already present through the local common lane. Add no adapter, wrapper, compatibility
alias, or cast to `t.JsonLikeU`.

Preserve manifest admission, failure classification, authenticated extension retention, object
identity, canonical part ordering, and the `t.DeepReadonly<t.DistPkg>` output. Keep the existing
deep extension integration proof: it establishes that JSON parsing, manifest admission, and the
canonical freezer compose without a stack failure.

If `t.DistPkg` does not satisfy the selected input contract under owner-level type proof, stop
rather than assert. Correct the lowest truthful existing type relationship or refine the public
contract; do not create a consumer-local escape hatch.

## `refactor(driver-pi): adopt Obj deep freeze in GUI reset data`

### Target surface

- `code/sys.driver/driver-pi/-scripts/common.ts`;
- `code/sys.driver/driver-pi/-scripts/task.start.gui.reset.ts`;
- `code/sys.driver/driver-pi/-scripts/u.vite.paths.ts`;
- existing GUI reset unit/process tests and preview-build tests.

### Required change

Expose `Obj` once through the script-local common lane, then use `Obj.deepFreeze` only for owned
nested plain-data graphs:

- `KEYS`, removing every nested `Object.freeze` and every now-unnecessary tuple `as const`;
- the projected settled result array in `projectGuiReleaseStoreReset`;
- the absent result array in `absentSettlements`;
- the nested path snapshot returned by `vitePaths`.

Retain native `Object.freeze` for flat primitive arrays and genuinely shallow records where
recursive intent would add no signal. Do not alter the hardened input-admission predicates, Rooted
failure objects, weak ownership maps, error causes, process authority, or reset behavior.

Prove the existing exact-key admission still accepts canonical Rooted settlements and rejects
accessors, proxies, extra keys, malformed failure shapes, and unfrozen inputs. Prove projected
arrays and every projected item remain frozen, and preview paths retain exact values and readonly
behavior.

## `fix(std): capture deep-freeze runtime intrinsics`

### Target surface

- `code/sys/std/src/m.Obj/u/u.deepFreeze.ts` and `m.Obj/t.ts`;
- `code/sys/std/src/m.Obj/-test/-u.deepFreeze.test.ts`;
- one isolated worker fixture owned by that test for safe ambient replacement;
- `code/sys/std/src/m.Is/m.Is.ts` and `m.Is/u.number.ts` only where the canonical array and number
  predicates must retain their own intrinsic authority.

### Required change

Capture at module evaluation every mutable ambient authority used by the deep-freeze kernel,
including freezing, prototype inspection, own-key and descriptor traversal, array-brand checks,
identity-set construction and methods, invocation, local prototype identity, and contract-error
construction. Eliminate dynamic array-prototype operations from private worklists. Do not weaken the
canonical `Is` requirement, duplicate a public helper, or expand the supported graph.

This hardening promises determinism against replacement after successful module evaluation only. It
does not authenticate proxies, protect a realm compromised before evaluation, or make arbitrary
same-realm code trustworthy.

### Runtime proof

Run the proof in an isolated worker so poisoned globals cannot escape into the test runner. Import
`Obj` first, then replace every captured ambient property and relevant collection/array prototype
method with a throwing or counting poison. Demonstrate that a valid nested graph containing an array
and `NaN` still freezes completely, and that an invalid accessor graph still fails with the original
`TypeError`, invokes no getter, and remains wholly unfrozen. Restore every replaced descriptor
before reporting and prove no poison was called.

## Scan inventory and migration boundary

The source scan excluded generated bundles, dependency trees, and temporary output. It found one
actual recursive implementation (`freezeJsonTree`) and a wider set of nested shallow-freeze
constructions. Only semantic matches belong in this arc.

### Adopt now

- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.pinned.manifest.ts` — delete the duplicate recursive
  algorithm;
- `code/sys.driver/driver-pi/-scripts/task.start.gui.reset.ts` — original `KEYS` callsite plus owned
  nested result arrays;
- `code/sys.driver/driver-pi/-scripts/u.vite.paths.ts` — owned nested string-only path snapshot.

### Preserve as explicit non-candidates

- nested `Lib`, `Is`, `Path`, `Lens`, codec, and other namespace objects under `code/sys/std/src`
  and sibling packages contain functions or semantic sub-surfaces; their explicit shallow freezes
  remain architectural composition, not plain-data deep freezing;
- `code/sys/immutable/src/m.core/m.Immutable/m.Symbols.ts` contains symbol leaves and is
  intentionally outside the selected data vocabulary;
- Rooted settlements and lifecycle/error graphs containing Errors, signals, promises, handles,
  functions, typed arrays, or ownership objects remain explicitly assembled at their owning
  boundaries;
- flat arrays and one-level result records retain native `Object.freeze` because deep traversal
  would misstate their complexity.

### Recorded follow-up candidates, not arc promises

- `code/sys.tools/src/cli.deploy/u.stage.ts` deeply freezes stage plans, but `snapshotMappings` also
  serves mutable execution preparation; migrate only after that dual ownership is reviewed;
- `code/sys/http/src/http.server/m.HttpPull/u.resource/u.snapshot.ts` builds nested resource
  records, but its failure-record and origin ownership require an HTTP-local pass;
- `code/sys/server/src/m.server.dist/u.server.browser/u.policy.ts` builds nested applied-policy
  evidence, but some children are already owned snapshots whose aliasing contract must be preserved;
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.browser.ts` and generated release
  evidence are plain data, but importing the aggregate `Obj` runtime into browser/generated surfaces
  requires measured bundle and generator ownership evidence first.

Do not convert these opportunistically. A later migration must prove caller ownership, supported
leaves, bundle impact where relevant, and existing behavioral tests. The presence of nested
`Object.freeze` alone is not sufficient.

## Rejected designs

- **Arbitrary-object deep freeze:** rejected because Date, Map, Set, typed arrays, functions,
  classes, host objects, and internal slots cannot share one truthful immutability promise.
- **Recursive descent:** rejected because input depth must not become call-stack authority.
- **Getter traversal:** rejected because observation would execute caller code and still could not
  freeze future getter results.
- **Public ambient-intrinsic registry:** rejected because kernel ownership, capture timing, bundle
  boundaries, and required authority differ; `Obj.deepFreeze` captures its exact dependencies
  locally instead.
- **Freeze while discovering:** rejected because a late unsupported node would leave an ordinary
  graph partially mutated.
- **Clone then freeze:** rejected because identity preservation and alias freezing are the selected
  semantics; cloning is already a separate `Obj.clone` concept.
- **JSON round-trip:** rejected because it loses identity, sharing, cycles, `undefined`,
  descriptors, and type fidelity.
- **Obj-local readonly type:** rejected because `t.DeepReadonly<T>` already owns the output concept.
- **Standalone function alias:** rejected because it would create a second public spelling without a
  distinct semantic boundary.
- **Repository-wide replacement:** rejected because shallow namespace integrity, opaque ownership,
  generated source, and plain-data deep immutability are different contracts.
- **Configurable policies:** rejected because no current consumer earns depth limits, skip lists,
  custom node handlers, best-effort mode, or mutation callbacks.

## Invariants

- One runtime noun (`Obj.deepFreeze`) and one compile-time noun (`t.DeepReadonly<T>`) describe the
  same supported deep-readonly promise.
- Inputs are permissive only within the selected plain-data vocabulary; outputs are deeply readonly.
- The function either validates an ordinary graph before mutation or rejects it; it never silently
  skips an unsupported reachable value.
- No getter, setter, iterator, `toJSON`, constructor, collection method, or user callback executes.
- Runtime identity, sharing, cycles, property order, sparse-array shape, and primitive values are
  preserved.
- Stack usage is independent of graph depth.
- Public types flow through the existing type plane and local common lanes.
- No `any`, broad production assertion, duplicate recursive type, duplicate helper, compatibility
  alias, or speculative option enters the implementation.
- Existing shallow-freeze and capability-composition semantics remain unchanged outside named
  callsites.

## Verification and landing

For `fix(types): preserve DeepReadonly tuple structure`, from `code/sys/types`:

1. run `deno task test --trace-leaks ./src/t/-test/-t.Readonly.test.ts`;
2. run `deno task check`;
3. inspect the exact type-surface diff and land only the canonical type correction and proof.

For `feat(std): add typed deep-freeze primitive`, from `code/sys/std`:

1. demonstrate the focused tests fail for absence of `Obj.deepFreeze` before implementation;
2. run `deno task test --trace-leaks ./src/m.Obj`;
3. run `deno task check`;
4. confirm API identity and namespace-freeze tests remain green;
5. land only the Obj contract, implementation, documentation, and owner proof.

For `refactor(fs): use Obj deep freeze for admitted manifests`, from `code/sys/fs`:

1. run `deno task test:unit --trace-leaks ./src/m.Pkg.Dist/-test/-pinned.verify.manifest.test.ts`;
2. run `deno task check`;
3. run `deno task test` before landing;
4. confirm `freezeJsonTree` no longer exists and no replacement adapter was introduced.

For `refactor(driver-pi): adopt Obj deep freeze in GUI reset data`, from
`code/sys.driver/driver-pi`:

1. run `deno task test:unit`;
2. run `deno task test:reset:process`;
3. run `deno task test:preview` for `vitePaths` integration;
4. run `deno task check`;
5. inspect bundle-sensitive source to confirm this item changed scripts only.

For `fix(std): capture deep-freeze runtime intrinsics`, from `code/sys/std`:

1. run the focused Obj tests, including the isolated post-load ambient-replacement proof;
2. run `deno task test --trace-leaks ./src/m.Obj`;
3. run `deno task check`;
4. run full `deno task test` before landing.

For every item:

1. run the canonical formatter over only attributable paths and reopen the plan opening block if the
   formatter touches it;
2. run `git diff --check` and inspect staged and unstaged target-attributed diffs separately;
3. preserve unrelated worktree state;
4. land one semantic commit only when explicitly authorized, then reconcile its reachable short hash
   in the opening arc.

After the final item, run full `deno task test` and `deno task check` in `code/sys/types`,
`code/sys/std`, `code/sys/fs`, and `code/sys.driver/driver-pi`. Perform a final S-tier residue scan
for raw recursive freeze logic, redundant assertions, accidental aliases, unsupported-node claims,
getter reads, recursion, broad callsite churn, and stale documentation.

## Review acceptance

A MAX review should reject the plan or implementation if any of these questions lacks direct proof:

1. Does the type signature preserve literals, every direct tuple form, canonical recursive readonly
   array surfaces, all JSON-family instantiations, and named `t.DistPkg` inputs without assertions,
   while projecting each decorated array-container union member to its documented surface without
   promising whole-union exact normalization?
2. Can every runtime-supported value be represented by the input type, and does every rejected
   object family avoid a false deep-readonly promise?
3. Can cycles, sharing, already-frozen parents, sparse arrays, and 20,000-level depth complete
   without recursion or property execution?
4. Does unsupported ordinary input fail before mutation, with no getter invocation?
5. Does the FS adoption delete rather than wrap `freezeJsonTree` while preserving manifest failure
   and proof behavior?
6. Does the Driver Pi adoption remove the motivating nested noise without changing hostile-input
   admission or pulling `Obj` into browser runtime code?
7. Were namespace freezes, symbol registries, opaque runtime graphs, generated files, and flat
   values left alone for stated semantic reasons rather than migrated by textual resemblance?
8. Is there exactly one public method, one implementation, one readonly type owner, and no
   speculative policy surface?
9. After successful module evaluation, can later replacement of every mutable ambient authority used
   by the kernel redirect validation, identity tracking, freezing, or contract errors?

## Non-goals

- deep cloning or copy-on-freeze;
- arbitrary JavaScript object or prototype freezing;
- transitive prototype freezing;
- Map/Set collection immutability;
- class, function, Error, Date, RegExp, Promise, typed-array, ArrayBuffer, DOM, host-object, or
  proxy hardening;
- data validation, sanitization, trust admission, serialization, hashing, or schema enforcement;
- changing `Object.freeze` usage where only shallow namespace or record integrity is intended;
- changing `t.DeepReadonly<T>` beyond the direct tuple and canonical open-array fidelity required by
  this API;
- preserving custom properties intersected onto array or tuple containers; model that metadata on a
  containing object instead;
- browser bundle expansion or a new leaf export without measured consumer evidence;
- generated evidence rewrites;
- broad workspace cleanup or unrelated `@sys/types`, `@sys/std`, FS, Driver Pi, Tools, HTTP, Server,
  or Immutable refactors.
