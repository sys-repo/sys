disposal-protocol-browser-compatibility.plan.md
- [x] 7f6fd3b13 feat(std): add disposal protocol symbol compatibility
- [x] 7193af338 feat(driver-vite): install disposal symbols in browser modules
- [x] f718039f7 build(driver-vite): align browser syntax targets across dev and build

**Status:** Complete and reconciled; JSR publication is in progress. Follow-on test architecture is
complete in [`disposal-protocol-browser-compatibility-cleanup.plan.md`](./disposal-protocol-browser-compatibility-cleanup.plan.md)
at `5adfc0c5b` and `e25c15485`.

## Final reality

- `@sys/std/dispose/compat` owns standards-faithful installation of only `Symbol.dispose` and
  `Symbol.asyncDispose`; the normal disposal surface remains non-mutating and fail-fast.
- `sys:dispose-protocol-compat` installs that protocol support in transformed client modules across
  development, production, dynamic imports, module workers, and explicit service-worker graphs.
  Virtual `\0` modules are intentionally excluded after behavioral Monaco production proof showed
  that injecting into generated virtual graphs creates invalid circular output.
- One browser syntax authority now feeds independent mutable target packets to Vite build and OXC:
  `chrome111`, `edge111`, `firefox114`, `safari16.4`, and `ios16.4`. Explicit OXC targets and
  `oxc: false` remain authoritative.
- The implementation landed against `@oxc-project/runtime@0.143.0`; dependency authority was later
  upgraded to `0.144.0` by `85d04fbb5` without changing the compatibility design. Development helper
  resolution, production lowering, LIFO cleanup, async awaiting, sync fallback, suppression, fresh
  non-registry compatibility symbols, and incumbent Chromium symbol identity remain behaviorally
  proven.
- Compatibility verification completed at 61 driver-vite suites / 356 steps. Cleanup verification
  completed at 62 suites / 356 steps, with focused config, plugin, runtime, and Chromium lanes,
  workspace checking, changed-file formatting, and `git diff --check`. The final external lane took
  1m32s against a 1m33s baseline; compatibility-owned scenarios passed while the pre-existing
  Rolldown signal-listener leak and published UI dependency-resolution failures remained.
- Safari 26.5.2 visibly rendered and ran the Monaco application under human acceptance. WebDriver
  automation remains unrecorded because Safari rejected session creation until **Allow Remote
  Automation** is enabled. This is explicit automation evidence debt, not a claim of automated Safari
  acceptance or a known implementation defect.
- The subsequent `@sys/tools` staging failure was a Monaco development-test timeout, not a compile
  failure. Development serving had invoked the production whole-tree verifier before its first
  asset response; it now resolves the package once and validates each requested regular path within
  canonical bounds, while production retains complete size, tree, hash, and notice verification.
  Deploy staging now reports test and build phases separately with bounded stdout and stderr. This
  test/tooling correction does not reopen the completed compatibility design.
- Workspace refresh `69bd948b9` bumped `@sys/driver-vite` to `0.0.474` and `@sys/std` to `0.0.380`.
  The generated [JSR workflow](../../../.github/workflows/jsr.yaml) is publishing
  [`@sys/std@0.0.380`](https://jsr.io/@sys/std@0.0.380) as job 1/13 and
  [`@sys/driver-vite@0.0.474`](https://jsr.io/@sys/driver-vite@0.0.474) as job 12/13. CI and registry
  visibility remain in progress; this plan makes no completed-publication claim.

## Retirement

Retire this plan together with its cleanup plan only after this final-reality snapshot is committed
and JSR CI confirms registry visibility for both published versions.

## Intent

Keep the standards-based `@sys/std/dispose` contract and make it work in Safari/WebKit realms that
lack `Symbol.dispose` and `Symbol.asyncDispose`.

The solution is deliberately small: one canonical two-symbol compatibility entrypoint, one named
Vite delivery plugin, and one separate syntax-target policy. No application patch, cache workaround,
or complete Explicit Resource Management polyfill.

## Truth

- Canonical resources correctly expose `[Symbol.dispose]` or `[Symbol.asyncDispose]`; `using` and
  `await using` can consume those protocols when syntax support or lowering is present.
- The failing Safari realm lacks the two symbol properties. Brave/Chromium provides them. Cache
  state cannot change that capability.
- The `@sys/std/dispose` guard is correct. Without a symbol, a computed key can become the string
  `"undefined"` and silently create a malformed resource.
- Vite/Rolldown targets lower syntax. They do not polyfill runtime globals or define a complete
  runtime support floor.
- Two symbols provide **disposal protocol symbol compatibility** only. They do not provide parser
  support, syntax lowering, `DisposableStack`, `AsyncDisposableStack`, or global `SuppressedError`.
- The discarded anonymous Rollup banner proved the diagnosis but was not a viable final design: it
  was production-only, hand-minified, and covered only by substring assertions.

## Design

### `@sys/std/dispose/compat`

Add `"./dispose/compat"` to `code/sys/std/deno.json`, targeting the side-effect-only module
`m.Dispose/m.Compat/mod.ts`. Importing it invokes the package-private
`m.Dispose/u.protocolSymbols.ts` kernel `installDisposalProtocolSymbols()`. Do not re-export either
surface through `Dispose`, `types.ts`, or the package root; the normal `@sys/std/dispose` entrypoint
remains non-mutating and fail-fast.

Installer contract:

- inspect both own descriptors before mutation;
- preserve an existing symbol-valued data property exactly;
- install only absent properties;
- create fresh `Symbol('Symbol.dispose')` and `Symbol('Symbol.asyncDispose')` values, never
  `Symbol.for(...)`;
- define `writable: false`, `enumerable: false`, and `configurable: false`;
- add `Is.symbol` as the canonical public predicate, implemented by one dependency-free internal
  primitive that the installer imports directly;
- be idempotent, including when a compatible source is already non-extensible;
- preflight both keys and require extensibility only when at least one key is absent;
- reject accessors, non-symbol values, inherited-only definitions, and non-extensible sources that
  need installation with one disposal-compatibility `TypeError`, leaving every preflight rejection
  unchanged;
- create all fresh values before mutation, then define all missing keys in one
  `Object.defineProperties` call.

Do not import the composed `Is` namespace or `m.Dispose/common.ts` from the installer: both widen
the bootstrap closure. The installer and `Is.symbol` composition share one dependency-free internal
predicate lane, and that closure performs no module-evaluation-time disposal work. The test seam
injects an ordinary symbol source; hostile proxies or replaced language intrinsics are outside this
compatibility contract. Errors and disposal documentation say **ECMAScript disposal protocol**, not
**native**, because either an engine or this entrypoint may establish the keys.

### `sys:dispose-protocol-compat`

Add `m.vite.plugins/m.DisposeProtocolCompat/` with one pre-enforced Vite plugin and include it by
default in `Vite.Config.app()`.

- Implement `applyToEnvironment(environment)` and apply only when
  `environment.config.consumer === 'client'`.
- Transform JavaScript and TypeScript modules in the controlled source graph.
- Prepend `import '@sys/std/dispose/compat';`; hashbang preservation is defensive.
- Make transform re-entry idempotent by using `this.parse(code, { lang, sourceType: 'module' })`
  with `lang` derived from the clean module ID, then detect an actual top-level side-effect import;
  do not infer prior injection from raw comment or string text.
- Exclude the public compatibility entrypoint and every module in its resolved static dependency
  closure, including the package-private installer and narrow predicate lane; keep that closure
  minimal and disposal-free before installation.
- Use the same transform in dev and build; replace the current reused `plugins` array so every
  `worker.plugins` invocation constructs a fresh worker plugin graph, including a new compatibility
  plugin instance.
- Add `npm:magic-string@1.1.0` through `deps.yaml` and return its generated high-resolution source
  map plus `moduleSideEffects: true`; do not use experimental bundler APIs or hand-roll offsets.

Static dependency evaluation installs the keys before every original module body outside the
compatibility module's own minimal static dependency closure. `enforce: 'pre'` places the injection
before Vite's OXC transform; lowered helper imports remain later static dependencies of the same
module. Each resolved compatibility module record evaluates once per realm; alternate URLs or
package copies may evaluate again, and installer idempotence preserves the incumbent identities.
Vite/Rolldown deduplicates the dependency within each production bundle graph. This covers
application modules, shared/dynamic chunks, bundled module workers, and explicit service-worker
inputs without banner repetition or caller-owned imports.

Add the generated `@sys/std/dispose/compat` mapping explicitly to
`m.vite/-test/u.bridge.fixture.ts`: plugin-injected imports are absent from fixture source scans and
`deno info`. Raw `publicDir` scripts, externals outside Vite's transformed graph, iframes, and
worklets are outside this contract. Do not add a compatibility option until a real native-only
consumer earns one.

### Browser syntax target

Declare and freeze one target list matching installed Vite 8.2.1's Baseline syntax floor:

```text
chrome111, edge111, firefox114, safari16.4, ios16.4
```

Derive independent arrays for production `build.target` and the default OXC target used by dev and
build. Preserve an explicit caller OXC target and `oxc: false`. Update `t.app.ts` because `oxc` is
no longer unset by default.

OXC's unbundled dev transform emits `@oxc-project/runtime/helpers/usingCtx`. Add the runtime version
matching the locked Rolldown OXC toolchain with the `helpers/usingCtx` subpath through `deps.yaml`,
regenerate dependency authority with `deno task prep`, and review that pin alongside Rolldown's OXC
version and the browser targets on each Vite major upgrade. Build may inline the helper; dev must
resolve the package.

This target lowers syntax; it does not polyfill runtime APIs. In particular, the two-symbol shim
does not establish `Promise.withResolvers` or a general Safari 16.4 API floor.

## Commit contracts

### `feat(std): add disposal protocol symbol compatibility`

- Add the `"./dispose/compat"` export, side-effect entrypoint, package-private installer, canonical
  `Is.symbol` surface, and one dependency-free primitive shared beneath them; test the installer
  through a package-internal seam rather than a second public export.
- Tighten disposal guards to require symbols and make terminology protocol-truthful.
- Prove absent, independently absent, existing, idempotent, compatible non-extensible, malformed,
  and non-extensible-needing-installation sources; exact descriptors; non-registry identity;
  pre-created values and single-call installation for missing keys; and unchanged preflight
  failures.
- Run:

  ```text
  cd /Users/phil/code/org.sys/sys/code/sys/std && deno task test --trace-leaks ./src/m.Dispose
  cd /Users/phil/code/org.sys/sys/code/sys/std && deno task check
  cd /Users/phil/code/org.sys/sys/code/sys/std && deno task test
  ```

### `feat(driver-vite): install disposal symbols in browser modules`

- Replace `RESOURCE_MANAGEMENT_BOOTSTRAP` and all banner assertions with the named plugin.
- Add direct `magic-string` authority through `deps.yaml`, regenerate dependency files with
  `deno task prep`, update fixture bridge mappings for the injected compat export, and prove that
  bridge output contains that mapping.
- Prove dev/build parity, plugin-before-OXC ordering, compatibility-closure ordering,
  deepest-static-dependency ordering, dynamic chunks, module workers, explicit service workers,
  incumbent runtime identity preservation, semantic transform re-entry despite comment/string
  lookalikes, complete bootstrap-closure exclusion, client-only filtering, side-effect retention,
  one emitted installer module per bundle graph, and valid source maps.
- Run:

  ```text
  cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test --trace-leaks ./src/m.vite.config ./src/m.vite
  cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task check
  cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test
  cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test:external
  ```

### `build(driver-vite): align browser syntax targets across dev and build`

- Replace `baseline-widely-available` with the pinned target authority and update `t.app.ts` for the
  new default OXC target.
- Add the OXC runtime helper authority and `helpers/usingCtx` subpath through `deps.yaml`,
  regenerate dependency files with `deno task prep`, bridge it into isolated fixtures, and prove
  both generated import-map and package dependency authority.
- Prove that real `using` and `await using` fixtures contain no unsupported syntax at that target;
  the dev-served helper resolves; the build helper bundles; helper lookup uses the installed
  non-registry protocol identities in a realm initially lacking engine symbols; and LIFO cleanup,
  async awaiting, sync fallback, and suppression semantics hold.
- Rebuild `@sys/driver-monaco`, then rebuild `code/sys.tools/.tmp/staging/fs.db.team` through its
  declared deploy task.
- Record exact browser versions and verify:
  - Safari production: both reported URLs start; document and service-worker disposal succeeds.
  - Safari dev: the same lifecycle fixture succeeds through Vite development serving.
  - Brave/Chrome: engine-provided symbol identities and existing behavior remain unchanged.

## Worktree and residue

- Implement the second and third commits without restoring the discarded `u.app.ts` and
  `-app.test.ts` prototype.
- Exclude `code/sys/server/src/m.server.dist/u.server/u.serve.screen.ts`; it belongs to
  `vite-preview-title-symmetry.plan.md`.
- Preserve all unrelated Monaco, server, plan, lockfile, and workspace changes.

The human restored the review-generated `deno.lock` delta before implementation. Dependency
regeneration therefore starts from a clean lockfile baseline.

Completion leaves no anonymous banner, copied bootstrap program, duplicate installer, application
shim, cache workaround, claim that targets polyfill APIs, or claim that two symbols constitute
complete or engine-native ERM support.
