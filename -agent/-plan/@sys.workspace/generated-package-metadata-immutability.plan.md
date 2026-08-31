generated-package-metadata-immutability.plan.md
- [x] 90b6649 fix(workspace)!: freeze generated package metadata
- [x] 052f293e4 refactor(driver-pi): consume immutable generated package metadata

## Status

Both implementation items are landed. This is the final truthful completion snapshot, prepared for
an independently authorized `plan(retire)` lifecycle commit; this file does not authorize that Git
mutation.

This plan is owned by `@sys/workspace` because `Workspace.Pkg.sync` is the canonical metadata
generator. `@sys/tmpl` carries the future-package seed, and Driver Pi is the motivating downstream
consumer. Do not create another updater, package, helper, task, or metadata abstraction.

## Purpose

Make every canonical generated `src/pkg.ts` export an immutable value at creation, then remove the
one redundant Driver Pi defensive copy that exposed why the invariant belongs at the producer.

The intended flow is:

```text
deno.json name/version
→ Workspace.Pkg canonical renderer
→ exact frozen generated pkg value
→ package consumers and dependency callbacks
```

The generated value is package identity, not mutable application state. A consumer that needs the
complete package identity should not have to repeatedly copy and freeze it merely because the
producer exported a mutable object.

## Maximum-review conclusion

The originating Driver Pi call site is sound evidence for this change:

```ts
/** Copy generated metadata into finite immutable authority before dependency callbacks run. */
const EXPECTED_PKG = Object.freeze({ name: pkg.name, version: pkg.version });
```

That line currently performs two jobs:

1. project the imported value to the finite `{ name, version }` identity shape; and
2. stop a dependency callback from changing that identity between build and GUI admission.

The earlier blanket claim that Driver Pi must retain this copy after generated metadata becomes
immutable was too conservative. At this specific package-local boundary, the canonical generated
`pkg` already has exactly the complete two-field identity shape. Once its producer freezes that
exact shape, copying it again adds no authority reduction and no temporal protection.

The correction is deliberately narrow:

- Driver Pi's package-local preview path may consume the generated frozen `pkg` directly.
- Driver Pi's generic GUI authority ingress must continue validating and synchronously snapshotting
  unknown caller evidence. That ingress accepts arbitrary objects, accessors, proxies, extra keys,
  and mutable values; generated package metadata does not make those inputs trusted.
- Generated release-evidence leaves must retain their own frozen embedded package tuple. They are a
  separate checked-in authority source and do not import the package metadata module at runtime.
- Test fixtures that model mutable or hostile external package evidence remain mutable when that is
  the behavior under test.

The architectural distinction is:

```text
canonical generated value, exact full shape  → reuse directly
unknown or broader boundary input             → admit, project, copy, freeze
```

This puts the DRY invariant at the highest truthful owner without weakening finite-authority
projection where projection is actually required.

## Existing authority and generation chain

The live repository already has the required infrastructure:

```text
-scripts/task.prep.ts
→ syncPackageMetadata(...)
→ Workspace.Pkg.sync(...)
→ code/sys/workspace/src/m.pkg/u.render.ts
→ existing canonical <package>/src/pkg.ts targets
```

Current ownership:

- `code/sys/workspace/src/m.pkg/u.render.ts` renders canonical package metadata bytes.
- `code/sys/workspace/src/m.pkg/u.sync.ts` reads each package `deno.json` and writes changed
  targets.
- `code/sys/workspace/src/m.pkg/u.targets.ts` deliberately recognizes only existing `src/pkg.ts`
  targets.
- `-scripts/task.prep.ts` discovers package manifests beneath `code/**` and `deploy/**`,
  synchronizes metadata before and after submodule prep, and explicitly prepares `@sys/tmpl`.
- `code/-tmpl/-templates/tmpl.pkg/src/pkg.ts` seeds new packages before their first repo prep.
- `code/-tmpl/src/m.tmpl/-bundle.json` embeds that seed for the public template runtime.
- `code/-tmpl/-templates/tmpl.repo/-scripts/task.prep.ts` already delegates future repository
  package synchronization to `Workspace.Pkg.sync`.

Do not duplicate or redirect this chain.

## Generated metadata contract

The canonical generated export will have this semantic form:

```ts
import type { Pkg } from '@sys/types';

export const pkg: Readonly<Pkg> = Object.freeze({
  name: '@sys/example',
  version: '0.0.0',
});
```

Required properties:

- The object is frozen before its reference is exported.
- Its only own keys are `name` and `version`.
- Both values are primitive strings sourced from the package `deno.json` exactly as today.
- The public inferred/declared surface is `Readonly<Pkg>` so compile-time and runtime intent agree.
- Enumeration order, JSON serialization, destructuring, spreading, re-exporting, and
  module-singleton identity remain ordinary JavaScript behavior.
- Existing-property writes, additions, deletions, and descriptor reconfiguration are refused by the
  frozen object.

`Object.freeze` is shallow. That is sufficient and complete for the present exact shape because both
fields are primitive strings. Do not add recursive freezing or describe arbitrary `Pkg` values as
deeply immutable.

Use the intrinsic `Object.freeze` directly. A runtime helper import would add a dependency to every
package metadata leaf and would create an invalid self-dependency problem for foundational packages
such as `@sys/std`. No helper earns its cost here.

## Type boundary

Keep `Pkg` itself unchanged in `code/sys/types/src/t/t.Pkg.ts`.

The general `Pkg` type is used for parsed values, fixtures, Dist data, and helper return values that
are not all frozen at runtime. Making its properties globally readonly without freezing every
constructor would overclaim the repository-wide contract and force an unrelated migration.

Only the canonical generated export promises `Readonly<Pkg>`. Preserve that readonly fact through
the private Driver Pi preview dependency seam that receives this exact generated value. Do not fan
out a repository-wide readonly-type migration or change Driver Vite's public package-input contract.

## Threat and compatibility model

This change protects against ordinary consumers and dependency callbacks mutating the shared package
metadata reference after module evaluation. It does not claim to:

- authenticate JavaScript primordials against hostile replacement before the module evaluates;
- harden an entire realm or provide SES-style guarantees;
- keep structured clones, spreads, JSON round-trips, or intentionally constructed copies frozen;
- make arbitrary `Pkg` objects immutable;
- replace boundary admission, exact-shape validation, or authority snapshots for unknown input.

The change is intentionally compatibility-significant:

- property descriptors become non-writable and non-configurable;
- the object becomes non-extensible;
- direct mutation that previously succeeded will now fail or throw under strict assignment;
- the generated export becomes readonly to TypeScript consumers.

No intentional mutation of an imported canonical generated `pkg` was found in the current `code/`
and `deploy/` consumers. The observed `pkg.name = ...` cases mutate local test objects to exercise
snapshot behavior, not generated package exports. External consumers are unknowable, so the first
commit retains the truthful breaking marker `!`.

Reads, serialization, formatting, equality of field values, re-exports, and reference identity are
unchanged.

## `fix(workspace)!: freeze generated package metadata`

### Behavior-first proof

Add the narrowest red tests before changing generated output:

- In `code/sys/workspace/src/m.pkg/-.test.ts`, import the package's actual generated `src/pkg.ts`
  value and prove:
  - `Object.isFrozen(pkg)` is `true`;
  - `Reflect.set` cannot replace `name`;
  - `Reflect.set` cannot add an extra property;
  - the original name/version remain unchanged;
  - the exact own-key set remains `name`, `version`;
  - the exported type is `Readonly<Pkg>`.
- Keep the existing sync tests as exact renderer/write/idempotence proof. They must still show that
  matching output is unchanged and stale output is rewritten from `deno.json`.
- In `code/-tmpl/src/-tests/-pkg.deno.test.ts`, import the canonical package-template seed and prove
  the same runtime frozen-value contract. Keep the existing scaffold materialization and package
  execution proof.

The runtime tests must fail against the current mutable generated value and template seed before the
renderer changes. Source matching alone is not sufficient evidence.

### Canonical implementation

- Change only the generated export form in `code/sys/workspace/src/m.pkg/u.render.ts`.
- Align `code/-tmpl/-templates/tmpl.pkg/src/pkg.ts` with the same frozen readonly form so a fresh
  package is correct before its first prep.
- Preserve the generated banner, package identity values, target discovery, skip behavior, logging,
  write semantics, and source globs.
- Do not change `Workspace.Pkg.sync`, `resolveExistingTargets`, root prep orchestration, or template
  repo prep delegation unless an executable proof exposes a real incompatibility.

### Regeneration

Run the existing prep authority; do not hand-edit generated package outputs.

Expected attributable output:

- every currently discovered existing canonical `code/**/src/pkg.ts` and `deploy/**/src/pkg.ts`
  target adopts the same frozen readonly export form;
- `code/-tmpl/src/m.tmpl/-bundle.json` embeds the updated package seed;
- names and versions remain byte-for-byte equal to their corresponding `deno.json` values;
- no package is created, removed, renamed, or version-bumped by this item;
- no Driver Pi Dist, GUI release-evidence leaf, lock, import map, workflow, or unrelated template
  surface changes merely because metadata is frozen.

Run prep a second time and require no additional generated delta. If prep exposes unrelated current
workspace drift, stop and isolate it rather than absorbing it into this item.

## `refactor(driver-pi): consume immutable generated package metadata`

Land only after the generator commit and only from an attributable Driver Pi baseline that does not
overwrite the active `start-ui-release-evidence.plan.md` worktree.

In `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/u.runtime.ts`:

- remove the redundant `EXPECTED_PKG = Object.freeze({ name: pkg.name, version: pkg.version })`
  snapshot;
- derive the temporary owner from `pkg.name`;
- pass the canonical generated `pkg` directly as the Vite build package identity;
- pass the same canonical generated `pkg` directly as development-source `expectedPkg`;
- keep the build-input object, development-source object, GUI input, paths, dependencies, and
  cleanup state frozen exactly where their separate aggregate contracts require it.

In the private preview dependency types, retain the generated value's compile-time contract as
`Readonly<t.Pkg>`. If the settled baseline still spells that field as mutable `t.Pkg`, narrow only
that private field. Do not widen this item into Driver Vite's public `Build.Args` or other package
inputs.

Update the focused preview test so the existing hostile build callback remains the decisive proof:

```text
hostile build callback mutation attempt
→ generated pkg refuses mutation
→ GUI receives the original @sys/driver-pi name/version
```

The test should prove refusal and stable values, not merely inspect source text. Do not require a
new copy or assert copy identity as a public contract.

Preserve these lower and separate boundaries unchanged:

- `u.start/u.authority.ts` continues snapshotting unknown GUI evidence;
- `u.start/u.identity.ts` continues exact own-data-shape admission and package snapshotting;
- `u/u.start.gui.service.evidence.ts` remains independently generated, embedded, and frozen;
- release and development evidence types remain `Readonly<t.Pkg>`;
- Vite child serialization, build result admission, GUI lifecycle, cleanup, permissions, and runtime
  graph boundaries remain unchanged.

Do not search-and-replace other package snapshots. Each remaining copy must be judged by its own
input provenance and authority boundary.

## Validation

Run commands from `/Users/phil/code/org.sys/sys` unless a command changes directory explicitly.

### Focused red/green loop

```text
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno test -P=test ./src/m.pkg/-.test.ts

cd /Users/phil/code/org.sys/sys/code/-tmpl
deno test -P=test ./src/-tests/-pkg.deno.test.ts ./src/m.tmpl/-test/-u.makeBundle.test.ts
```

After the Workspace generator and template seed are green:

```text
cd /Users/phil/code/org.sys/sys
deno task prep
deno task prep
```

After the Driver Pi consumer item:

```text
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi
deno task test:preview
deno task check
deno task dry
```

### Owner-package proof

```text
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task test
deno task check
deno task dry

cd /Users/phil/code/org.sys/sys/code/-tmpl
deno task test
deno task check
deno task dry
```

### Workspace capstone

Run only after focused proofs are green and the generated diff is attributable:

```text
cd /Users/phil/code/org.sys/sys
deno fmt --check
deno task lint
deno task check
deno task dry
deno task test
git diff --check
```

Inspect the final diff and require:

- one canonical renderer change;
- one template-seed change and its generated bundle update;
- mechanical generated `src/pkg.ts` changes with unchanged identities;
- focused behavior tests;
- the separately attributable Driver Pi consumer simplification;
- no unrelated generated drift or active-thread overwrite.

A passing source check without runtime mutation proof is insufficient. A passing focused test
without publication dry-run and generated-diff review is also insufficient because every publishable
package metadata module changes bytes.

## Acceptance

- Every current canonical generated package metadata export is frozen at module creation.
- Fresh package scaffolds begin with the same frozen contract before prep.
- Generated exports expose `Readonly<Pkg>` while the general `Pkg` type remains unchanged.
- Existing names, versions, keys, serialization, and read behavior remain unchanged.
- Mutation of an existing field and extension with a new field are refused.
- Canonical prep is idempotent and remains the sole regeneration path.
- Driver Pi's preview path no longer performs its redundant package-local copy/freeze.
- A hostile preview build callback cannot change the package identity later admitted by the GUI.
- Generic Driver Pi authority admission still copies and freezes unknown caller evidence.
- No new dependency, helper, module, task, package, deep-freeze utility, or ambient authority is
  added.
- Focused package checks, tests, dry publications, and generated-diff checks passed. Repository-wide
  formatting and lint retain unrelated pre-existing failures outside this plan's implementation scope.

## Non-goals

- Do not make all `Pkg` instances globally immutable.
- Do not change `Pkg.fromJson`, `Pkg.unknown`, Dist package parsing, or fixture construction.
- Do not redesign package metadata validation or escaping.
- Do not add recursive freezing, immutable collections, schema libraries, or a value-object
  framework.
- Do not rewrite every `{ name, version }` snapshot in the repository.
- Do not remove snapshots at unknown-input, publication-evidence, or security admission boundaries.
- Do not rebuild or rebind Driver Pi GUI Dist evidence.
- Do not bump or publish packages as part of implementation.
- Do not update external repositories; they adopt the contract through a future published
  `@sys/workspace` version plus their normal prep, while future packages receive the aligned
  `@sys/tmpl` seed.
- Do not fold unrelated prep drift, active Driver Pi navigation work, or release-policy changes into
  either commit.

## Stop conditions

Stop and revisit the design if any implementation requires:

- a runtime helper import in generated `pkg.ts`;
- changing the general `Pkg` type or every `Pkg` constructor;
- weakening Driver Pi's unknown-input snapshots;
- adding a second metadata generator or prep task;
- changing package names, versions, publication selection, or release evidence;
- accepting unrelated prep output to make the tree appear clean;
- overwriting staged, unstaged, or untracked work from another active thread.
