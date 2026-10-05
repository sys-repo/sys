# Producer package and signature composition review

## Verdict: incomplete

No material defect attributable to the reviewed content-identity replacement was established. The
executed signer, package-admission, session and non-build preview controls passed. Required real
Vite build/pipeline and Pi real-preview executions remain unobserved: serialized slots were requested
but not granted in this session. This is not a clean whole-slice verdict or landing clearance.

Independent orthogonal review of attributable live worktree behavior for
`feat(dist)!: unify build pins and verification on canonical content identity` in
`/Users/phil/code/org.sys/sys`, governed by
`-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
The supplied configuration was `gpt-6-astra` at `xhigh`; this records the assignment, not an
independent runtime/model attestation. TMIND/STIER applied. No prior reports, round 01,
adjudications, recovery copies or implementing conversation were read.

## 1. Source state, attribution and evidence boundary

Entry and final observed HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
The index was empty of staged changes at both observations. This was a substantially dirty workspace,
not an examination of HEAD alone. Concurrent App/UI and other unrelated changes were left intact.

The opening arc reconciles without an edit:

- `e6316e80b` uniquely matches the reachable signer own-key correction.
- `872b5a34d` uniquely matches the reachable composite-builder own-key correction.
- No reachable exact-subject match was found for the integrated breaking item; it remains unchecked.

Only the first five plan lines and the charter-authorized requirement sections were opened. A
heading-only search located the sections; historical finding/receipt bodies were not opened.

### Material attribution

- Vite: successful-response authority became a discriminated union; required package-write failure
  returns no Dist/pin/checksum authority; producer pins replace document pins; new pipeline test/task.
- Pi: preview handoff carries the producer pin; package checks move from root labels to covered file
  reads; the session awaits/drains those reads; fixtures and real-preview assertions follow suit.
- Signer: production canonical reconstruction is the already-landed owner correction; the dirty
  test adds real FS compute → default descriptor writeback → retained-pin verification. Existing
  canonical fixtures now carry admissible v2 descriptors.
- FS/Std/Server: followed only to establish the encoding, production, observation, read,
  materialization and hosting contracts used by this composition. Their complete security surface
  was not independently re-reviewed here.

Three relevant driver files were untracked at entry and exit, and their full contents were opened
and reopened, not omitted from Git-only review:

- `code/sys.driver/driver-vite/src/m.vite/-test.external/-dist.pipeline.ts`
- `code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui/u.pkg.ts`
- `code/sys.driver/driver-pi/src/m.cli/m.profiles/-test/-u.start.gui.pkg.test.ts`

The untracked Std content encoder was likewise opened and reopened.

### Entry/exit comparison

Initial live reads and tracked patches were compared with final patches/content reads. No material
change was observed in the Vite response/build/tests, Pi preview/service/session/package sources and
selected tests, Signer test/writeback implementation, or the reopened FS compute/hash/load/admission/
verification/part-read kernels and Std content encoder. Final Git patch content identities include:

| File (repository-relative) | Final Git content identity |
| --- | --- |
| `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts` | `baac98b110a431c49a01a8734583ca6132f438d5` |
| `code/sys.driver/driver-vite/src/m.vite/t.ts` | `f72f4c13e8d581c8a1164ad49dea3c9054151c7f` |
| `code/sys.driver/driver-vite/src/m.vite/-test/-build.test.ts` | `5646386a5b5358b423b2853b93d9107e7a893623` |
| `code/sys.driver/driver-vite/deno.json` | `0f125633ea695c74070c60b53123eb1b6d21d01f` |
| `code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.preview.real.ts` | `af120ddc0baf63df090800b65bfea9b0b1893f8c` |
| `code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui/u.service.ts` | `fb5adf5fae9c253c69b9d63f41bbc097bbc321de` |
| `code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui/u.session.ts` | `8e453962137c9b7792734e3dd0343a842d45f583` |
| `code/sys.driver/driver-signer/src/m.dist/-test/-.test.ts` | `89d8e368d6405eed8eb8ac9dc5ef3cec6f1f40ec` |

The full-index patches are read-only Git observations, not objects written or commits created by
this review. Equal HEAD/status was not used as dirty-byte proof. One early combined diff exceeded
output limits; the affected primary inputs were independently opened and the final diffs split.

Root `deno.json`, `deps.yaml`, `imports.json`, `package.json`, and Pi/Signer task configurations were
opened. Content diffs against HEAD were empty at entry/exit for these and `deno.lock`. The unchanged
lockfile's index blob was `9804db48f8ef3665d62432ce0598d27284c4df79`; its complete text was not read.
Root dependency authority selects Vite `8.3.0`. Tests used frozen/cached dependency flags.

Limits: this is a procedural content comparison, not an atomic snapshot or a complete transitive
source/cache/environment receipt. Not every transitive import, generated file or native dependency
was inventoried and reopened. In particular, no actual child Vite toolchain/build result is attested.
Later changes require re-baselining the affected proof. No source, test, task, dependency or profile
was edited; this report is the only authored output.

## 2. Invariant-to-proof map

### A. Producer → covered declaration → content authority

Owner path:

`Vite.build` → `buildWith` → real Vite child → `Fs.write(pkg/-pkg.json)` →
`Pkg.Dist.compute` → FS `captureContent` → Std `Content.encode` + Crypto `Hash.sha256`.

`buildWith` defaults its internal writer seam to `Fs.write`. The public `build` delegates without
supplying a substitute. With a supplied package, the exact `pkg/-pkg.json` path is written before
compute. A returned write error branches to `fail` before cleanup/compute; `fail` no longer computes
metadata from stale output. Failed responses have neither `dist`, `pin` nor `manifestChecksum`.
`cmd.output.success` deliberately remains the child's result and can be true while `response.ok` is
false. Parent consumers must narrow on `ok`.

Source-inspected controls in `-build.test.ts`:

- Normal real builds require own membership of exactly `pkg/-pkg.json`, decode its bytes and compare
  with the intended package, then strictly verify against the build pin.
- `successful child but failed package write → no successful Dist authority` runs the real child,
  substitutes only the final writer, leaves readable stale declaration bytes, requires child success
  and one writer invocation, then asserts failed parent response, absent authority fields and no
  freshly authored `dist.json`.
- Actual missing-entry child failure also requires failed parent response and absent authority.
- Caller path mutation, worker/service-worker output, retained digest presentation and workspace
  splitting assertions remain; narrowing does not remove them.

These build tests were **not executed** here. Their positive/negative structure is discriminating;
there is no reason to replace the failed-response contract with a thrown exception.

Return/exit boundary: `exitOnError:false` returns the failed response through `finally`, which stops
the spinner and awaits command disposal. The default remains `true`, calling `Deno.exit(1)` inside
`fail`. That existing immediate-exit branch does not unwind the asynchronous `finally`; therefore
this report does not promise bootstrap-file cleanup in default-exit mode. Inspection of HEAD shows
this is inherited behavior, not introduced by the pin replacement. The selected tests explicitly
use `false`; no default-exit subprocess proof was run. Diagnostics log the parent failure even with
`silent:true`, while retained command output remains child output.

Generic Dist has no package-file requirement. Its encoder consumes path/hash/length tuples, not
root package labels. The executed Signer own-file test and Pi malformed/missing-declaration fixtures
successfully compute/verify generic distributions without a valid Pi declaration; Pi then refuses
its own package policy. The unexecuted Vite pipeline also builds without a package and projects
HTML/assets separately. Do not promote Pi's filename requirement into FS or Server.

### B. Covered declaration → generation/started-host admission

Owner path:

Pi `snapshotReleaseAuthority` / `snapshotDevelopmentAuthority` → captured expected package and pin →
Server generation/host verification → Pi `readGuiPackage` → FS `Pinned.readPart` →
`admitGenerationPkg` / `admitApplicationPkg` → readiness.

`readGuiPackage` requires own inventory membership before reading, uses the admitted part's checksum
and exact size, caps declaration bytes at 16 KiB, rejects cancellation, decodes fatal UTF-8, and
requires own bounded `name`/`version` fields. It never uses permissive unknown-package defaults or
root labels. The default read implementation is the FS owner, not an unchecked fetch. That owner
checks root/ancestors, regular-file size/bytes, checksum and cancellation.

Executed evidence in `-u.start.gui.pkg.test.ts`:

| Invariant | Positive and negative control | Real/mock boundary |
| --- | --- | --- |
| Independent package expectation | A valid different covered package refuses both checks despite matching root labels; changing only the independent expectation to the actual package admits it | Real FS compute/verify/read; simple supplied generation/host evidence wrappers for this case |
| Root labels are descriptive | Correct, conflicting and absent root labels all retain the original pin and both package decisions | Real files and strict verification |
| Missing/malformed/unlisted input refuses | Missing file, malformed JSON, missing/invalid fields, controls, malformed Unicode and UTF-8 refuse; inherited/unlisted/oversized/pre-cancelled descriptors must not call the reader | Real filesystem cases plus a throwing no-read sentinel |
| Later bytes remain authenticated | Changed, missing and symlinked declaration bytes after verification refuse | Real FS read owner |
| Declaration bytes affect identity | Different valid declarations produce different pins; the old pin refuses the second tree | Real producer and verifier |
| Cold/warm package policy agrees | Cold `promoted` and offline `existing` generation both pass generation and started-host package checks; HTML is served and pinned `/dist.json` is 404 | Real local source server, materializer, generation owner and application host; source listener closed before warm open |

The cold/warm fixture deliberately changes the descriptive root label before acquisition. Its pin
comes from locally selected producer output, not from downloaded metadata. Warm reuse retains the
admitted document checksum. No release evidence is rebound.

`u.session.ts` checks a release generation before requesting the application host, then checks the
returned host before publishing readiness. It passes the same captured directory into startup and
package reading. The host check is **post-listener**, not a pre-bind guarantee.

Executed `-u.start.gui.test.ts` controls hold each of the two package reads pending, cancel the
session, and assert abort/drain before generation release and no readiness. A separate control
terminates the host during the second read. Wrong generation prevents host startup; wrong returned
host is closed before failure dismissal. Existing primary/suppressed cleanup-error and owner-order
controls still pass. These are deterministic lifecycle doubles, not OS/browser proofs; real FS and
host behavior is separately supplied by the package and non-build preview tests.

### C. Actual preview builds reach package admission

Source-inspected path:

`mainWith` → isolated `buildPreviewGeneration` child → `-entry.build.ts::Vite.build` with package
metadata → finite successful pin handoff → `snapshotDevelopmentAuthority` → real `DistServer.start`
→ `admitApplicationPkg`.

In `-task.start.gui.preview.real.ts::startHost`, the same started host, directory and pin are tested
first with the intended expected package and then with `@wrong/preview`. The wrong snapshot's
`authority`, not the original authority, is actually passed to admission. Both preview instances
call this helper. Each successful host is closed; a failed package assertion attempts close and
preserves primary plus close errors in an `AggregateError`.

The test retains the first host while the second build/host completes, checks unchanged first
response, distinct output directories, equal content pins but different manifest checksums,
second-generation removal, first-generation survival until release, eventual first removal, and
unchanged shared Dist tree. These assertions are reachable in source, not an execution receipt.
The `startGui` callback is replaced: this proves intended real-build/host/package seams, not a full
GUI/session/browser launch.

Executed `test:preview` supplies a complementary narrower proof: builds are mocked, while selected
cases use real FS-produced files, the real session package path, and a real Dist host. Wrong pin,
pre-start mutation and post-start mutation refuse; no release generation is acquired. Temporary
outputs are disposed only after settled outcomes. Rejected GUI invocation intentionally retains its
generation when host settlement is unproven; adding unconditional deletion would violate that
existing ownership boundary. Preparation plus cleanup error preservation also passed.

### D. Compute → signer writeback → original independent pin

Owner path:

FS `DirHash.compute` → Crypto `CompositeHash.builder` lossless own-key storage → FS `captureContent`
→ Std content tuple → retained producer pin → `DistSigner.run` →
`u.run.dist.ts::writeDistSignDescriptorAndReadBytes` → lossless canonical reconstruction → Crypto
Ed25519 signing → FS load and strict verification against the original pin.

The executed integrated signer case creates an actual root file named `__proto__`, not a prototype
property. It asserts own part membership, retains a copied/frozen producer pin before signing,
adds a computed own descriptive `__proto__` key, uses default descriptor writeback, and puts the
signature sidecar outside the strict payload tree. After signing it asserts the descriptor, own
payload part, descriptive own property, preserved inventory/digest, successful strict verification
and successful detached signature verification.

Its negative controls distinguish the subjects:

1. Change only the descriptive own member: signature returns `E_VERIFY`, while the retained content
   pin still verifies.
2. Change the actual `__proto__` file from `A` to `B`: strict verification returns `content-mismatch`;
   recompute yields a different pin. The original expected pin is not reread from the artifact.

Existing signer cases passed for writeback enabled/disabled, ordinary own-key control, inherited
setter non-dispatch, independent canonical byte serialization, formatting/key-order invariance,
wrong public key and raw-byte tampering. These use real temporary files and fresh local test keys,
not production credentials. `Object.fromEntries` preserves own data members during recursive
canonical reconstruction. The generic composite digest remains the sorted hash sequence contract;
FS replaces that digest with the v2 tuple digest rather than changing generic hashing semantics.

### E. Vite-owned public pipeline

`-dist.pipeline.ts` uses actual Vite builds, public FS `project`/`Pins.capture`/`Pins.verify`, public
Server `materialize`/`DistServer.start`, and a local HTTP byte fixture. It imports Vite-owned fixture
helpers, not Cloudflare-private fixtures or permissions.

Source assertions cover two fixed-input builds; three distinct full/private/public identities;
equal content with different timestamps/document checksums; metadata/layout/root-label changes;
locally recorded expectations; cold materialization; per-response checksums and sizes; pinned
manifest hiding; no-request warm reuse retaining the first document; changed payload and renamed
path producing new identities; and stale-pin refusal after only the manifest request.

The SRI assertion compares served JS/CSS bytes with the emitted base64 hash. It is not a browser
execution assertion. The transport is real local HTTP with an in-memory source map, not a provider.
Existing operation-document fences in FS projection and Server materialization remain separate from
content equality; this pass did not rerun their complete adversarial owner matrices.

This pipeline was **not executed**. Source reachability is not substituted for required runtime proof.

### Retained/replaced assertions

- Replaced: Pi preview's old expectation that separate builds have different pins. It now requires
  equal content pins and separately unequal document checksums, retaining directory/host isolation.
- Strengthened: Vite's former prefix search for a package entry becomes exact own membership plus
  decoded package equality and strict verification.
- Replaced: Signer fixture descriptors now encode valid v2 content while retaining independently
  ordered canonical bytes, exact trailing-newline behavior and signature tamper controls.
- Retained: raw-file signatures, wrong-key refusal, no-writeback behavior, generic composite digest
  semantics, host readiness/cancellation/cleanup controls and no release-to-development fallback.

## 3. Findings and design judgment

No material target-attributed finding was established by the inspected source and executed controls.
No production correction is proposed on the strength of this pass alone. Required runtime gaps
below remain unresolved; absence of a demonstrated defect is not proof of completion.

The strongest case for leaving the owner split unchanged is concrete: Std owns only the pure tuple;
Crypto owns hashing/signing; FS owns inventory/path/byte verification; Server owns acquisition and
hosting; Pi owns its application package policy; Signer owns canonical document reconstruction.
There is one present consumer for the package policy and already an appropriate FS checksum-read
primitive. A generic package-policy abstraction would add breadth without closing a demonstrated
invariant. Existing targeted negative controls are preferable to a new broad build matrix.

Inherited limitation to keep explicit: default Vite process exit does not provide the return-mode
cleanup guarantee described above. No default-exit runtime claim or new v2 regression is inferred.
A separately scoped cleanup change, if desired, belongs to Vite, not FS/Pi package policy.

## 4. Commands executed and outcomes

Runtime: `deno --version` reported Deno `2.9.7`, V8 `15.0.245.2-rusty`, TypeScript `6.0.3`,
`aarch64-apple-darwin`.

Commands were run serially. These exact task invocations completed successfully:

```sh
cd code/sys.driver/driver-signer && deno task test --frozen --cached-only --no-prompt --trace-leaks ./src/m.dist/-test/-.test.ts
cd code/sys.driver/driver-pi && deno task test:profiles:gui --frozen --cached-only --no-prompt --trace-leaks --filter='/covered package policy|start:gui policy|start:gui direct composition/'
cd code/sys.driver/driver-pi && deno task test:preview --frozen --cached-only --no-prompt
```

- Signer: **1 passed, 22 steps, 0 failed**.
- Pi selected GUI suites: **3 passed, 43 steps, 0 failed, 2 filtered out**. The owning aggregator
  imports the new package suite; the filter actually selected it.
- Pi non-build preview: **1 passed, 21 steps, 0 failed**.
- Each task performed its normal type check. Permission-preset experimental warnings were emitted;
  there was no observed permission/provenance denial and no authority expansion/retry.
- No Vite build, real Pi preview, browser, publication, bind/reset, provider or workspace-wide test ran.

Read-only history/state commands included:

```sh
git rev-parse HEAD
git status --short
git diff --cached --stat
git diff --cached --name-only
git log --format='%h %s' --fixed-strings --grep='fix(driver-signer): preserve own keys in canonical Dist documents' --grep='fix(crypto): preserve every selected key in composite hash builders' --grep='feat(dist)!: unify build pins and verification on canonical content identity'
git show --format=fuller --stat e6316e80b
git show --format=fuller --stat 872b5a34d
git show HEAD:code/sys.driver/driver-vite/src/m.vite/u/u.build.ts
git show e6316e80b^:code/sys.driver/driver-signer/src/m.dist/u.run.dist.ts
git show 872b5a34d -- code/sys/crypto/src/m.Hash.Composite/u.builder.ts
git ls-files -s -- deno.json deno.lock deps.yaml imports.json package.json code/sys.driver/driver-pi/deno.json code/sys.driver/driver-signer/deno.json
git diff --exit-code HEAD -- deno.json deno.lock deps.yaml imports.json package.json code/sys.driver/driver-pi/deno.json code/sys.driver/driver-signer/deno.json
git diff --check -- code/sys.driver/driver-vite/src/m.vite code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui code/sys.driver/driver-pi/src/m.cli/m.profiles/-test code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.preview.real.ts code/sys.driver/driver-signer/src/m.dist
```

Scoped content diffs, including final `--full-index` / `-U0` comparisons, covered the driver files
listed in sections 1 and 6. `git diff --check` emitted no errors; dependency-authority comparison
emitted no changes. Path-only discovery and narrow line-location searches also ran. Initial
`find -agent` failed because of its leading hyphen and was corrected to `find ./-agent`; a guessed
`m.CompositeHash` discovery path and `m.Hash.Composite/m.Hash.ts` read were absent, then actual owner
paths were located. These were discovery errors, not denied-access workarounds or runtime proof.

### Requested but unexecuted serialized lanes

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test:unit --frozen --cached-only --no-prompt --trace-leaks ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test:dist:pipeline --frozen --cached-only --no-prompt
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi && deno task test:preview:real --frozen --cached-only
```

The Vite focused tests copy fixtures under the module's test temporary area; workspace composition
uses `.tmp/test/Vite.build.workspace-composition/fixture` and removes its copied tree. Fixture
configuration is restored. The pipeline creates a unique temporary project, projected inventories,
sealed stores and local listeners; it closes hosts/source and removes stores through Rooted before
removing the temporary tree. These lanes may initialize toolchain/cache state.

Pi's real lane allocates unique external preview/build-exchange directories and uses declared
preview presets; its task denies workspace writes in the outer process. The build child explicitly
allows its output/exchange and Vite cache directories, with a sanitized environment. Shared Dist and
retained release evidence are not intended outputs. Parent frozen/cached flags do not by themselves
prove every nested Vite/bridge invocation is cached-only; child commands were inspected, not run.
No downstream-private permission preset was substituted.

No serialized slot arrived before this report. Re-baseline material inputs before running these
commands. A fresh run must retain the meaningful negative controls, not merely report build success.

## 5. Remaining coverage and non-goals

- Required real producer-write failure/success, real preview pair, and Vite public pipeline runtime
  observations remain outstanding. They are the principal reason for the incomplete verdict.
- Default Vite exit policy and its diagnostics/disposal were source-inspected, not subprocess-tested.
- No complete transitive dependency/cache/native-toolchain reproducibility assertion is made.
- No full GUI/browser session, whole browser module-graph integrity, published package/provider
  acceptance, real Pi release binding, cross-platform filesystem guarantee or whole-system clearance.
- Signer signatures authenticate their canonical document subject, not producer trust or publication.
  Content pins authenticate selected payload identity, not benign behavior or freshness.
- Broader FS/Server hostile-input, mutation and promotion-settlement matrices remain with their owner
  review. No conclusion from another report was imported to fill that boundary.

## 6. Inspected file index

Paths below are relative to the repository root. Directory headings are literal prefixes; each
listed suffix identifies an actual opened file. Type-file reads limited to relevant sections are
marked. Canon traversal was completed separately.

### Governing/task/dependency inputs

- `-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/02/README.md`
- `-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/02/03-composition.review.plan.md`
- `-agent/-plan/@sys.fs/dist-content-identity.plan.md` — authorized ranges only
- `deno.json`, `deps.yaml`, `imports.json`, `package.json`
- `code/sys.driver/driver-vite/deno.json`
- `code/sys.driver/driver-pi/deno.json`
- `code/sys.driver/driver-signer/deno.json`

### `code/sys.driver/driver-vite/src/`

- `m.vite/t.ts`
- `m.vite/common.ts`
- `m.vite/u/u.build.ts`
- `m.vite/u/u.wrangle.ts`
- `m.vite/u/u.log.ts`
- `m.vite/u/u.bootstrap.ts`
- `m.vite.startup/u.delivery.ts`
- `m.vite/-test/-build.test.ts`
- `m.vite/-test/-build.workspace-composition.test.ts`
- `m.vite/-test/u.bridge.fixture.ts`
- `m.vite/-test.external/-dist.pipeline.ts`
- `m.vite/-test.external/u.html-integrity.project.ts`
- `common/libs.ts`
- `-test.ts`, `-test/mod.ts`, `-test/u.SAMPLE.ts`

### `code/sys.driver/driver-pi/`

- `-scripts/-test.profiles.gui.ts`
- `-scripts/-test.external/-task.start.gui.preview.real.ts`
- `-scripts/m.start.gui.preview.build/u.runtime.ts`
- `-scripts/m.start.gui.preview.build/-entry.build.ts`
- `-scripts/m.start.gui.preview.build/t.ts`
- `-scripts/m.start.gui.preview.build/-test/-.test.ts`
- `src/pkg.ts`
- `src/m.cli/m.profiles/common.ts`
- `src/m.cli/m.profiles/u.start/common.ts`
- `src/m.cli/m.profiles/u.start/u.gui/t.ts` — lines 1–215 plus tracked delta
- `src/m.cli/m.profiles/u.start/u.gui/u.pkg.ts`
- `src/m.cli/m.profiles/u.start/u.gui/u.service.ts`
- `src/m.cli/m.profiles/u.start/u.gui/u.session.ts`
- `src/m.cli/m.profiles/-test/-u.start.gui.pkg.test.ts`
- `src/m.cli/m.profiles/-test/-u.start.gui.service.test.ts`
- `src/m.cli/m.profiles/-test/-u.start.gui.test.ts`
- `src/m.cli/m.profiles/-test/u.fixture.start.gui.ts`

### `code/sys.driver/driver-signer/src/`

- `m.dist/u.run.dist.ts`, `m.dist/u.run.ts`, `m.dist/mod.ts`, `m.dist/common.ts`
- `m.dist/-test/-.test.ts`
- `common.ts`, `common/libs.ts`

### Nonlocal semantic owners

- `code/sys/fs/src/m.Pkg/t.ts` — public surface/project section, lines 1–80
- `code/sys/fs/src/m.Pkg.Dist/m.Dist.ts`
- `code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts`
- `code/sys/fs/src/m.Pkg.Dist/u/u.hash.ts`
- `code/sys/fs/src/m.Pkg.Dist/u/u.load.ts`
- `code/sys/fs/src/m.Pkg.Dist/u/u.project.ts`
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts`
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.verify.ts`
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.part.ts`
- `code/sys/fs/src/m.Dir.Hash/u.compute.ts`
- `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts`
- `code/sys/crypto/src/m.Hash.Composite/u.builder.ts`
- `code/sys/crypto/src/m.Hash.Composite/u.digest.ts`
- `code/sys/crypto/src/m.Sign.Ed25519/u.sign.ts`
- `code/sys/crypto/src/m.Sign.Ed25519/u.verify.ts`
- `code/sys/server/src/m.server.dist/u.materialize/u.run.ts`
- `code/sys/server/src/m.server.dist/u.generation/u.open.ts`
- `code/sys/server/src/m.server.dist/u.server.start/u.start.ts`
- `code/sys/server/src/m.server.dist/u.server/u.read.ts`
- `code/sys/server/src/m.server.dist/u.server.start.verified/mod.ts`
- `code/sys/server/src/m.server.dist/u.server.start.verified/u.ts`
- `code/sys/server/src/m.server.dist/u.server.start.verified/u.listener.ts`
