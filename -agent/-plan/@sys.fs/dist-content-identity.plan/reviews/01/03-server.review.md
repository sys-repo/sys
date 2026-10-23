# Review 03 — generation settlement and hosting

## Verdict

**Request changes:** one lower-settlement validation gap (P2), plus stale public documentation (P3).
No content/document-fence or premature-release bypass was demonstrated in the production paths
examined. The isolated suites passed. This is a bounded review, not whole-pipeline acceptance;
entry-to-exit byte-stability certification is incomplete as detailed below.

Subject: the attributable R1 worktree replacement, including the untracked
`code/sys/server/src/m.server.dist/-test/-content.identity.test.ts`, not HEAD alone.
HEAD at entry and final status check: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
No source edits, Git mutations, shared builds, real-store cleanup, profile changes, or sibling-report
reads were performed. Only this report was written.

## Findings

### P2 — Generation admits success evidence exceeding newly accepted caller path budgets

**Owner / anchor:**
`code/sys/server/src/m.server.dist/u.generation/u.is.ts::isVerification`, especially lines 97–112;
`u.materialize/u.input.ts::snapshotVerification` (lines 256–277);
`u.generation/u.result.ts::admitSuccess`.

**Observed source:** input admission now preserves optional `pathLength` and `pathTotal` limits.
Generation independently checks manifest bytes, file count, file bytes, total bytes, the selected
pin, and recomputed content digest, but never reads either caller path limit. Its call to
`Pkg.Dist.Content.encode(parts)` applies only the encoder's fixed ceilings. Those are not the
caller's possibly tighter limits. FS does enforce the tighter limits in
`code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts::captureContent`.

**Reproduction sequence, source-traced; not executed as a new regression:** use the existing
`prepareSuccess`, `args`, and `fakeRooted` helpers in
`code/sys/server/src/m.server.dist/-test/-generation.authority.test.ts`:

1. Prepare a genuine successful settlement for the fixture using its ordinary policy.
2. Open the same root/target/pin with the same policy except `verification.pathLength: 1`.
3. Have the internal materializer return the previously prepared, deeply frozen success through
   `Promise.resolve(lower)`. Keep the other dependencies contract-valid, as the existing
   `rejects frozen success evidence that is not bound to the selected generation` test does.
4. Every current admission condition passes: directory, pin, source, totals, document bound and
   content all match. `openWith` consequently returns `opened`, although `index.html` alone exceeds
   the selected path limit. Repeat independently with `pathTotal: 1`.

This is not a demonstrated remote bypass of the real FS verifier: the production materializer
already refuses these inputs. It is a gap in the explicitly promised **independent hostile lower
settlement admission**, relevant when a lower result is inconsistent with the invocation policy.
The callable remains a direct callable returning an exact native Promise; no opaque transport is
needed. The new caller budgets must not silently disappear at this second boundary.

**Smallest correction:** Server should check the captured caller path budgets when admitting
content evidence, before encoding/expanding it, with the same effective ceilings and path-unit
semantics as FS. Include the prefix-work budget if reproducing FS's `pathTotal` semantics. Keep
this pure admission work; do not add a second filesystem verification or infer authenticity from
metadata. If sharing a validator, expose it through its owner rather than importing an FS private
implementation into Server.

**Closing proof:** add separate tight `pathLength` and `pathTotal` cases to the existing lower-success
admission test. Expect `{ kind: 'failed', phase: 'materialization', reason: 'execution-failure',
ownership: 'released' }`, exactly one release, and no returned owner. Retain a sufficient-budget
positive control and compare refusal with the real materializer. Rerun the Generation authority
suite. Do not treat the existing green suite as this missing proof.

### P3 — README promises a failure field deliberately removed by the replacement

**Owner / anchors:** `code/sys/server/README.md:133–135,155–158`, the materialization failed-result
and diagnostics paragraphs.

Both paragraphs promise `manifestChecksum: { expected, received }` on a failure. The live
`code/sys/server/src/m.server.dist/t.ts::Dist.Failed` has no such field; the builder in
`u.materialize/u.failure.ts::failed` never emits it; and
`u.generation/u.result.ts::admitFailure` rejects extra fields. The replacement intentionally retains
only a successful verification's document checksum, not the retired external document-pin mismatch
variant.

**Misuse sequence:** follow the README when implementing failure diagnostics, call materialization
with a different valid content pin, then access `result.manifestChecksum.expected`. Typed code does
not compile; unchecked code accesses an absent property. The executed test
`-materialize.test.ts` → `wrong external content pin → bounded serialized refusal without acquired
inventory evidence` establishes the actual four-field refusal.

**Invariant:** public guidance must distinguish content-pin refusal, payload-byte checksum refusal,
and retained document-continuity evidence without describing an unsupported API.

**Smallest correction:** remove the two obsolete failure-diagnostic promises. Explain
`manifest-admission/pin-mismatch` versus `resource-pull/checksum-mismatch`; keep
`verification.manifestChecksum` documented as the candidate's exact-document continuity record.
Do not restore the obsolete API to match the text.

**Closing proof:** reconcile both paragraphs with `Dist.Failed` and the existing type assertion
`HasOldDiagnostics = false` in `-materialize.test.ts:598–605`; rerun that suite and check the edited
README for formatting.

## Candidate / provenance / fence analysis

All implementation anchors in this table are in
`code/sys/server/src/m.server.dist/u.materialize/u.run.ts` unless stated otherwise.

| Candidate / transition | Admitted document baseline | Publication authority and final result | Evidence |
| --- | --- | --- | --- |
| Initially existing valid target | Initial pinned verification's `manifestChecksum` | Exclusive target lease spans sealing and final verification. No network, credential evaluation, or metadata refresh; result `existing`. | `settleInitialGeneration`, `settleExisting`, `finalEvidence`; existing/offline tests and the new existing-document replacement test. |
| Initially occupied invalid target | No usable candidate baseline | Refuse with `publication: occupied`; retain the target and do not seal/repair it. | Occupied-directory, symlink, malformed-generation and mode-preservation tests in `-materialize.test.ts`. |
| Fresh private stage | Checksum from bounded FS manifest admission | Publish the fetched bytes, pull exact parts, verify the complete stage, then compare its checksum with the admitted checksum before promotion. | `materializeWith` stage-verification comparison at lines 167–171. Source-traced metadata-only fence; no dedicated new stage-replacement runtime injection. |
| Explicit successful publication | The losing/downloaded stage's original admitted checksum | Only `promoted.kind === 'published'` establishes this attempt's publication. Final success is `promoted`; later failure retains `publication: committed`. | `promoteVerifiedStage`, `settleVisible`; committed-final-failure, pending-cleanup and late-cancellation tests. |
| Separately established equal-content winner | Winner's own checksum, captured while the distinct private stage still exists | `separateWinnerChecksum` checks directory kind and distinct device/inode identity, verifies target content, and checks target identity again. An occupied outcome uses that independently captured baseline, not a newly observed post-error document. | New `established separate equal-content winner → its own document baseline, never the losing download` test. |
| Occupied outcome without established separate provenance | Original admitted download checksum | Must not acquire a fresh document baseline merely because a target is visible. May return `existing` only if final content and the retained checksum both pass. | `separateChecksum ?? manifestChecksum` and `finalEvidence`. |
| Typed committed promotion error with a visible target | Separate-winner checksum only if already established; otherwise original download checksum | `committed` can describe private-stage permission changes, so this branch conservatively settles as occupied, never fabricates promoted provenance or transfer totals. | Both new ambiguous-error controls: unchanged document succeeds as `existing`; equal-content replacement fails with `publication: occupied`. |
| Visible settlement after cancellation | Same candidate baseline | Final visible settlement intentionally proceeds without the caller cancellation signal. It cannot relabel publication as rolled back. Private-stage cleanup and publication remain independent. | `settleVisible`; `does not rewrite a visible published generation as cancelled`. |

The checksum is not a second distribution identity. It is captured once per candidate and carried
through that candidate's operation. The separate-winner branch is necessary complexity: merging it
with the original-stage branch would either reject legitimate equal-content winners or accept
metadata replacement after ambiguous publication.

`separateWinnerChecksum` relies on host device/inode evidence; unavailable evidence fails
conservatively. The tests here are evidence for the current host, not every filesystem or Windows.
Rooted leases coordinate participating writers, not arbitrary direct filesystem authority.

## Other obligations assessed

- **Admission and acquisition:** `u.materialize/u.input.ts` snapshots exact pin/policy authority and
  clamps manifest transport bytes to the verification ceiling. `u.manifest.ts::admitManifest`
  delegates supported-document admission and content recomputation to public FS before creating a
  stage or requesting assets. Encoded URL segments preserve admitted path spelling. Asset Pull
  receives independent per-file checksums and exact lengths.
- **Store replacement:** the only generation target constructed is `sys.dist-v2/<pin.digest>`.
  Generation's expected returned directory uses the same namespace. No old-store lookup or
  automatic repinning was found in these paths. This was source inspection, not a dedicated
  old-store decoy execution.
- **Credentials:** source-origin refusal precedes manifest credential evaluation; manifest and
  resource credentials remain separate; redirected requests strip credentials outside credential
  origins. Executed authority tests retain callback count, no-network and no-secret-evidence
  assertions. No external credential/provider test ran.
- **Ownership:** `u.generation/u.open.ts`, `u.owner.ts`, `u.retention.ts`, and `u.result.ts` keep
  failed materialization evidence separate from outer ownership. Opaque materialization retains
  the lease rather than releasing behind hidden work. Returned release is one terminal operation;
  only an observable void completion proves release. Rejecting/non-void/opaque release retains
  authority and does not invoke it again. Acquisition is explicitly assumed all-or-none.
- **Hosting:** pinned `/dist.json` stays absent; Local serves only the retained document checksum
  and length. Asset reads use matching FilesStatic file/ref path, hash and size, including zero
  bytes. Host rejection precedes lookup/read; request abort does not replace server lifecycle
  authority. Listener rollback and presentation settlement tests remain intact.
- **Browser policy:** `u.server.browser/u.policy.ts` now checks `evidence.content.parts`; worker
  membership, exact origin, browser headers and destination gates remain separate caller policy.
  Unit HTTP responses were tested; no browser execution is claimed.
- **Presentation:** `u.server.start.verified/u.listener.ts` and `u.server.screen/u.layout.ts` display
  content digest rather than document identity. `u.server.start/u.serve.ts:274` uses the host's own
  package identity, not a root manifest label; descriptive build age was removed from verified
  evidence presentation. Local retains explicit UNPINNED vocabulary.
- **Service:** strict structured pin schema, containment, loopback binding and Cell-owned lifecycle
  delegation were inspected and tested. YAML currently exposes only the four required verification
  limits, not direct hosting's optional path budgets. This stricter configuration subset was not
  established as a security defect; configuration parity would be a separate API decision.
- **FilesStatic:** `m.fromDist.ts`, `t.ts`, and `u/u.index.ts` consume `DistContent`, emit only Files
  entries/refs and accept descriptive `buildTime` separately. The encoder validates supported
  inventory structure; it does not authenticate the supplied digest or read payloads. Retaining
  an arbitrary fixture digest is therefore intentional, not an authentication test. Missing sizes
  now refuse. Runtime graph and Dist seam tests passed.

## Prior coverage → retained or replaced proof

Compared live tests and worktree diffs with reachable HEAD test content. This is an invariant map,
not a claim that test counts establish exhaustiveness.

Test paths below use these exact roots:

- **S:** `code/sys/server/src/m.server.dist/-test/`
- **M:** `code/sys.model/model/src/m.files.static/-test/`

| Prior load-bearing assertion | Replacement / retained proof | Disposition |
| --- | --- | --- |
| Exact document-pin Fetch mismatch and its type-correlated diagnostic variant | S `-materialize.test.ts` content-pin type/absence assertions; S `-materialize.authority.test.ts` rejects old/mixed/contradictory byte evidence without invoking hooks | Old acceptance contract intentionally removed, not silently weakened. Ordinary HTTP 412 still maps to resource failure. README did not fully follow. |
| Hostile/missing Fetch response fields, status and policy evidence | Table-driven cases in S `-materialize.authority.test.ts`, including null/custom prototypes, getters, tags, proxies and revoked proxies | Failure families retained under the byte-observation contract. |
| Transparent Proxy input could not supply absent optional credentials | Same file now rejects top-level and nested credential Proxies before any calls or traps | Old Proxy acceptance obsolete; stricter refusal has an explicit proof. |
| Invocation snapshots, credential confinement, pre-cancellation, in-flight cancellation, timeout and failed cleanup | Same file retains distinct tests with expected stage/reason/cleanup, request counts and sanitized output | Retained; truncation/enlargement cases share setup but remain independently named tests. |
| Invalid digest discovered during staged verification | `malformed JSON and forged self-reported digest → no stage, asset request or publication` | Earlier FS admission now refuses it. The later old failure phase is intentionally obsolete. |
| Path escape, target collision, missing exact size and expanded-entry overflow | S `-materialize.test.ts` unsafe path/collision/size tests; S `-materialize.authority.test.ts` structural budget case | Refused before asset acquisition and generally before stage creation rather than during staging. |
| Seals, occupied-invalid preservation, final mutation, generation lease across sealing/publication | S `-materialize.test.ts`, largely retained tests | Distinct phase-specific assertions preserved, including no mode changes to invalid winners and no deletion fallback in fixture teardown. |
| Ambiguous committed promotion, concurrent winner, pending cleanup and late cancellation | S `-materialize.test.ts` publication-settlement group, plus S `-content.identity.test.ts` | Retained old provenance proofs; new tests distinguish equal-content document replacement from a separately established winner. |
| Generation exact lower-result shape, selected directory/source binding, hostile evidence graph and retained release | S `-generation.authority.test.ts`; S `-generation.open.test.ts` | Existing authority/release cases retained. Oversized/cyclic whole-document graph cases became oversized/cyclic content graph cases. New caller path-budget contradiction is missing (P2). |
| Pinned and Local byte authority, manifest routing, host/path errors, shutdown and browser policy | S `-server.start.test.ts`, `-server.start.authority.test.ts`, `-server.local.start.test.ts`, `-server.browser-policy.test.ts`; new combined content-identity host test | Retained under narrow content/checksum evidence. Local manifest metadata replacement is additionally exercised. |
| Raw/screen identity, local warning, strict ports, back/quit and cleanup ordering | S `-server.serve.test.ts`, `-server.serve.screen.test.ts` | New host-package-not-manifest-label control replaces old root-label presentation. Build-age assertions obsolete; layout and lifecycle controls retained. |
| FilesStatic size-optional refs and implicit document build time | M `-m.fromDist.test.ts`: no-size refusal plus explicit-build-observation test | Obsolete acceptance replaced explicitly; listing, pagination, filtering, read policy, reference URLs, snapshotting and command-error tests retained. |

**Proof gaps, not hidden greens:** no new injected execution for P2; no dedicated metadata-only
replacement at the fresh-stage boundary or the explicit `published` return boundary (the shared
checksum comparisons were source-traced, and the ambiguous branch was exercised); no dynamic
old-store decoy test. These are useful closing controls, not evidence of an observed production
fence failure.

## Dependency direction and runtime authority

The relative `../../-test.ts` imports are owner-local barrels, not downstream fixture borrowing.
Both barrels were opened through `src/-test/mod.ts` and their `common/libs.ts` exports.

| Import / surface | Actual owner and direction | Purpose / runtime authority |
| --- | --- | --- |
| Server `../../-test/u.fixture.dist.ts` | Private Server fixture, shared only within Server | Owns temporary source/store and loopback origin; public FS production/Rooted cleanup. Requires read/write/net, no real build output. |
| `@sys/fs`, `@sys/fs/pkg`, `@sys/fs/env` | Public FS APIs; Server → FS | Fixture production, filesystem observation, verification, lease protocol and process graph environment lookup. Read/write as needed; environment for graph runner. No FS private fixture import. |
| `@sys/crypto/hash`, `@sys/crypto/fmt` | Public Crypto APIs; Server → Crypto | Document observations, content rehashing and digest display assertions. No independent filesystem/network authority. |
| `@sys/testing/server`, `@sys/testing/web` through Server test barrel | Public Testing support APIs | Test runner/assertions, loopback fixture, property mocks. Server's owning task supplies permissions; the fixture does not confer permissions itself. |
| `@sys/esm/testing` through test barrels | Public ESM testing surface | Authored/runtime graph boundary assertions; read access for module inspection. |
| `@sys/model/files` through Server common barrel | Public Model API; Server → Model | Read policy and Files references, not host reads or materialization. |
| `@sys/std/*` through common barrels | Public Std helpers | Guards, JSON, scheduling, lifecycle, paths and formatting. Host-native guard support remains in server-side surfaces where needed. |
| `@sys/cli` in serve-screen tests | Public CLI surface; Server presentation → CLI | Formatting/terminal observation with controlled test effects. Not a borrowed package build fixture. |
| `@sys/process` in `-test.external/common.ts` | Public Process API; Server tests → Process | Bounded `deno info` graph probes and child lifecycle helpers. Requires run; graph probes use frozen dependencies and denied imports. |
| `@sys/server/dist`, `/dist/server`, `/dist/service` test imports | Public self-entry checks | Export and restricted hosting graph proofs. Same-package internal `openWith`/`materializeWith` imports deliberately exercise private injection seams. |
| Model `../../m.files/mod.ts`, `../mod.ts`, `u.fixture.ts` | Same Model owner; private test fixture and owner runtime modules | Pure static inventory/reference tests. `https://example.test` is a reference URL, not a fetch. |
| `@sys/model/files/static` | Public Model self-entry check | Export identity assertion; no network/write needed for static operations. |

Owning tasks were read before execution. Server `test` permissions are read/write/env/net/run;
Model `test` permissions are read/write/env, with neither net nor run. Actual executed process
proofs further restrict children: the lease child denies net/run/sys/ffi and confines writes to its
temporary root; the Local child has only selected-root reads, loopback binding and named environment
access. The parent deliberately has broader fixture authority. No downstream sample fixture or
permission laundering was found in this slice.

Production dependency separation is supported by executed graph proofs: Generation excludes
hosting, and the public hosting entry excludes acquisition/Rooted publication graphs. Hosting uses
`@sys/fs/pkg/dist/verify`, HTTP host/file-bytes entry points and `FilesStatic`, not a fabricated
full authenticated document.

## Economy and explanatory quality

Necessary concepts introduced or revised:

1. Structured pin plus scheme-bound store path: independent expectation and incompatible-store
   separation, not an adapter or compatibility lane.
2. Candidate-specific `manifestChecksum`: exact-document continuity while content identity stays
   stable. It must remain distinct from the pin and publication provenance.
3. `separateWinnerChecksum`: pre-settlement evidence permitting a different winner document.
   Its identity observation cannot be replaced by post-error visibility.
4. FS-owned admission before asset planning: removes a duplicated Server JSON/manifest parser and
   moves malformed/unsafe refusal earlier.
5. `DistContent` plus explicit FilesStatic `buildTime`: separates reference inventory from
   descriptive observation without granting host IO.

The ordinary, ambiguous and separate-winner paths should not be collapsed into one success helper
that refreshes a baseline. Likewise, retaining the separate sealing/publication lease tests is
simpler than a highly parameterized test obscuring when ownership must remain held.

Optional small consolidation: the unchanged-document ambiguous-error case in
S `-content.identity.test.ts` overlaps S `-materialize.test.ts` →
`does not infer promoted provenance from a committed error and visible target`. It could live as
one two-case unchanged/replaced test, provided it retains **all** of the configured-source-only,
absent-totals, applied-seal, original-checksum and occupied-failure assertions. There is no need for a
new fixture framework. Keeping both is also defensible: one teaches provenance, the other document
continuity. No consolidation is required for acceptance.

Comments around separate-winner provenance and post-publication cancellation explain useful
asymmetries. The main clarity defect is the stale failure field in the README, not lack of prose.

## Runtime evidence

Executed from the respective owning package directories with frozen dependencies:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/server
deno task test:unit --frozen --trace-leaks ./src/m.server.dist/-test/-content.identity.test.ts ./src/m.server.dist/-test/-materialize.test.ts ./src/m.server.dist/-test/-materialize.authority.test.ts
deno task test:unit --frozen --trace-leaks ./src/m.server.dist/-test/-generation.authority.test.ts ./src/m.server.dist/-test/-generation.open.test.ts ./src/m.server.dist/-test/-server.start.test.ts ./src/m.server.dist/-test/-server.local.start.test.ts ./src/m.server.dist/-test/-server.browser-policy.test.ts
deno task test:unit --frozen --trace-leaks ./src/m.server.dist.service/-test/-.test.ts ./src/m.server.dist/-test/-server.start.authority.test.ts ./src/m.server.dist/-test/-server.serve.test.ts ./src/m.server.dist/-test/-server.serve.screen.test.ts
deno task test:unit --frozen --trace-leaks --reporter=dot ./src/m.server.dist/-test/ ./src/m.server.dist.service/-test/
deno task test:dist:process --frozen --reporter=dot
cd /Users/phil/code/org.sys/sys/code/sys.model/model
deno task test --frozen --trace-leaks ./src/m.files.static/-test/
```

Complete terminal receipts from the final runs:

- Server Dist + DistService unit directories: **15 passed, 223 steps, 0 failed**.
- Server Dist process manifest: **4 passed, 10 steps, 0 failed**.
- FilesStatic: **3 passed, 15 steps, 0 failed**.
- The separate service/start-authority/serve/screen run: **4 passed, 80 steps, 0 failed**;
  it is a subset, not additional unique coverage.

Earlier focused output was truncated; totals above come from complete later receipts, not inferred
from the truncated runs. Process probes and fixtures used temporary stores/loopback endpoints, not
shared build outputs. No package-wide build, browser, provider, publication or release proof ran.
No permission/provenance denial occurred in these runs.

## Inspection inventory

The following inventories identify the substantive source and test evidence used. Entries following
a directory prefix are literal filenames relative to that prefix, not claims about every file in
the directory.

- Governing/coordination: `-agent/-plan/@sys.fs/dist-content-identity.plan.md` contract, A–H,
  adversarial matrix and completion boundary; this directory's `README.md` and
  `03-server.review.plan.md`. Checkpoint, handoff and research verdict prose were not adopted as
  conclusions. Workspace/canonical AGENTS and canonical files were traversed; no additional scoped
  AGENTS was found under the owner trees or `-agent`.
- Under `code/sys/server/src/m.server.dist/`:
  - Root: `t.ts`, `common.server.ts`.
  - `u.materialize/`: `common.ts`, `u.input.ts`, `u.manifest.ts`, `u.failure.ts`, `u.run.ts`,
    `u.seal.ts`.
  - `u.generation/`: `u.input.ts`, `u.is.ts`, `u.open.ts`, `u.owner.ts`, `u.retention.ts`,
    `u.result.ts`.
  - `u.server.input/`: `u.start.ts`; `t.ts` also inspected in the tracked diff.
  - `u.server.start/`: `common.ts`, `u.start.ts`, `u.lifecycle.ts`, and changed
    authority/presentation portions of `u.serve.ts`.
  - `u.server.start.verified/`: `u.ts`, `u.listener.ts`, `u.result.ts`, `u.request.ts`,
    `u.request.handler.ts`.
  - `u.server/u.read.ts`, `u.server.browser/u.policy.ts`, and changed content/authority layout in
    `u.server.screen/u.layout.ts`.
- Server tests: all changed S test files named in the coverage map, the untracked content-identity
  test, and `u.fixture.serve.screen.ts`; unchanged listener lifecycle code was followed to explain
  teardown claims. The process manifest and its graph, lease and Local permission test parents
  were read. Not every unchanged presentation helper was independently re-reviewed.
- `code/sys/server/src/m.server.dist.service/`: `m.start.ts`, `t.ts`, `mod.ts`,
  `u.config/u.schema.ts`, `u.config/u.parse.ts`, `u.config/u.resolve.ts`, `u/u.resources.ts`,
  `-test/-.test.ts`.
- `code/sys/server/`: `README.md`, `deno.json`, `src/-test.ts`, `src/-test/mod.ts`,
  `src/-test/u.fixture.dist.ts`, `src/common/libs.ts`.
- `code/sys.model/model/src/m.files.static/`: `m.fromDist.ts`, `t.ts`, `u/u.index.ts`,
  `-test/u.fixture.ts`, `-test/-boundary.test.ts`, `-test/-dist-seam.test.ts`,
  `-test/-m.fromDist.test.ts`.
- `code/sys.model/model/`: `deno.json`, `src/-test.ts`, `src/-test/mod.ts`, `src/common/libs.ts`.
- `code/sys/fs/src/m.Pkg.Dist/u.verify/`: `u.manifest.ts`, `u.verify.ts`, `u.part.ts`,
  `u.readPart.ts`; also `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.stage.ts` and
  `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts`. These reads support Server seam conclusions, not
  an independent full FS/Std/HTTP owner verdict.

Reachable history was inspected read-only. The opening prerequisite commits `e6316e80b` and
`872b5a34d`, and the independent publication repair `482e42505`, are ancestors of HEAD. The breaking
replacement remains attributable worktree content. Prior tracked tests and implementation were
compared through Git diffs/history, not reconstructed from commit subjects alone.

## Baseline and drift qualification

Entry inspection recorded HEAD, scoped status, staged/unstaged changes and the untracked test.
Final inspection returned the same HEAD, no scoped staged changes, and the same scoped modified
paths plus the content-identity untracked test. `deno.json`, `deno.lock` and the owning task files
were not reported modified. Scoped `git diff --check` passed.

Content was re-read and full-index patches were inspected, not just status. Repeated patch evidence
includes these worktree blob identities:

| File | Observed worktree blob |
| --- | --- |
| Server `u.materialize/u.run.ts` | `f07883d88e58c721ee603d8235dc984226fa330c` |
| Server `u.generation/u.is.ts` | `3758e93db553027ad89541273bac237ae65e1826` |
| Server `u.generation/u.result.ts` | `39e37c62771437997a622f77e2f25fefebf9a796` |
| Server `README.md` | `3fbda4a4a7a504ace7beeba769fca5ec2bc21bfc` |
| Server `-materialize.authority.test.ts` | `65a1d1f7111239ea412a624632656c5707aa489e` |
| Model `m.files.static/u/u.index.ts` | `f734a53883054b638bd9981eb1cb9ecb9cc0ad2e` |

The authority-test identity was compared with the earlier captured diff as well as the later diff.
The untracked content-identity test was opened repeatedly and inspected through a read-only
`git diff --no-index /dev/null` comparison; its observed blob is
`0f9e70c2ae221ac2d2685954784d1d33550bb3c0` (exit 1 means differences, not a test failure).

**Limit:** a complete entry byte-fingerprint inventory for every target and transitive dependency
was not retained across session compaction. No target drift was observed, but matching status and
these selected repeated content identities cannot certify whole-slice byte stability from the
original entry. Treat the requested comprehensive freeze/drift receipt as **incomplete**, not as a
clean R1 acceptance receipt. The coordinator should confirm/re-establish a stable baseline before
using a follow-up review to close P2 and the missing controls. No changed target was identified that
would justify silently rebasing these conclusions.

Unrelated sample image/UI configuration and planning deltas were not claimed or edited. No result
here grants Git mutation, external publication, Pi release authority, or evidence rebinding.
