# Review 05 — Cloudflare inventory and sample selection

## Verdict

**Request changes: one P2 documentation defect.** The package's primary consumer guide still teaches the removed byte-pin contract and whole-manifest callback shape. No additional runtime correctness defect was established in the inspected slice.

This is an independent review of Dist review R1, not adoption of the governing plan's checkpoint or another review's verdict. STIER/TMIND/BMIND were applied to consumer understanding, failure-path maintenance, and hostile inputs. No sibling report was opened.

## Baseline and reconciliation

- Repository: `/Users/phil/code/org.sys/sys`.
- Entry and exit HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
- Governing plan: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Reachable exact-subject history independently matches `e6316e80b8cd74b0982f25c8f635ba4a28f3b219` and `872b5a34d55ecee83d8bede21446c76ebd13965d`. No reachable exact-subject match was returned for the breaking replacement. The opening arc therefore remains unchanged: two landed prerequisites, then the unlanded replacement under review.
- Cloudflare entry/exit status: 31 modified tracked files, no staged changes, no untracked source under the package. The target is the worktree, not HEAD's old implementation.
- The image-link deltas in sample `src/ui/index.html`, `-scripts/-test/-ui.images.test.ts`, and `vite.config.ts` are concurrent work, not attributed to this migration. Their boundary interactions were inspected; no change was requested to them.
- Entry patches and exit `git diff --full-index --unified=0` patches agreed in content and new-blob identity prefixes across all 31 changed files. This checks content, not just matching status. The package README remained tracked and unchanged, which is the omission in F1. No scoped drift was observed.
- Dependency inspection included the untracked Std content encoder. There is no immutable snapshot or byte-complete attestation of the entire transitive workspace dependency graph; the supplied procedural freeze remains the launch premise. These conclusions do not establish stability of unrelated concurrent work.

## Prioritized findings

### F1 — P2: the public README instructs callers to use a pin and callback contract that now refuse

**Evidence:** `code/sys.driver/driver-cloudflare/README.md:75–78` prescribes `{ 'dist.json': checksum }`, defines it as SHA-256 of complete manifest bytes, and says construction validates metadata. Lines 103–105 describe immutable manifest metadata and `dist.hash.parts` as callback input.

The actual replacement is explicit:

- `src/m.r2/m.ReadRoute/u/u.dist.ts:22–24`, `snapshotDist`, requires `Pkg.Is.distPin` and snapshots `{ scheme, digest }`.
- `src/m.r2/m.ReadRoute/m.fromDist.ts:50–62` admits through FS, then supplies `admitted.evidence.content`.
- `src/m.r2/t.ts`, `ReadRoute.FromDist.Args` and `Routes`, describe independent content expectations and `DistContent`, not authenticated root metadata.
- Executed `src/m.r2/-test/-m.ReadRoute.fromDist.test.ts`, “refuses invalid input before storage or callbacks,” supplies the README's old shape using a real document checksum and proves `invalid-input`, zero signing, zero policy calls, and zero fetches.

**Failure/misuse sequence:** obtain a valid v2 manifest and independent checksum of its exact bytes; follow the README and pass `{ 'dist.json': checksum }` to `fromDist`. TypeScript rejects the input shape, or an untyped caller receives `invalid-input` before storage work. Merely repairing the pin while keeping a callback that reads `dist.hash.parts` also fails: its argument is now `{ scheme, digest, parts }`; root labels and build metadata are not supplied or authenticated.

**Violated invariant:** a clean breaking replacement must replace active first-party examples and explain the narrower authority honestly. This is the package's primary API guide, linked from the updated sample README, not historical migration prose.

**Smallest correction / owner:** Cloudflare owner updates the constructor summary and “Routes from a pinned Dist manifest” section together. Show an independently retained `{ scheme: 'sys.dist/v2', digest }` expectation from the producer/selection workflow; explain descriptor recomputation and callback `content.parts`; retain the existing warnings about later response bodies, routed manifests, and absent provenance. Do not obtain the expectation from the same download, restore old input acceptance, or broaden response verification.

**Closing proof:** type-check and exercise the revised example against a fixture with a separately retained producer pin. Require successful selection with only `scheme`, `digest`, and `parts`, metadata-only invariance, and continued refusal of the old pin. Re-scan the package README for active byte-pin/whole-manifest claims. Existing runtime refusal and callback-shape tests already provide the negative controls; no live R2 access is needed.

## Selection and document-fence map

Paths in this section are relative to `code/sys.driver/driver-cloudflare/-sample/deploy/` unless stated otherwise.

| Boundary | Retained authority and observable proof |
| --- | --- |
| Builder → projection | `-scripts/task.build.ts::buildSample` invalidates both records before outputs/building, requires `built.ok`, and passes the producer's `built.pin` into FS projection. It does not discover a pin from a downloaded manifest. Failure leaves no publishable record. |
| Projection → private/public pins | `partitionBuild` and `selectionFiles` in `src/m.deployment/u.selection.ts` consume admitted content only. Private payload is exactly `index.html`; public requires JS/CSS and allows the specified assets, not HTML, workers, source maps, or unsupported names. Each output receives its own FS-computed content identity. |
| Source document through projection | Inspected `code/sys/fs/src/m.Pkg.Dist/u/u.project.ts::projectWithIo`: capture source `manifestChecksum`, select, checksum-read payloads, stage/verify/promote outputs without clobber, then reverify source and compare the original checksum. Partial-publication and cleanup evidence remain separate. This was source inspection, not a rerun of FS's full projection adversarial suite. |
| Payload total | `buildSample` sums sizes from admitted `content.parts`, not `build.size.total`. The sample's metadata-forgery test changes root labels, time, and reported totals while retaining both selected pins and the independently calculated payload total. |
| Record → immutable inputs | `snapshotInputs` demands the exact record fields, matching build/config public base, safe bundle size, and exact named private/public pins. Shared Pins capture freezes copies. Old-only/mixed pin shapes and record accessors refuse. Configuration/credential callbacks cannot retarget the captured expectations. |
| Local selection → rechecks | `selectBuild` captures the input pin before awaiting verification, captures the first successful document checksum, and closes over both. Rechecks return `changed` for a content-equal replacement document; caller mutation cannot reset either baseline. |
| Selection → proof expectations | `-scripts/task.proof.local.ts::prepareProof` snapshots each private file, compares manifest bytes to the initial document checksum and payload bytes to admitted part hashes, then invokes the same fenced verifier. Tests replace metadata before the manifest snapshot and after the last payload snapshot; both refuse. A fresh independent selection of the replacement still succeeds. |
| Expectations → delivery proof | `proveWith` compares actual private GET bytes using ordinary HTTP byte checksums, checks HEAD metadata and route refusals, then performs the fenced final local recheck. Metadata replacement after selection refuses without a verified receipt, while listener cleanup still completes. Reporting/client/server failure composition remains intact. |
| Record → publication request | `task.push.ts::pushSample` reloads bounded local inputs, verifies both projected inventories and filename policies before invoking the publisher, and supplies only the selected audience directory/namespace with unresolved credential references. Missing/changed partner output, stale pins, or old records do not trigger rebuilding, repinning, or one-target fallback. |
| Publication limit | This is preflight over caller-maintained local outputs, not a leased transaction across two separate push commands. The README explicitly requires outputs/configuration to remain unchanged until push completes. The sample tests do not establish remote success, atomic two-bucket publication, or arbitrary concurrent-writer protection. |
| Browser/status | `src/ui/u.load.ts` observes schema-recognized manifests and exact received-document checksums; it does not recompute/verify payload identity. `ui.App.tsx` explicitly says observations are unpinned, keeps one content row, labels reported size unverified, and moves the checksum to a diagnostic disclosure. `u.status.ts` instead displays the digest from a locally pinned verification. Neither is a provider/browser-execution receipt. |

## Route admission and lifecycle assessment

Cloudflare paths here are relative to `code/sys.driver/driver-cloudflare/`.

- `m.fromDist.ts` captures source, independent pin, budgets, callbacks, and signal before signing. Invalid inputs refuse before storage. `snapshotSource` retains the signer/receiver; `signedUrl` checks the exact S3 origin, bucket, and key at every read.
- `u/u.read.ts` counts decoded body chunks before retaining them, rejects unsupported response/encoding shapes, omits credentials, follows no redirects, and owns late-body cancellation. Manifest acquisition uses `manifestLimits.manifestBytes`, independently from later response limits.
- `Pinned.admitManifest` is the public FS admission owner, not a Cloudflare reimplementation. Inspected owner code uses fatal UTF-8/native JSON, finite document/entry/path/prefix/size work, supported scheme, canonical part parsing, descriptor recomputation, and independent pin comparison. Excluded metadata is not recursively cloned or passed to policy. Synchronous parsing/hashing is not claimed interruptible or deadline-bounded.
- `snapshotDistRoutes` checks own data descriptors, rejects proxy/accessor/thenable/invalid-key results, permits only admitted own payload members or explicit `dist.json`, and privately copies the map. Ordinary native Promise rejection observation remains deliberately narrower than arbitrary caller-owned async work.
- No route policy runs on failed acquisition/admission. Metadata-only changes produce the same narrow content view. Path/hash substitution with an internally consistent new digest refuses the stale expectation before selection.
- Read deadlines end after manifest-read cleanup; route selection and admission have no timeout. Cancellation still covers construction, including abort inside policy. Request cancellation is separate after readiness. Read slots remain held through unsettled work/cleanup.
- Later manifest and payload bodies are **not** checked by construction-time admission. Both the library's changed-response test and sample bootstrap test prove this limit rather than accidentally promising it away. The local proof adds explicit byte comparison; ordinary serving does not.

## Prior assertion → retained/replaced proof

Compared current source and staged/unstaged patches against reachable HEAD. No pre-change suite was executed.

| Prior load-bearing signal | Disposition and current proof anchor |
| --- | --- |
| Expected exact-document pin refuses different manifest bytes | Obsolete as distribution identity. Replaced by independent v2 `pin-mismatch`, malformed descriptor, path/hash substitution, and old/mixed-input rejection in `-m.ReadRoute.fromDist.test.ts` and sample `-bootstrap.test.ts`. Exact bytes remain separately fenced where an enclosing operation needs them. |
| Whole-manifest immutable policy input | Intentionally removed. The route success test asserts exactly `digest`, `parts`, `scheme`; metadata-only test proves unchanged policy evidence. Sample selection tests use content-only filename fixtures. |
| Declared build totals must agree for admission | Obsolete metadata authority. Forged descriptor digest/part tests retain malformed-content refusal; new build test proves admitted totals instead of trusting metadata. |
| Suspend asynchronous ignore-rule hashing during admission to prove cancellation/read-timeout separation | That executable phase no longer exists. Replacement lifecycle test proves no asynchronous metadata digest is invoked. Late signing/fetch cleanup, pre-abort, abort-inside-policy, and ready-handler cancellation remain separate executed controls. Source explicitly preserves the read-only deadline boundary. |
| Captured signer, origin, limits, callbacks, route map, and input pin | Retained and executed in route snapshot/hostile-input tests. New structured pin is copied rather than retaining a mutable caller object. |
| Build success/failure, invalidation order, no old projection fallback, narrow partition | Retained in sample `-u.build.test.ts`; new totals test adds root-metadata invariance. PNG proof still asserts identical public bytes and no private payload membership. |
| Selection proof reuses one exact expectation across capture and final verification | Replaced deliberately by a copied content pin plus private document checksum. `-u.proof.test.ts` covers changed payload, pin mutation, metadata before/after capture and during proof, plus fresh-selection positive controls. |
| Publish only selected outputs; both audiences must pass before either publisher invocation | Retained in `-push.test.ts`, including stale/partial/missing/forbidden selections, correct namespace, credential references, no temporary config, safe failures, and no retry. |
| Two primary browser hashes and document-checksum comparison to build pins | Removed as obsolete UI semantics, not loss of byte evidence. `-ui.load.test.ts` retains exact BOM/whitespace checksums and deliberately inconsistent self-reports; `-ui.render.test.tsx` checks diagnostic disclosure, full pin title, independent fetch outcomes, and explicit unpinned language. |
| Status and build formatting | `-u.status.test.ts` proves verified digest equals pin but differs from document checksum; `-u.fmt.test.ts` retains full scheme/digest, alignment, record link, and publish command. |
| Reporting/disposal and authority failures | Existing sample proof tests retain original/suppressed causes, ordered cleanup, no reporter retry, and explicit receipt-before-cleanup semantics. Synthetic denials are test inputs, not runtime authority failures. |

## Import and permission assessment

The nearest owning configs were opened before execution. Both the library and sample `test` presets grant read/write/env, **not net/run/ffi**. The sample task explicitly owns `src/-test/` and `-scripts/-test/`; it was run from the sample directory, independently of the parent suite. No permissions were changed.

| Import lane / actual owner | Surface, purpose, direction, runtime authority |
| --- | --- |
| Route tests → `../../-test.ts` → `src/-test/mod.ts` | Package-local harness; public `@sys/testing/server`, `@sys/testing/web`, and `@sys/esm/testing` exports plus local common. Route fixtures stay in the Cloudflare owner and use mocked fetch/synthetic credentials, not another package's build fixture. |
| Route admission → `@sys/fs/pkg/dist/verify`, `@sys/std/is/server`, `@sys/http/server/file-bytes` | Public owner subpaths, confirmed in export maps. Shared admission and response primitives; no imported owner's test preset is inherited. No filesystem/network acquisition occurs in manifest-only admission. |
| Sample tests → `src/-test/mod.ts` / `-scripts/-test/common.ts` | Both are sample-local barrels. Relative imports between `src/-test` and `-scripts/-test` stay inside `@sample/r2`, not a cross-package fixture borrow. |
| Sample fixture → `@sys/fs` Pkg/Fs | Public production compute/project/verify, temporary filesystem trees, and fixture cleanup. Requires the sample's read/write/env authority, not Vite's subprocess/FFI build grants. The builder is explicitly stubbed; projection and verification are real. |
| Sample bootstrap/proof → `@sys/driver-cloudflare/r2` | Public parent runtime owner. Real service/presigner/route code, synthetic credential values, mocked network. Consumer → provider direction is appropriate. |
| Sample push tests → `@sys/tools/deploy` | Public Deploy entry (confirmed export), not Tools test internals. Injected publication plus a mocked real failure path; temporary fixture dotenv values shadow process values. No inherited Tools net/run permission and no real publication. |
| Sample UI/proof → `@sys/http/client`, `@sys/http/server` | Public HTTP APIs. Fetch is mocked; proof start is injected, so sample tests need neither sockets nor network. Production proof has a separately declared serve preset; it was not launched. |
| Hash/encoding/formatting → `@sys/crypto/hash`, `@sys/crypto/fmt`, `@sys/std/pkg`, `@sys/std/ignore`, `@sys/cli/fmt`, `@sys/cli/fmt/code` | Public lower-owner surfaces. Fixtures use the real encoder/hash but do not establish independent literal cryptographic vectors. Format tests use owner ANSI/width helpers. No external execution is required. |
| UI tests → `@sys/ui-react/testing/server`; image tests → `@sys/std/testing/server/dom` | Public test-support entries, inspected through their barrels. Process-local DOM/React emulation, inert HTML parsing, lifecycle cleanup; not Chromium, browser SRI, or Vite build authority. |

No changed sample test imports a Vite-private or other downstream test fixture. The conditional Vite import in `task.build.ts` is under `import.meta.main`; sample fixture tests do not take that path. The sample's separate build preset has subprocess/FFI authority, but that does not leak into its tests.

## Economy and clarity

The production changes add no new Cloudflare module boundary or framework. The structured pin snapshot owns independent authority; the narrow content callback removes accidental metadata authority; the checksum closure owns document continuity; the snapshot-file parameter is a local seam for two distinct capture phases. These responsibilities are necessary and fit the existing owners.

Keep the separate bootstrap, selection, proof-reporting, and cleanup tests. They exercise different points at which authority escapes or resources are acquired; combining them into one large success/failure scenario would hide the phase and weaken failures. In particular, pre-manifest-snapshot, post-last-snapshot, and final-live-proof mutation are not duplicates.

Optional, nonblocking reduction: UI load/render fixtures repeat the same illustrative manifest literals. A sample-local data-only fixture could reduce drift while retaining different transport/DOM assertions and explicit inconsistent self-reports. Do not replace these with the real-build fixture: that adds filesystem work without improving observation/rendering proof. No test-count reduction is required.

The main clarity failure is F1. Runtime comments otherwise make the important asymmetries visible: source content versus observations, independent pin versus operation checksum, cancellation versus unsettled cleanup, and construction admission versus later body delivery.

## Executed verification

All commands below completed successfully in this review:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare
deno task test --trace-leaks ./src/m.r2/-test/-m.ReadRoute.fromDist.test.ts ./src/m.r2/-test/-m.ReadRoute.fromDist.lifecycle.test.ts
# 2 tests / 20 steps, zero failures

deno task test --trace-leaks ./src/m.r2/-test/-m.ReadRoute.test.ts ./src/m.r2/-test/-m.ReadRoute.lifecycle.test.ts
# 2 tests / 29 steps, zero failures

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare/-sample/deploy
deno task test --trace-leaks
# 27 tests / 134 steps, zero failures

cd /Users/phil/code/org.sys/sys
git diff --check -- code/sys.driver/driver-cloudflare
# no whitespace errors
```

Other executed observations: `find`/`rg --files` for paths and scoped AGENTS; narrow `rg -n` to locate imports and documentation; `git rev-parse HEAD`, scoped `git status --short --untracked-files=all`, staged/unstaged diffs, exact-subject reachable `git log`, and exit full-index diffs. One initial `find -agent` command failed due to the leading hyphen, then path discovery used `./-agent`; a speculative `./fs` discovery path did not exist. Neither failure involved denied access. A path-only check confirmed this report did not already exist before creation.

No real build, pin rebinding, publish, credentials lookup against real provider configuration, dependency regeneration, profile edit, Git mutation, external web lookup, or shared SRI/browser task ran. Only this assigned report was authored.

## Inspected-file inventory

Prefixes below are exact repository-relative directories; append each listed filename to its prefix. Symbol/test anchors above identify the obligations assessed. Runtime-only additional sample tests are separated from full source inspection.

### Cloudflare owner — `code/sys.driver/driver-cloudflare/`

- `deno.json`, `README.md`.
- `src/-test.ts`, `src/-test/mod.ts`, `src/common/mod.ts`, `src/common/libs.ts`.
- `src/m.r2/README.md`, `src/m.r2/t.ts`, `src/m.r2/mod.ts`.
- `src/m.r2/m.ReadRoute/common.ts`, `mod.ts`, `m.fromDist.ts`, `t.internal.ts`.
- Under `src/m.r2/m.ReadRoute/u/`: `u.dist.ts`, `u.input.ts`, `u.read.ts`, `u.operation.ts`, `u.handler.ts`.
- Under `src/m.r2/-test/`: `-m.ReadRoute.fromDist.test.ts`, `-m.ReadRoute.fromDist.lifecycle.test.ts`, `-m.ReadRoute.test.ts`, `-m.ReadRoute.lifecycle.test.ts`, `u.fixture.fromDist.ts`, `u.fixture.readRoute.ts`, `u.fixture.ts`.

### Sample owner — `code/sys.driver/driver-cloudflare/-sample/deploy/`

- `deno.json`, `README.md`, `vite.config.ts`; `src/ui/index.html` was inspected in Git diff and exercised by the inert image-source test.
- `src/common.ts`, `src/common/mod.ts`, `src/common/libs.ts`, `src/-test.ts`, `src/-test/mod.ts`.
- Under `src/m.deployment/`: `common.ts`, `mod.ts`, `t.ts`, `u.selection.ts`, `u.inputs.ts`, `u.app.ts`.
- Under `src/ui/`: `common.ts`, `u.load.ts`, `ui.App.tsx`.
- Under `src/-test/`: `-bootstrap.test.ts`, `-push.test.ts`, `-selection.test.ts`, `-ui.load.test.ts`, `-ui.render.test.tsx`, `u.fixture.ts`.
- Under `-scripts/`: `common.ts`, `task.build.ts`, `task.proof.local.ts`, `task.push.ts`, `u.fmt.ts`, `u.status.ts`.
- Under `-scripts/-test/`: `common.ts`, `u.fixture.ts`, `u.fixture.status.ts`, `-u.build.test.ts`, `-u.proof.test.ts`, `-u.fmt.test.ts`, `-u.status.test.ts`, `-ui.images.test.ts`.
- Additional suite execution, not full source review: `src/-test/-app.test.ts`, `src/-test/-inputs.test.ts`, `-scripts/-test/-service.test.ts`, `-scripts/-test/-u.clean.test.ts`, `-scripts/-test/-u.task.test.ts`. Their green results do not expand the source-review claim.

### Shared dependencies / public boundaries

- `code/sys/fs/deno.json`, `src/-exports/-pkg.dist.verify.ts`, `src/m.Pkg.Dist/m.Pins.ts`, `src/m.Pkg.Dist/u/u.project.ts`, and `src/m.Pkg.Dist/u.verify/{u.admitManifest.ts,u.admitManifest.input.ts,u.manifest.ts}` under that package.
- `code/sys/std/deno.json`, `src/m.Pkg/m/{m.Is.ts,m.Dist.Pins.ts,m.Dist.Content.ts}` (the content encoder is untracked source), and `src/-exports/-testing.server.dom.ts` under that package.
- `code/sys/http/deno.json`, `code/sys.tools/deno.json`, `code/sys/crypto/deno.json`, `code/sys/cli/deno.json`, `code/sys.ui/ui-react/deno.json`, `code/sys.ui/ui-react/src/m.testing.server/mod.ts`.
- `code/sys/testing/deno.json` lines 1–90 only: relevant exports and permission context; no testing-owner task was run.
- Governing plan in full, coordination README, assigned `05-cloudflare.review.plan.md`, canonical AGENTS and every file under `../sys.canon/-canon/`. Scoped discovery found no applicable additional AGENTS in the target ancestry.

## Evidence limits / remaining proof

- This is not an independent audit of FS's complete parser/Unicode/budget/tree matrix, Rooted OS guarantees, Tools publication settlement, or Vite output ordering. Shared source was followed only far enough to establish the Cloudflare/sample delegation and document fences.
- No new counterexample test file was authored. F1's old-pin refusal is directly exercised by an existing test run; callback misuse is a source-derived sequence. No before/after red-to-green claim is made.
- Route-local tests do not individually exercise every omitted/unknown manifest scheme or optional path-budget setting; those decisions visibly delegate to the shared admission owner. Worst-case parsing performance was not benchmarked in this slice.
- Sample fixtures prove real FS production/projection and sample-owned record/partition/proof/display behavior with a stub builder. They do not prove two real Vite builds, fingerprint rewriting, SRI, or browser execution. No parent/Vite result is substituted for sample-owned evidence.
- Public PNG source/partition assertions passed; actual public asset URLs, CORS, browser failure behavior, cache headers, bucket privacy, remote publication, and provider acceptance remain unobserved. The unrelated marked-image-link configuration must retain its separately owned build/browser proof.
- No destructive real sample build or `proof:local` against R2 is requested as a prerequisite to fixing F1. Correct the local public guide, then perform a bounded documentation/example recheck. Broader release/publication authority remains separate.
