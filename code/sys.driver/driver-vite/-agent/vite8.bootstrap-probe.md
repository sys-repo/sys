# Vite 8 / Deno child-bootstrap probe log

- Top-level view:
  - Goal:
    - isolate Vite 8 child-runtime failures under Deno
    - stop only when the blocker class changes
  - Accepted design:
    - explicit child bootstrap authority layer
    - generated import map passed via `--import-map`
    - bootstrap-only, separate from app/plugin resolution
    - constrained and reconstructable
  - Current state:
    - bootstrap-authority failures have been pushed through far enough to run real fixture builds and dev servers
    - focused `m.vite` Vite 8 probes are green on the current tree
    - four code commits are now landed from this probe line:
      - `fix(driver-vite): adapt config seams for vite 8 under deno`
      - `fix(driver-vite): stabilize vite 8 child build and dev runtime`
      - `refactor(driver-vite): narrow local common import surfaces`
      - `test(driver-vite): align transport prefix tests with current plugin context`
    - the former post-commit residue around `fromFile` / native local config loading has now been pushed through
    - the full `driver-vite` package test suite is green under `--trace-leaks`

- Stable design:
  - explicit child bootstrap authority layer
  - generated import map passed via `--import-map`
  - bootstrap-only, separate from app/plugin resolution
  - constrained and reconstructable


================

- Categories exhausted cleanly:
  - Vite package subpaths
    - `vite/internal`
    - `vite/module-runner`
  - plugin-react runtime package seam
    - `@rolldown/pluginutils`
  - bare Node builtin imports used by Vite bundled runtime
    - `fs -> node:fs`
    - `path -> node:path`
    - `zlib -> node:zlib`
  - Vite direct runtime package deps
    - `tinyglobby`
    - `lightningcss`
    - `picomatch`
    - `postcss`
    - `rolldown`
  - Vite package-import alias
    - `#module-sync-enabled`
    - solved via generated adjacent bootstrap module file, mapped by file URL
  - Rolldown bootstrap subpaths
    - `rolldown/experimental`
    - `rolldown/filter`
    - `rolldown/parseAst`
    - `rolldown/plugins`
    - `rolldown/utils`
  - Maintenance note:
    - append newly yielded bootstrap-authority seams here
    - keep this section short and category-shaped

- Probe files:
  - `src/m.vite/u.bootstrap.ts`
  - `src/m.vite/u.wrangle.ts`
  - `src/m.vite/u.build.ts`
  - `src/m.vite/u.dev.ts`
  - `src/m.vite/-test/-build.test.ts`
  - `src/m.vite/-test/-dev.test.ts`
  - `src/m.vite/-test/-wrangle.test.ts`
  - `src/m.vite/-test/u.bridge.fixture.ts`
  - `src/m.vite.config/u.app.ts`
  - `src/m.vite.config/u.fromFile.ts`
  - `src/m.vite.config/u.plugins.ts`

- Working tree note:
  - the current dirty tree is coherent with this Vite 8 probe campaign
  - do not try to preserve this state incrementally in commit history until the runtime frontier stabilizes

- Verified outcomes:
  - minimal plain-Vite manual build under Vite 8 works with the accepted bootstrap/import-map design
  - the `driver-vite` failing path must therefore be explained by the integration delta, not by bootstrap authority alone
  - `u.fromFile.ts` was a real seam:
    - eager runtime import from `'vite'` risked split authority between the consumer fixture Vite and workspace/root Vite
    - making that load lazy moved the blocker forward
  - `vite-plugin-wasm` was a real seam but is not the current decisive blocker:
    - loading it with `import('npm:vite-plugin-wasm')` in `src/m.vite.config/u.plugins.ts` works on the current tree
    - `src/m.vite.config/-test/-plugins.test.ts` passes with this loader shape
  - Vite 8 / rolldown rejected the previous `manualChunks` object form used by `u.app.ts`
    - adapting chunk aliases to a `manualChunks(id) => alias | undefined` function moved the fixture build farther
    - `src/m.vite.config/-test/-app.test.ts` covers this adapter and passes
  - build child permissions were another real seam:
    - Vite 8 / rolldown build under Deno can issue a localhost DNS lookup during startup
    - adding localhost-only net permission to the build child moved the build test to green
  - dev child permissions were another real seam:
    - Vite 8 dev can bind an IPv6 unspecified host under Deno (`[::]`)
    - allowing local IPv4 + IPv6 bindings in the dev child moved the dev test forward
  - fixture bridge authority was another real seam:
    - self-hosted local `@sys/driver-vite/*` fixture imports need transitive public package imports bridged too
    - expanding the bridge import map to include package imports found in resolved local workspace entry files fixed the `@sys/std/indexeddb` failure class
    - type-only imports from those local files must be ignored when generating runtime bridge authority
  - test posture was another real seam:
    - `Vite.Config.fromFile(...)` loads Vite/rolldown in the parent process and leaves signal listeners behind under `--trace-leaks`
    - focused `m.vite` tests should pass explicit `paths` to `Vite.build(...)` / `Vite.dev(...)` when the fixture layout is already known
    - this keeps the tests on the child-runtime seam instead of reintroducing parent-runtime rolldown leaks
  - local common-barrel cleanup was another real seam:
    - narrowed submodule-local `common.ts` surfaces away from the broad root runtime barrel
    - split `PATHS` out of `src/common/mod.ts` into `src/common/u.paths.ts`
    - this removed `src/common/libs.ts` as the dominant warning hotspot in focused self-hosted dev probing

- Current concrete observations:
  - focused probes still pass:
    - `src/m.vite/-test/-wrangle.test.ts`
    - `src/m.vite/-test/-build.test.ts`
    - `src/m.vite/-test/-dev.test.ts`
  - remaining unresolved-import warnings are now localized to direct submodule common surfaces such as:
    - `src/m.vite/common.ts`
    - `src/m.vite.config/common.ts`
    - `src/m.vite.config.workspace/common.ts`
    - `src/m.fmt/common.ts`
    - `src/-entry/common.ts`
    - `src/m.vite.transport/common.ts`
    - `src/m.vite.plugins/m.OptimizeImports/common.ts`
  - generated fixture authority already includes those `@sys/*` specifiers in `imports.json`
    - for example:
      - `@sys/cli`
      - `@sys/fs`
      - `@sys/std`
      - `@sys/http/server`
      - `@sys/process`
      - `@sys/driver-deno/runtime`
  - therefore the remaining warnings are not missing bridge/import-map authority
  - best current read:
    - the self-hosted Vite/rolldown config/module bundling path is not honoring that import-map authority for linked local file imports in the same way the Deno child bootstrap does

- Focused tests now passing on the current tree:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite

deno task test --trace-leaks ./src/m.vite.config/-test/-plugins.test.ts
deno task test --trace-leaks ./src/m.vite.config/-test/-app.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-build.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts
```

- Current frontier:
  - the focused `m.vite` Vite 8 line is committed and stable
  - structural cleanup and the small transport prefix test-alignment slice are committed
  - the former post-commit residue has also been pushed through via narrow test/harness hardening:
    - `ViteConfig.fromFile` coverage now runs in a child probe instead of the parent process
    - `Vite.build (transitive jsr)` uses explicit `paths`
    - `Vite.build (workspace composition)` uses explicit `paths`, local bridge imports, and explicit workspace authority in the copied fixture config
  - practical state now:
    - `deno task test --trace-leaks` is green for `code/sys.driver/driver-vite`
  - attempted and rejected cleanup seams:
    - a test-local mirrored `@sys/driver-vite` bridge rewrite in `src/m.vite/-test/u.bridge.fixture.ts`
      - rejected because it increased complexity, widened the self-hosted warning surface into transitive packages, and introduced fresh runtime/package-authority failures without improving the proof line enough to keep
    - Vite 8 `--configLoader=runner`
      - rejected because it converted the current non-fatal unresolved-import warnings into a hard config-load failure (`ERR_MODULE_NOT_FOUND`, e.g. `@sys/cli` from `src/m.vite/common.ts`)
  - accepted cleanup seam:
    - Vite 8+ `--configLoader=native` in `src/m.vite/u.wrangle.ts`
    - proven in order:
      1. direct bridged-fixture manual build probe: green
      2. direct bridged-fixture manual dev probe: green
      3. same build probe under real `Wrangle.command(...)` permissions: green
      4. same dev probe under real `Wrangle.command(...)` permissions: green
      5. focused `-wrangle`, `-build`, `-dev` tests: green
    - added guard proof:
      - Vite 7 command path does not receive `--configLoader=native`
    - practical effect:
      - the large self-hosted unresolved-import warning wall no longer appeared on the focused Vite 8 dev path after this change

- Resume checklist:
  - revalidate focused green probes:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite

deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-build.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts
```

  - then inspect the next owned seam only:
    - `src/m.vite.config/u.app.ts`
    - `src/m.vite.config.workspace/mod.ts`
    - `src/m.vite.transport/m.denoPlugin.ts`
    - `src/m.vite.transport/u.resolve.ts`
    - `src/m.vite/-test/u.bridge.fixture.ts`

- Stash / resume:
  - if pausing this whole probe line, stash canonically:

```bash
git -C /Users/phil/code/org.sys/sys stash push -u -m "driver-vite vite8 bootstrap probe"
```

  - on resume, prefer apply:

```bash
git -C /Users/phil/code/org.sys/sys stash list
git -C /Users/phil/code/org.sys/sys stash apply stash@{...}
```
