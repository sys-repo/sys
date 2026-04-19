# CTX — Vite 8 probe current state

## Scope
- Package: `code/sys.driver/driver-vite`
- Frontier: Vite 8 child-runtime under Deno
- Keep scope tight to the focused `m.vite` build/dev/wrangle path

## Canon posture refreshed
- Re-read:
  - root bootstrap
  - canonical `sys.canon/AGENTS.md`
  - full `sys.canon/-canon/` set
- Current work remains STIER/BMIND:
  - one cleanup frontier at a time
  - rerun focused proof after each narrow seam
  - do not reopen exhausted bootstrap-authority categories

## Proven facts
- Minimal plain-Vite Vite 8 works with the accepted bootstrap/import-map design
- The integration delta is in `driver-vite`, not in bootstrap authority alone
- Focused green probes remain:
  - `src/m.vite/-test/-wrangle.test.ts`
  - `src/m.vite/-test/-build.test.ts`
  - `src/m.vite/-test/-dev.test.ts`
- Four code commits are now landed from this probe line:
  - `fix(driver-vite): adapt config seams for vite 8 under deno`
  - `fix(driver-vite): stabilize vite 8 child build and dev runtime`
  - `refactor(driver-vite): narrow local common import surfaces`
  - `test(driver-vite): align transport prefix tests with current plugin context`
- Earlier proven seams still stand:
  - npm dynamic import for `vite-plugin-wasm` in `src/m.vite.config/u.plugins.ts`
  - `manualChunks(id) => alias | undefined` adaptation in `src/m.vite.config/u.app.ts`
  - localhost-only build permission and local IPv4/IPv6 dev permissions in `src/m.vite/u.wrangle.ts`
  - transitive local workspace import bridging in `src/m.vite/-test/u.bridge.fixture.ts`
  - explicit `paths` in focused `m.vite` tests to avoid parent-process rolldown leaks
  - Vite 8+ child commands using `--configLoader=native`, with a Vite 7 guard

## New cleanup result
- Narrowed self-hosted local common barrels away from the root broad runtime barrel in:
  - `src/m.vite/common.ts`
  - `src/m.vite.config/common.ts`
  - `src/m.vite.config.workspace/common.ts`
  - `src/m.fmt/common.ts`
  - `src/-entry/common.ts`
  - `src/m.vite.transport/common.ts`
  - `src/m.vite.plugins/common.ts`
  - `src/m.vite.plugins/m.OptimizeImports/common.ts`
- Split `PATHS` out of the root common barrel into:
  - `src/common/u.paths.ts`
- Result:
  - `src/common/libs.ts` is no longer the dominant warning hotspot in the focused dev probe
  - remaining unresolved-import warnings are now localized to the submodule common files that directly name those external `@sys/*` deps

## Important classification shift
- Generated fixture authority already includes the relevant `@sys/*` specifiers in `imports.json`, including for example:
  - `@sys/cli`
  - `@sys/fs`
  - `@sys/std`
  - `@sys/http/server`
  - `@sys/process`
  - `@sys/driver-deno/runtime`
- Therefore the remaining warnings are **not** explained by missing bridge import-map authority
- Current best read:
  - the self-hosted Vite/rolldown config/module bundling path is not honoring the import-map for linked local file imports in the same way the Deno child bootstrap does

## Current remaining noise
- Focused probes are green, but dev still emits non-fatal unresolved-import warnings from localized submodule common files such as:
  - `src/m.vite/common.ts`
  - `src/m.vite.config/common.ts`
  - `src/m.vite.config.workspace/common.ts`
  - `src/m.fmt/common.ts`
  - `src/-entry/common.ts`
  - `src/m.vite.transport/common.ts`
  - `src/m.vite.plugins/m.OptimizeImports/common.ts`
- This is a cleaner and more honest warning surface than before

## Latest residue-pass result
- Tried a test-local mirrored `@sys/driver-vite` bridge rewrite in `src/m.vite/-test/u.bridge.fixture.ts`
- Rejected it and reverted it
- Why rejected:
  - it increased complexity materially
  - it expanded warning reach into transitive self-hosted packages like `driver-deno`
  - it introduced fresh runtime/package-authority failure modes
  - it did not earn a cleaner line than the current stable green state

## Latest hardening result
- The post-commit residue frontier was pushed through without reopening the committed Vite 8 runtime line
- Full package test suite is now green under `--trace-leaks`:
  - `34 passed | 0 failed`
- The final hardening moves were:
  - `src/m.vite.config/-test/-fromFile.test.ts`
    - moved `ViteConfig.fromFile(...)` coverage onto a child-process probe
    - preserved API coverage while avoiding parent-process rolldown signal-listener leaks
  - `src/m.vite/-test/-build.transitive-jsr.test.ts`
    - passed explicit `paths` to keep the test on the child-runtime lane
    - removed the indirect parent-process `fromFile` leak path
  - `src/m.vite/-test/-build.workspace-composition.test.ts`
    - passed explicit `paths`
    - used `writeLocalFixtureImports(...)`
    - injected explicit workspace authority into the copied fixture config
    - this moved the test off the excluded native local-config-loading residue and restored truthful workspace-composition coverage
- Do not randomly reopen the already-committed config/runtime or child-runtime seams
- Do not revive the mirrored-package bridge approach unless new evidence appears
- Do not switch Vite 8 child commands to `--configLoader=runner`
  - it turns the current non-fatal unresolved-import warnings into a hard config-load failure (`ERR_MODULE_NOT_FOUND`, e.g. `@sys/cli` from `src/m.vite/common.ts`)

## Latest publish-safe hardening checkpoint
- The `driver-vite` publish/runtime seam was tightened and committed cleanly before this next frontier.
- Landed shape:
  - `src/m.vite.config/u.plugins.ts`
    - publish-safe literal pinned npm import for `vite-plugin-wasm`
  - `src/m.vite/u.wrangle.ts`
    - removed unanalyzable `require.resolve('esbuild/package.json')`
    - now prefers declared consumer package authority for `esbuild` version lookup
  - `-scripts/task.prep.ts`
    - prep now syncs the pinned `vite-plugin-wasm` import from canonical dependency authority
  - `-scripts/-test/-task.prep.test.ts`
    - covers the new prep sync
- Proof that was green before moving on:
  - `deno task test --trace-leaks ./-scripts/-test/-task.prep.test.ts`
  - `deno task dry`
- A small follow-up stale test expectation in `src/m.vite/-test/-wrangle.test.ts` was also corrected so that it asserts the consumer fixture's declared `esbuild` version rather than the workspace-root version.

## Next frontier after compact
- Scope shift:
  - stop working the publish-safe `driver-vite` seam
  - start a broader CI/package build sweep for Vite-backed packages using `deno task build`
- Known failure classes already observed:
  1. `driver-deno` staged/generated tmpl package build
     - failure shape:
       - `Failed to resolve declared esbuild version from consumer package boundary`
     - likely cause:
       - generated/staged package does not declare `esbuild`, but `driver-vite` now prefers declared consumer authority
     - this is a narrower local build-authority seam, distinct from the broader config-loader residue class
  2. CI / package `deno task build` failures during Vite config loading
     - example shape:
       - `Import "strip-ansi" not a dependency and not in import map`
       - from local workspace source like `code/sys/std/src/m.Ansi/common.ts`
     - best current read:
       - this is the self-hosted local config/module loading residue where Vite native config loading ignores root import-map authority for linked local workspace files
- Important classification:
  - these two failure classes are related to Deno/Vite authority, but they are not the same blocker and should not be conflated

## Resume plan
1. Read the current CI build workflow/package build set.
2. Enumerate local `deno task build` failures across that same set.
3. Classify failures by blocker class before fixing anything broad.
4. Patch one class at a time, rerunning only the affected package build lane.
5. Keep the first decisive blocker for each package; do not reopen solved publish-safe seams unless evidence requires it.

## Focused verification
Run from:
`cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`

- `deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts`
- `deno task test --trace-leaks ./src/m.vite/-test/-build.test.ts`
- `deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts`
- `deno task test --trace-leaks ./-scripts/-test/-task.prep.test.ts`
- `deno task dry`
