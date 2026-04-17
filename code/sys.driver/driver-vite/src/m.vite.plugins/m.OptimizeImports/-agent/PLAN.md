# OptimizeImports plugin plan

## Goal
Build a small Vite plugin in `@sys/driver-vite` that optimizes broad public barrel imports into narrower public subpath imports when that rewrite can be derived safely.

The plugin is a performance adapter:
- central
- derived from package/barrel truth
- reviewable
- consistent across apps using `@sys/driver-vite`

It is not the truth layer for package import policy.

## Core decisions

### Home
- `src/m.vite.plugins/m.OptimizeImports/`

### Scope
- optimize public barrel imports only
- derive candidates from public package/export reality
- rewrite to public exported subpaths only
- deterministic rewrites only
- start with `@sys/*` workspace packages, but do not hard-code package-specific policy into the driver as the durable truth source

### Truth split
Rewrite authority comes from a derived rule dataset built from:
- package `deno.json` public `exports`
- root barrel exports such as `src/mod.ts`
- public subpath module exports

Graph tooling is for:
- prioritization
- diagnostics
- proof
- hot-path analysis

Graph tooling is not for:
- sole rewrite authority
- private path inference
- papering over missing public exports

### Public API stance
Keep the public type surface small and policy-first.

Do not leak:
- AST mechanics
- internal transform helpers
- raw workspace graph structures
- barrel-analysis internals
- `common` as a public rule kind unless it earns promotion later

## Rewrite strategy

### Preferred sequencing
1. Read package public exports from `deno.json`.
2. Read the root public barrel (`src/mod.ts` or exported root module).
3. Read public exported subpath modules.
4. Derive symbol → narrower public subpath candidates where the same symbol is exported at both levels.
5. Rewrite only unambiguous safe cases.

### Hard invariants
- the driver must not hand-author durable package-specific `@sys/*` rewrite knowledge
- rewrites must be derived from public package/barrel truth
- targets must be stable public exports
- unknown imports are left unchanged
- no rewrites to private or internal source paths
- no guessing from runtime discovery alone
- no papering over missing upstream exports

## Transform policy questions to lock before full implementation
- named imports only in v1?
- mixed value + type named imports
- mixed default + named imports
- partial rewrites within one import declaration
- namespace imports
- side-effect imports
- `export ... from` handling, if any

## Mechanism decision gate
Before implementation expands, decide one of:
- reuse existing clean transform infrastructure
- use a clean AST-based implementation

Do not fall into brittle string-rewrite surgery.

## Investigation order
1. Inspect current `driver-vite` composition and plugin order.
2. Identify the minimum derived rule dataset shape.
3. Read package `deno.json` export maps for candidate packages.
4. Read root/public barrel exports and public subpath exports.
5. Derive safe symbol → subpath candidates.
6. Use graph data only to prioritize and prove payoff.
7. Decide transform mechanism: regex v1 vs AST if syntax scope expands.
8. Greenlight implementation only if the path stays explicit and clean.

## Initial target bias
Prefer UI packages first if export reality supports it:
- `@sys/ui-react-components`
- `@sys/ui-react-devharness`

Defer `@sys/std` unless discovery shows it is unusually trivial and safe.

## Greenlight criteria
Proceed only if all are true:
1. meaningful payoff on a real pain path
2. stable public narrow targets can be derived for a useful subset
3. rewrite authority stays outside hand-authored driver package knowledge
4. transform implementation path is clean

## Test plan
1. unit tests for transform behavior
   - derived safe rewrites
   - type-only correctness
   - unknown imports unchanged
   - unsupported forms unchanged unless explicitly supported
2. tests for rule derivation
   - package exports read correctly
   - root/public subpath symbol matching is correct
   - ambiguous cases are rejected
3. integration test for `driver-vite` composition
4. proof against a real pain case or focused fixture
5. keep graph/proof tooling separate from sole rewrite authority

## Current posture correction
The current hard-coded default package rules are acceptable only as a mechanism spike/proof.
They are not the intended final authority model.

## Expected truthful outcomes
Healthy v1 may be:
- small plugin
- small derived rule dataset
- clear blocked cases
- explicit upstream export-surface follow-ups

That is success, not failure.
