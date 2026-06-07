# driver-vite Deno loader lookup simplification plan

- [x] 622f80e6b test(driver-vite): codify deno loader resolver parity gates
- [x] 43c6aee49 test(driver-vite): codify deno loader resolver contract
- [x] 77a06d089 feat(driver-vite): introduce loader-backed resolve seam
- [x] 4152ab23e test(driver-vite): prove loader virtual ids across dev and build
- [x] cce733972 refactor(driver-vite): route transport resolution through deno loader
- [x] c51644c92 refactor(driver-vite): split transport resolver modules
- [x] 4f371e1d8 refactor(driver-vite): organize transport utility modules
- [x] 8394facf8 test(driver-vite): harden npm path fallback coverage
- [x] 69e52fb2f refactor(driver-vite): retire legacy deno-info lookup bridge

## Final deno-info bridge retirement beat

Completed commit:

```txt
69e52fb2f refactor(driver-vite): retire legacy deno-info lookup bridge
```

Final shape:

```txt
u/u.cache.ts                 # transform cache planning/read/write
u/u.load.ts                  # Deno module load/transform/rewrite
u/u.npm.ts                   # npm specifier helpers
u/u.prefix.ts                # Vite pre-resolve prefix plugin
u/u.specifier.ts             # Deno/Vite transport specifier encoding

u.resolve/u.resolve.ts      # public façade / compatibility surface
u.resolve/u.plugin.ts       # createResolvePlugin and loader lifecycle
u.resolve/u.vite.ts         # resolveViteSpecifier orchestration
u.resolve/u.loader.ts       # pure @deno/loader seam
u.resolve/u.loaderAdapter.ts # @deno/loader URL → Vite transport IDs
u.resolve/u.npmPath.ts      # npm file-path fallback
u.resolve/u.trace.ts        # diagnostics
```

Boundary:

- delete the legacy `deno info --json` lookup bridge and helper leaves;
- keep Deno semantics delegated to `@deno/loader@0.5.0`;
- adapt loader-returned concrete remote URL authority directly into Vite transport IDs;
- keep npm file-path fallback as the separate `deno eval import.meta.resolve(...)` bridge;
- keep rollback context in this plan and git history, not live compatibility exports or skipped tests.

Final implementation:

- removed `u.resolve/u.denoInfo.ts`, `.is`, `.deps`, and `.memo`;
- removed production `resolveDenoWith` calls from Vite resolution and plugin load hydration;
- added loader-backed concrete remote URL adaptation in `u.resolve/u.loaderAdapter.ts`;
- added remote URL loading through `@deno/loader` in `u/u.load.ts`;
- inject the configured plugin loader into remote module loads so build/dev use the same workspace authority;
- prefer resolved concrete remote URLs as child referrers so transitive JSR/http imports stay on loader authority instead of synthetic `file:///jsr:*` fallbacks;
- removed the prefix plugin's deno-info npm gate; npm IDs now normalize to Vite first and use the npm path fallback second;
- removed `resolveDenoWith`, `ResolveMemo`, and skipped tombstone specs so the retired bridge has no live API or test residue.

Proof already run for the completed organization beat:

- `deno fmt --check src/m.vite.transport/u src/m.vite.transport/u.resolve` ✅
- focused transport utility/resolver suite ✅ — `7 passed (99 steps) | 0 failed`
- package prep/load proof ✅ — `3 passed (30 steps) | 0 failed`
- `deno task check` ✅
- `deno task test` ✅ — `50 passed (269 steps) | 0 failed`

Retirement rollback pointer:

- legacy bridge files were deleted in this commit unit;
- if field evidence requires resurrection, recover the deleted `u.resolve/u.denoInfo*` files and removed `resolveDenoWith`/`ResolveMemo` surface from the parent of `refactor(driver-vite): retire legacy deno-info lookup bridge`;
- first restore behind an explicit compatibility seam, then re-run loader parity, Vite virtual ID, npm fallback, focused transport, package check, and package test gates before publishing.

Proof for the completed retirement beat:

- `deno check --node-modules-dir=auto` on touched transport resolver/load/test files ✅
- `deno fmt --check` on touched transport TS files ✅
- focused transport utility/resolver suite ✅ — `6 passed (73 steps) | 0 failed`
- previously failing build/integration set ✅ — `4 passed (9 steps) | 0 failed`
- `deno task check` ✅
- `deno task test` ✅ — `50 passed (248 steps) | 0 failed`

## 100-year STIER review

Design verdict: GO, but only as a staged retirement with a reversible seam.

The high-grade path is not “delete the old lookup map because loader exists.” It is:

1. specify the observable resolver contract;
2. add a loader-backed seam that can run beside the legacy bridge;
3. prove Vite ID invariants separately from Deno lookup semantics;
4. route production resolution through the new seam only after parity is green;
5. delete the old bridge last, in one searchable resurrection-friendly commit.

Non-negotiable invariants:

- Deno semantics come from `jsr:@deno/loader@0.5.0`, not local graph folklore.
- Vite-specific semantics remain explicit: virtual IDs, browser dev IDs, build IDs,
  raw `https://` shielding, and FS allow boundaries.
- No broader permissions or cache grants are allowed as the price of simplification.
- No `OptimizeImportsPlugin` removal is implied by this work.
- No workspace/import-map alias deletion happens before loader parity proves it.
- The old path stays resurrectable until `test:external` is green after the flip.

Commit quality bar:

- Each commit should have one primary risk class.
- Tests land before behavioral flips.
- The flip commit should be small enough to revert without reverting the parity suite.
- The deletion commit must name the retired seam: `legacy deno-info lookup bridge`.
- If the loader path needs bespoke patches comparable to the old bridge, stop and call
  NO-GO rather than re-creating the same complexity under a new name.

Final local status:

- local implementation/proof is DONE;
- legacy `deno info` graph parsing/hydration code is removed;
- `resolveDenoWith`, `ResolveMemo`, `memo`, skipped tombstone specs, and `u.resolve/u.denoInfo*` files are gone;
- rollback context lives in this plan and git history, not live source/test residue;
- resulting code is smaller in authority, not just rearranged.

Publication/external status:

- publish and external smoke are release-train gates after this local cleanup, not blockers for the local retirement commit;
- after publishing, run the relevant external/package smoke lane before declaring the published artifact fully DONE DONE.

## Scope boundary

This is a follow-on cleanup plan. The focused transport unblock is complete and published as `@sys/driver-vite@0.0.425`.

The completed transport work replaced the direct load/transpile bridge and proved published external stability. This plan tracks the separate question of whether `@deno/loader` also lets us remove local lookup/resolution pattern-matching code in `@sys/driver-vite`.

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

## Pre-impl DMIND check

Verdict: GO for a test-first spike, not GO for deletion yet.

Coverage posture:

- The current test/build suite is a real proof base, not dangerously thin.
- Existing coverage already proves the legacy resolver bridge's observable
  contract across transport unit behavior, Vite build IDs, browser dev IDs,
  bootstrap handoff, workspace composition, transitive JSR modules, dev-server
  fetch paths, external smoke lanes, and UI package builds.
- Add explicit loader parity tests for the highest-risk edges, but treat them as
  strengthening an existing proof base rather than inventing coverage from zero.

Ratified facts:

- The focused transport swap is already green: `u.load.ts` uses
  `@deno/loader` for transform/source-map output.
- The old heavy lookup bridge is still live in `u.resolve.ts`, `u.prefix.ts`,
  `u.specifier.ts`, `u.npm.ts`, `u.app.specifierRewrite.ts`, and workspace alias
  generation.
- Upstream `@deno/vite-plugin@2.0.2` uses the same primitive we now trust:
  `Workspace(...).createLoader()`, `loader.resolveSync(...)`,
  `loader.addEntrypoints(...)`, and `loader.load(...)`.
- The upstream model is meaningfully smaller than our current local bridge:
  loader resolution replaces `deno info --json`, dependency graph parsing,
  redirect hydration, and much of the importer-parent lookup machinery.

Do not start by deleting workspace aliases/import-map rewrites. Start by proving a
loader-backed resolve seam against the existing behavior, then delete one bridge
at a time.

First safe spike:

1. Add loader-backed resolve tests or an experimental plugin path that mirrors
   upstream behavior while keeping the existing transport as baseline.
2. Prove current hard cases through the loader seam:
   workspace exports, sibling source outside app root, import-map aliases, remote
   children, npm/jsr/http, JSON, and browser/build virtual IDs.
3. Only then remove local lookup bridges in narrow chunks.

Risk register:

- `import.meta.resolve` authority may differ depending on which config/import-map
  world the plugin code executes under; prove local import-map aliases explicitly.
- Remote `https://` imports still need Vite-specific shielding (`deno-http::` or
  equivalent) for SSR/module-runner paths.
- Browser dev IDs and build IDs have different stability requirements; prove both.
- Vite FS allow remains a serving boundary, not resolver authority; do not remove
  it in this cleanup.
- `OptimizeImportsPlugin` is still bundle-shape optimization, not Deno lookup;
  leave it out of this work.
- Vite child-runtime compatibility scaffolding is separate; do not mix it with
  lookup simplification.

## Non-goals

- Do not block the immediate transport stability fix.
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

1. Use the completed transport stability change as the baseline.
2. Add the smallest possible switch point for a loader-backed resolver path while
   preserving the legacy path intact.
3. Add tests comparing loader-backed resolution with current lookup behavior.
4. Flip only after the behavioral suite and explicit parity tests are green.
5. Later/next, retire one local lookup bridge at a time:
   - transport graph parsing/hydration;
   - broad load-time import string rewriting;
   - workspace alias generation if redundant;
   - import-map specifier rewrite/prewarm if redundant.
6. Keep each deletion behind passing parity tests.
7. Run UI dev/build proof after each meaningful deletion chunk.

## Later retirement commit quality bar

When retiring the old code path, keep the deletion commit tight and searchable:

- Do not mix retirement with unrelated feature work.
- Use a commit subject/body that names the resurrectable seam, for example:
  `refactor(driver-vite): retire legacy deno-info resolver bridge`.
- Mention the replacement explicitly: loader-backed resolver via
  `jsr:@deno/loader@0.5.0`.
- Mention the deleted legacy concepts explicitly in the body: `deno info`, graph
  hydration, import rewriting, workspace/import-map bridge, and virtual IDs.
- Leave clear short comments near the new seam describing why the old bridge was
  removed and which proof gates covered the swap.
- Preserve enough nearby naming/provenance that a later search for `deno-info
  resolver bridge` or `legacy lookup bridge` can find the retirement commit and
  resurrect the path if a post-cleanup regression appears.

## Decision posture

GO if loader-backed Vite resolution covers current behavior with less local code
and no broader permissions.

NO-GO/defer if cleanup starts requiring bespoke patches comparable to the code it
would delete, or if it destabilizes the immediate release train.
