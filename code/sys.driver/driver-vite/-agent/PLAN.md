# PLAN — driver-vite Vite 8 commit distillation and post-commit hardening

## Scope
- Package: `code/sys.driver/driver-vite`
- Goal now: split the earned work into reviewable commits, keep mechanical noise separate, and avoid losing the critical path we have just proven
- Posture:
  - TMIND for classification and commit design
  - BMIND for the concrete staging / review / commit sequence

## Current truth
- The focused Vite 8 line is working
- Focused proofs are green:
  - `src/m.vite/-test/-wrangle.test.ts`
  - `src/m.vite/-test/-build.test.ts`
  - `src/m.vite/-test/-dev.test.ts`
- The first two planned product commits are now landed:
  - `fix(driver-vite): adapt config seams for vite 8 under deno`
  - `fix(driver-vite): stabilize vite 8 child build and dev runtime`
- Previously rejected cleanup seams remain rejected:
  - mirrored test-local `@sys/driver-vite` bridge rewrite
  - Vite 8 `--configLoader=runner`
- Accepted cleanup seam now retained:
  - Vite 8+ `--configLoader=native`
  - proven by:
    1. direct bridged-fixture build probe
    2. direct bridged-fixture dev probe
    3. real `Wrangle.command(...)` build probe under actual permissions
    4. real `Wrangle.command(...)` dev probe under actual permissions
    5. focused tests green after wiring it
- Vite 7 remains on the default config-loader path by explicit guard test

## Mechanical noise policy
The dependency/template/lockstep churn is intentionally separate from behavioral review.
That chunk should land on its own and stay out of the signal of the functional commits.

Mechanical/noise chunk:
- `code/-tmpl/-templates/tmpl.repo/-package.json`
- `code/-tmpl/-templates/tmpl.repo/imports.json`
- `code/-tmpl/-templates/tmpl.repo/-deps.yaml`
- `code/-tmpl/src/m.tmpl/-bundle.json`
- `package.json`
- `deps.yaml`
- `imports.json`
- `deno.lock`

## Working-set commit strategy
After the mechanical commit, classify the remaining meaningful tree into these review buckets.

### A. Config/runtime seam fixes
Intent:
- keep only the changes that made Vite 8 config evaluation truthful under Deno
- isolate config-shape/runtime seams from broader cleanup

Typical content:
- lazy Vite loading
- wasm plugin npm loading
- manualChunks adapter
- any directly coupled config tests

Primary candidate files:
- `src/m.vite.config/u.fromFile.ts`
- `src/m.vite.config/u.plugins.ts`
- `src/m.vite.config/u.app.ts`
- `src/m.vite.config/-test/-app.test.ts`
- possibly tightly-coupled helpers/tests only if they are required for a coherent review

### B. Child runtime stabilization
Intent:
- keep the actual earned Vite 8 child-runtime/build/dev survival path together
- this is the core behavioral fix line

Typical content:
- bootstrap authority retained path
- wrangle permission corrections
- fixture bridge authority that is actually required by the focused tests
- Vite 8+ `--configLoader=native`
- focused build/dev/wrangle tests

Primary candidate files:
- `src/m.vite/u.wrangle.ts`
- `src/m.vite/u.build.ts`
- `src/m.vite/u.dev.ts`
- `src/m.vite/u.bootstrap.ts`
- `src/m.vite/-test/-wrangle.test.ts`
- `src/m.vite/-test/-build.test.ts`
- `src/m.vite/-test/-dev.test.ts`
- `src/m.vite/-test/u.bridge.fixture.ts`

### C. Structural cleanup
Intent:
- keep import-surface narrowing and broad-local-barrel cleanup separate from behavioral runtime seams
- this is refactor/cleanup, not frontier survival

Primary candidate files:
- `src/common/u.paths.ts`
- `src/common/mod.ts`
- `src/-entry/common.ts`
- `src/m.fmt/common.ts`
- `src/m.vite/common.ts`
- `src/m.vite.config/common.ts`
- `src/m.vite.config.workspace/common.ts`
- `src/m.vite.transport/common.ts`
- `src/m.vite.plugins/common.ts`
- `src/m.vite.plugins/m.OptimizeImports/common.ts`

### D. Agent notes / audit records
Intent:
- preserve reasoning, audit trail, and resume truth
- do not let these blur product-code review

Files:
- `-agent/CTX.md`
- `-agent/PLAN.md`
- `-agent/vite8.bootstrap-probe.md`

## Commit hygiene rule
As we walk the chunks:
- clean while committing
- do not preserve slop just because it currently works
- but do not rewrite from scratch
- prefer deletion, simplification, and sharper commit boundaries over fresh redesign

## Rewrite judgment
### Decision now
- Do **not** do a clean rewrite from the pre-fix baseline now

### Why
- the current tree contains empirical, proven seams rather than merely theoretical design ideas
- a fresh rewrite would likely erase hard-earned boundary knowledge and reintroduce risk
- the more S-tier move is:
  1. commit the earned line
  2. distill the invariants
  3. remove accidental complexity only after the working truth is safely in history

### Post-commit hardening path
After the initial commit series lands:
1. restate the invariants explicitly
   - bootstrap authority remains separate from app/plugin resolution
   - Vite 8+ needs `--configLoader=native`
   - Vite 7 remains default
   - lazy Vite loading is retained where needed
   - npm wasm loading is retained where needed
   - explicit fixture paths avoid the parent-process leak path
   - fixture bridge authority includes the necessary transitive runtime imports
2. inspect for dead scaffolding or duplicate seams
3. delete or collapse only what is clearly redundant
4. prefer a small distillation pass over any “clean-room” reimplementation

## Review method from here
1. mechanical noise chunk: landed separately
2. A config/runtime seam fix chunk: landed
3. B child runtime stabilization chunk: landed
4. structural cleanup chunk: landed
5. transport prefix test/hook-shape alignment chunk: landed
6. remaining live frontier is now the excluded residue / post-commit hardening path
7. keep notes/docs separate unless intentionally documenting the probe line in history
8. after the commit series, consider a narrow hardening/distillation pass rather than a rewrite

## Verification baseline
Run from:
```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite

deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-build.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts
```

## Anticipated commit messages
Mechanical/noise:
- `chore(repo): refresh dependency and template lockstep files`

Working-set candidates:
- `fix(driver-vite): adapt config seams for vite 8 under deno` ✅ landed
- `fix(driver-vite): stabilize vite 8 child build and dev runtime` ✅ landed
- `refactor(driver-vite): narrow local common import surfaces` ✅ landed
- `test(driver-vite): align transport prefix tests with current plugin context` ✅ landed
- `docs(driver-vite): refresh vite 8 probe notes`

## Latest hardening outcome
- The previously excluded post-commit residue frontier has now been pushed through
- Resolved seams:
  - `ViteConfig.fromFile`
    - test coverage now runs through a child-process probe rather than triggering rolldown signal listeners in the parent test process
  - `Vite.build (transitive jsr)`
    - now stays on explicit `paths` and no longer re-enters the parent `fromFile` leak path
  - `Vite.build (workspace composition)`
    - now stays on explicit `paths`
    - uses local bridge imports plus explicit workspace authority in the copied fixture config
    - no longer fails on the earlier native local-config-loading / linked workspace authority frontier
- Result:
  - `deno task test --trace-leaks` is green for `code/sys.driver/driver-vite`
- Any further work from here should be distillation / cleanup only, not frontier rescue
