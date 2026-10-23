# Review 09: independent end-to-end authority trace

## Verdict

**Incomplete acceptance assessment; no confirmed production defect in the inspected composition.**

The core content/document/package distinction survives the source trace and the narrow executed
proofs. This is not a clean whole-slice verdict: the real two-build pipeline was inspected but not
executed without a coordinator-serialized slot, complete dependency-byte stability was not
established, and the prior-assertion audit is bounded below. One concrete composition-proof gap is
recorded as U1, not represented as an observed production failure.

Scope: attributable worktree replacement for
`feat(dist)!: unify build pins and verification on canonical content identity`, under
`-agent/-plan/@sys.fs/dist-content-identity.plan.md`. STIER/TMIND applied. Charter recommendation:
`gpt-6-astra` at `xhigh`; this records the charter, not an attestation of runtime model settings. No
sibling review, implementer handoff, provider, or release evidence was used as a verdict.

## Baseline, history, and drift limits

- Entry and exit HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3` (R1).
- Reachable exact-subject history reconciles the opening arc: signer `e6316e80b`, collection
  `872b5a34d`, then the unmatched, unlanded integrated replacement. No arc edit was made.
- Entry observation included full `git status --short`, unstaged diff statistics, scoped numstat,
  and staged diff inspection. The index was empty of changes. Relevant untracked production and
  proof files were opened through `read`; they were not omitted by using HEAD alone.
- Current versus HEAD content was inspected for Types, FS projection, Vite build, sample build and
  selection, Server materialization/failure handling, FilesStatic, and Pi service/session. A
  combined diff command exceeded the output limit; its omitted prefix is not counted as inspected
  evidence.
- Exit HEAD, scoped status, staged diff, and scoped diff statistics showed no detected target drift.
  Repeated content diffs for Vite build and FS projection retained the same new-blob prefixes
  `d4d83c227` and `756291e47`. The final Pi real-preview diff agrees with its inspected live source.
- These observations do **not** prove byte stability of every dependency, fixture, or untracked
  file. A complete entry byte baseline was not retained. Matching status/statistics cannot fill that
  gap. Before treating this as R1 acceptance, the coordinator must establish the frozen review
  baseline and rerun/review any affected evidence. No mixed-version production defect is alleged
  here.
- Only this report was authored. No source, governing plan, permission, dependency, Git, sample
  build, publication, or evidence-binding mutation was performed. Narrow tests used temporary owned
  fixtures; unrelated sample-image and UI-visualizer changes were not attributed to this migration.

## Independent trace

This trace was derived from production owners before opening `-dist.pipeline.ts`. The graph
branches: the R2 sample and Pi are different consumers, not mandatory stages of one linear
deployment.

### 1. Identity kernel and producer

`code/sys/types/src/t/t.Pkg.dist.ts` makes `DistPin` the exact independent `{ scheme, digest }`
expectation and explicitly excludes the root package label from authority. `DistContent` alone is a
claim, not proof of bytes or independence.

`code/sys/std/src/m.Pkg/m/m.Dist.Content.ts::encode` binds exact paths, canonical SHA-256 values,
and required sizes into compact `sys.dist/v2` JSON. Code-unit sorting, scalar-string refusal, and
finite collection/string limits precede encoding. It does not authenticate metadata or implement
filesystem path policy. `m.Dist.Pins.ts::capture` copies and freezes exact named pin records.

`code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts::compute` collects parts, calls `captureContent`, and
returns a pin only for a computed candidate. `u.verify/u.manifest.ts` owns portable target
admission, resource bounds, inventory reconstruction, and recomputation. `admitManifestBytes` parses
one fatal UTF-8/native-JSON interpretation, retains a byte checksum, and exposes only content facts.
A claimed `hash.digest` must equal the recomputed digest and then the independent expectation.
Descriptive ignore rules do not authorize extra entries.

`u.verify/u.verify.ts::verifyWithIo` adds exact-tree and actual-file proof and checks the retained
manifest again at the end. Local verification uses the same kernel without pretending to possess an
independent expectation. Manifest-only admission is not full-tree proof.

### 2. Vite, projection, and recorded pins

`code/sys.driver/driver-vite/src/m.vite/u/u.build.ts::build` waits for the real child, optionally
writes `pkg/-pkg.json`, computes/saves the Dist, and exposes `dist`, `pin`, and `manifestChecksum`
only on success. The declaration file is payload. Changing its bytes changes identity; changing only
the root `dist.pkg` does not.

`code/sys/fs/src/m.Pkg.Dist/u/u.project.ts::projectWithIo`:

1. Captures the supplied source pin and verifies the source tree.
2. Retains the first `manifestChecksum` before invoking selection.
3. Supplies only `DistContent` to selection and requires own inventory membership for every copy.
4. Reads each selected part against its checksum/length, computes each output's own identity, and
   verifies the output and its computed document before no-clobber promotion.
5. Re-verifies the source and compares the original document checksum after output work. Equal
   content does not excuse a changed source document; already-published outputs remain reported.

`code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/task.build.ts::buildSample` supplies the
producer pin to that public projection owner. `u.selection.ts::partitionBuild` selects private HTML
and public assets. Bundle totals derive from admitted parts, not root totals. The sample persists
validated projection pins in its own `dist.pins.json`; FS does not become the owner of this record.
A valid generic private projection can omit `pkg/-pkg.json`. It must not thereby become a valid Pi
GUI. `selectBuild` retains its first document checksum across subsequent validation calls.

`task.push.ts::pushSample` reads the existing record and validates both audiences before delegating
to public `Deploy.push`; it does not call the builder or discover replacement expectations remotely.
The entire provider publication implementation was not re-reviewed in this slice.

### 3. Cold acquisition, reuse, and settlement

`code/sys/server/src/m.server.dist/u.materialize/u.input.ts::snapshotPolicy` takes the stricter
manifest acquisition ceiling before Fetch creates its Blob. `u.run.ts::fetchManifest` deliberately
requests no byte checksum equal to the content pin. The actual HTTP success and failure constructors
both own a `checksum` property, which makes the Server response-admission check compatible with the
real lower response shape.

`u.materialize/u.manifest.ts::admitManifest` delegates to public FS admission before deriving
resource URLs. Each URL encodes exact path segments; each resource retains its separate byte
checksum and length. No asset acquisition precedes successful content-pin admission.

`u.run.ts` addresses only `sys.dist-v2/<digest>`. Existing candidates are fully verified; invalid
occupied candidates refuse. Cold acquisition retains the fetched document through stage verification
and final evidence. Warm reuse does no network work and keeps the existing document, even if another
build would have different descriptive bytes.

The candidate-provenance cases remain distinct:

- Initial existing candidate: its first verification checksum survives sealing and final checks.
- Owned stage: the fetched checksum survives staging, promotion, and final verification.
- Separate winner: `separateWinnerChecksum` observes distinct source/target directory identities
  while the stage still exists, verifies the target, and rechecks its identity. Its document may
  legitimately differ from the losing download.
- Ambiguous committed error: visibility or `occupied` classification alone does not reset the
  baseline. The original checksum remains the fallback. Final document mismatch refuses while
  preserving conservative publication and cleanup reporting.

`u.generation/u.open.ts::openPrepared` retains a shared package-store owner around materialization
and validates the returned generation before transferring ownership. This review traced its
orchestration, not every lower hostile-result validator or OS lease primitive.

### 4. Hosting and per-read authority

`code/sys.model/model/src/m.files.static/u/u.index.ts::staticIndex` indexes a content descriptor,
rejects noncanonical visible paths, and keeps optional build time separate. It does not claim to
verify the content digest or payload bytes. That is appropriate for this index: Server supplies the
already-verified content and performs the actual reads.

`code/sys/server/src/m.server.dist/u.server.start/u.start.ts` verifies before listener composition.
`u.server.start.verified/u.request.handler.ts::createBacking` passes `evidence.content`, not a
fabricated whole manifest. `u.server/u.read.ts::readAsset` requires matching requested path, hash,
and length from the Files reference before the FS checked read. Pinned hosting has no manifest
inventory entry and refuses `/dist.json`; local-unpinned hosting serves only the retained document's
checksum/length-matched bytes. Neither mode claims all browser execution is verified.

The R2 alternative is intentionally weaker at delivery:
`code/sys.driver/driver-cloudflare/src/m.r2/m.ReadRoute/m.fromDist.ts` admits the construction-time
inventory before routes are selected; `u/u.handler.ts` later serves bounded authorized bytes without
comparing them to inventory hashes. A later routed manifest may differ. This is documented, not a
new continuous-verification guarantee.

### 5. Pi package policy and lifetime

`code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui/u.pkg.ts::readGuiPackage` requires own
membership of `pkg/-pkg.json`, a required size no greater than 16 KiB, and a checked FS part read.
Fatal decoding and strict required package fields replace unknown-default parsing. No root-label
fallback exists.

`u.service.ts::{admitGenerationPkg,admitApplicationPkg}` compare those verified payload facts with
separately captured `expectedPkg`. The first check precedes application startup; the second checks
the started host before readiness, not before binding. `u.session.ts::admitPackage` races lifecycle
events, aborts work, and drains the read before Generation release. Release ownership remains until
application termination. Development still uses a producer pin, not local-unpinned hosting.

The retained `u.service.evidence.ts` still contains old rehearsal `integrity` evidence. The snapshot
path refuses it before generation/application acquisition; the review did not rebind it.

### 6. Deletion, publication, signatures, and SRI are different subjects

`code/sys.tools/src/cli.deploy/u.staging/u.manifest.ts` retains directory identity plus
`manifestChecksum`. `u.finalizeDistTree.ts::writeManifest` checks the serialized document checksum,
retains the exact written-document record, and keeps finalization and cleanup failures separate.
Equal-content replacement does not authorize deletion. This is observation/recheck protection, not
an atomic OS transaction or an assurance against every transient writer.

Content equality also cannot establish which publisher won or prove an exact requested document was
uploaded. The provider's exact-document publication obligation remains independent; its full remote
implementation and provider behavior were not validated here.

Canonical-document signatures can change when descriptive members change. That does not change the
Dist content pin. The signer prerequisite was reconciled in history, not re-attested by this review.
SRI hashes the actual referenced JS/CSS bytes; it is neither the Dist digest nor the document
checksum. The capstone checks emitted SRI values but does not execute a browser.

## Claim-to-proof map

Evidence labels: **executed** means this session; **source** means assertions inspected, not run.

- Canonical literal bytes/digest, duplicates, BOM/Unicode, resource bounds, old/mixed-input refusal,
  caller snapshots, no early payload IO: FS `-content.admission.test.ts` and
  `-content.production.test.ts` **executed**. Std `-m.Dist.Content.test.ts` **source** additionally
  fixes encoder ordering/escaping without importing Crypto into Std.
- Source/document continuity, output pin recomputation, no-clobber, partial-output truth,
  cancellation, alias refusal: FS `-project.test.ts` **executed**. The first 170 lines were directly
  read; the remaining cases were observed through the complete task receipt, not individually
  audited.
- Cold/warm metadata invariance, stale-pin refusal before assets, tighter transport limit, ambiguous
  unchanged/changed settlement, distinct winner, initial-existing sealing fence, pinned manifest
  refusal and local document continuity: Server `-content.identity.test.ts` **executed**.
- Real package bytes at both Pi boundaries, cold materialization/offline reuse, root-label
  invariance, missing/malformed/unlisted/oversized/symlinked declaration refusal, changed package
  identity: Pi `-u.start.gui.pkg.test.ts` **executed**.
- Package-read cancellation/draining and host termination: Pi `-u.start.gui.test.ts`, particularly
  `cancellation during either package read` and `host termination during package read`, **source**.
- Sample record ownership, admitted bundle total, failure invalidation, selected-byte corruption:
  sample `-scripts/-test/-u.build.test.ts` **source**. The PNG comparison is separate sample-owned
  work, not proof of Dist identity or Vite fingerprinting.
- Two real fixed-source builds, three inventory identities, four cold stores, offline reuse, pinned
  serving, byte/length checks, SRI bytes, path/payload stale-pin refusal: Vite
  `-test.external/-dist.pipeline.ts` **source only; serialized execution outstanding**.
- Actual Pi preview builds retain distinct directories and document checksums with equal content
  pins: Pi `-task.start.gui.preview.real.ts` **source only**. Package admission of that actual
  output remains U1 below.
- Metadata-equal cleanup refusal: Tools `-u.execute.test.ts`, lines 1234-1310, **source only**;
  includes malformed replacement and supported equal-content replacements at root and child.

### Prior load-bearing assertions

The inspected HEAD/worktree deltas preserve or explicitly replace these obligations:

- Old byte-pinned Vite/preview identity changed on every document rebuild. That acceptance is
  obsolete: separate `manifestChecksum` inequality remains while content-pin equality is asserted.
- Old projection source integrity implicitly fenced the document. The new explicit `sourceDocument`
  comparison and metadata-only mutation cases replace that protection rather than deleting it.
- Old Server Fetch checksum mismatch diagnostics authenticated the raw manifest before parsing. They
  are deliberately removed, not silently reinterpreted: bounded shared FS admission now proves the
  content pin, and wrong-pin tests assert no assets are fetched. Generic response checksums remain
  byte checksums.
- Old FilesStatic inputs carried the whole manifest/build time. Content-only indexing and explicit
  observational build time replace that shape without giving root metadata resource authority.
- Old Pi package checks used root `verification.dist.pkg`. Covered-file checks at both boundaries
  replace that assertion, with opposite-root-label and malformed/missing-payload controls.
- Existing stage/publication/cleanup classifications are preserved in the new ambiguous settlement
  pair; the separate-winner test is distinct and must not be collapsed into ordinary offline reuse.

This is not an exhaustive one-for-one audit of the large rewritten FS/Server test files. In
particular, all old `-Pkg.Dist.test.ts`, `-pinned.verify.manifest.test.ts`, and
`-materialize.authority.test.ts` assertions were not individually mapped. No claim of zero
meaningful prior-signal loss is made for those files.

## Prioritized uncovered seam

### U1: actual Pi build output does not cross the package-policy boundary in its real-preview proof

**Priority: medium proof improvement; not a demonstrated production defect.**

Evidence:

- `code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.preview.real.ts` replaces
  `mainWith.startGui` and calls local `startHost`, which invokes only `DistServer.start`.
- `code/sys.driver/driver-pi/src/m.cli/m.profiles/-test/-u.start.gui.pkg.test.ts::candidate` authors
  its own `pkg/-pkg.json`; it does not consume a real Vite/Pi build.
- `code/sys.driver/driver-vite/src/m.vite/-test/-build.test.ts::testBuild` checks a package-path
  prefix and full-tree verification, but not that the declaration's parsed package equals `pkg`.
- Production `u.runtime.ts::mainWith` passes `pkg` to the builder and uses the same independently
  expected package for GUI startup. Live `u.build.ts` currently writes that package correctly.

Executable counterfactual: change the producer to write a well-formed but wrong package declaration
at the same covered path, then compute a matching Dist. Full-tree verification and the preview's
HTTP checks still accept it; synthetic package-policy fixtures do not exercise that build.
Production `admitApplicationPkg` must refuse it. This identifies a potential false-green composition
proof, not a counterexample executed against current production.

Smallest correction: Pi owns the downstream assertion. In the existing real-preview test, snapshot
the actual development authority and call `admitApplicationPkg` on each returned host and real
output directory before declaring it ready. Retain both-build isolation assertions. Add a mismatched
independent expected-package control. Do not import Pi internals into Vite or copy another package's
private fixture, and do not add a new full GUI/browser harness merely for this assertion.

Closing proof: actual Vite-produced Pi payload succeeds at the real package-policy seam; a different
independent `expectedPkg` refuses; changing only a root label cannot reverse either result. Run in a
coordinator-serialized preview slot, without rebinding checked-in release evidence.

## Dependency direction, fixture ownership, and permissions

The reviewed proof composition does not borrow private downstream sample fixtures into Vite.

- Vite capstone imports `Dist`/`DistServer` from public `@sys/server/dist` and types from public
  `@sys/server/t`. This is a test-only composition dependency; the inspected Vite production build
  does not import Server. FS/Pkg/Hash/Json arrive through Vite's `src/-test.ts` → `-test/mod.ts` →
  `-test/common.ts` and `src/common/libs.ts`, using public owner exports. The SRI project and bridge
  helpers are Vite-owned local fixtures. No Cloudflare/Pi/Tools private fixture import appears
  there.
- The bridge helper resolves workspace package exports and root import/package authorities. It
  launches `deno info --json`, writes temporary project import/config/package files, and restores
  them. The real child imports public Vite/plugin, FS, and Std surfaces plus the external Vite/Node
  toolchain. This is not a pure encoder test and must not be run under a supposedly read-only scope.
- Vite `test:dist:pipeline` delegates to `test:unit` with preset `test`: read/write/env/net/run/ffi
  plus named system queries. Child authority is explicitly constructed in `u.wrangle.ts`; build
  writes target output/cache roots, reads dependencies, and permits localhost/toolchain work. These
  are broad existing test grants, not a reason to widen another owner's task.
- FS tests use package-local production/IO seams and public Std testing/Crypto helpers, through
  `src/-test/mod.ts` and `src/common/libs.ts`. Their configured preset grants read/write/env only.
  Production/admission/project fixtures own fresh temp roots. No downstream test authority is
  needed.
- Server content tests use public Crypto/FS and package-local materialization seams. Its neutral
  `src/-test/u.fixture.dist.ts` owns loopback transport and fresh source/store directories. Its
  testing barrel uses public `@sys/testing/server`; preset `test` grants read/write/env/net/run.
  Owned sealed-store removal uses Rooted and does not fall back to parent recursion on refusal.
- Pi package tests use public `@sys/fs/pkg`, `@sys/server/dist`, and public testing helpers through
  Pi's own barrels. Package/lifecycle fixtures belong to Pi. Preset `test` grants read/write/env and
  localhost/127.0.0.1/0.0.0.0 networking, with no run/ffi grant. The executed filtered group needed
  no Vite child or private foreign fixture.
- Pi real preview uses its own script fixture and public Server/FS/Process surfaces. Its declared
  task selects `preview-test`, denies workspace writes, and permits Deno children plus loopback.
  Build orchestration narrows child writes to exchanges/output/toolchain caches. It is a separate
  authority lane from unit package-policy proof and from release evidence binding.
- Sample tests use their own script/source fixtures and public FS/Pkg/Crypto/testing exports.
  `-scripts/-test/u.fixture.ts` stubs Vite but computes real FS distributions; the sample `test`
  preset has read/write/env, not run/net/ffi. Real build dynamically imports public Vite only on its
  main task path and uses the sample's separate build preset. Publication uses public Tools/R2, not
  test-only private interfaces.
- FilesStatic is an actual production Server dependency, not a test fixture. Its index cannot stand
  in for checked file reads. Types-only imports grant no runtime permissions.

The ledger covers the directly inspected proof imports and their shown barrels, not an exhaustive
transitive dependency graph audit. Narrow dependency-closure process proofs were not executed.

## Economy and explanatory quality

Keep the separate concepts that carry different failure consequences: content descriptor/pin,
manifest observation, independent package expectation, file checksum/length, and lease/publication
settlement. Merging them would reduce names by removing security distinctions, not by simplifying
behavior. `readGuiPackage` is justified consumer policy, not a generic Dist package-file
requirement. `separateWinnerChecksum` earns its place by preventing visibility from becoming
provenance.

The capstone is one useful public-owner composition test, not a reason to copy the sample or Pi
workflow into the upstream package. Its private/public terminology is only a fixture split. Keep
sample policy tests under the sample and Pi package/lifecycle tests under Pi. The smallest useful
proof addition is U1 within the already-existing preview build test, not another two-build harness.

The ambiguous changed/unchanged settlement pair, separately established winner, initial-existing
sealing mutation, and offline reuse exercise different authority phases. Consolidating them into one
parameter bag would obscure the distinct baselines. Literal encoder vectors must also remain
independent of builder/verifier agreement. No test-count reduction is recommended from this pass.

Comments explaining document fences, unpinned observations, package payload membership, and
publication uncertainty carry real signal. No production abstraction removal was justified by the
inspected flow.

## Commands and results

Executed from their owning modules after reading their `deno.json`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task test:unit --frozen --cached-only --no-prompt --trace-leaks ./src/m.Pkg.Dist/-test/-content.admission.test.ts ./src/m.Pkg.Dist/-test/-content.production.test.ts ./src/m.Pkg.Dist/-test/-project.test.ts
```

Result: **4 passed, 36 steps, 0 failed**.

```sh
cd /Users/phil/code/org.sys/sys/code/sys/server
deno task test:unit --frozen --cached-only --no-prompt --trace-leaks ./src/m.server.dist/-test/-content.identity.test.ts
```

Result: **1 passed, 8 steps, 0 failed**.

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi
deno task test:profiles:gui --frozen --cached-only --no-prompt --filter 'covered package policy'
```

Result: **1 passed, 7 steps, 0 failed**. This does not attest the unselected lifecycle/presentation
suites. No authority denial occurred and no broader-permission retry ran.

Read-only Git commands included `git rev-parse HEAD`, `git status --short`, scoped `git diff`,
`git diff --cached`, `git diff --numstat`, `git diff --full-index`, exact-subject `git log`, and
`git show --no-patch`. Scoped `git diff --check` passed. The report also passed `deno fmt --check`.

Requested but **not run**, pending coordinator serialization:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task test:dist:pipeline --frozen --cached-only --no-prompt
```

Effects: two child builds; temporary bridge/config/output writes; loopback HTTP hosts; temporary
projections and sealed stores; possible toolchain-cache activity. No real sample publication is
needed. Pi `test:preview:real` and browser tasks likewise remain unexecuted here; no
release/provider approval follows from any local test.

## Inspected-file inventory

Paths below are repository-relative. Within each base directory, listed filenames are literal path
suffixes, not globs. A listed range marks a partial read; no whole-file audit is implied for it.

- Governance: `-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/README.md`,
  `-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/09-composition.review.plan.md`, and
  `-agent/-plan/@sys.fs/dist-content-identity.plan.md` (purpose, identity contract, A-H workstreams,
  matrix, completion boundary). Canon traversal was recorded in the session; plan checkpoint prose
  was not treated as proof.
- Configuration: `deno.json`, `code/sys/fs/deno.json`, `code/sys/server/deno.json`,
  `code/sys.driver/driver-vite/deno.json`, `code/sys.driver/driver-pi/deno.json`,
  `code/sys.driver/driver-cloudflare/-sample/deploy/deno.json`.
- Types: `code/sys/types/src/t/t.Pkg.dist.ts`.
- `code/sys/std/src/m.Pkg/`: `m/m.Dist.Content.ts`, `m/m.Dist.Pins.ts`, `m/m.Is.ts`,
  `-test/-m.Dist.Content.test.ts`.
- `code/sys/fs/src/m.Pkg.Dist/`: `u/u.compute.ts`, `u/u.project.ts`, `m.Pins.ts`,
  `u.verify/u.manifest.ts`, `u.verify/u.verify.ts`, `-test/-content.admission.test.ts`,
  `-test/-content.production.test.ts`, `-test/-project.test.ts` (1-170),
  `-test/-u.project.fixture.ts`.
- FS barrels: `code/sys/fs/src/-test/mod.ts`, `code/sys/fs/src/common/libs.ts`.
- `code/sys.driver/driver-vite/src/`: `-test.ts`, `-test/mod.ts`, `-test/common.ts`,
  `common/libs.ts`, `m.vite/common.ts`, `m.vite/u/u.build.ts`, `m.vite/u/u.wrangle.ts`,
  `m.vite/-test/-build.test.ts`, `m.vite/-test/u.bridge.fixture.ts`,
  `m.vite/-test.external/-dist.pipeline.ts`, `m.vite/-test.external/u.html-integrity.fixture.ts`,
  `m.vite/-test.external/u.html-integrity.project.ts`.
- `code/sys.driver/driver-cloudflare/-sample/deploy/`: `-scripts/task.build.ts`,
  `-scripts/task.push.ts`, `-scripts/common.ts`, `-scripts/-test/common.ts`,
  `-scripts/-test/u.fixture.ts`, `-scripts/-test/-u.build.test.ts`, `src/-test.ts`,
  `src/-test/-selection.test.ts` (1-112), `src/m.deployment/u.selection.ts`,
  `src/m.deployment/u.push.ts`.
- `code/sys.driver/driver-cloudflare/src/m.r2/m.ReadRoute/`: `m.fromDist.ts`, `u/u.dist.ts`,
  `u/u.handler.ts`.
- `code/sys/server/src/`: `-test/mod.ts`, `-test/u.fixture.dist.ts`, `common/libs.ts`.
- `code/sys/server/src/m.server.dist/`: `u.materialize/u.run.ts`, `u.materialize/u.failure.ts`,
  `u.materialize/u.manifest.ts`, `u.materialize/u.input.ts` (1-280), `u.generation/u.open.ts`,
  `u.server.start/u.start.ts`, `u.server.start.verified/u.request.handler.ts`, `u.server/u.read.ts`,
  `u.server/u.path.ts`, `-test/-content.identity.test.ts`.
- `code/sys.model/model/src/m.files.static/`: `m.fromDist.ts`, `u/u.index.ts`, `u/u.path.ts`. Path
  implementation followed into `code/sys/std/src/m.Path/m/m.Bounded.ts` and
  `code/sys/std/src/m.Path/m.Bounded/u.visible.ts`.
- `code/sys/http/src/http.client/m.HttpFetch/u/`: `u.invoke.ts`, `u.failure.ts`.
- `code/sys.driver/driver-pi/src/`: `common/libs.ts`, `-test/mod.ts`,
  `m.cli/m.profiles/u.start/common.ts`.
- `code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui/`: `u.pkg.ts`, `u.service.ts`,
  `u.session.ts`, `u.service.evidence.ts`.
- `code/sys.driver/driver-pi/src/m.cli/m.profiles/-test/`: `-u.start.gui.pkg.test.ts`,
  `-u.start.gui.test.ts` (108-307), `u.fixture.start.gui.ts` (1-130).
- `code/sys.driver/driver-pi/-scripts/`: `common.ts`, `-test.profiles.gui.ts`,
  `-test.external/-task.start.gui.preview.real.ts`, `m.start.gui.preview.build/-entry.build.ts`,
  `m.start.gui.preview.build/u.runtime.ts`.
- `code/sys.tools/src/cli.deploy/u.staging/`: `u.manifest.ts`, `u.finalizeDistTree.ts`,
  `-test/-u.execute.test.ts` (1210-1329).

## Exact remainder

Before a complete composition acceptance verdict: establish full frozen-baseline byte continuity;
execute the serialized capstone; adjudicate U1; finish the prior-assertion map for changed authority
suites; and verify any still-required narrow dependency/process proof. This report does not attest
all hostile lower-input shapes, all producer refusal callers, the signer integration, full provider
publication, platform lease behavior, browser execution, or Pi release evidence. Those limits are
not repaired by the 51 passing steps reported above.
