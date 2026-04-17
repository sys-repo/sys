# OptimizeImports plugin plan

## Goal
Build a small, explicit Vite plugin in `@sys/driver-vite` that rewrites only approved broad `@sys/*` root imports to approved public narrow subpath imports.

The plugin is a performance adapter:
- central
- explicit
- reviewable
- consistent across apps using `@sys/driver-vite`

It is not the truth layer for package import policy.

## Core decisions

### Home
- `src/m.vite.plugins/m.OptimizeImports/`

### Scope
- allowlisted package roots only
- explicit mapping table only
- public exported subpaths only
- deterministic rewrites only
- no generic optimization of all `@sys/*`

### Truth split
Rewrite authority comes from:
- approved plugin mapping rules
- real public package export surfaces

Graph tooling is for:
- diagnostics
- proof
- fixture generation
- hot-path analysis

Graph tooling is not for:
- rewrite authority
- path inference
- automatic rule generation

### Public API stance
Keep the public type surface small and policy-first:
- `Lib`
- `OptionsInput`
- `PackageRule`
- `ImportRule`
- `ImportRuleKind`

Do not leak:
- AST mechanics
- internal transform helpers
- workspace graph inputs
- `common` as a public rule kind unless it earns promotion later

## Rewrite strategy

### Preferred sequencing
1. Inspect whether canonical public package sub-surfaces can reduce broad-root cost first.
2. If that is enough, prefer that simpler structural rewrite lane.
3. If not enough, add approved symbol-level named-import rewrites.

### Hard invariants
- rewrites are explicit and allowlisted
- targets must be stable public exports
- unknown imports are left unchanged
- no rewrites to private or internal source paths
- no guessing from runtime or graph discovery
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
2. Inspect public export reality for initial target packages.
3. Inspect real broad imports on the hot path in the pain case.
4. Decide whether v1 can start with canonical package sub-surfaces.
5. Decide transform mechanism: reuse vs AST.
6. Greenlight implementation only if the path stays explicit and clean.

## Initial target bias
Prefer UI packages first if export reality supports it:
- `@sys/ui-react-components`
- `@sys/ui-react-devharness`

Defer `@sys/std` unless discovery shows it is unusually trivial and safe.

## Greenlight criteria
Proceed only if all are true:
1. meaningful payoff on a real pain path
2. stable public narrow targets exist for a useful subset
3. transform implementation path is clean

## Test plan
1. unit tests for transform behavior
   - approved rewrites
   - type-only correctness
   - unknown imports unchanged
   - unsupported forms unchanged unless explicitly supported
2. integration test for `driver-vite` composition
3. proof against a real pain case or focused fixture
4. keep graph/proof tooling separate from rewrite authority

## Expected truthful outcomes
Healthy v1 may be:
- small plugin
- small mapping table
- clear blocked cases
- explicit upstream export-surface follow-ups

That is success, not failure.
