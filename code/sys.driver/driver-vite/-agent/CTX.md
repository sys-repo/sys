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
- Earlier proven seams still stand:
  - lazy `vite` load in `src/m.vite.config/u.fromFile.ts`
  - npm dynamic import for `vite-plugin-wasm` in `src/m.vite.config/u.plugins.ts`
  - `manualChunks(id) => alias | undefined` adaptation in `src/m.vite.config/u.app.ts`
  - localhost-only build permission and local IPv4/IPv6 dev permissions in `src/m.vite/u.wrangle.ts`
  - transitive local workspace import bridging in `src/m.vite/-test/u.bridge.fixture.ts`
  - explicit `paths` in focused `m.vite` tests to avoid parent-process rolldown leaks

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

## Best next move
- Do not randomly keep shaving local barrels now
- Do not revive the mirrored-package bridge approach unless new evidence appears
- Do not switch Vite 8 child commands to `--configLoader=runner`
  - it turns the current non-fatal unresolved-import warnings into a hard config-load failure (`ERR_MODULE_NOT_FOUND`, e.g. `@sys/cli` from `src/m.vite/common.ts`)
- Accepted cleanup win:
  - Vite 8+ child commands now pass `--configLoader=native`
  - this was proven first by direct manual fixture probes, then by real `Wrangle.command(...)` build/dev probes under the actual permission envelope
  - focused `wrangle` / `build` / `dev` tests remain green
  - the prior self-hosted unresolved-import warning wall no longer appeared in the focused dev path after this change
- Current S-tier read:
  - focused Vite 8 proof is done
  - remaining residue is smaller and primarily the fixture `deno.json` importMap-ignored warning, not the old self-hosted unresolved-import wall
- If continuing beyond this point, only do so with a clearly owned seam that is simpler than the already-accepted `native` config-loader improvement

## Focused verification
Run from:
`cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`

- `deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts`
- `deno task test --trace-leaks ./src/m.vite/-test/-build.test.ts`
- `deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts`
