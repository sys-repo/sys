self-hosted-assets.plan.md
- [x] 19e769b6c feat(driver-monaco): self-host Monaco runtime assets
- [x] b69634e15 fix(driver-monaco): avoid whole-tree verification in development

**Status:** Complete and reconciled; JSR publication is in progress.

## Final reality

- `19e769b6c` introduced the reusable `MonacoVite.plugin()` integration, upstream loader surface,
  complete `monaco-editor/min/vs` emission, notices, source/output path-to-hash parity, source-tree
  admission, and development/root/nested Chromium worker proof.
- `b69634e15` separated development source-location resolution from production whole-tree
  verification. Development serves only requested canonically bounded regular files; production
  retains complete size, tree, hash, and notice verification.
- The runtime tree remains one application-release artifact. The browser proof covers same-origin
  loader, editor, CSS, TypeScript worker, JSON worker, notices, root deployment, and nested
  `/tools/monaco/` deployment without unintended third-party Monaco requests.
- The downstream [`start-ui.design.md`](../@sys.driver-pi/start-ui.design.md) arc owns verified
  materialization, pinned hosting, and Service Worker origin policy. This plan supplies its complete
  Monaco runtime-emission and dedicated-worker prerequisite; it does not own that downstream policy.
- Workspace refresh `69bd948b9` set `@sys/driver-monaco@0.0.292`. The generated
  [JSR workflow](../../../.github/workflows/jsr.yaml) publishes it as job 13/13; CI and registry
  visibility remain in progress, so this plan makes no completed-publication claim.

## Retirement

This plan is ready to retire after this final-reality snapshot is committed and JSR CI confirms
registry visibility for [`@sys/driver-monaco@0.0.292`](https://jsr.io/@sys/driver-monaco@0.0.292).
After retirement, reconcile the checked prerequisite reference in
[`start-ui.design.md`](../@sys.driver-pi/start-ui.design.md); its remaining work is downstream.

## Decision

Ship the installed `monaco-editor/min/vs` tree with the package's Vite distribution and configure
Monaco's upstream loader to use it. Keep the loader's CDN default for library consumers who do not
choose a source.

This is an application/build-boundary policy, not editor-component behavior and not a new loading
abstraction.

## Subject

The subject is a trustworthy Monaco runtime release unit:

```text
application code
+ matching Monaco runtime assets
+ upstream notices
+ one cache identity
```

Copying files is insufficient. A release is valid only when those four parts remain coherent through
builds, deployments, and dependency upgrades.

## Boundaries

- `Monaco.loader` is the upstream `@monaco-editor/react` singleton.
- Loader configuration occurs before the first editor mount or direct `loader.init()` call.
- `Monaco.Editor` remains a renderer/adapter; it does not own asset origin or deployment policy.
- The package DevHarness chooses same-origin assets at its application entry.
- Library consumers retain upstream behavior unless they configure the loader.
- Generated Monaco assets stay in build output; no copied runtime tree is checked into source.

## Release contract

### Source identity

Resolve `monaco-editor`, walk to the nearest package manifest whose `name` is `monaco-editor`, and
derive `min/vs` from that package root. Do not encode assumptions about how many parent directories
separate the package entry from its manifest.

The package manifest, runtime tree, `LICENSE`, and `ThirdPartyNotices.txt` must come from the same
resolved dependency installation.

### Completeness

The complete pinned `min/vs` tree is the unit of deployment. Do not curate a speculative subset: the
loader resolves language modules, CSS, fonts, and workers at runtime.

The source-side check must fail when the runtime tree is missing or empty, contains a symbolic link
or special entry, either notice is not a regular file, or the complete tree exceeds its reviewed
size ceiling. Do not maintain a handwritten index of upstream filenames; that duplicates Monaco's
package structure and will drift.

After Vite writes the bundle, compute composite hashes and require the output's `vs` subtree—
excluding only the two emitted notice files—to match every regular file in the installed `min/vs`
tree exactly. Compare complete path-to-hash maps, not only composite digests. Verify both emitted
notices byte for byte against their package sources. Missing, changed, renamed, or extra runtime
files are build failures. Browser smoke proof, rather than a static filename list, establishes that
loader, editor, CSS, and language-worker behavior actually runs.

### Size policy

The full runtime tree has a reviewed ceiling of 32 MiB. This is an upgrade tripwire, not a pruning
target or a promise that every client downloads the whole tree. If a future pinned Monaco release
crosses it, inspect the upstream delta and raise the ceiling explicitly only when the complete-tree
policy remains justified.

Do not record exact total build bytes in this plan; generated application chunks and metadata make
that observation volatile. The build should report the current runtime file count and formatted size
each time it verifies the tree.

### Provenance

Emit Monaco's exact `LICENSE` and `ThirdPartyNotices.txt` into `dist/vs`. The deployable artifact is
not complete without them.

### Cache identity

Treat application code and `vs` as one atomic release. Preferred deployment places the entire dist
beneath an immutable version- or digest-scoped parent URL. If `/vs` is unversioned, deployment must
replace the app and tree atomically and serve `/vs/**` with revalidation
(`Cache-Control: no-cache`). Never apply long-lived immutable caching to stable unversioned names
such as `loader.js` and `editor/editor.main.js`. The package service worker currently leaves `/vs`
outside its cache; deployment headers and release identity own this policy.

`new URL('./vs', document.baseURI)` is intentional: the same artifact must resolve correctly at an
origin root and beneath a nested application path.

## Implementation map

- `src/m.Monaco/m.Monaco.ts` exposes the upstream loader singleton.
- `src/m.Monaco/t.ts` declares the loader on the public driver surface.
- `src/t.def.monaco.ts` defines `MonacoLoader`; `src/types.ts` exports it through
  `@sys/driver-monaco/t`.
- `src/-test/entry.tsx` configures the same-origin URL before rendering.
- `@sys/driver-monaco/vite` exposes `MonacoVite.plugin()` as the reusable integration for every Vite
  application that opts into self-hosting.
- `src/m.Vite/m.MonacoVite` owns Monaco package resolution, development serving, production copying,
  notices, size policy, source-tree admission, and source/output parity; this is public driver
  capability, not sample-script logic.
- `vite.config.ts` is a declarative consumer: `vitePlugins: [MonacoVite.plugin()]`; its relative
  Vite base makes one production artifact portable between root and nested deployment paths.
- `-scripts/task.browser-smoke.ts` is the repeatable development/root/nested browser release proof.
- `deno.json` keeps source, scripts, and Vite configuration inside the package check surface.
- `README.md` documents initialization timing, self-hosting, Vite integration, notices, and
  cache/deployment policy.

## Upgrade protocol

For every `monaco-editor` upgrade:

1. Change the pinned dependency through the normal workspace dependency workflow.
2. Run the package check, tests, publish dry-run, and production build.
3. Let package-identity, regular-tree, notice, size, and source/output-hash checks fail closed.
4. Inspect any size-ceiling or source-tree-contract change rather than weakening the checks
   reflexively.
5. Repeat the browser smoke proof against Vite development and production, including language
   workers and nested-base deployment.
6. Confirm the network contains no unintended third-party Monaco request.

## Proof

Established evidence:

- package checks, full tests, publish dry-run, and production builds pass;
- production verification admits only a regular source tree, enforces the 32 MiB ceiling, proves
  exact source/output path-to-hash parity, and proves byte-identical notices;
- a sanitized HAR showed successful same-origin loader, editor, CSS, worker-bootstrap, and default
  editor-worker requests, with no Monaco request to jsDelivr or another third-party origin;
- `deno task smoke:browser` mounts TypeScript and JSON editors, observes diagnostics from both
  language workers, and checks runtime resources and browser errors in Vite development, root
  production, and the same production artifact beneath `/tools/monaco/`;
- the production smoke records every same-origin request and fails on any non-success response.

The repeatable browser proof closes the language-worker and nested-path gaps left by the original
root-path HAR.

### Acceptance proof

The bounded feature requires all of the following evidence:

- package check, full tests, and publish dry-run pass;
- the public API proof imports `MonacoLoader` from `@sys/driver-monaco/t`;
- the production build emits both notices and compares the complete source and output path-to-hash
  maps, not only their composite digests;
- runtime output remains beneath the reviewed 32 MiB ceiling;
- Vite development loads the same-origin runtime without relevant failures;
- root and nested production smokes initialize the editor and start its default, TypeScript, and
  JSON dedicated workers;
- observed loader, CSS, language, and worker requests stay on the intended origin, with no Monaco
  request to jsDelivr or another unintended third party; and
- browser console and network remain free of relevant failures.

The exact-map requirement is security-relevant: the current composite digest orders entries by path
but does not itself bind path names. Source/output parity must compare the complete `hash.parts`
records so a renamed or substituted path cannot satisfy the release check merely by preserving the
ordered content hashes.

## Verified Dist composition

The plugin writes `vs/**` during Vite's awaited bundle lifecycle. `@sys/driver-vite` subsequently
computes `dist.json`, so every emitted Monaco runtime file and notice becomes an ordinary declared
Dist part with an exact path, size, and checksum. `Dist.materialize` and `DistServer` remain the
owners of authenticated acquisition, exact-tree verification, pinned part reads, and HTTP response
policy; this plugin neither bypasses nor reproduces those owners.

Monaco's default, TypeScript, and JSON processing require dedicated Web Workers. A verified browser
host must preserve those application capabilities while governing Service Worker persistence
separately. The downstream `start-ui.design.md` arc owns that browser-origin policy and must prove
the exact built artifact through pinned local hosting and materialization. Blanket worker denial is
not an admissible integration strategy.

## Non-goals

- No replacement for the upstream loader.
- No change to the default asset source for external library consumers.
- No worker bundler redesign.
- No hand-maintained subset of Monaco runtime files.
- No package-global CDN policy inside React components.
- No claim that static file presence substitutes for browser proof.
