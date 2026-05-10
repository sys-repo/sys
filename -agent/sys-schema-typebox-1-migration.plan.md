# Plan: migrate @sys/schema to typebox@1.x

## Status

Completed. The main migration landed in commit:

```txt
d79de9a9bb75535f146b69077143dc10df84b773
```

That commit moved `@sys/schema` to the bare `typebox@1.1.38` line, kept `@sys/schema` as the
workspace schema authority, and landed the greenfield Type/Value contract wording.

## Context

The driver-pi sandbox remove extension introduced an interop-only dependency on:

```yaml
- import: npm:typebox@1.1.37
```

Reason: Pi's extension tool ABI expects schemas and static types from the bare `typebox` package:

```ts
import { Type } from 'typebox';
```

Before this migration, `@sys/schema` internals were built around:

```yaml
- import: npm:@sinclair/typebox@0.34.49
```

Both packages are by `sinclairzx81` and both describe themselves as JSON Schema type builders with
static TypeScript resolution. The bare `typebox` package is the newer package line and is not
type-identical to `@sinclair/typebox`.

## Principle

All @sys schema/config/YAML shaping must continue through canonical `@sys/schema` surfaces.

Direct `typebox` usage in driver-pi is allowed only for Pi extension ABI interop, not as a new
general schema authority.

## Greenfield API truth: TypeBox under the Sys name

`@sys/schema` is the Sys import/name authority for TypeBox. It is not a competing schema abstraction
and should not invent a second schema theory.

The greenfield stance is deliberately minimal:

- `Schema.Type` / `Type` is the TypeBox type-builder surface under the `@sys/schema` package name.
- `Schema.Value` / `Value` is the TypeBox value-runtime surface under the `@sys/schema` package
  name.
- Runtime schemas are the source of truth; TypeScript types are projected from those runtime
  schemas.
- JSON Schema validation evidence is preserved as runtime diagnostic truth.
- Downstream packages should depend on `@sys/schema`, not on direct TypeBox package identity.

Pure pass-through is the default. Any divergence from upstream TypeBox must be explicit, minimal,
tested, and justified as existing `@sys/schema` public behavior rather than as a new abstraction
layer.

Current allowed deltas:

- `Type.Recursive`: preserved because `@sys/schema` already exposed that constructor. Internally it
  maps to TypeBox 1.x `Cyclic` while keeping stable named recursive-schema identity.
- `Value.Parse`: materializes canonical runtime values by cloning, cleaning, applying defaults,
  converting, then asserting. This is the `@sys/schema` value-materialization contract for
  config/schema use.
- `Value.Errors` / `AssertError`: returns Sys-normalized, JSON-pointer-addressed diagnostics with
  evidence (`path`, message, schema, value) for YAML/config/editor UX.

These are not “legacy hacks.” They are the smallest package-boundary contracts required to keep
`@sys/schema` useful as the canonical schema language for the workspace while letting TypeBox remain
the engine.

## Pre-commit hardening plan

Before the first commit of this migration, remove migration wording and make the tests/docs describe
the greenfield contract. This hardening has been applied to the core Type/Value contract tests and
TypeBox boundary comments:

1. Rename tests from TypeBox-version compatibility language to `@sys/schema` Type/Value contract
   language.
2. Keep every behavioral signal currently proven by tests:
   - parse materializes canonical values,
   - diagnostics are JSON-pointer addressed,
   - diagnostic messages are stable enough for consumers,
   - diagnostic evidence includes failing schema/value where exposed,
   - recursive schemas keep stable public identity,
   - recursive validation preserves nested error paths.
3. Do not make `First()` spiritually central; treat it as an array-list affordance if retained.
4. Keep direct TypeBox imports confined to `code/sys/schema`, except the approved driver-pi Pi
   extension ABI interop template.
5. Keep `Typebox.*` as type namespace only; avoid ugly root-level `TypeBoxTypeLib`-style names.
6. Run the package gate and workspace dry publish after any naming/semantic hardening.

## Decision

Yes. `@sys/schema` migrated from `@sinclair/typebox@0.34.x` to bare `typebox@1.1.38`.

This was not a new schema abstraction. The intended design is TypeBox under the `@sys/schema` name,
with the smallest Sys boundary needed for canonical value materialization, stable diagnostics, and
named recursive schemas.

## Evergreen notes

- Treat TypeBox as the implementation engine and `@sys/schema` as the import/name authority.
- Prefer pass-through over wrapper invention.
- Keep any Sys behavior at the package boundary explicit, documented, and tested as public contract.
- Keep schema/config/YAML shaping through `@sys/schema`; do not let direct TypeBox imports become a
  second workspace authority.
- Preserve diagnostic evidence. Paths, messages, schema, and value references are part of how schema
  validation becomes useful in CLIs, YAML flows, editors, and config tooling.
- Keep tests phrased as greenfield `@sys/schema` contract, not migration compatibility archaeology.
- Keep large or domain-specific test concerns split by module (`-std-schema`, `-error`, recipe,
  testing locks), but do not split small coherent contract tests prematurely.

## Risks proved / handled

- Export paths changed and were mapped through the package boundary:
  - value helpers: `typebox/value`,
  - localized errors: `typebox/error`,
  - schema constructors/types: `typebox`.
- Type identities changed, so public type surfaces were made explicit enough for JSR slow-type
  checks.
- Error formats changed, so `Value.Errors` and `AssertError` normalize diagnostics into the
  `@sys/schema` surface.
- Validation behavior changed around parse/clean/assert flows, so `Value.Parse` now owns canonical
  value materialization explicitly.
- Recursive schemas changed shape, so `Type.Recursive` maps to TypeBox `Cyclic` while preserving the
  public named recursive constructor.
- Direct TypeBox imports remain confined to `code/sys/schema`, except the approved driver-pi Pi
  extension ABI interop template.

## Completed migration shape

1. Kept general schema authority at `@sys/schema`.
2. Updated internals to `typebox@1.1.38`.
3. Added minimal boundary behavior only where `@sys/schema` owns public value:
   - canonical value materialization,
   - normalized diagnostics,
   - named recursive schemas.
4. Reframed tests as greenfield `@sys/schema` contract rather than version-compatibility history.
5. Ran schema package gates and full workspace dry publish before the main migration commit.
6. Removed accidental `@sinclair/typebox` authority while retaining `@sinclair/typebox-codegen` as a
   separate codegen dependency.

## Non-goals

- Do not fold this into the driver-pi remove-tool patch.
- Do not migrate YAML profile schemas ad hoc.
- Do not permit direct `typebox` imports outside interop boundaries or `@sys/schema` internals.
- Do not conflate Pi extension ABI schemas with @sys config schemas.

## Acceptance outcome

- `@sys/schema` remains the canonical schema surface.
- Existing schema consumers avoided broad call-site rewrites.
- Schema validation/error tests now document intentional `@sys/schema` contract, not migration
  residue.
- Full workspace dry publish passed after the migration.
- The workspace has no accidental direct TypeBox imports outside approved boundaries.
