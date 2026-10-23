# Review 10 — engineering economy and proof organization

## Verdict

**Incomplete whole-slice assessment; one confirmed documentation correction.** The inspected core arrangement has a defensible responsibility split. I found no evidence supporting a broad abstraction merge or test deletion. This is not whole-migration approval: the remaining proof/import audit and byte-stability limits below prevent that conclusion.

Review-only, independent pass. No sibling reports were read. No implementation, dependency, permission, Git, or shared-build mutations were performed. This report is the only authored repository file.

## Baseline and evidence limits

- Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`; dispatch: this directory's `README.md` and `10-economy.review.plan.md`.
- Entry and exit HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3` (R1).
- Subject: dirty tracked replacement plus relevant untracked implementation/tests, not HEAD alone. Staged inspection produced no changes. Scoped status and unstaged diffs were inspected.
- Reachable prerequisite changes inspected included `e6316e80b` (signer own-key preservation) and `872b5a34d` (composite-hash own-key preservation). Their retained invariant matters independently of the replacement digest algorithm.
- Exit inspection repeated scoped status/diff observations and reopened selected source, fixtures, and untracked files. The README/failure-type mismatch was reconfirmed directly. No drift was identified in those checks. **This does not establish byte-for-byte stability of the entire dirty slice:** a complete comparable entry/exit content record was not retained across the session. Matching HEAD/status is not substituted for that proof. A complete R1 certification needs that remaining check or a coordinator-established fresh baseline.
- Sample image/UI/visualizer configuration deltas and unrelated planning files are not attributed to this migration. Shared build dependencies were not exercised.

## Finding

### P2 — Server documentation promises a failure variant that no longer exists

**Evidence**

- `code/sys/server/README.md:132–135`: the `failed` result description promises an exact-manifest mismatch variant with `manifestChecksum: { expected, received }`.
- `code/sys/server/README.md:154–158`: repeats that promise and distinguishes it from successful verification evidence.
- `code/sys/server/src/m.server.dist/t.ts`, `Dist.Failed` and `Dist.FailureReason`: no failure checksum diagnostic member/variant; content mismatch is `pin-mismatch`, while asset-byte mismatch is `checksum-mismatch`.
- `code/sys/server/src/m.server.dist/u.materialize/u.failure.ts`, `failed` and `admitManifestResponse`: constructs sanitized failures without that member; unsolicited transport checksum evidence is rejected, not promoted into content authority.

**Concrete maintenance failure:** a consumer follows the README, handles a manifest-admission `pin-mismatch`, and reads `result.manifestChecksum.expected` to display the promised diagnostics. The public type rejects the access; an untyped consumer gets no such field. A maintainer trying to reconcile the documentation could incorrectly restore the old manifest-byte-pin machinery.

**Violated invariant:** documentation must teach the supported authority model and actual public result contract, not preserve obsolete checksum-pin behavior under new terminology.

**Smallest correction, Server owner:** remove the two claims about failure checksum diagnostics. Keep the successful `verification.manifestChecksum` explanation. Suggested replacement:

> Failures expose `stage`, `reason`, `cleanup`, and optional `publication`, without document-checksum diagnostics. A content-pin mismatch fails at manifest admission before asset acquisition. Successful verification separately records the admitted document checksum for continuity.

Do not restore the old failure type or HTTP checksum capture merely to satisfy stale prose.

**Closing proof:** compare both README passages with `Dist.Failed`; retain the exact `pin-mismatch` failure-shape/no-asset-acquisition assertions in `code/sys/server/src/m.server.dist/-test/-content.identity.test.ts`. Review the resulting prose for the distinction between content authority and successful document-continuity evidence. The targeted Server tests passed here; the documentation correction remains unmade.

## Production-concept inventory: retain the necessary asymmetries

These are responsibility findings from the inspected implementation/diffs, not a claim that every branch was independently falsified.

| Owner and evidence anchors | Before → after responsibility | Recommendation |
| --- | --- | --- |
| Std: `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts`, `m/m.Dist.Pins.ts`, `m/m.Is.ts`, `t.ts` | Generic composite digest/legacy shape acceptance → one explicit tuple encoder, supported content descriptor, and exact independent pin capture. | **Keep.** The encoder owns deterministic representation; strict pin capture owns caller expectations. Neither should absorb filesystem admission or cryptographic IO. |
| FS: `code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts`, `u.verify/u.admitManifest.ts`, `u.verify/u.verify.ts`, `u/u.compute.ts`, `u/u.load.ts` | Descriptor admission and recomputation replace legacy/self-reported shortcuts; successful producers expose a pin separately from the document checksum. | **Keep.** Loading supported metadata, admitting bounded manifest bytes, and verifying an actual tree are different claims. A producer must refuse without publishing a success-shaped document/pin. |
| FS: `code/sys/fs/src/m.Pkg.Dist/u/u.hash.ts`, `u/u.project.ts` | Child reuse must preserve exact parent selection; projections derive identities for their selected payloads. | **Keep** direct/reused selection checks and exact spelling. Child inventories cannot resurrect filtered files. Projection identity does not replace cleanup ownership. |
| Server: `code/sys/server/src/m.server.dist/u.materialize/u.failure.ts`, `u.materialize/u.manifest.ts`, `u.materialize/u.run.ts`, `t.ts` | Old manifest-checksum transport diagnostics disappear; bounded transport capture feeds FS content admission; store names become scheme/content addressed. | **Keep** the transport capture boundary. It admits hostile lower-layer observations, not a second content identity. Deleted checksum parsing is genuine simplification; verification responsibility moves to FS rather than disappearing. |
| Server: `code/sys/server/src/m.server.dist/-test/-content.identity.test.ts` and `-materialize.authority.test.ts` | Equal content can have different documents; an established winner is distinct from ambiguous publication by this attempt. | **Keep** candidate-document and publication evidence separately. Equal pins cannot establish provenance, renew a document fence, or authorize deletion. |
| Tools: `code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts`, `u.finalizeDistTree.ts`, `u.manifest.ts`; `code/sys.tools/src/cli.pull/u.yaml/u.schema.ts`, `u.bundle/u.pull/u.pull.dist.ts` | Content selection replaces checksum-pin inputs, while staged-copy/deletion and manifest-last publication retain their own checks. | **Keep** ownership/finalization checks. A shared generic “digest matches” abstraction would conceal different authority and timing. Full removed-assertion audit remains open. |
| Sample/R2: `code/sys.driver/driver-cloudflare/-sample/deploy/src/m.deployment/u.selection.ts`, `-scripts/task.proof.local.ts`; `code/sys.driver/driver-cloudflare/src/m.r2/m.ReadRoute/u/u.dist.ts` | Sample selection/proof consumes content pins; provider routes remain a separate byte-delivery boundary. | **Keep** independently recorded selections separate from observed HTTP manifests. Do not make provider output its own expected pin. Runtime provider proof was not run. |
| Vite: `code/sys.driver/driver-vite/src/m.vite/t.ts`, `u/u.build.ts`, `-test.external/-dist.pipeline.ts` | Build results distinguish content identity from document checksum; real composition is exercised through public FS/Server APIs. | **Keep** a composition test in addition to owner unit tests. It is not another encoder oracle. SRI still names actual JS/CSS bytes, not the Dist pin. |
| Pi: `code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui/u.pkg.ts`, `u.service.ts`, `u.session.ts`, `t.ts` | Root descriptive labels cease to be trusted package identity; bounded `pkg/-pkg.json` is read as covered payload and subjected to Pi package policy. | **Keep** this owner-local policy helper. Do not teach generic FS verification Pi's package naming/size policy. Cancellation and retained ownership remain distinct from the package snapshot. |

The economy gain is removal of compatibility and misplaced metadata authority, not elimination of every digest-bearing value. `content`, `manifestChecksum`, payload checksums, signature hashes, SRI, and deletion evidence need explicit names because their interchange is unsafe.

## Prior proof → retained/replaced proof and consolidation map

### Concrete mappings inspected

| Prior load-bearing assertion | Current evidence and disposition |
| --- | --- |
| Exact canonical bytes, own keys, meaningful path/hash/size changes | `code/sys/std/src/m.Pkg/-test/-m.Dist.Content.test.ts`: literal 103-byte tuple, code-unit ordering, Unicode distinction, escaping, scalar/limit refusal. `code/sys/fs/src/m.Pkg.Dist/-test/-content.production.test.ts`: fixed literal SHA-256 pin. **Keep both**: representation oracle and independent digest vector must not be generated solely with the implementation under test. |
| Generic directory hashing preserves prototype-sensitive selected keys | `code/sys/fs/src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts`, “selected own filenames”: retains generic digest expectation, exact membership, saved bytes, and changed own-key payload sensitivity; explicitly distinguishes generic and Dist digests. New `-content.production.test.ts` adds compute → load → strict verification and tamper refusal. **Keep** both observation boundaries. |
| Repeated save, manifest exclusion, signature exclusion | `-Pkg.Dist.test.ts`, “root manifest and signature bytes”: consolidated three-computation scenario retains manifest/signature exclusion and stable identity. This is a defensible **same-owner consolidation**, not lost signal merely because former test titles disappear. |
| Producer metadata, custom filter/ignore, progress, save/no-save, omitted package | `-Pkg.Dist.test.ts`: retained under focused current tests, including selected parts, ordered progress, descriptive policy metadata, exact document bytes, and omitted root package. Generic-hash equality is correctly replaced by equal parts/distinct digest. |
| Missing/bad root previously returned an empty success-shaped descriptor | `-Pkg.Dist.test.ts`, “missing directory or regular-file root”; `-content.production.test.ts`, “empty or unsafe candidates”: failure without `dist`/`pin` or new manifest. **Obsolete acceptance deliberately removed.** |
| Invalid child descriptor fell back to hashing | `-Pkg.Dist.test.ts`, “unsupported child manifest”; `-content.production.test.ts`, child reuse: refusal without publication replaces fallback. Parent filter/ignore and sibling/space-sensitive names remain covered. |
| Legacy load/compat conversion | `-Pkg.Dist.test.ts`, “partial or legacy document”; Std `-m.Dist.test.ts` and `-m.Pkg.Is.test.ts`: supported-only surface replaces conversion. **Remove old acceptance**, retain explicit refusal/API-absence assertions. |
| Self-reported ignore metadata governed verification | `-Pkg.Dist.test.ts`, “Local.verify”: changed root ignore labels do not supply authority; changed payload still fails, missing manifest/root still fails. Old ignore-policy-authority assertions are **obsolete**, not tests to resurrect. |
| Manifest-byte mismatch prevented asset work | FS `-content.admission.test.ts`, `-pinned.admitManifest.test.ts`, `-pinned.verify.manifest.test.ts`; Server `-content.identity.test.ts`: independent content mismatch now refuses before asset work. **Keep** hostile-input/limits tests despite removal of the old transport-checksum variant. |
| Stable candidate document during an operation | FS `-content.production.test.ts`, “metadata-only replacement during verification”: same-pin replacement yields `changed`; a separate verification can admit it. Server `-content.identity.test.ts` exercises settlement distinctions. **Keep** this separately from metadata-only acceptance across operations. |
| Signing preserves payload identity without weakening signature coverage | `code/sys.driver/driver-signer/src/m.dist/-test/-.test.ts`: before/after compute pins equal; signature verification and own-member mutation checks remain. **Keep signer-owned tests**, not a synthetic shared digest test. Direct pinned verification of the signed output was not established by this pass. |
| Downstream empty producers must not report successful publication | `code/sys.tools/src/cli.crdt/cmd.doc.snapshot/-test/-u.calcAndSaveDist.test.ts`; `deploy/@tdb.data/src/fs/m.DataPipeline/-test/-u.dist.test.ts`; `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/-test/-u.dist.test.ts`: refusal, no new manifest, and retained existing document. **Keep per caller**: exception propagation, path return, and write-count behavior differ. |

### Keep versus consolidate

- **Keep** independent Std vectors, FS actual-byte verification, Server publication-failure tests, and Vite real composition. Similar setup does not make their oracles interchangeable.
- **Keep** manifest admission distinct from tree traversal/read-time mutation, existing-generation reuse distinct from own promotion, and cancellation/draining distinct from completed cleanup/lease release.
- **Accept existing consolidation** of repeated FS save/signature exclusions and metadata assertions where the mapping above preserves every meaningful assertion.
- **Do not introduce** a cross-package fixture package to remove a few local setup helpers. It would couple ownership and permission graphs without demonstrated benefit.
- No additional test deletion is proposed. In particular, I did not complete the assertion-by-assertion cancellation, lease, credential-confinement, and ambiguous-publication map across all migrated edges; reduction there would be unsupported.

## Import ownership and actual execution authority

These are the traced examples, not an exhaustive all-import receipt.

| Import/fixture | Ownership, direction, purpose, and authority |
| --- | --- |
| FS `-content.production.test.ts` → `u.verify/u.io.ts`, `u.verify/u.verify.ts`, `m.Dir.Hash/mod.ts` | Same `@sys/fs` owner; private injection seam controls document replacement/read observations. This is not cross-package fixture borrowing. FS `test:unit` selects `-P=test`: read/write/env, no network/run. |
| FS `-u.manifest.fixture.ts` → local `m.Pkg/mod.ts` and `../../-test.ts` | Same-owner in-memory descriptor fixture, including finite limits; not an independent encoder oracle. Separate literal tests supply that independence. |
| Server `src/-test/u.fixture.dist.ts` → public `@sys/fs`, `@sys/crypto/hash`, local testing barrel | Server composes its lower production owners to produce temporary sources/stores; loopback request gates test orchestration. Server `test:unit` selects read/write/env/net/run. The preset is broader than this narrow run's temp-filesystem/loopback work; no permission narrowing is inferred from an import name. |
| Vite `-dist.pipeline.ts` → public `@sys/server/dist`, `@sys/server/t`; local `../../-test.ts` → `src/-test/common.ts` → `@sys/testing/server` and `@sys/testing/web`; common libs → public `@sys/fs` | Cross-owner production composition, not import of Server private fixtures. Vite's `u.html-integrity.project.ts` and `-test/u.bridge.fixture.ts` remain same-owner helpers. The `test` preset grants read/write/env/net/run/ffi and enumerated sys access. The test performs two builds, loopback hosting, and capability-owned store cleanup; it is **not** a pure unit test. Not executed here. |
| Cloudflare sample `-scripts/-test/u.fixture.ts` → `../../src/-test/u.fixture.ts`, local task, `common.ts` → public `@sys/fs` | Same sample ownership across scripts/source; relative traversal alone is not an architectural violation. Fixture authors payloads with a stub Vite emitter and real FS computation. The sample's full task/barrel permission graph was not completely audited; no sample task was launched. |
| CRDT snapshot test → `../../-test/-fixtures.ts` | Same `sys.tools` CLI owner; helper supplies temporary-directory lifetime, not downstream runtime authority. Deploy producer tests use their own local test/common barrels. Full transitive deployed-package task authority remains unaudited. |

The new pipeline is wired into `code/sys.driver/driver-vite/deno.json` as `test:dist:pipeline` and into default `test`. Keep that visible task boundary; do not describe it as browser-execution proof merely because hosted bytes satisfy SRI hashes.

## Executed evidence

Owning task definitions and presets were inspected. The final compact-output repetitions completed without truncation:

```sh
cd code/sys/std && deno task test --cached-only --frozen --no-prompt --trace-leaks --reporter=dot ./src/m.Pkg/-test/-m.Dist.Content.test.ts ./src/m.Pkg/-test/-m.Dist.Pins.test.ts ./src/m.Pkg/-test/-m.Pkg.Is.distPin.test.ts ./src/m.Pkg/-test/-m.Pkg.Is.test.ts ./src/m.Pkg/-test/-m.Dist.test.ts
```

Result: **5 passed (38 steps), 0 failed**.

```sh
cd code/sys/fs && deno task test:unit --cached-only --frozen --no-prompt --trace-leaks --reporter=dot ./src/m.Pkg.Dist/-test/-content.admission.test.ts ./src/m.Pkg.Dist/-test/-content.production.test.ts ./src/m.Pkg.Dist/-test/-pinned.admitManifest.test.ts ./src/m.Pkg.Dist/-test/-pinned.verify.manifest.test.ts
```

Result: **5 passed (38 steps), 0 failed**.

```sh
cd code/sys/server && deno task test:unit --cached-only --frozen --no-prompt --trace-leaks --reporter=dot ./src/m.server.dist/-test/-materialize.authority.test.ts ./src/m.server.dist/-test/-content.identity.test.ts
```

Result: **4 passed (33 steps), 0 failed**.

Commands are from the repository root, independently. Earlier verbose executions were truncated; the results above come from the final bounded repetitions. No aggregate whole-package or whole-migration pass is claimed.

## Exact remaining assessment work

1. Establish complete entry/exit byte stability for the attributable source, fixtures, tasks, and relevant untracked files, rather than relying on status/HEAD. This pass's bounded reopens cannot certify all R1 bytes.
2. Complete the removed-assertion ledger for `code/sys/server/src/m.server.dist/-test/-generation.authority.test.ts`, `-generation.open.test.ts`, `-server.start.authority.test.ts`, the FS IO/tree/projection suites, Tools staging/pull suites, and Pi service/session/process tests. Required dimensions are cancellation/draining, ambiguous publication, leases, cleanup truth, credential confinement, and dependency ordering. These were not all mapped at assertion granularity.
3. Finish transitive nonlocal import/task authority tracing for the Cloudflare sample, Tools, Pi, and deployed producer/UI edges. The table above is not an all-import guarantee.
4. No real Vite/sample builds, Chromium/SRI execution, provider/R2 acceptance, Pi process/exit proof, full signer suite, or broad check/lint suite ran. Request a coordinator-serialized slot before any shared-output-sensitive proof. The pipeline command to request is `cd code/sys.driver/driver-vite && deno task test:dist:pipeline --cached-only --frozen --no-prompt`; its inspected effects include real builds, local fixture-import setup/restoration, loopback listeners, and temporary sealed-store cleanup. This command was **not executed**.

These context/evidence and runtime limits are why the verdict is incomplete rather than a clean whole-slice economy approval. The confirmed README correction and the concrete keep/consolidate mappings remain actionable without inventing conclusions for uncovered obligations.
