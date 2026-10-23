# Review 06 — Vite producer and SRI seams

## Verdict

**Request changes: one source-established producer failure-path defect. Runtime assessment is incomplete.**

The new success-only response is a sound reduction: failed builds no longer compute or expose Dist authority, and successful responses distinguish `pin` from `manifestChecksum`. The new pipeline belongs at Vite: it uses Vite-owned projects and public FS/Server contracts, not Cloudflare's private sample fixtures. Retain those boundaries.

However, the build still ignores a failed write of its covered package declaration. It can return `ok: true` and a valid content pin for stale package bytes. This is inherited code, not a newly introduced line-level regression, but it violates the reviewed producer outcome and matters now that consumers must use covered package bytes instead of root labels.

No builds, browser tests, process tests, publication, dependency regeneration, or source edits were performed. Required runtime slots were requested in-session; none was granted during this pass. This is not a clean whole-slice acceptance or a confirmation of the plan's recorded greens.

## Baseline and authority

- Entry and exit HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3` (Dist review R1).
- Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`; validated directory/filename header and read contract, A–H workstreams, adversarial matrix, and completion boundary.
- Read the assigned README and `06-vite.review.plan.md`; no sibling report was read.
- Canon traversal completed. Discovery found no additional `AGENTS.md` under `-agent`, `code/sys.driver`, or `code/sys`, or at the searched shallow `code` ancestors.
- Opening arc reconciles without edits: `e6316e80b8cd74b0982f25c8f635ba4a28f3b219` and `872b5a34d55ecee83d8bede21446c76ebd13965d` are reachable and have exactly the recorded subjects. No reachable exact-subject match was found for the unchecked integrated replacement. The replacement remains the current unlanded arc item.
- Nine tracked Vite files are modified, with no staged Vite changes. The tenth target file, `src/m.vite/-test.external/-dist.pipeline.ts`, is untracked and was read completely twice.
- The initial broad plan read exposed checkpoint prose; none of its execution receipts or research verdicts was used as proof. Findings below come from source, diffs, and reachable pre-change source.

## Finding

### F1 — P2: package-declaration write failure still produces successful build authority

**Evidence**

- `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts:143–146`, `build`: awaits `Fs.write(path, Json.stringify(pkg, 2))` but neither requests throwing behavior nor checks its result.
- The same function proceeds to `computeDist(true)` at line 163 and the success response at line 167.
- `code/sys/fs/src/m.Fs/u/u.write.ts:7–38`, `write`: `throw` defaults to false; write exceptions become a returned `error`.
- `code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts`, `compute`: hashes the files actually present; `args.pkg` supplies only the descriptive root label. It checks its own manifest write error, but cannot establish that Vite wrote the requested declaration.
- `code/sys.driver/driver-vite/src/m.vite/-test/-build.test.ts`, `testBuild`: checks a prefix match for `pkg/-pkg.json`, root `dist.pkg`, the pin, and strict verification. It does not compare the exact declaration's parsed contents with the supplied package or exercise this write failure.
- `git show HEAD:code/sys.driver/driver-vite/src/m.vite/u/u.build.ts` confirms that ignoring this write result predates the replacement.

**Executable failure sequence (source-derived; not executed here)**

1. In an isolated, ordinary-user POSIX Vite project, finish a successful child build with readable JS/HTML and a readable `dist/pkg/-pkg.json` containing package A. A fixture `closeBundle` hook can create that regular file and make just that file read-only, leaving its parent and `dist` writable.
2. Call `Vite.build({ paths, pkg: B, exitOnError: false, silent: true, spinner: false })` with B different from A.
3. The parent's attempt to replace the read-only declaration returns `Fs.write(...).error`. The build ignores it.
4. The nonempty check and FS computation can succeed: the file remains readable, and `dist.json` is writable. The response reports success, describes root package B, and returns a pin committing package A's declaration bytes.
5. Recording that pin preserves the wrong production outcome. A consumer correctly requiring package B must reject it; generic content verification can still succeed. This is not a bypass of content hashing or of a correctly implemented consumer package check.

A narrowly injected returned write error is a deterministic alternative for the regression test; the real read-only-file variant needs a supported non-root host and careful fixture-owned cleanup.

**Invariant**: successful Vite production with an explicit package must include the requested covered declaration. A required producer write failure must not yield a successful response or newly computed pin. Root labels cannot repair failed payload production.

**Smallest correction / owner**: Vite's `build` must inspect the package write result and route failure through its existing `fail` branch before computing/saving Dist metadata. Do not add a generic package-file requirement to FS or a fallback from covered bytes to `dist.pkg`.

**Closing proof**: add a Vite-owned failed-declaration-write test with a successful child-build control. Assert `ok: false`, absence of `dist`, `pin`, and `manifestChecksum`, no new successful manifest publication, and preservation of the stale declaration rather than reporting it as package B. Strengthen the successful-build assertion to exact own membership and decoded declaration equality. Retain the no-package build control; generic Vite builds without `pkg` remain valid.

## Contract and test-claim map

All rows below are source inspection, not newly executed test results.

| Obligation | Evidence anchor | Established scope / remaining proof |
|---|---|---|
| Only successful builds expose authority | `m.vite/t.ts::Vite.Build.Response`; `u/u.build.ts::response`, `fail`; `-test/-build.test.ts::does not link an actual failed build` | Discriminated API and nonzero-child refusal are covered. F1 is the unchecked required-write path. Empty-output and FS-compute refusal branches were traced but lack a distinct inspected Vite regression. |
| Pin and document checksum have separate subjects | `u/u.build.ts::computeDist`; FS `u/u.compute.ts::compute`; `-build.test.ts::testBuild` | Manifest bytes are independently hashed in the test; pin recomputation and strict local verification are added. Shared encoder agreement is not an independent literal-vector proof; that is the contract owner's obligation. |
| Normal and workspace builds retain output authority | `-build.test.ts::testBuild`; `-build.workspace-composition.test.ts::testBuild` | Absolute/relative paths, snapshot/freeze, caller mutation, CLI base, service/module workers, dynamic chunks, workspace splitting and disposal syntax assertions remain. Workspace test gains only success narrowing; its actual execution remains outstanding. |
| Same fixed inventory across two builds | `-test.external/-dist.pipeline.ts:59–98` | Two real `Vite.build` calls on unchanged source; inventories and pins equal, timestamps/checksums differ, three distinct whole/private/public digests. No general reproducible-build claim for arbitrary configs. |
| Independent recorded projection expectations | Pipeline `Pkg.Dist.project`, record write, `Pins.capture`, `Pins.verify` | Pins originate locally before HTTP, not from downloaded manifests. Private is HTML; public is remaining payload. These names indicate inventory partitioning, not access control. |
| Metadata/layout changes do not change content authority | Pipeline second-projection document rewrite and four materializations | Root package added/changed, time changed, compact serialization changed; same recorded pins verify. Root-label absence exists in the first fixture build. No within-operation document replacement is tested here. |
| Materialization and retained-document reuse | Pipeline `Dist.materialize`, `responses.clear`, offline reuse | Four distinct cold stores; new namespace checked; retained evidence equals local verification. Offline reuse makes zero HTTP requests and retains the first document checksum. No publication provenance claim beyond the asserted materializer result. |
| Pinned hosting and per-read integrity | Pipeline `DistServer.start`, asset loop, corruption phase | `/dist.json` is 404; every payload response hash and length checked; changed bytes reject, recomputation changes pin, rename changes pin, stale manifest refuses before asset acquisition. `status !== 200` alone is broad, but paired whole-tree `content-mismatch` gives an independent corruption observation. |
| Manifest pin refusal precedes asset fetch | Pipeline `/stale/dist.json` terminal assertion | Exact `manifest-admission` / `pin-mismatch`, `cleanup: not-needed`, and one manifest-only request. Does not exercise all bounded hostile-input cases. |
| SRI hashes actual emitted/hosted bytes | Pipeline SRI loop; `u.html-integrity.fixture.ts::readAttestedHtml`, `readIntegrityAsset` | Entry JS, CSS, overlapping modulepreload hashes compared with actual bytes; written HTML is included in Dist. The pipeline manually maps the synthetic CDN base to a local public host; it does not navigate a browser to that base. |
| Actual browser SRI enforcement | `-html-integrity.loading.chromium.ts::CASES`; select/shadow browser tests | Separate original, tampered, rehashed, CORS, MIME, missing-resource, preload, cache, and module-map controls. Select/open/closed/nested shadow observations precede enabled-build refusal checks. Tests not run here. |
| SRI is not transitive execution integrity | `m.vite.plugins/t.ts::HtmlIntegrity`; README `Ownership and coverage`; `u.html.ts::finalizeIntegrityHtml` | Only output-owned HTML-linked module/CSS and overlapping modulepreloads. Dynamic-import source fixture proves written linked bytes, not protection of imported chunks. No claim for workers, CSS imports, dependency-only preloads, or arbitrary later rewriting. |
| Cached serve requires no build-native child authority | `-serve.cached.process.ts::proveCachedServe`; package `entry-serve-proof` preset; `u.fixture.serve.cached.process.ts` | Exact read/net/env-only preset; child uses frozen lock, cached-only imports, no node modules, cleared environment, null stdin. No run/write/FFI/sys permission is added to the child. New FS compute parity check runs in the parent only. |
| Cancellation/draining and cleanup | Cached proof `stopChild`, `capture`, `waitForIndex`; pipeline `finally`, `removeStores` | Child timeout/termination, pipe consumption on normal paths, body cancellation and final abort are explicit. Pipeline awaits operations sequentially, closes all hosts with `allSettled`, disposes source, and uses Rooted exclusive lease + `Tree.remove` before ordinary temp cleanup. Removal refusal prevents the fallback cleanup. No cancellation stimulus or cleanup-fault test is added by the pipeline. |
| Display remains one content identity | `u/u.build.ts::response.toString`; `m.fmt/u.Dist.ts::Dist.toString`; `m.fmt/u.Help.ts::Help.log` | Build digest is content digest; checksum is not a competing display row. Retained build digest is not hyperlinked as if it were the current document. Help consumes only canonical load results; load/display remains observation, not independent payload verification. |

### Prior load-bearing assertions

The complete scoped diff was compared with HEAD; no entire Vite test was deleted.

- Old `res.manifest.integrity === Hash.sha256(manifest.data)` becomes the equivalent exact-byte assertion on `res.manifestChecksum`; the byte-check obligation is preserved, not replaced by pin equality.
- Successful `res.dist` and metadata/worker/path assertions remain behind explicit success narrowing.
- Retained output replacement still tests changing content identity and the unlinked digest; it now names `pin.digest`, the appropriate independent-recording field.
- Failed-build link refusal remains and gains absence checks for all three authority fields. Historical failure responses carrying a computed Dist are deliberately removed under the new contract.
- Cached manifest's old composite digest is replaced by the v2 discriminator/digest. The new parent-side producer parity assertion fixes its authorship; the restricted child's permission/lifecycle assertions remain intact.
- The shared SRI fixture adds one success guard. Its written-HTML attestation, toolchain evidence, asset digests, preload identity, and browser matrices are retained.
- The pipeline is additional composition proof. It does not replace FS's hostile-input vectors, Server's publication/lease tests, Cloudflare's sample build record/partition policy tests, or browser enforcement.

## Import and permission graph

No imported module grants runtime permission merely by exporting a helper. These tests execute under Vite's owning tasks, not the imported owner's test preset.

| Import / route | Owner and visibility | Purpose / direction / runtime authority |
|---|---|---|
| Pipeline `@sys/server/dist`, `@sys/server/t` | Server public exports, confirmed in its `deno.json` and `src/m.server.dist/mod.ts` | Consumer integration with materialization and pinned hosting; type import has no runtime authority. Needs filesystem and local network operations. Does not import Server's private fixtures. |
| `../../-test.ts` → `-test/mod.ts` → `-test/common.ts` → `../common.ts` / `common/mod.ts` / `common/libs.ts` | Vite-owned internal barrels | Shared testing and public lower-owner libraries. This spelling does not leave Vite. |
| Barrel `Fs`, `Path`, `Pkg` | Public `@sys/fs`; overlapping testing re-exports expose FS helpers | Real temp projects, production, projections, capture/verify, capability cleanup. FS owner unit preset is read/write/env without run/net/FFI; the integration's extra powers are Vite's, not borrowed private FS fixtures. |
| Barrel `Hash`, `HashFmt`, `Json`, `Obj`, `Str`, `Time`, `Is` | Public Crypto and Std subpaths | Byte checks, rendering, bounded policy input construction, fixtures. No new hashing or canonicalization implementation. |
| Barrel `Testing`, `Browser`, BDD assertions | Public `@sys/testing/server`; `WebFixture` is also re-exported from public `@sys/testing/web` | Test support, not a downstream product fixture. `Testing` composes public Std server-testing helpers. `Browser` uses the testing owner's Chrome session/process implementation; needs process, temp filesystem, environment discovery, and loopback CDP authority when called. The pipeline does not call Browser. |
| `./u.html-integrity.project.ts` | Vite private test fixture | Generates JS/CSS/HTML and a real child config. No sample-deploy imports. Shares the SRI project's semantics, not downstream build selection policy. |
| `../-test/u.bridge.fixture.ts::writeLocalFixtureImports` | Vite private test helper | Reads root workspace/export/dependency authority, runs `deno info --json`, writes fixture-local import/package/config files, returns restoration. Uses public `@sys/driver-deno/runtime`, FS, Process. Does not regenerate repository dependencies. Runtime graph tooling/cache effects still require the serialized slot. |
| Generated child config | Public `@sys/driver-vite`, `/plugins`, `@sys/fs`, Std JSON/Is, plus `vite` and Node module interop | Real driver production and toolchain evidence. Bridge resolves local workspace exports/import-map authority. The use of public exports differs from deep-importing another package's sample fixture. |
| `../mod.ts` in pipeline / build tests | Vite's own runtime module | Executes the actual driver, not a copied producer implementation. `Wrangle.command` supplies explicit output/base and owns bootstrap disposal. |
| Cached serve child → Vite entry → lazy `u.load/u.serve.ts` → `@sys/server/dist/server` | Vite entry and narrow public Server hosting export | Local-unpinned serving only. Child never imports the build test fixture or receives Vite's test preset. Parent owns fixture creation and FS parity calculation. |
| SRI fixture `vite` / `VitePlugins` | Public external Vite package and Vite-owned plugin | Direct in-process builds isolate parser/build refusal; the normal SRI fixture separately exercises a real driver child. Native Vite/Rolldown initialization is why read-only-looking test selection is not permission-free. |

`driver-vite/deno.json` selects `-P=test`: read/write/env/net/run/FFI plus enumerated sys permissions. `test:dist:pipeline` is explicitly included after unit, entry-process, and candidate tasks in ordinary `test`. Its filename does not rely on automatic `*.test.ts` discovery. `test:integrity` separately names plugin tests and the browser entry; browser coverage must not be inferred from ordinary pipeline execution.

The build child is narrower than the parent: `u/u.wrangle.ts::permissions` grants output/cache write roots, package-native FFI roots, Deno executable run authority, read/env, listed sys operations, and localhost build network authority. Cached serving is narrower again: read only its prepared dist, `127.0.0.1:0`, and three presentation environment variables.

**Relay boundary**: no relay or Cloudflare sample workflow is invoked by this pipeline. The fixture source serves only exact map entries, with no forwarding; policy uses one source origin, no credential origins, and zero redirects. The SRI browser source likewise serves only its selected exact JS/CSS URLs. This establishes no relay-confinement or real-provider workflow acceptance. Server browser-policy source was inspected for separation, but the pipeline does not supply or exercise that policy.

## Production concepts and economy

- `Build.Response`'s success union earns its place: it prevents failed production from appearing to carry authority.
- `pin` is the independent-recording form of the same content identity; `manifestChecksum` names document continuity. Neither is a new verification algorithm or compatibility lane.
- FS remains the producer/admission owner. Vite contains no duplicate v2 encoder and does not introduce package-policy verification at a generic owner.
- The pipeline's `transportPolicy`, `readBytes`, and `removeStores` are fixture-local concerns. In particular, capability cleanup is necessary because materialized stores are sealed; replacing it with recursive deletion would lose ownership checks.
- Keep isolated build, cached-child, written-byte SRI, and browser proofs separate. They falsify different authority and lifecycle claims. Sharing one broader fixture would either grant cached serving build powers or blur HTTP byte checks with browser enforcement.
- Optional only: the duplicated `VERBOSE = false` diagnostic printing in the two build suites could be removed locally without changing assertions. Creating a cross-package helper for it would be worse. No test-count reduction is recommended.
- Test comments generally explain asymmetry and limits well. The package declaration assertion is the significant pedagogical weakness: a prefix/existence check does not teach or prove the bytes contract; strengthen it with F1.

## Commands and execution limits

Read-only commands actually used included:

```sh
git rev-parse HEAD
git status --short --untracked-files=all -- code/sys.driver/driver-vite
git diff --cached -- code/sys.driver/driver-vite
git diff -- code/sys.driver/driver-vite
git diff --check -- code/sys.driver/driver-vite
git show -s --format='%H %s' e6316e80b 872b5a34d
git merge-base --is-ancestor e6316e80b HEAD
git merge-base --is-ancestor 872b5a34d HEAD
git log --format='%H %s' --fixed-strings --grep='feat(dist)!: unify build pins and verification on canonical content identity'
git show HEAD:code/sys.driver/driver-vite/src/m.vite/u/u.build.ts
```

Also used path discovery, candidate-line searches, scoped dependency status, and full-index Vite diffs. Initial hyphen-prefixed discovery arguments failed and were corrected with `./`; some candidate paths did not exist. These were not permission denials. `git diff --check` produced no diagnostics for tracked Vite changes; it does not cover the untracked pipeline or establish type/runtime correctness.

Requested but **not executed**, from `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`:

```sh
deno task test:dist:pipeline
deno task test:entry:process
deno task test:integrity
deno task test:unit --trace-leaks ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts
```

Effects include fixture and build-output writes/removal, dependency/cache interaction through configured toolchains, Vite/serve child processes, local HTTP listeners, sealed-store cleanup, and Chromium for integrity tests. No real Cloudflare sample build should be substituted. Package check and the new F1 regression also remain unexecuted; no task or test source was added for this review.

## Inspected-file inventory

The following inventory is in addition to the charter, README, governing plan, and canonical files. Paths below `code/sys.driver/driver-vite/` are listed relative to that explicit base; symbols and obligations are mapped above.

### Attributable Vite deltas — complete live reads and diff inspection

- `deno.json`
- `src/m.vite/t.ts`
- `src/m.vite/u/u.build.ts`
- `src/m.vite/-test/-build.test.ts`
- `src/m.vite/-test/-build.workspace-composition.test.ts`
- `src/m.vite/-test.external/-dist.pipeline.ts` (untracked)
- `src/m.vite/-test.external/u.html-integrity.fixture.ts`
- `src/-entry/-test.external/-serve.cached.process.ts`
- `src/-entry/-test.fixture/serve/manifest.json`
- `src/m.fmt/u.Help.ts`

### Vite supporting surfaces — complete reads except the indicated README section

- `README.md` — HTML subresource integrity section, lines 57–148
- `src/m.vite/mod.ts`, `src/m.vite/m.Vite.ts`, `src/m.vite/common.ts`
- `src/m.vite/u/u.wrangle.ts`
- `src/m.fmt/u.Dist.ts`
- `src/m.vite/-test/u.bridge.fixture.ts`
- `src/m.vite/-test.external/u.html-integrity.project.ts`
- `src/m.vite/-test.external/u.html-integrity.browser.ts`
- `src/m.vite/-test.external/-html-integrity.chromium.ts`
- `src/m.vite/-test.external/-html-integrity.loading.chromium.ts`
- `src/m.vite/-test.external/-html-integrity.select.chromium.ts`
- `src/m.vite/-test.external/-html-integrity.shadow.chromium.ts`
- `src/m.vite.plugins/t.ts`
- `src/m.vite.plugins/m.HtmlIntegrity/m.HtmlIntegrity.ts`
- `src/m.vite.plugins/m.HtmlIntegrity/u.html.ts`
- `src/m.vite.plugins/m.HtmlIntegrity/u.url.ts`
- `src/m.vite.plugins/m.HtmlIntegrity/-test/-html-integrity.build.test.ts`
- `src/-entry/-test.external/u.fixture.serve.cached.process.ts`
- `src/-entry/-test.external/u.serve.waitFor.ts`
- `src/-entry/-test.fixture/serve/index.html`
- `src/-entry/u.command/u.build.ts`
- `src/-entry/u.command/u.serve.ts`
- `src/-entry/u.command/u.load/u.serve.ts`
- `src/-test.ts`, `src/-test/mod.ts`, `src/-test/common.ts`
- `src/-test/u.ROOT.ts`, `src/-test/u.SAMPLE.ts`
- `src/common/mod.ts`, `src/common/libs.ts`, `src/common/t.ts`

### Lower-owner supporting evidence

- `code/sys/fs/deno.json`, `code/sys/fs/src/mod.ts` — public exports and task authority
- `code/sys/fs/src/m.Pkg/t.ts:1–270` — production/projection/pin/load/verification inputs
- `code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts` — complete producer and manifest-save path
- `code/sys/fs/src/m.Pkg.Dist/u/u.load.ts` — complete bounded observation path
- `code/sys/fs/src/m.Fs/u/u.write.ts` — complete returned-error behavior
- `code/sys/fs/src/m.Fs.capability/m.Rooted/t.ts:78–126,242–267` — removal/lease contract; `Tree.remove` returns removed/absent, failures throw
- `code/sys/server/deno.json`, `code/sys/server/src/m.server.dist/mod.ts` — public ownership
- `code/sys/server/src/m.server.dist/t.ts:1–290` — materialization, policy, failure and generation contracts
- `code/sys/server/src/m.server.dist/u.materialize/u.run.ts:1–250` — admission-before-stage/pull, fetched-document fence, initial generation path; promotion remainder not reviewed
- `code/sys/server/src/m.server.dist/u.server.start.verified/u.request.handler.ts` — complete serving inventory and local-manifest distinction
- `code/sys/server/src/m.server.dist/u.server.browser/u.policy.ts` — complete separate browser policy; not exercised by pipeline
- `code/sys/testing/src/m.server/mod.ts`
- `code/sys/testing/src/m.server/m.Testing/m.Testing.ts`
- `code/sys/testing/src/m.server/m.Browser/mod.ts`
- `code/sys/testing/src/m.server/m.Browser/u.chrome.ts`
- `code/sys/testing/src/m.server/m.Browser/u.chrome.launch.ts`

Lower-owner inspection supports seam classification, not a substitute for assigned FS/Server/contract reviews. No claim is made that the whole transitive dependency graph or every unchanged Vite sample file was audited.

## Drift check and exact remainder

Exit HEAD, scoped staged/unstaged state, and complete tracked Vite diff matched entry observations. The untracked pipeline was reopened in full and matched the entry content; FS compute/write sources used for F1 were also reopened unchanged. This is content comparison, not inference from matching filenames/status alone. No target drift was observed.

The procedural freeze was not independently enforceable by this reviewer, and a byte-complete entry/exit snapshot of every lower-owner dependency was not captured. Thus this is not immutable-snapshot certification. Concurrent unrelated Cloudflare sample/UI/planning deltas were not attributed to this migration or edited.

Remaining before whole-slice acceptance:

1. Adjudicate F1 and execute its failed-write plus successful declaration-byte controls.
2. Obtain a coordinator-serialized slot and run the four commands above against a confirmed frozen dependency baseline, plus the owning package check.
3. Establish runtime results for fixed-inventory equality, cold/warm materialization, per-read refusal, restricted cached serving, and the actual browser matrices; no receipt from this review currently establishes them.
4. Keep hostile admission, publication settlement, cross-process lease/cancellation, real relay/provider behavior, and Pi package/release acceptance with their respective owners. The pipeline has no cancellation stimulus and does not prove those broader obligations.

Only this assigned report was written. No source, plan, Git state, profile, permission, dependency, or retained evidence was changed.
