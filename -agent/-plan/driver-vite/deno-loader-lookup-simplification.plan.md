# driver-vite Deno loader lookup simplification plan

## Scope boundary

This is a follow-on cleanup plan, not the immediate esbuild unblock.

The esbuild unblock should stay focused on replacing the direct transport
load/transpile bridge enough to remove the failing esbuild path. This plan tracks
the separate question of whether `@deno/loader` also lets us remove local
lookup/resolution pattern-matching code in `@sys/driver-vite`.

Both work items may use the same primitive:

```ts
jsr:@deno/loader@0.5.0
```

But they have different proof gates and should not be collapsed into one broad
refactor.

## Problem

`@sys/driver-vite` currently contains a lot of local Deno/Vite lookup bridge
logic that was necessary before using `@deno/loader` directly.

Hard-pattern candidates:

- `src/m.vite.transport/u.resolve.ts`
  - `deno info --json`
  - graph parsing
  - redirect normalization
  - parent importer dependency lookup
  - remote parent/child hydration
  - npm fallback
  - memo/inflight/alias coalescing
- `src/m.vite.transport/u.load.ts`
  - broad import-specifier string rewriting
  - remote/local dependency rewrite coupling
- `src/m.vite.transport/u.specifier.ts`
  - virtual Deno ID parsing/repair/canonicalization
- `src/m.vite.transport/u.npm.ts`
  - `npm:` to Vite bare-package normalization
- `src/m.vite.config/u.app.specifierRewrite.ts`
  - import-map longest-prefix matching
  - `npm:`/`jsr:` rewrite decisions
  - npm prewarm bridge
- `src/m.vite.config.workspace/mod.ts`
  - workspace export alias generation for Vite resolution

## Current finding

Initial probes show `@deno/loader` already handles core lookup cases:

- Deno workspace package exports from root `deno.json` workspace authority
- member package `deno.json` `name`/`exports`
- import-map aliases
- `npm:` specifiers
- bare npm imports mapped through Deno config
- `jsr:` specifiers
- remote HTTPS modules
- remote relative child resolution
- local relative child resolution
- media-type lookup and TS/TSX transpile

This suggests the local lookup bridge may be reducible to a much smaller
Vite-adapter layer.

## Important distinction

This plan is about Deno/Vite lookup and resolution grime.

It is not the same as `OptimizeImportsPlugin`:

- `m.vite.plugins/m.OptimizeImports/*` rewrites public/barrel imports for bundle
  shape and optimization.
- Do not assume `@deno/loader` makes `OptimizeImportsPlugin` redundant.
- Keep `OptimizeImportsPlugin` unless separate proof shows its optimization role
  is no longer needed.

## Desired end state

If proof passes, the local lookup layer should look closer to the upstream
`@deno/vite-plugin` model:

- create one `@deno/loader` workspace/loader per environment as needed;
- use loader resolution for Deno workspace/import-map/npm/jsr/http semantics;
- keep a small Vite virtual-ID adapter;
- keep only Vite-specific rewrites that are still necessary, such as raw
  `https://` shielding for Vite SSR/module-runner paths;
- remove local `deno info` graph parsing and dependency-hydration machinery.

## Non-goals

- Do not block the immediate esbuild-unblock fix.
- Do not combine this cleanup with UI namespace/refactor commits.
- Do not remove `OptimizeImportsPlugin` as part of this plan.
- Do not remove Vite FS allow boundaries unless separately proven safe.
- Do not use npm JSR alias imports; final code should use repo dependency
  authority for `jsr:@deno/loader@0.5.0`.

## Proof gates

Before deleting lookup helpers, prove loader-backed behavior for:

1. workspace exports inside the repo;
2. sibling workspace source outside app root;
3. import-map aliases to npm, jsr, and local file targets;
4. bare npm imports from local workspace modules;
5. npm imports from remote Deno/JSR modules;
6. remote relative child imports;
7. JSON modules;
8. TS/TSX/JSX/JS media types and source maps;
9. Vite browser dev virtual IDs;
10. Vite build virtual IDs;
11. raw `https://` imports in SSR/module-runner paths;
12. UI dev/build packages:
    - `code/sys.ui/ui-dev`
    - `code/sys.ui/ui-components`
    - `code/sys.ui/ui`

## Suggested sequence

1. Finish the focused esbuild-unblock transport change first.
2. Add tests comparing loader-backed resolution with current lookup behavior.
3. Remove one local lookup bridge at a time:
   - transport graph parsing/hydration;
   - broad load-time import string rewriting;
   - workspace alias generation if redundant;
   - import-map specifier rewrite/prewarm if redundant.
4. Keep each deletion behind passing parity tests.
5. Run UI dev/build proof after each meaningful deletion chunk.

## Decision posture

GO if loader-backed Vite resolution covers current behavior with less local code
and no broader permissions.

NO-GO/defer if cleanup starts requiring bespoke patches comparable to the code it
would delete, or if it destabilizes the immediate release train.
