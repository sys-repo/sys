@sys.fs
dist-content-identity.plan.md
- [x] e6316e80b fix(driver-signer): preserve own keys in canonical Dist documents
- [x] 872b5a34d fix(crypto): preserve every selected key in composite hash builders
- [x] 6c15b0942 feat(dist)!: define canonical content identity and pin contracts
- [x] a1c9a6939 feat(fs)!: establish canonical Dist production and verification
- [ ] feat(server)!: serve and materialize canonical Dist evidence
- [ ] feat(tools)!: preserve canonical Dist staging and publication ownership
- [ ] feat(tools)!: consume canonical Dist pins in pull and serve
- [ ] feat(dist)!: migrate build and snapshot producers to canonical pins
- [ ] feat(cell)!: configure Dist services with canonical content pins
- [ ] feat(driver-pi)!: admit GUI packages through canonical Dist content
- [ ] feat(cloudflare)!: admit R2 distributions using canonical content pins
- [ ] feat(dist)!: align observations and signing fixtures with canonical manifests
- [ ] fix(driver-vite): align frozen build fixtures with their dependency authority
- [ ] test(dist): prove canonical build projection and serving composition
- [ ] test(driver-pi): prove canonical Dist isolation across real previews
- [ ] refactor(dist): consolidate inventory accounting and retain build failure causes

## Purpose and authority

Restore one stable identity for the distribution being selected, verified, materialized, and shown
to the operator. A pin is an independently supplied expectation of that same identity, not a second
identity minted from incidental manifest serialization.

The subject is **payload-only identity**: the same admitted exact paths and file bytes produce the
same identity under the same scheme. Root manifest package labels, their absence, and incidental
build metadata do not enter the digest. Metadata embedded in a payload file is ordinary content;
changing those bytes does change identity. Consumer package policies adapt to this contract, not the
reverse. In particular, Pi is an affected call site, not the owner of generic Dist semantics.

The human-established release boundary is **unreleased Dist with no backward-compatibility
obligation**. This is a clean breaking replacement, not a compatibility migration. The completed
system has one supported Dist manifest/pin contract, one producer behavior, and one verification
interpretation. Remove old Dist acceptance and conversion surfaces; do not add opt-in switches,
dual-format unions, adapters, deprecation lanes, or automatic artifact conversion. If a real
supported external consumer is discovered, bring that concrete obligation back to the human; do not
invent a compatibility lane to accommodate an unestablished dependency.

The scheme discriminator still defines the hash preimage and rejects unsupported input. It does not
promise support for older schemes. Internal document checks, generic file checksums, and signatures
retain their separate jobs; none becomes another distribution identity. Subsets use the same
contract over their own exact inventories.

The independent R2 publication repair is reachable at `482e42505`. Preserve its exact-path and
exact-document publication contract without reopening that repair or making it a prerequisite gate.
It neither implements nor requires the new identity protocol.

This plan proposes replacement behavior; it does not make that behavior existing API or authorize
production implementation, Git mutation, publication, evidence rebinding, cache deletion, or changes
to permissions/signing. Replace producer and consumer authority coherently; retain all security
guarantees identified below without retaining the old Dist protocol.

Historical plans explain how the implementation arrived here. Their use of words such as canonical,
locked, or approved is not independent proof that exact-document identity is the correct permanent
product identity. Do not rewrite those historical records or silently repurpose their pins.

## Landing discipline — bounded replacement, not adjacent hardening

The target remains one coherent breaking contract replacement. The opening arc allocates it to ten
source units, followed by the three named integration-proof commits and the separate bounded
refactor. These are planned ownership boundaries, not ten independently supported protocol states or
claims that exact commit candidates have been assembled. Accepted R3-A01–A06 corrections and
affected-consumer migrations retain their owner-local obligations. Do not turn nearby weaknesses
into an expanding implementation mandate. The separately recorded inventory-accounting and
build-failure refactor remains separate. Preserve observations in the
[adjacent findings register](./dist-content-identity.plan/adjacent-findings.md), with owner, evidence,
proposed future commit, and a concrete condition for reconsideration.

**Priority:** core `@sys` libraries, drivers and UI. Repository `deploy/` consumers still require
the minimal migration, checks and old-input refusal needed to avoid a broken supported path.
Provisional product hardening, extra features, presentation polish and unrelated cleanup there do
not belong in this landing. If such work starts driving the schedule, stop and examine the scope
with the human. This priority does not defer `code/sys.tools/src/cli.deploy` ownership/continuity
fixes: those are core tooling contracts already accepted in R3.

Classify every further observation before editing:

- **Current correctness obligation:** a concrete failure of the replacement's promised identity,
  admission, ownership, continuity, consumer or failure-truth contract. Fix at its smallest owner
  and run the corresponding proof; do not defer a material defect merely because some code predates
  this change.
- **Adjacent improvement:** no demonstrated failure of that bounded contract. Record it and its
  future commit; do not implement it during this landing. Discovery during migration does not
  establish attribution to migration. This includes general resolver-policy hardening and unrelated
  fixture lint debt unless a specific necessary proof demonstrates a narrower prerequisite.
- **Execution prerequisite:** a named required proof cannot run within existing authority. Preserve
  that coverage gap and keep the affected lane stopped. Seek the smallest supported execution route;
  if it needs substantive loader/toolchain work, present it as a separate prerequisite decision, not
  another silently absorbed Dist fix. Deferral never grants permission to bypass checks, weaken
  proof, fetch missing dependencies or claim unexecuted coverage.

The finite closing sequence is:

1. Resolve each source unit below into exact attributable paths/hunks, including its tests,
   necessary documentation, generated artifacts and removals. Use current deltas and reachable
   history, not directory-wide staging or the historical aggregate path count. The unit boundaries
   are the plan; their concrete cuts still require inspection. A newly discovered seam mismatch
   requires an explicit plan revision, not a catch-all final commit or peripheral slivers.
2. Review and verify each source unit against its stated dependency context. Retain the accepted R3
   counterexamples, positive controls and targeted independent closure at their owning boundaries.
   Reuse applicable evidence; do not automatically repeat completed reviews or the entire residue
   pass. Check for attributable drift, actual defects and unrelated hunks, not optional polish.
3. Land each accepted source unit with explicit human Git authorization and document its evidence
   limits and intermediate dependencies. **Every intermediate commit passing CI is not a
   requirement.** A dependent migration state is not an independently releasable tree. Results from
   the integrated worktree must not be represented as results from an isolated intermediate commit.
   Do not add compatibility scaffolding merely to make intermediate commits green.
4. Complete the three deferred proof commits below, in arc order, after their implementation
   dependencies. Execute build-bearing lanes sequentially through an authorized route. The pipeline
   item owns the outstanding independent composition evidence; it is not an unnamed final review.
5. Assess the completed source/proof sequence against the single contract and reconcile its landed
   history. Source commits do not claim unexecuted composition coverage or release readiness. A
   concrete newly demonstrated product defect requires a named owner and smallest correction, not
   an autonomous widening of scope.

The loader/graph investigation is retained as evidence, **not an instruction to launch a new review
or implement a resolution framework**. Neither adjacent improvements nor the separate
inventory-accounting/build-failure refactor is a prerequisite to source landing. Existing security,
permission, signing and evidence-authority boundaries remain unchanged. Historical checkpoints below
retain their original evidence meaning; their former single-commit/pre-landing-proof sequencing is
superseded by this landing discipline and the explicit proof tail.

## Source units — ownership, dependencies and completion

S1–S10 name the ten source items in opening-arc order; they are references, not another landing
ledger. Workstreams A–H below retain the detailed contract and adversarial requirements. A unit is
coherent when it changes one named contract or assurance boundary with its actual callers and tests,
not merely because it is small. Isolation means reviewable ownership and explicit dependencies, not
standalone CI success or independent release support.

For every unit, record its exact cut and dependency snapshot before landing. Include ordinary
owner-test migrations, negative controls, necessary docs and exports; never defer source correctness
to a proof commit. Reuse valid owner receipts only for the inputs and assertions they actually cover.
Run the narrow affected checks after corrections through the current owning tasks. Record integrated
results as integrated, dependency-incomplete states as such, and blocked proof as blocked. Targeted
independent closure follows the owning boundaries; there is no additional all-source landing gate.

### S1 — Types and Std contract

- **Owner:** `code/sys/types/src/t/t.Pkg.dist.ts`; attributable `code/sys/std/src/m.Pkg/` types,
  encoding, guards, Pins and exports, plus `src/-test/-namespace.freeze.test.ts` and owner tests.
  Includes removal of `m/m.Compat.ts`. Workstream A's pure contract belongs here, not FS IO.
- **Dependencies:** the two reachable signer/collection corrections remain unchanged. FS and
  downstream callers intentionally follow; no old/new union is introduced to accommodate the gap.
- **Completion:** one supported scheme and pin shape, bounded literal encoding vectors, exact
  Part/Unicode/order semantics, old-input refusal and retired exports. Std gains no crypto or FS
  dependency. S2 owns digest composition and filesystem admission proof.
- **Candidate evidence:**
  [S1 exact cut and owner verification](./dist-content-identity.plan/landing/S1.landing.md)
  records the exact source/test cut, dependency context, blind-review adjudication and subsequent
  mechanical-extraction checks.

### S2 — FS production, admission, projection and pins

- **Owner:** attributable `code/sys/fs/src/m.Pkg.Dist/`, `src/m.Pkg/t.ts`, namespace tests and README;
  includes the `u/u.checkSelfReported.ts` removal and residue R-01 below. Workstreams A–C meet here:
  production, manifest-only admission and tree verification share the same canonical contract.
- **Dependencies:** S1 and the reachable lossless collection correction. Server and producer callers
  follow; generic `DirHash`/`CompositeHash` contracts are not part of this cut.
- **Completion:** literal digests, production refusal truth, bounded admission before effects,
  immutable evidence, exact closed-tree verification, child-selection equivalence, projection
  document continuity and independent pin capture. Retain TS-01's diagnostic controls.
- **Landing evidence:**
  [FS exact cut and owner verification](./dist-content-identity.plan/landing/S2.landing.md)
  records the reviewed 36-path source cut, R-01 correction, independent review with qualified
  blindness, adjudication and post-correction checks. The landing also included the general README
  edits and the previously excluded Std property-order edit; the receipt records that scope
  difference without extending the earlier review's provenance.

### S3 — Server evidence, generations and hosting

- **Owner:** attributable `code/sys/server/src/m.server.dist/`, `src/m.server.dist.service/`, shared
  Dist fixtures, samples and README; `code/sys.model/model/src/m.files.static/`; and
  `code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts`. Includes residue R-02. FilesStatic
  is a real hosting dependency, not an observation-UI adapter to postpone. Workstream D applies.
- **Dependencies:** S1–S2. Tools, Cell and Pi service callers follow.
- **Completion:** scheme-bound addressing, scalar-first hostile-evidence refusal, exact inventory
  membership, candidate/winner document continuity, no-clobber, leases and independent release
  errors; pinned/local hosting and service-config refusal. Preserve terminal lifecycle/resize tests
  while removing only the obsolete display-clock contract. Real build composition belongs later.

### S4 — Tools staging and publication ownership

- **Owner:** attributable `code/sys.tools/src/cli.deploy/` staging, finalization, preview/menu,
  provider integration and tests; the staging task in `code/sys.tools/deno.json`. Includes residue
  R-03. Workstream F's exact-document destructive-operation authority is the cohesive boundary.
- **Dependencies:** S1–S3; real build-backed execution also requires S6. Review finalization and its
  production caller together even when the intermediate tree still has unmigrated build callers.
- **Completion:** explicit publication ownership, no deletion of equal foreign bytes, retained
  original/independent causes, awaited finalizers, exact-document cleanup refusal, and truthful
  preview invalidation/digest/size. Include TS-03's reachable Tools changes in attribution, but do
  not recommit their already-landed hunks. Do not reopen the independent R2 publisher repair.

### S5 — Tools Pull and Serve consumers

- **Owner:** attributable `code/sys.tools/src/cli.pull/` and `src/cli.serve/`, including YAML/CLI
  parsing, help, fixtures and tests. This is caller expectation/configuration, not staging ownership.
- **Dependencies:** S1–S3. Cell examples in S7 consume these conventions.
- **Completion:** old-only and mixed input refusal before acquisition, independent pin propagation,
  materialization and local/pinned status, mutable-projection non-authority, preserved credentials
  and caller bounds. No inferred pins, config conversion or checksum aliases. Workstream F applies.

### S6 — Build and snapshot producer success contracts

- **Owner:** Vite `src/m.vite/{t.ts,u/u.build.ts}` and ordinary build tests, help, cached-serve fixture
  and SRI-fixture response narrowing; Tools `cli.crypto/cmd.hash/` and
  `cli.crdt/cmd.doc.snapshot/`; `deploy/@tdb.data/src/fs/m.DataPipeline/` and
  `deploy/@tdb.edu.slug/src/m.slug.compiler/` Dist producers and their fixtures/tests. Include the
  corresponding snapshot/hash/data test-task deltas, not unrelated deployment work.
- **Dependencies:** S1–S2. These callers share one success postcondition: canonical computation
  succeeded and any required document/package writes completed before success is reported. Preserve
  non-saving hash jobs; do not require every producer to save or expose the same response wrapper.
- **Completion:** narrowed build responses, copied path authority, required package-file write,
  retained returned pin/checksum, truthful hash display, and refusal before secondary writes/counts.
  Ordinary owner tests stay here even where execution awaits frozen-fixture correction. The existing
  internal `buildWith` fault seam is earned; deferred failure-cause enhancement stays in the final
  refactor. Dependency-policy support is allocated separately below. Workstreams A/H apply.

### S7 — Cell service configuration and authored help

- **Owner:** attributable `code/sys/cell/` Dist-host/proof fixtures and tests, README/sample README,
  authored `src/m.help/yaml/` examples, their parity tests, generated `-bundle.json` and task wiring.
- **Dependencies:** S1–S3 and S5, plus S4 for the provider-neutral Deploy sample/proof.
  `DeploySampleProof.run` executes the actual sample's `DeployStageTask` → `Deploy.stage` → S4's
  staging finalizer. Include S4 in the recorded verification context; keep the Cell regression in
  S7. The opening order already places S4 first, so no reordering or new gate is needed.
- **Completion:** canonical service/pulled-view expectations, old-input refusal, no two-identity
  assertions, and generated help matching its authored source. Keep source and generated changes
  together under the owning generator; do not hand-fix generated formatting or rebind sample pins.
  The existing Deploy proof scope is Cell's `test:deploy:authority` and
  `src/m.cell/-test/-u.load.test.ts` through its owning `test` task, against the declared dependency
  context when execution is authorized. This is S7 owner proof, not an additional deferred item.

### S8 — Pi GUI payload/package admission

- **Owner:** attributable `code/sys.driver/driver-pi/` GUI service/session/presentation, covered
  `u.pkg.ts`, local-evidence and preview-build response contracts, owner tests/process fixtures and
  the two ZIP artifact JSON files. Proof-only preview forwarding is split below. Workstream G applies.
- **Dependencies:** S1–S3 and S6; covered `pkg/-pkg.json` is Pi policy, not a generic Dist requirement.
- **Completion:** bounded inventoried/checksum-verified package reads at both admission boundaries,
  captured expected package, cancellation draining and host/Generation ownership, canonical preview
  handoff and old-evidence refusal. Retain ZIP owner parity evidence; repeat only for changed inputs.
  Do not edit profiles, retained release evidence or shared outputs. Real preview isolation is later.

### S9 — R2 inventory admission and sample selection

- **Owner:** attributable `code/sys.driver/driver-cloudflare/` ReadRoute types/admission/lifecycle
  tests and docs; sample build record, selection, status, local-proof code and deterministic tests.
  Include only the identity-specific App/render-test/README hunks described below.
- **Dependencies:** S1–S2 and S6; sample serving also uses S3. Workstreams E/H apply.
- **Completion:** shared bounded inventory admission, zero policy effects before acceptance,
  canonical per-projection pins, captured document fences, producer refusal and publish-selected-build
  behavior. The UI distinguishes observed content and document hashes. No promise of later response
  checksums, browser execution integrity or provider acceptance; no real publication or sample repin.

### S10 — Observation and signing consumer contract closure

- **Owner:** DenoEntry `src/m.cloud/m.DenoEntry/`; React `use/use.Dist/`; UI-components Dist samples
  and `Http.Origin/`; UI-dev ModuleList regression; Model-slug Dist fixtures; the signer's
  `src/m.dist/-test/-.test.ts` integrated regression. These are the named observation/signature
  consumers, not a bucket for residual files or new cleanup.
- **Dependencies:** S1–S2 and the reachable signer correction. Workstreams B/H apply.
- **Completion:** local consistency uses the sole verifier but remains unpinned; manifest-only UI
  observations never imply payload authentication; async replacement/disposal retains its controls;
  downstream fixture/cache assumptions match the contract. Real-file compute → sign/writeback →
  load → strict verification preserves own keys. Canonical-document signing remains separate from
  content identity, and raw-file signature behavior stays unchanged.

### Mixed hunks and exclusions

Path ownership above selects attributable deltas, never every edit under a directory. Resolve these
known shared files by symbol/behavior, then inspect the actual cut before landing:

- **Vite:** canonical response/production and ordinary build assertions belong to S6. The optional
  `Build.Args.dependencyPolicy`, its `u.build.ts` forwarding, `u.wrangle.ts` command support, focused
  command assertions, build-test policy arguments and `u.bridge.fixture.ts` frozen discovery belong
  to the frozen-fixture proof item. Keep each declaration/caller/test chain together. These flags
  constrain the immediate child only; neither their presence nor their removal proves containment.
- **Pipeline:** `-dist.pipeline.ts`, `u.dist.pipeline.cleanup.ts`, its focused cleanup test and
  `code/sys.driver/driver-vite/deno.json` pipeline task/aggregate-test wiring belong to the pipeline
  proof item. Preserve R3-A06 settlement behavior; do not move ordinary producer tests there.
- **Pi preview:** response/source-pin migration and ordinary assertions belong to S8. The optional
  `PreviewBuildInput.dependencyPolicy` type/import, conditional command forwarding in
  `-scripts/m.start.gui.preview.build/{mod.ts,u.runtime.ts}`, their focused assertions and
  `-scripts/-test.external/-task.start.gui.preview.real.ts` belong to the real-preview proof item,
  depending on Vite's earlier proof support. Preserve ordinary defaults and environment guards.
- **Tools tasks:** `test:deploy:staging` belongs to S4; `test:crdt:snapshot` and `test:crypto:hash`
  belong to S6. Task-file proximity does not combine their source units.
- **Cloudflare sample:** `src/ui/ui.App.tsx`, `src/-test/-ui.render.test.tsx` and README use the
  [recorded minimal semantic cut](./dist-content-identity.plan/reviews/03/R3.landing-scope.md#tested-minimal-mixed-candidate)
  as inspected evidence, not a patch to apply blindly against later bytes. Leave presentation,
  image/exposure work and visualizer changes separate.
- Preserve the workspace private-publication fix, template source/bundle refresh, plan buffer and
  all other unrelated deltas. Historical aggregate counts are not a current selection recipe.

### Attributable residue — owner-local completion, not a new cleanup item

These three source-traced leftovers invalidate blanket residue-clear claims. They belong to the
named source units, not the later accounting refactor or a new all-source review requirement.

- **R-01 → S2:** `code/sys/fs/src/m.Pkg.Dist/u/u.hash.ts::hashes` explicitly computes
  `CompositeHash.digest(outParts)` after child merging; `u/u.compute.ts` consumes only the parts and
  obtains canonical identity through `captureContent`. Remove that unused Dist-local computation
  and any resulting unused import. Preserve generic hashing and direct/reuse selection, exact keys,
  collisions and literal canonical identity controls. Source inspection must show the dead work is
  gone; the owning producer tests must still prove those outcomes.
- **R-02 → S3:** remove `PresentationArgs.renderedAt` in `u.server.screen/t.ts`, its forwarding in
  `u.runtime.ts`, and `ServeEffects.now` / `effects.now()` in `u.server.start/u.serve.ts` under
  `code/sys/server/src/m.server.dist/`. The layout no longer consumes it. Include the serve/screen
  fixtures and tests, including currently unchanged `-test/u.fixture.serve.ts`; remove only the
  obsolete clock inputs/assertion, not tests of lifecycle, keyboard/browser policy, resize scheduling,
  output or exactly-once cleanup. Real scheduler use of `Time` remains. Recheck the owner reference
  closure and run the affected serve/screen/browser-policy tests.
- **R-03 → S4:** remove `stageAge` and `formatStageAgeText` from
  `code/sys.tools/src/cli.deploy/u.menu/u/u.promptEndpointAction.ts`; `menu.endpoint.ts` no longer
  supplies age. Retire the field from `-menu.endpoint.preview.test.ts` capture/expectations and
  inspect prompt tests. Preserve truthful digest/size, mutation invalidation, action labels and
  nested-preview cleanup controls; prove their behavior through the menu/prompt owner tests.

## Deferred proof commits — scope and completion

These are bounded implementation/test commits, not review receipts or new `GATE` items. Deferred
execution does not justify weakening assertions, hiding failed tests, changing dependency versions,
relaxing guards, rebinding retained evidence or claiming whole-chain offline containment from parent
flags. Required production fixes and ordinary owner-test migrations stay with their source units.
Allocate mixed production/proof-support hunks explicitly; a proof item may own only the smallest
necessary harness, command or forwarding correction. A run is successful only when the named scope
passes, not when it contains passing subcounts.

### Frozen Vite fixture authority

`fix(driver-vite): align frozen build fixtures with their dependency authority`

- **Owner:** `code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts`, the child-command
  boundary and its focused tests. The reported refusal is a fixture/command lock-authority mismatch,
  not established evidence of a Dist identity defect or a dependency upgrade requirement. An
  unchanged root-lock copy was tried and refused; it is not a validated remedy.
- **Dependency:** the source migration's canonical build-response and package-output contracts.
  This correction precedes both build-dependent proof items below.
- **Completion:** regression coverage for the demonstrated fixture refusal and successful execution
  of the existing `-build.test.ts` and `-build.workspace-composition.test.ts` through the owning
  `test:unit` task. Retain sample, worker, workspace, path/base, content-pin and successful-child /
  failed-package-write assertions. Capture the child diagnostic on failure; do not infer a cause
  from a boolean assertion alone.
- **Boundary:** preserve fixed dependency versions, repository lock authority and frozen checks.
  No general loader/resolver redesign, cache-repair acquisition or permission expansion. If the
  authorized route is unavailable, report that item-specific blocker without turning it into an
  all-source landing prerequisite or silently expanding the item.

### Build, projection and serving composition

`test(dist): prove canonical build projection and serving composition`

- **Owner:** `code/sys.driver/driver-vite/src/m.vite/-test.external/-dist.pipeline.ts`,
  `u.dist.pipeline.cleanup.ts`, its focused cleanup tests and the owning `test:dist:pipeline` task.
- **Dependencies:** canonical Vite, FS and Server source contracts plus the frozen-fixture correction.
- **Completion:** two real builds with stable payload pins but distinct manifest checksums; recorded
  projection pins; materialization and pinned serving of the expected bytes; original-document warm
  reuse; changed-byte/path and stale-pin refusal. Preserve the existing SRI-byte assertions rather
  than opening a separate SRI project. Include the already-required independent composition evidence.
- **Failure settlement:** retain R3-A06 body/cleanup failure arbitration, drained hosts, leases and
  independent release errors. Refused restoration/removal never authorizes deletion around that
  refusal. A passing cleanup-only test does not replace the real pipeline proof.

### Real Pi preview isolation

`test(driver-pi): prove canonical Dist isolation across real previews`

- **Owner:** `code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.preview.real.ts`,
  its preview-build fixture/forwarding boundary and the owning `test:preview:real` task.
- **Dependencies:** canonical Pi package/source admission, Vite and Server contracts plus the
  frozen-fixture correction. Run after the pipeline item in the recorded execution sequence.
- **Completion:** two real preview generations with equal payload identity and distinct documents;
  the first remains verified and served while the second is built and cleaned up; covered package
  admission accepts the expected package and refuses a conflicting expectation. Preserve original
  documents, shared-output snapshots, environment sanitization, independent failures and cleanup.
- **Boundary:** preserve the task's `--deny-write=../../..` guard, retained release evidence and
  ordinary developer behavior. No shared-output rebuild, GUI reset, release rebinding, provider
  publication or broader launcher/permission work.

The human-reported ZIP read/extract `prep:zip --check` parity already passed, as recorded in
[R3 landing evidence](./dist-content-identity.plan/reviews/03/R3.landing-scope.md#subsequent-functional-receipts-and-fixture-lock-diagnosis).
Do not invent another missing ZIP proof; repeat only if relevant owner inputs change. The proof tail
has no implicit fourth catch-all audit, upgrade or tooling project. A newly discovered obligation
must be reported and explicitly scoped before changing arc membership.

## Dist test-signal audit — implementing-thread adjudication

The original source/history adjudication performed no runtime reproduction or source/test edits.
The human subsequently authorized all four bounded closure steps; the TS-01 proof below records that
later execution. Observed HEAD remains `8d97fe4088bed6764e804424b767b089ffb13cf3`; that does not
identify dirty source bytes or author intent. No Git mutation or independent review occurred here.

### TS-01 — accepted: producer failure-truth regression; red → green proof

At adjudication, `code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts::compute` combined missing and
non-directory roots under `Dist directory does not exist.`. An existing regular file returned
`kind: 'failed'` and `exists: true`, but carried a false absence cause inside
`Dist computation failed.`. HEAD distinguished the cases; its two tests in
`code/sys/fs/src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts` asserted that distinction and path context.
The replacement test had retained refusal but checked only error presence. This was an attributable
diagnostic regression, not invalid-content acceptance or evidence of deliberate test suppression.

The authorized two-file correction first added distinct cause assertions against isolated missing
and regular-file roots. The producer run failed exactly on expected `Dist path is not a directory.`
versus actual `Dist directory does not exist.`. Splitting the two refusal branches then passed
1 suite / 19 steps; the full Dist owner scope passed 18 suites / 148 steps. Exact-file format/lint
passed. Tests check both `StdError.cause.message` and `Err.summary(error, { cause: true })`, truthful
`exists`/`dir`, failed-kind, absent document/pin/checksum authority, unchanged file bytes and no new
filesystem output. The generic outer message and failed-result shape remain unchanged; historical
absolute-path disclosure and success-shaped failure data were not restored. Exact commands are in
[R3 closure execution](./dist-content-identity.plan/reviews/03/R3.corrections.md#authorized-closure-pass--fs-diagnostic-proof).

The [R1 assertion audit](./dist-content-identity.plan/reviews/01/R1.corrections.md#prior-assertion-audit)
retired the old shape/path-specific expectations. That disposition does **not** waive truthful
failure reasons; TS-01 corrects that narrower audit omission. This belongs to the current replacement,
not the separate inventory-accounting refactor or an adjacent cleanup project.

### TS-02 — already covered: historical greens are not current-byte verification

See [R3 exclusive-slot execution](./dist-content-identity.plan/reviews/03/R3.corrections.md#exclusive-slot-execution--tools-complete):
Tools exact-root staging passed 1 suite / 45 steps and public lifecycle passed 1 suite / 2 steps
sequentially after the corrections. The handoff's older description of Tools as unexecuted is
superseded by that receipt. Fresh post-correction real Vite build/pipeline and Pi preview runs remain
outstanding under the recorded execution constraints; earlier successes cannot close that gap.
No duplicate obligation or speculative resolver project is added. General resolver hardening stays
parked in the [adjacent register](./dist-content-identity.plan/adjacent-findings.md); no bypass, permission
widening or claim of current composition acceptance follows from deferral.

### TS-03 — accepted: migration attribution includes reachable committed Tools changes

`177d10929f985b45b74c35fae37ff80c6d9e8d0a` is an ancestor of the observed HEAD. Despite its subject,
`plan(create): html-capability.plan.md`, its actual diff includes seven files under
`code/sys.tools/src/cli.deploy/`:

- `-test/-u.preview.parity.test.ts`
- `-test/-u.stage.lifecycle.test.ts`
- `-test/-u.stage.test.ts`
- `u.fmt/u.fmt.endpoint.ts`
- `u.menu/menu.endpoint.ts`
- `u.providers/provider.r2/-test/u.fixture.ts`
- `u.providers/provider.r2/u.push.ts`

Those hunks migrate evidence to `content`/`manifestChecksum`, guard fixture compute success and
remove displayed stage age from content-verification evidence. Review attribution for these files
must include the `177d10929^` → `177d10929` changes plus subsequent worktree deltas, not just
`HEAD` → worktree. Its parent is `97cc6977e9308423934836b4567cb5c58219d5ca`; this is a local historical
comparison point, not an asserted pristine baseline for the entire migration. Commit content, not its
subject, establishes this scope. No history rewrite, new landing item or inference of intent is needed.

### Audit boundary — reject blanket restoration of retired tests

HEAD's `checkSelfReported` tests replayed ignore-policy rules/digests as verification authority. That
contract is intentionally removed. Current `u/u.hash.ts::ignore` still awaits descriptive policy
hashing; the current producer test checks selection/metadata, and `Local.verify` explicitly proves
that altered policy metadata is inert while changed payload bytes refuse. Restore a test only for a
surviving invariant, not merely because an async historical test disappeared. These inspected examples
are not exhaustive assertion-preservation clearance. This handoff is not blind closure and triggers
no new broad review campaign.

## Prior owner proof — receipts and limits

The [R1 correction/audit record](./dist-content-identity.plan/reviews/01/R1.corrections.md),
[round 02](./dist-content-identity.plan/reviews/02/) and
[round 03](./dist-content-identity.plan/reviews/03/README.md) retain historical review and correction
provenance. R3's four reports were adjudicated; the six accepted corrections have focused proofs in
[R3 corrections](./dist-content-identity.plan/reviews/03/R3.corrections.md). The
[targeted closure charter](./dist-content-identity.plan/reviews/03/R3.closure.review.plan.md) is a
charter, not evidence that its independent review ran. Allocate required closure to source owners;
the named pipeline proof owns independent composition evidence.

The [R3 semantic verdict](./dist-content-identity.plan/reviews/03/R3.corrections.md#implementer-semantic-verdict)
identified no unresolved material semantic defect at that checkpoint. It is not a current blanket
STIER/residue certification: R-01–R-03 above establish remaining attributable cleanup. Preserve the
accepted corrections, especially explicit Tools publication/deletion ownership and Generation's
bounded hidden/symbol-member refusal, zero getter effects and exactly-once release. Their tests
must not be removed to simplify the source split.

Historical, overlapping owner receipts after those corrections include:

| Owner/scope | Suites / steps | Evidence boundary |
| --- | --- | --- |
| FS Dist | 18 / 148 | Includes TS-01 truthful producer refusal |
| Server | 6 / 128 | Includes exact inventory membership and release controls |
| Tools staging | 7 / 125 | Includes no-clobber publication/deletion ownership |
| Pi GUI | 5 / 57 | Owner admission/session proof, not real preview/release proof |
| HTTP | 1 / 1 | Canonical inventory seam with unchanged transport checksum meaning |
| Cloudflare mixed candidate | 2 / 20 | Minimal semantic cut and restored live files each passed |
| Cell help | 2 / 13 | Authored/generated source-map parity |

Exact twelve-file format/lint and scoped whitespace checks also passed at that checkpoint. The
broader lint run retained seventeen unrelated/pre-existing diagnostics; it was not a global green.
The generated Cell newline remained under its writer's ownership. Commands, earlier non-additive
receipts and the historical path inventory are in
[R3 corrections](./dist-content-identity.plan/reviews/03/R3.corrections.md) and
[R3 landing scope](./dist-content-identity.plan/reviews/03/R3.landing-scope.md). Those aggregate
counts are not S1–S10 cut manifests. Removed recovery/capture files are not accessible baselines.

The [subsequent human receipts](./dist-content-identity.plan/reviews/03/R3.landing-scope.md#subsequent-functional-receipts-and-fixture-lock-diagnosis)
supersede missing ZIP parity and record failed Vite runs, the concrete frozen fixture-lock refusal,
and the unsuccessful/reverted lock-copy attempt. ZIP parity passed; current Vite build/pipeline and
Pi real-preview closure did not. The proof items above own those gaps. Historical “landing remains
no-go” wording in linked records describes the former aggregate landing policy, not a veto on
reviewed source units under this plan. Parent flags still do not prove loader/subprocess containment.

Reuse evidence only within its demonstrated scope. Historical commands are not current launcher
instructions; prior reports/conclusions must not be supplied as authority to a blind reviewer. This
plan revision runs no source tests and grants no new execution, mutation or release authority.

## Historical implementation verification checkpoint

The receipts below predate the R1 corrections. See
[correction and assertion-audit evidence](./dist-content-identity.plan/reviews/01/R1.corrections.md)
for the subsequent authorized batch, remaining coverage qualifications, and prospective source
capture. Earlier touched-file audit statements do not attest final post-correction STIER closure.

Implementation began after the human's explicit GO. All A–H obligations apply to the single
integrated replacement. The opening arc alone records landing; owner greens below establish neither
whole-pipeline completion nor provider/browser/release evidence.

- Types/Std define `sys.dist/v2`, `{ scheme, digest }` pins, and the bounded payload-tuple encoder.
  Generic CompositeHash semantics are unchanged; legacy Dist conversion was removed.
- FS proof covers production, loading, narrow admission/verification evidence, child selection,
  projections, and named pins. Metadata-only replacement tests retain separate `manifestChecksum`
  continuity. Full check, unit (80 tests / 736 steps), and process (4 tests / 6 steps) passed.
- FilesStatic consumes `DistContent`, with descriptive `buildTime` separate. Full Model check and
  tests (45 tests / 221 steps) passed.
- Server proof preserves document fences through sealing/publication/settlement, separate-winner
  provenance, credentials, cancellation, hostile-input refusal, leases, and cleanup. Full check,
  unit (43 tests / 336 steps), process (4 tests / 10 steps), and HTTP samples (2 tests / 2 steps)
  passed. Content-pin refusal remains distinct from asset-checksum refusal.
- Tools full check passed previously. Focused Pull (23 / 97), Deploy (40 / 364), restricted Deploy
  authority, hash, Serve, and snapshot producer refusal passed. Equal-content replacement documents
  do not restore temporary-manifest deletion authority. A fresh full run passed with a complete
  terminal receipt: 126 tests / 791 steps.
- Cell's pulled-view help and generated bundle require independent `sys.dist/v2` pins; the stale
  bundle regression failed before the owning help bundler ran and passed afterward (2 / 12).
  Dist-host services (1 / 9) and provider-neutral Deploy authority passed separately. Full package
  check passed on rerun. A fresh full run passed with a complete terminal receipt: 41 tests / 333
  steps. No real sample pin was rebound.
- DenoEntry's `Local.verify` remains unpinned observation. Focused tests (2 tests / 12 steps) cover
  cwd-anchor canonicalization while still refusing a selected Dist symlink and changed payload.
- Vite success narrowing now covers the shared SRI fixture. The cached serve fixture is checked
  against current FS production; that assertion failed before the v2 fixture correction and then
  passed without granting build authority to the serve child. Recovered full-task receipts show unit
  (73 / 603), entry process (2 / 10), and candidate consumers (4 / 4) green. A fresh package check
  passed without truncated output. The SRI/Chromium lane passed (11 / 186).
- Vite's new `test:dist:pipeline` passes (1 / 1) and is included in the ordinary `test` task. Two
  real builds with fixed source/configuration produce equal inventories/pins and different document
  checksums. Public FS projection and local pin recording feed four cold materializations, pinned
  hosting, byte/length checks, and emitted JS/CSS SRI checks. Metadata/layout/root-label replacement
  preserves pins; offline reuse retains the first document. Changed payloads and paths reject stale
  pins, including manifest-only refusal before materializer asset acquisition. The capstone was
  added after implementation, not demonstrated red against the old implementation; its initial
  failures were fixture type/setup errors. It does not claim browser execution. Following the
  human's dependency-order challenge, this proof uses only public FS/Server contracts and Vite-owned
  fixtures in `-test.external`, not reverse imports from the Cloudflare sample. Sample build-record,
  partition, and display contracts remain under the sample's test owner.
- Signer full tests passed (5 tests / 52 steps), Monaco full tests passed (28 / 354), and Stripe
  unit tests passed (6 / 14). Fresh Model-slug (55 / 234) and HTTP unit (59 / 456) runs passed with
  complete terminal receipts. HTTP's denied-authority file-bytes entry process proof passed.
  Stripe's owning `test:build` also passed; local bundle/browser checks passed (2 / 3). These
  establish the fixture's browser runtime, not a live Stripe payment/provider transaction.
- Http.Origin focused tests passed (3 / 11). Its new regression supplies an inconsistent
  self-reported digest and proves manifest-only acquisition plus explicit unpinned wording; it
  failed before the wording fix and passed afterward. A fresh full UI-components run passed with a
  complete terminal receipt: 85 tests / 564 steps.
- Edu-slug full tests passed (53 tests / 239 steps), including the producer-refusal controls. TDB
  data producer tests passed separately (2 tests / 4 steps).
- Cloudflare's sample now consumes structured content pins, narrowed content evidence, and builder
  success. Its captured verification and local proof retain operation-wide document checksums;
  metadata-only replacements before/after capture and during proof refuse. Bundle totals come from
  admitted entries, while browser manifest observations remain explicitly unpinned. The new UI
  assertions failed before implementation and then passed. Fresh complete receipts: sample (27 /
  134), parent including the sample (42 / 273). Parent check passed. Exact-file formatting passed
  for all 21 changed sample files. No destructive real sample build or pin rebinding ran.
- Pi's full check and unit run passed (77 / 530), as did reset process (1 / 1), profiles process (2
  / 17), release task contracts (2 / 10), and release launcher process (1 / 1). All 26 changed Pi
  files passed exact-file formatting. Package policy reads covered `pkg/-pkg.json` bytes at both
  boundaries; cancellation drains these reads before Generation release. Real cold materialization
  and offline reuse retain both package checks. The isolated real-preview proof passed (1 / 4),
  including equal pins across two builds and distinct document checksums. Retained legacy rehearsal
  evidence remains unchanged and explicitly refuses; none of these tests is real release evidence.
- The residue scan found stale Dist code in Pi's two prepared ZIP artifacts. The owning
  `prep:zip --check` failed before regeneration; `prep:zip` regenerated only the two artifact JSON
  files, and the following parity check passed for both. Focused ZIP tests passed (7 / 61). No
  profile, tool-permission, or retained release-evidence change was made.
- Tmpl's fresh full receipt is complete: 24 tests / 94 steps, zero failures (3m6s). This closes the
  missing full-run receipt; the earlier interrupted run still has no established cause.
- The touched-file audit now covers attributable authored source, tests, configuration, and docs,
  including the untracked contract/pipeline/package-policy tests. Exact-file checks cover Types/Std,
  FS, Server, Tools, Model/Model-slug, Cloudflare/sample, Vite, DenoEntry, Signer, Pi, Cell, HTTP,
  observation UI, and secondary producers. Generated Cell/ZIP bytes follow their owning generators.
  The expanded pass corrected layout in 19 files through surgical edits, without formatter writes,
  test deletion, or intended behavioral changes. Fresh proofs passed: FS (4 / 40), Tools hash (4 /
  18), snapshot (1 / 2), Deploy (40 / 364), FilesStatic (1 / 13), TDB (2 / 4), edu-slug (1 / 2), and
  Cloudflare admission/lifecycle (2 / 20).
- Broader documentation searches found five additional stale surfaces: FS and Server READMEs, the
  static HTTP sample README, and Pull/DistService module comments. They now distinguish the
  independent content pin from document checksums, show the actual store namespace and input shapes,
  and preserve unpinned/manifest-only evidence limits. All five exact-file checks passed.
- Residue searches leave explicit negative old-input/API controls, DenoEntry's wrapper over the sole
  Local verifier, Pi's negative launcher-marker scan, and untracked generated browser output.
  Workspace dependency-manifest pin terminology concerns dependency upgrades, not Dist. Retained Pi
  rehearsal evidence remains deliberately old and refuses; it was not rebound. The final whitespace
  check passed. Unrelated sample footer wording and UI visualizer configuration were inspected for
  attribution and left untouched.
- The human reported a green workspace test run: 56 packages, 10,679 tests, 45 reports collected, 11
  not applicable, in 8 minutes. This is human-reported evidence, not an independently inspected
  report set, and precedes the new pipeline proof and ZIP artifact regeneration.

At that historical checkpoint, the three diagnosis-only handoffs informed serial R2/Vite fixes and
the implementer reported a completed residue/formatting pass. Its independent-review charters live in
`dist-content-identity.plan/reviews/01/`; neither that earlier completion statement nor those receipts
certify the current source units. Later corrections and R-01–R-03 retain their own obligations.
Neither the owner receipts nor the historical local pipeline establishes publication or Pi release
evidence. Profile permissions, real evidence binding and publication retain separate authority.

## Research verdict

**The original content-stability requirement is explicit, not reconstructed from memory.** The
checksum-pinned acquisition work solved real security problems, but the inspected history does not
establish why exact serialization must replace stable content identity as the value the operator
pins. Preserve its protections; revisit that identity choice.

This is not evidence that the entire earlier effort was careless. Its confinement, bounded reads,
independent expected authority, mutation detection, and publication ownership are valuable. Nor is
today's embedded digest already adequate for security: it omits the path-to-content binding.

### Reachable historical evidence

Research baseline: `4b7d3e636 feat(sample.r2): compare private and public manifest identities`.
History was inspected only through read-only Git. These are research anchors, not this plan's arc.

- `458bfab9b feat(fs/pkg): add trustChildDist for dist.json hashing (reuse child hashes)` introduced
  child-inventory reuse.
- `fa39da60e fix(fs): harden Pkg.Dist hash policy for deterministic staging digests` explicitly
  says: "separate content integrity from build metadata so no-op rebuilds remain hash-stable". Its
  diff removes child manifest bytes from parent hashing and adds stability tests. Current
  `Pkg.Dist.Compute.Args.trustChildDist` still documents that rationale.
- `dbbf98435 feat(fs): verify pinned strict Dist generations` adds exact-byte pin verification
  before decoding, then strict manifest/tree/content verification.
- The completed foundation snapshot at
  `a7c6a9f62:-agent/-plan/@sys.fs/verified-dist-filesystem-foundations.plan.md` explicitly selects
  `integrity` as the SHA-256 of exact manifest bytes. It records strong security requirements and
  reviews; it does not compare that choice with a path-bound, canonical content pin.
- `1f74dc010 refactor(dist)!: make Dist trust authority explicit` adds `manifest.integrity` to
  compute/Vite/CLI output, removes remote self-reported convenience, and renames local consistency
  checking. Its exact-byte pin source is a separate addition to the existing content digest.
- The materialization snapshot at
  `6bf22370f:-agent/-plan/@sys.server/verified-dist-materialization.plan.md` expressly makes the
  independently supplied manifest checksum, not `dist.hash.digest`, artifact authority. Independence
  of expectation is necessary; it does not itself require whole-document byte identity.
- `0169c2c20 feat(pkg): add canonical Dist pin contracts` later names the existing exact-byte
  convention `DistPin`. `ff24c6d98` propagates it through projections and named selections.
- `867add7c5 fix(tools): compare R2 manifest identity before skipping publication` is concrete
  downstream evidence of the split: equal payload digests still require manifest replacement when
  timestamps, formatting, or BOM bytes differ.
- The live Driver Pi release plan's `fix(driver-pi): display verified Dist digest in GUI status`
  section explicitly keeps byte authority separate from the operator-facing content digest. This is
  a deliberate presentation repair around the split, not evidence that the split is unavoidable.

No inspected record establishes that the path omission was the reason exact-byte pins were chosen.
Do not invent that historical rationale. Source establishes that exact-byte pinning currently covers
it, regardless of the original motivation.

## Findings and executable failure sequences

These findings describe the recorded research baseline, not a claim that every defect remains in
current source. Reachable history includes the independent publisher repair:
`482e42505 fix(tools): compare R2 publication parts by exact path and hash`. This revision does not
rerun or attest its proof; the sequences preserve the identity work's rationale.

### 1. Existing composite digest does not bind names or sizes

`code/sys/crypto/src/m.Hash.Composite/u.digest.ts` sorts keys, extracts the content hashes from
their values, and hashes their newline-joined sequence. Key text and part byte sizes are not hash
input. Its existing tests explicitly assert this algorithm. This is an encoding omission, not a
SHA-256 collision attack.

Let A and B be distinct byte strings with content hashes hA and hB:

- `{ 'a.js': hA }` and `{ 'b.js': hA }` produce the same digest.
- `{ 'a.js': hA, 'b.js': hB }` and `{ 'b.js': hA, 'c.js': hB }` also produce the same digest.
- Changing only the size suffix of a part leaves the digest unchanged.

This generic primitive also serves directory hashing and Vite caches. Do not change its existing
algorithm globally and silently invalidate those contracts. The new authoritative identity belongs
to Dist, with a versioned encoding; ordinary file checksums remain SHA-256 of file bytes.

### 2. Historical R2 publication failures, independently repaired

Owner: `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts`. At the research baseline,
two distinct defects made publication unsafe:

- **Aggregate equality:** remote `a.js = A, b.js = B` and local `b.js = A, c.js = B` had equal
  composite digests. The root-digest shortcut skipped `b.js`, uploaded `c.js`, replaced the
  manifest, and pruned `a.js`, leaving B where the new manifest declared A.
- **Path rewriting:** `toFilesPath` trimmed keys and collapsed/repaired separators. Distinct
  `" a.js" = A` and `"a.js" = B` could both read/write the unspaced path, omit the leading-space
  object, and prune it despite its manifest membership. The first quoted name begins with U+0020;
  that spelling is supported, not an alias to repair or a reason to ban whitespace.

These were source-traced failure sequences, not executed counterexamples in this research pass. The
independent repair at `482e42505` binds exact paths and complete part values, including size. Keep
that contract through this replacement, including exact staged reads/object keys, pruning,
manifest-last publication, byte-exact manifest comparison, and failure reporting. Preserve refusal
of unsupported spellings/collisions without introducing a new global path policy.

Its trusted-remote-metadata optimization does not verify every skipped remote object's bytes or
protect against arbitrary concurrent writers. The repair and its existing provider regressions are
not new work or a review prerequisite in this arc; this revision does not re-attest their results.

### 3. Whole-manifest pinning over-identifies the payload

`code/sys/fs/src/m.Pkg.Dist/u/u.compute.ts` emits `build.time`, builder/runtime/schema-policy
metadata, then hashes the serialized manifest for `manifest.integrity`. Changes to those descriptive
values, whitespace, or member order can change a pin without changing the loaded payload.

Exact-byte identity is still useful for transport diagnostics, publication fidelity, and detecting
mutation during one read. Its existence is not the problem. Promoting it to the primary distribution
identity is the choice under review.

### 4. Not all metadata is currently descriptive in practice

- Pi's `u.start/u.gui/u.service.ts` compares `verification.dist.pkg` with launcher-owned
  `expectedPkg`; package identity participates in admission.
- FS `project` and R2 `fromDist` pass the whole authenticated manifest to caller selection
  callbacks. A caller can branch on build metadata today.
- Strict FS admission executes bounded ignore matching from `build.hash.ignore` and checks totals.
- Server materialization derives resource targets/checksums/sizes from authenticated manifest data.
- The signer canonicalizes the complete manifest value, including metadata, before signing. That
  signature contract is neither the raw-document checksum nor the existing composite digest.

Therefore, excluding fields from a new pin while continuing to call the whole manifest authenticated
would be a trust regression. The replacement must narrow authenticated evidence and callback input.
Pi's existing root-label comparison establishes a consumer-replacement obligation, not a reason to
broaden the identity subject. Its package check must consume verified payload facts under its own
caller policy.

### 5. Collection and document reconstruction must preserve own keys

`code/sys/fs/src/m.Dir.Hash/u.compute.ts` feeds relative paths to
`code/sys/crypto/src/m.Hash.Composite/u.builder.ts`. The builder stores parts in ordinary `{}` with
`parts[key] = value`. For a root file named `__proto__`, assigning a hash string invokes the
inherited setter rather than creating the selected own property. The entry can disappear before an
encoder sees it. This is source-confirmed; no new regression was executed during plan adjudication.

A canonical encoding of an incomplete inventory is still wrong. The collection item makes storage
lossless through the existing owner, using safe dictionary/map semantics and owned snapshots.
Preserve enumeration, overwrite/remove, serialization, and round-trip behavior for
prototype-sensitive names. This narrow storage correction does not change `CompositeHash.digest`'s
generic preimage or its empty-builder behavior. Previously omitted entries must no longer disappear;
ordinary generic vectors remain stable. Keeping an unrelated generic hash contract is not retaining
a legacy Dist lane. Strict tree verification should refuse an omitted file, so this is not claimed
as a demonstrated bypass of today's pinned verifier.

The signer has an independent reconstruction defect at
`code/sys.driver/driver-signer/src/m.dist/u.run.dist.ts::canonicalizeJson`: it rebuilds sorted
objects with `{}` and assignment. An own `__proto__` member can disappear or affect the new object's
prototype. Default signature-descriptor writeback can therefore remove a part while retaining the
producer's digest; signing without writeback can still omit a document member from canonical signed
bytes. Correct the signer first so newly preserved producer keys do not reach a still-lossy signer.
Keep canonical-document signing; neither content-digest signing nor a lossy compatibility mode is a
repair. Standalone and integrated proof belong to their respective landing units below.

### 6. Existing byte expectations also fence enclosing operations

`code/sys/fs/src/m.Pkg.Dist/u/u.project.ts` verifies the source before selection and again after
output publication using the same expected manifest checksum. Server's
`code/sys/server/src/m.server.dist/u.materialize/u.run.ts` similarly carries one byte expectation
through acquisition, staging, sealing, and final verification. Replacing only those arguments with
content pins would admit metadata-only changes between individually successful checks. Preserve that
enclosing-operation protection explicitly; a per-verifier mutation test alone is insufficient.

Tools staging also uses exact bytes as destructive-operation authority.
`code/sys.tools/src/cli.deploy/u.staging/u.manifest.ts` retains a directory identity and manifest
checksum for validation, removal, and retraction. `u.finalizeDistTree.ts::writeManifest` currently
obtains that checksum from `computed.manifest.integrity`. A content-equal metadata replacement M′
must not authorize deleting a previously owned M. Keep this private document checksum explicitly
named `manifestChecksum`, separate from content identity. The current byte check is protection to
preserve, not an established cleanup bypass.

### 7. Child reuse must not bypass parent selection

`code/sys/fs/src/m.Pkg.Dist/u/u.hash.ts::hashes` applies filtering/ignore policy to direct
collection, then merges child entries with
`parts[Path.join(child.rootRel, Str.trimLeadingDotSlash(childPath))] = uri`. A parent-excluded
`private.txt` can reappear through the child inventory; path operations can also repair spelling
rather than prove exact rebasing. Supported-child recognition alone does not fix these problems.
Workstream A must admit the child descriptor, preserve exact rebasing, refuse collisions, and apply
parent selection with the same path semantics as direct collection. Reused hashes are an
optimization, not proof of current file bytes or independent authority.

### Alternatives considered

- **Keep exact-document pins:** coherent when approval deliberately selects every byte of one
  manifest, including provenance annotations. It also gives a simpler pre-parse authentication
  boundary. Rejected as a Dist pin contract because it does not satisfy stable payload identity.
  Retain byte checks only for named document/transport operations, not as a second accepted Dist
  pin.
- **Pin today's embedded digest:** unsafe as a distribution selector because paths are not bound.
- **Canonicalize the whole manifest:** removes formatting differences, not timestamp/builder churn.
  This is close to the signer's document contract, not the desired content identity.
- **Commit the exact payload inventory:** selected approach. Bind paths, hashes, lengths, and
  scheme; reconcile consumers that currently rely on other manifest fields being authenticated.
- **Also commit root package labels:** coherent labeled-distribution identity, but a different
  subject. Rejected here because manifest-only relabeling would break payload stability. A covered
  package file already participates as ordinary payload; consumer policy may interpret its verified
  bytes without changing the generic digest contract.
- **Use an immutable descriptor document with provenance elsewhere:** can retain byte-before-parse
  authentication, but requires a different layout/serialization contract. It is not necessary for
  this proposal, and an embedded checksum of the complete enclosing document would be
  self-referential.
- **Change CompositeHash globally:** unrelated directory/cache identities change without a protocol
  marker. A Dist-owned encoding is narrower. Correcting the builder's lost-key storage defect is
  separate from changing its digest algorithm.

## Proposed identity contract

The following is proposed new behavior, not an assertion that these APIs or schema fields exist.
Workstream A of the breaking replacement must freeze the public types, manifest discriminator
placement, budget contract, and literal vectors before consumer implementation proceeds. These are
intra-change dependencies, not independently shipped protocol stages. The payload-only subject is
not deferred to consumers.

### Subject

Identity names a nonempty, closed regular-file payload inventory under a supported Dist scheme. It
does not name a build event, enclosing JSON document, root package label, provider, or the
application's entire runtime environment. It is not proof of benign code, producer identity, or
freshness. Preserve the strict static-distribution file-kind contract: symlinks, special files, and
undeclared files/directories are refused. This is not an executable-permission/archive scheme. If
permission bits or other file kinds become execution inputs, evolve the contract explicitly.

For a given identity:

- every exact relative payload path is committed;
- every file's complete bytes are committed through its SHA-256;
- every declared byte length is committed and checked against observed bytes;
- interpretation semantics are committed by a fixed version/domain identifier.

Within one supported scheme, equal admitted inventories produce equal identity regardless of root
`pkg` presence/value, build time, builder/runtime annotations, or manifest layout. Root-label
changes cannot satisfy or defeat a consumer's authenticated package check. If `pkg/-pkg.json` is in
the inventory, its bytes participate like any other file; changing it changes content identity. Vite
emits that file when supplied a package, but generic producers and projections need not do so. No
generic Dist package-file requirement is introduced. Pi's separate package policy belongs to its
consumer replacement.

Keep the new contract's nonempty-inventory rule aligned with current strict admission. Refuse an
empty Dist production candidate rather than emitting a pin that the verifier cannot admit. Do not
silently redefine the generic builder's empty string or direct empty-map digest behavior.

### Canonical representation

Proposed minimal preimage: UTF-8 of one compact JSON tuple with a fixed version/domain token and
code-unit-sorted file tuples. There is no package-label slot:

```text
["sys.dist/v2", [[path, canonical-sha256, byte-length], ...]]
```

This is a byte-level contract to freeze with literal vectors, not an invitation to hash an arbitrary
object or recursively stringify the full manifest. Use `Json.stringify(value, 0)` and
`Hash.sha256(bytes)` through system owners. Define no trailing newline, exact string escaping,
code-unit ordering, canonical lowercase SHA-256 strings, and safe nonnegative integer lengths.
Reject malformed scalar strings and ambiguous/noncanonical path spellings rather than repairing
names while verifying. Preserve exact case and Unicode spelling; do not silently normalize Unicode,
case-fold, use locale ordering, or join paths with the host's separator.

The current Rooted portable target grammar remains the security owner for filesystem paths. Do not
copy it into consumers. The pure encoder consumes a validated descriptor and defines its bytes;
strict admission remains responsible for bounds, path safety, duplicate/structural collisions, and
closed-world membership. Builder and verifier must produce the same descriptor independently.

Keep `hash.digest` as the primary displayed value. Require one supported identity-scheme
discriminator in the manifest and external pin. A proposed pin is
`{ scheme: 'sys.dist/v2', digest: <canonical SHA-256> }`; final field placement belongs to
workstream A's type contract. The pin retains the same digest as an independent expectation; it is
not a hash of that string or a second identity. A bare `sha256-` string cannot identify its preimage
contract. The marker is domain separation and exact interpretation, not multi-version negotiation.
Refuse missing or unsupported schemes. Neither a JSR versioned type URL nor `build.hash.policy`
selects executable verification behavior.

### Fields and authority

| Field/fact                                                     | New identity treatment                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Identity scheme/version                                        | Committed, locally supported, no remote algorithm dispatch                       |
| Exact path, file hash, byte length                             | Committed inventory; actual-byte assurance depends on the verifier/delivery path |
| Root package name/version or absence                           | Descriptive observation; excluded from content identity and package authority    |
| Package declaration inside an inventoried file                 | Ordinary committed payload; consumer policy uses checksum-verified file bytes    |
| Declared set of files                                          | Complete authoritative inventory, not a glob suggestion                          |
| `build.time`, builder, runtime, documentation/type URLs        | Descriptive observations; no pin churn                                           |
| Build totals                                                   | Derived from authenticated entries/bytes, not independent authority              |
| Ignore rules and their digest                                  | Producer selection description, not permission to serve extra files              |
| Signature descriptor/key hint                                  | Not a trust root; existing signature verification stays separate                 |
| Manifest whitespace, ordering, BOM                             | Not content identity; decoder acceptance is an explicit contract                 |
| Origin, credentials, routes, CSP, worker grants, caller limits | Separate caller policy, never inferred from excluded metadata                    |

Selected paths already capture the result of producer filtering. Verification still rejects every
undeclared file/directory under the strict tree contract. Removing ignore-rule authority must not
turn ignore patterns into a way to bypass exact-tree checks. If a future manifest field controls
loading, it must enter a new authenticated schema or remain explicit external caller policy; unknown
fields must never acquire authority by accident.

Authenticated evidence contains only the committed projection and owner-derived facts. Preserve raw
manifest/build observations separately and label them unauthenticated by the content pin. Selection
callbacks get the authenticated view, not the old whole-manifest shape under unchanged trust claims.
Do not keep a field named `verified.dist` that quietly grants the old assurance to excluded fields.

Keep assurance levels explicit in types, API documentation, and display:

| Evidence                                         | What it establishes                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Downloaded/schema-recognized manifest            | Observation; neither an independent expectation nor payload verification                 |
| Descriptor recomputed against an independent pin | Admitted inventory, not yet proof of all resource bytes                                  |
| Strictly verified local generation               | Observed complete tree and file bytes under the verifier's supported filesystem contract |
| Checksum-verified response read                  | That response's observed bytes; not automatically every browser-executed resource        |

Pinned Server hosting currently refuses `/dist.json`; its local-unpinned mode can return retained,
checked manifest bytes. Preserve that distinction. R2 `fromDist` admits the construction-time
inventory, but its current handler does not compare later bodies with part checksums. UI
`Http.Origin/use.Verify.ts` and the R2 sample loader observe manifests rather than establish
verified execution. No green display, schema guard, or self-consistent root digest may imply more
authority.

### Ownership

- `@sys/types`: versioned Dist/pin/identity vocabulary, not a silent reinterpretation of
  `CompositeHash` or the old checksum pin.
- `@sys/std/pkg`: pure descriptor/encoding contract within the existing `Pkg.Dist` owner; no crypto
  dependency added back into std. Existing crypto depends on std.
- `@sys/crypto`: existing `Hash.sha256` supplies hashing; no parallel hash algorithm or generic
  canonicalization framework is required. Repair lossless builder storage at its existing owner;
  generic `CompositeHash.digest` and its ordinary vectors remain unchanged.
- `@sys/driver-signer`: preserve every own document member during canonical reconstruction and
  descriptor writeback. Its canonical-document signature remains separate from content identity.
- `@sys/fs/pkg`: compose the shared encoder and hash for production and strict admission; own
  whole-tree proof, projections, immutable snapshots, and operation-wide byte-stability fences.
- `@sys/model` FilesStatic: adapt the actual hosting index to the admitted inventory without
  fabricating whole-manifest assurance. Build-time observations remain distinct from file authority.
- Server/R2/Tools/Pi: consume admitted identity and evidence; do not reproduce digest, path, or
  schema interpretation. Pi owns its package-admission policy, not Dist's identity subject. Put
  reusable byte-reading/parsing mechanisms at existing owners only when an actual consumer earns
  them.
- UI/browser consumers: expose the appropriate assurance level. Shared encoding and hashing do not
  substitute for an independent pin, file verification, or verified browser execution.

Only introduce a new module boundary if earned; prefer extending existing owners. If a new scaffold
is needed, follow template/human landing policy rather than hand-creating a package.

## Verification model and the changed parsing boundary

New content-pinned acquisition must be:

```text
capture independent expected scheme/digest and caller limits
→ bounded byte acquisition
→ one strict UTF-8/JSON interpretation into an owned snapshot
→ bounded supported-schema and canonical-path admission
→ recompute committed descriptor digest and compare with expected pin
→ release only authenticated inventory facts to policy callbacks or resource acquisition
→ verify each actual file and the complete tree
→ let consumer package policy use verified payload bytes, where that policy is required
→ retain operation-wide document stability and truthful final evidence
```

Comparing the downloaded `hash.digest` string alone is never verification. Authenticate its
recomputed descriptor against the independently supplied expectation, then verify content bytes. Do
not derive expected authority from the same endpoint that supplies the artifact.

Unlike the old byte pin, a content pin cannot authenticate the raw document before interpreting it.
This is a genuine trade-off: keep finite byte/entry/string/work limits before consequential work,
reject unsupported schemas, and perform no resource fetch, callback, staging publication, or
listener startup using unauthenticated descriptor data. Generic HTTP byte-checksum semantics stay
unchanged; a Dist digest must never be passed as `Fetch.blob(..., { checksum })` for the manifest.

### One parser interpretation

The proposed v2 interpretation uses the existing `@sys/std/json` native parsed-value semantics, not
JSONC and not a new duplicate-rejecting parser. Freeze these rules with workstream A's vectors:

- Decode as fatal UTF-8. Accept a single leading UTF-8 BOM as the existing decoder does; it is not
  content identity. A second BOM outside a JSON string is not silently stripped. Retain the exact
  original bytes independently for document observations and mutation checks.
- Parse once through `Json.parse` into an owned value. Duplicate object members, including escaped
  spellings of the same key, have native last-member-wins semantics. Authentication names that final
  parsed inventory, not all textual occurrences. Test duplicate scheme/hash/parts/path fields with
  conflicting values; earlier text must not supply a different consumer's authority.
- Build one bounded, immutable admitted descriptor. Downstream authenticated decisions consume that
  descriptor, not a second raw-document parse or a first-member-wins interpretation. Raw bytes may
  remain available as explicitly unauthenticated document observations.
- Descriptor strings must be Unicode scalar strings. Reject unpaired surrogates; preserve exact case
  and Unicode spelling without normalization. Use code-unit ordering, not locale ordering.
- Retain the existing Part owner's exact lowercase `sha256-` plus 64-hex grammar and required
  canonical decimal `:size=` value. Reject missing sizes, signs, leading-zero aliases, exponent
  spellings, fractions, and unsafe lengths in part strings. Encode admitted safe integer lengths as
  compact JSON numbers. Do not introduce a competing part parser in a consumer.
- Select behavior only from the locally supported scheme discriminator. Unknown fields and
  descriptive type/policy URLs cannot select algorithms or acquire authority.

This is a Dist encoding/interpretation contract, not an RFC-8785/JCS claim. Literal byte and digest
vectors must independently fix escaping, ordering, BOM, duplicate, Unicode, and number behavior;
producer and verifier agreeing through one shared helper is insufficient proof. If a supported
consumer cannot obey this interpretation, replace that call site before the integrated change lands;
do not add try-both parsing or silently switch to another duplicate policy.

### Pre-authentication resource contract

Workstream A defines concrete budget types/defaults and failure semantics; workstream B implements
and proves enforcement within the same breaking change. No remote content-pin admission activates
before that proof. The costs below are requirements, not claims that all limits already exist:

- Enforce the caller's finite manifest-byte ceiling during acquisition, before whole-body decoding
  or parsing. Server must compose the stricter of transport `maxBytes` and verification
  `manifestBytes` during acquisition, not only after Blob construction. Snapshot caller authority
  and limits first. Malformed UTF-8/JSON is a bounded refusal.
- Inventory entry count, individual and aggregate path/string work, implied-directory count, and
  safe file/total-byte arithmetic are bounded before sorting, normalization, collection expansion,
  or resource acquisition. Include worst-case shared prefixes and duplicate textual members.
- Bound post-parse traversal/copying and nesting work before recursively visiting attacker-owned
  observations. Do not deep-freeze or clone arbitrary excluded metadata merely to construct the
  authenticated result. Schema rejection must not trigger an unbounded error/diagnostic walk.
- Account separately for native parsing allocation/work, descriptor traversal, path comparison,
  serialization, and hashing. A byte ceiling bounds input size; it is not by itself proof of a depth
  ceiling, CPU deadline, or interruptible synchronous parser. Exercise worst-case bounded inputs on
  supported runtimes. If required bounds cannot be enforced by the existing surface, resolve a
  justified owner-level change before remote content-pin admission; do not relax them.
- Excluded ignore rules/key hints are not executable admission policy. No ignored-file escape,
  signature-key discovery, callback, asset fetch, stage publication, or listener startup may occur
  from unauthenticated descriptor data. Cancellation keeps existing finite refusal/cleanup truth; do
  not claim a signal interrupts native synchronous parsing.

### Operation snapshots are not another distribution identity

Retain exact bytes or a clearly named `manifestChecksum` as internal document-change evidence, not
another pin or primary display value. Keep retained bytes privately owned; exposing an observation
requires a separate copy, not the internally retained mutable `Uint8Array`. A frozen wrapper alone
does not protect its contents. Preserve checks across the **enclosing operation**, not just inside
each individual verifier invocation:

| Operation                                               | Required document fence                                                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projection                                              | Retain the first admitted source document across selection, all output work, and final source recheck; metadata-only source replacement is refused |
| Materialization of this operation's stage               | Retain the fetched/admitted document through stage verification, promotion/sealing, and final verification of that same candidate                  |
| Initially existing generation                           | Retain its first successful document observation across sealing and final checks                                                                   |
| Established separate concurrent winner                  | Admit that winner under the same content pin, then retain its own document across observation/sealing/final checks                                 |
| Unresolved candidate provenance after promotion failure | Retain the owned candidate's original fence; do not establish a new baseline merely because the target is visible or reported as occupied/existing |
| Tools staging validation/removal/retraction             | Retain directory identity and the private exact-document checksum; content-equal replacement does not authorize deletion                           |
| Local-unpinned manifest response                        | Compare with the retained local observation; pinned hosting continues to refuse `/dist.json`                                                       |

An established separate winner may have different descriptive bytes from the losing download. Verify
it independently and return its observations; never overwrite its sealed manifest or compare its
document blindly with the losing candidate's checksum. Only established separate-candidate
provenance permits that replacement of the operation's document baseline.

Publication reporting and candidate provenance are different facts. In Server's
`u.materialize/u.run.ts::promoteVerifiedStage`, a committed promotion failure plus a visible target
settles conservatively through `settleVisible` as occupied. `Dist.Existing` means publication by
this attempt was not proven; it does not prove another candidate won. Rooted's `committed` can also
refer to private-stage changes. Neither those labels nor content-digest equality authorizes a new
manifest baseline. Otherwise an owned document M changed to metadata-only M′ after publication could
be accepted as a freshly observed winner.

Carry the original document fence through unresolved settlement, or refuse if the required
continuity cannot be established. Matching original bytes may still settle with the existing
conservative classification; do not invent promoted provenance. Add a narrow Rooted observation
surface only if needed to prove a separate winner and admit additional cases. Preserve independent
phase, publication, cleanup, and lease-release truth on every refusal.

Tools staging must carry its retained document checksum through finalization and temporary/root
manifest cleanup. Compare directory identity and exact bytes, not a content pin. A supported,
content-equal metadata replacement refuses cleanup and remains intact; unchanged owned documents
still clean up normally. Renaming `integrity` must not erase this deletion-authority distinction.

Tests must mutate metadata between projection checks, between materialization phases, and before
staging cleanup, not only inside one FS verification call. Include an established
equal-content/different-document winner, ambiguous unchanged-document settlement, and ambiguous
post-publication document mutation. Observed within-operation changes still refuse even when a
rebuild in a separate operation would legitimately retain the same content identity. This is
snapshot/recheck protection, not a claim to detect every transient write or provide an atomic OS
no-follow primitive.

## Clean-break API, artifact, and release behavior

- Expose one supported Dist manifest/pin contract. Replace the old pin type, capture/guards, runtime
  admission, producer output, configuration, and consumers together. No old-format overload, union,
  mode flag, opt-in producer, decoder fallback, conversion helper, or retained byte-pin verifier.
- Remove existing Dist compatibility surfaces, not just prospective ones: `DistPkgLegacy`,
  `Pkg.Is.distCompat`, `Pkg.Dist.Compat` / `toCanonical`, and `Dist.load`'s legacy kind/value branch
  at the Types, Std, and FS owners. Update exports, callers, namespace-freeze tests, and fixtures.
  Old shapes belong only in refusal tests and historical documentation, not accepted runtime APIs.
- Content identity and internal manifest-document checks must use distinct names/types. Remove old
  Dist `integrity` inputs rather than accepting them as aliases; never reinterpret their strings as
  content expectations. Keep exact-byte observations only where a named operation needs them, not as
  another pin, default build identity, or primary display value.
- Address the sole supported generation contract in a scheme-bound store namespace. Do not search an
  old checksum-addressed namespace, promote its contents, or relabel its key as a content digest. A
  candidate reached under the new namespace still requires full verification. Unsupported or
  occupied-invalid candidates refuse; never refresh their sealed metadata to make them acceptable.
- Rebuild disposable development distributions and recorded pins explicitly through their producer
  workflows. Do not convert old manifests, discover replacement expectations from downloads, or
  automatically rename/delete stores. Independently owned evidence stays outside this authority; an
  old evidence record is refused until its owner explicitly rebuilds and rebinds it. This is a
  supported refusal, not an old-format execution lane or permission to skip package/authority
  checks.
- Same content identity with different descriptive manifest bytes may reuse a fully verified
  existing generation under the operation-fence rules above. An ambiguous promotion failure is not
  evidence of a separate winner and cannot reset the baseline. Keep the admitted generation's
  retained manifest; do not refresh sealed metadata. Returned observations describe that generation,
  not a losing download. Cold/warm paths must agree on authenticated facts.
- Byte-exact publication can still update descriptive manifests. Content-equal does not prove that a
  requested exact document was uploaded. Preserve that distinction in push/readback diagnostics.
- New build pins come from the trusted producer or an explicitly selected, verified local candidate.
  Replacement never discovers a pin from a download, silently rebinds Pi evidence, or treats
  URL/TLS/ETag/self-consistency as the expected artifact identity.
- Signer behavior remains canonical-document signing, with lossless own-key reconstruction. Keep
  ordinary serialization/signature vectors and raw-file signing unchanged; do not preserve the lossy
  bug as a compatibility mode. Signature-descriptor and descriptive-member changes affect document
  signatures without changing content identity. A signature sidecar is not automatically admitted as
  executable tree content.
- Parent Dist computation may flatten child payload entries while excluding child manifest bytes,
  subject to workstream A's admission, exact-rebasing, collision, and parent-selection rules. That
  does not authenticate excluded child package metadata or permit loading child manifests as trusted
  content. `trustChildDist` remains a producer optimization, not independent verification; actual
  bytes must be checked before executable authority is granted.
- `UNPINNED` remains correct for locally observed consistency with no independent expected digest. A
  prettier matching hash does not create provenance or expected authority.

## Landing units and implementation workstreams

### 1. Lossless canonical-document signing at the existing owner

`fix(driver-signer): preserve own keys in canonical Dist documents` repairs `canonicalizeJson` at
`code/sys.driver/driver-signer/src/m.dist/u.run.dist.ts` without changing the current Dist contract.
Use lossless own-property construction at every reconstructed object depth. Preserve ordering,
serialization, detached signature-descriptor behavior, and failure reporting; do not change the
signature subject to the content digest or add a generic canonicalization framework.

Prove the fix through the existing `src/m.dist/-test/-.test.ts` signing surface with parsed
own-property fixtures under today's Dist shape. Cover `__proto__` and other prototype-sensitive keys
in inventories and nested descriptive objects, both default descriptor writeback and signing without
writeback. Assert retained own membership, canonical signed bytes, and successful signature
verification; changing an own descriptive member must change signed bytes and defeat the old
signature. Preserve ordinary signature/serialization vectors and raw-file signing.

These standalone fixtures must not depend on the collection correction to construct their keys. The
real file → compute → descriptor writeback → load → strict content verification proof belongs to the
integrated replacement. Land signer before collection so producer completeness is not followed by
lossy document signing; this ordering introduces no new Dist protocol or support lane.

### 2. Lossless collection at the existing owner

`fix(crypto): preserve every selected key in composite hash builders` is independently useful and
can land without changing the Dist contract. Correct the builder's own-key storage and owned
snapshots, including `__proto__`, without changing the generic digest preimage, algorithm selection,
or empty-builder/direct-empty-map behavior. Existing directory/cache consumers keep their contract;
previously lost selected entries now participate as they should.

Prove own membership, count, overwrite/remove, digest-cache invalidation, snapshot independence, and
JSON round-trip for prototype-sensitive keys. Add an FS integration regression through real selected
files, collection, and the current Dist manifest serialization; an encoder-only test cannot prove
collection completeness. Preserve ordinary generic digest vectors. Do not exclude a supported
filename to hide the defect. This item neither introduces the new identity nor claims to verify it.

### 3. One contract across the source sequence

S1–S10 allocate the producer/consumer replacement previously named
`feat(dist)!: unify build pins and verification on canonical content identity`. That aggregate
subject is historical, not an additional expected commit. Workstreams A–H below specify the
contract and proof obligations across those units; they are not another landing ledger. The three
deferred proof items retain their explicit owners and completion criteria above.

The pin type, strict capture, FS verification, Server addressing and consumer arguments are coupled.
Document those dependencies in the source commit sequence rather than requiring every intermediate
commit to pass CI. Review each unit's behavior against the intended contract and name the dependency
snapshot used for its tests. Do not claim isolated-commit or release coverage from an integrated
worktree run. Intermediate migration dependencies are acceptable; undisclosed defects are not.

The completed source sequence must migrate all affected first-party paths to one contract. Do not
introduce opt-in switches, temporary compatibility adapters, old/new unions or new protocol machinery
merely to enable smaller commits. Owner-local correctness remains required; the explicitly deferred
real-build proofs complete cross-boundary evidence after source landing.

#### A. Canonical contract and producer replacement

Freeze the payload-only descriptor, scheme/discriminator, public type shape, parser interpretation,
resource-budget contract, and independently established literal preimage/digest vectors. Add pure
encoding at Std's existing Pkg.Dist owner and use it in the ordinary FS compute path. This becomes
the only production behavior, not an option. Keep Crypto's generic digest contract separate.

Replace old Dist pin/manifest compatibility types, guards, helpers, and load results at their
existing owners. The new descriptor and observation types must not inherit whole-manifest trust.
Retain old inputs only to prove refusal; neither unpinned loading nor child-inventory reuse may
secretly accept or convert an old Dist shape.

Define `trustChildDist` at `u/u.hash.ts` as a selection-preserving hash optimization:

- Admit each reused child descriptor under the supported schema/path/budget rules, or refuse.
- Rebase admitted child paths exactly under their parent-relative prefix. Do not trim names, repair
  dot/separator aliases, or use host path normalization as proof of canonical spelling.
- Refuse rebased structural/key collisions with direct entries or another child; no last-writer-wins
  merge.
- Apply parent filter/ignore selection with the same path representation and semantics as direct
  collection. Child membership cannot resurrect a parent-excluded file.
- Prove reuse/direct inventory and identity equivalence for matching supported child inventories,
  including parent-excluded `private.txt`, sibling prefixes, and space-sensitive names. Arbitrary
  stale child hashes cannot satisfy that equivalence premise and are not actual-byte proof.

Carry lossless collection through descriptor reconstruction and production, including
prototype-sensitive paths. Freeze producer refusal semantics: empty/invalid candidates must not
publish a manifest or pin, and callers must propagate failure rather than re-save a returned value
or report a successful write. Keep generic empty hashing unchanged. Prove path/content/size
sensitivity, root-label/metadata/layout invariance, insertion-order stability, string encoding, and
domain separation. Replace the assumption that Dist and Dir.Hash have the same digest with their
distinct contracts. Freeze the exact vectors, public wire shape, parser semantics, and
budget-enforcement ownership before building dependent workstreams. Producer proof does not
substitute for workstream B's strict admission proof.

#### B. Strict filesystem admission and verification

Replace byte-pin admission with closed content-pin admission and independent descriptor
recomputation. Split authenticated inventory evidence from descriptive manifest observations.
Enforce the pre-authentication resource contract and return an owned immutable descriptor before
callbacks or asset reads. Reject old or mixed pin/configuration inputs before manifest acquisition.
After bounded manifest acquisition, refuse old shapes, missing/unknown schemes, empty inventories,
and old composite values under the new scheme before any policy callback or payload acquisition. Do
not keep the previous verifier behind another exported name or option.

Preserve portable targets, exact-tree checks, bounded file reads, observation/recheck-based link and
identity refusal, mutation classification, cancellation, and immutable results. The current IO owner
uses ordinary `Deno.open` surrounded by observations; do not claim an atomic OS no-follow guarantee.
Stop on unsupported filesystem behavior instead of broadening the claimed protection.

Reuse one admission owner for manifest-only and complete-tree proof. Local consistency remains
separate from independently pinned proof. Expose the retained document observation needed by
operation owners without treating it as a second content pin. Test no callback/asset read before pin
acceptance and metadata-only mutation inside verification, in addition to ordinary content, path,
schema, bounds, and cancellation refusals.

Explicitly replace or remove `u/u.checkSelfReported.ts` and its types/callers. It currently
delegates to `DirHash.verify`, accepts an optional generic hash, and replays `build.hash.ignore`. No
alternate old Dist algorithm may survive behind an observation API. Any retained self-consistency
surface must use the sole supported Dist admission/content rules, not manifest-supplied ignore
authority, and remain `UNPINNED` without an independent expectation. Update DenoEntry's
`u.checkSelfReported.ts` wrapper and every caller to the chosen disposition.

#### C. Projections and named pins

Replace the contracts of `Dist.project`, `Pins.capture/verify`, and selection evidence. Callbacks
receive only explicitly authenticated inventory facts. Compute each output identity from its own
exact payload inventory, never by copying the parent digest or hashing the digest string. The stored
pin records that same output identity as an expectation. Root package annotations do not affect it.

Retain the first source document fence across selection, output creation/publication, and final
source recheck. Exercise metadata-only replacements between those phases, preserving partial-output
truth on refusal. Prove output order, budgets, frozen pins, no-clobber, and parent/child boundaries.
A projection may omit a package file and still be a valid generic Dist; consumers requiring that
file must refuse it under their own policy, not promote an excluded root label instead.

#### D. Server materialization, generation ownership, and hosting

Replace `m.server.dist`, `m.server.dist.service`, input snapshots, error evidence, store keys, local
transport, pinned hosting, and per-read checks. Adopt shared bounded Dist admission before staging
or resource acquisition, replacing the materializer's independent partial manifest interpretation.
Generic Fetch/Pull byte-checksum semantics do not change.

Include the actual FilesStatic hosting dependency at
`code/sys.model/model/src/m.files.static/u/u.index.ts` and its public types/callers. Adapt its index
to admitted inventory; do not fabricate an authenticated whole Dist to satisfy the old interface.
Keep optional build-time observations separate. Preserve narrow verification/hosting dependency
closures and update all callers to the one admitted-inventory contract; no old-interface adapter.

Fence fetched/staged/final documents for the same candidate. Carry initial-existing and staged
verification observations forward instead of discarding them. Distinguish a known owned candidate,
an established separate winner, and unresolved candidate provenance. A conservative `existing` or
`occupied` result after promotion failure must not reset the original fence. Separate-winner reuse
requires evidence, not an inference from equal content, target visibility, or `committed`.

Extend the existing `-test/-materialize.test.ts` case “does not infer promoted provenance from a
committed error and visible target” with metadata-only M → M′ after publication: refuse while
retaining publication/cleanup evidence. Pair it with successful established equal-content/different-
document winner reuse, unchanged-document ambiguous settlement preserving its conservative result,
and bounded refusal when the required continuity evidence is unavailable. Never fabricate winner
provenance to return success. These are workstream D's proofs, not new arc items or a Rooted
redesign.

Preserve cold acquisition, offline reuse, occupied-invalid refusal, no-clobber, leases/sealing,
cleanup, phase/publication truth, and the scheme-bound store namespace. Never refresh sealed
metadata in place or reuse an old checksum-addressed generation as an accepted content generation.

Preserve `/dist.json` refusal under pinned hosting and checked retained-manifest responses under
local-unpinned hosting. Verify payload bytes on existing per-read paths; status renders the same
content identity as the selected expectation without overstating delivery or browser assurance.

#### E. R2 route-inventory authority

Replace `R2.ReadRoute.fromDist`'s pin and admission with the sole contract and narrowed callback
view. Keep source/signing/authorization/deadline behavior and route allowlists unchanged. Test
path/hash substitution, unsupported schemes, and zero policy callbacks before successful admission.
Root package/build metadata cannot influence the authenticated route-selection callback.

This API admits a construction-time inventory, not every later response body. Preserve that explicit
limit: a later routed `dist.json` need not equal the construction snapshot. Content pinning alone
adds neither per-response checksum enforcement nor browser asset integrity. Any separately requested
stronger delivery contract requires its own changed-response-body proof, not a wording upgrade here.

#### F. Tools consumer replacement

Replace Pull YAML/CLI, service configuration, local serving, hash output, publication status, and
generated examples with the sole content-pin contract. Remove old Dist exact-document input fields
and aliases; reject old-only and mixed old/new configurations before acquisition. Reuse shared
pin/descriptor validation; do not add consumer-owned SHA regexes or schema interpretations.

Preserve the staging ledger's exact-document authority at `cli.deploy/u.staging/u.manifest.ts`
(`retainStagingManifest`, validation, removal, and retraction) and
`u.finalizeDistTree.ts::writeManifest`. Rename the private record/helper vocabulary to document
checksum/`manifestChecksum`; retain directory identity and the checksum of the actual owned bytes,
including existing failed-write retention behavior. Public content evidence and local staging
verification do not replace this cleanup authority.

Extend `u.staging/-test/-u.execute.test.ts`'s “fails closed on temporary child-manifest mutation”
with supported metadata-only M → M′ retaining the same content identity. Refuse finalization and
cleanup, preserve M′, and retain the existing combined failure truth (“finalization failed and
temporary-manifest cleanup also failed”). Pair with unchanged temporary-manifest removal, successful
root retention, root retraction/rollback, and directory-identity refusal controls.

Preserve mutable-projection non-authority, source/credential bounds, and explicit operator consent
for publication. The independent R2 repair remains separate; its per-path correctness must survive
this replacement. Distinguish publication fidelity from content identity in diagnostics.

#### G. Pi consumer replacement

Reconcile the GUI call sites, not the generic identity subject. Replace generated
release/development source contracts, local evidence generation, preview handoff, generation/host
arguments, package checks, diagnostics, and status together. Keep profile YAML, permissions, and
independently owned evidence leaves outside this work. Do not add a release-to-development fallback.

The currently checked-in `u.service.evidence.ts` identifies itself as local-rehearsal evidence, not
published release evidence. Its old checksum does not become a content pin by renaming a field.
After the contract replacement, an unrebuilt record must refuse explicitly before acquisition;
exercise valid startup with newly producer-pinned test/preview inputs. Updating evidence generators
is in scope; running a real evidence rebinding workflow still requires its separate authority. Do
not retain a byte-pin lane merely to make an old rehearsal startup succeed.

Preserve Pi's independently supplied `expectedPkg` check through a documented package declaration
inside the verified GUI payload. Vite's existing `pkg/-pkg.json` is the concrete integration
starting point, not a universal Dist requirement. Before changing the call site, establish the GUI
producers' actual path/schema and use bounded checksum-verified file reads and existing package
parsing owners. Require own membership in the admitted inventory before `readPart`; that helper
alone does not prove membership. Validate the declaration strictly rather than admitting
`Pkg.fromJson` / `Pkg.toPkg`'s unknown defaults. Reusable mechanisms belong at existing owners only
as needed; Pi retains policy.

Preserve the release-generation check before application startup and the started-host check before
readiness publication. The latter is currently post-listener startup, not a pre-bind package
guarantee. Its new bounded read may be asynchronous: bind it to the captured directory and
started-host evidence, and integrate cancellation, host termination, and cleanup rather than
borrowing an unchecked fetch. Development preview still uses producer-pinned host verification, not
the local-unpinned lane.

Missing, malformed, unlisted, unreadable, or expected-package-mismatching declaration bytes refuse
GUI admission. No root `dist.pkg` fallback. A descriptive root label, including a conflicting or
absent label, cannot override verified payload facts or become package authority; any display of it
must be labeled observational. A projection omitting Pi's required declaration is not a valid GUI
candidate even if it is a valid generic Dist. Verify producer and fixture coverage rather than
assuming every Dist contains this file.

Prove root-label-only invariance, matching and conflicting covered declarations, missing declaration
refusal, valid-but-different payload refusal, independent expectation, cold/warm parity, both
package checks, truthful local-unpinned operation, and no release fallback. Do not regenerate real
evidence just to make tests pass. The separately owned public release/provider/browser/OS decision
remains.

#### H. Producer/display integration and end-to-end contract

Make first-party FS/Vite builds, readers, and consumers use the sole contract across the completed
source sequence.
Align Vite build responses, the sample's build record/projections/status/tables, CLI/package UI, and
first-party fixtures/docs. Remove superseded identity fields, helpers, aliases, examples, and old
acceptance tests rather than leaving a default-selection switch. `dist.pins.json` remains
sample-owned: FS projection produces each output identity, shared Pins capture validates
expectations, and the sample persists them. `dist/`, `dist.private/`, and `dist.public/` are
different inventories using one scheme, not three copies of one digest. Each projection's
build/pin/verification/display value must agree.

Propagate compute refusal through secondary producers before saving, reporting output paths, or
incrementing written counts:

- Tools CRDT `cli.crdt/cmd.doc.snapshot/u.calcAndSaveDist.ts::calcAndSaveDist` currently extracts
  `.dist` and writes it again without checking `compute.error`.
- Data pipeline
  `deploy/@tdb.data/src/fs/m.DataPipeline/u.dist.ts::{refreshMountDist,refreshRootDist}` currently
  reports output paths without checking compute failure.
- Slug compiler `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/u.dist.ts::writeDistFiles`
  currently counts unchecked compute as written.

Exercise empty/invalid refusal plus valid-output controls at these callers. The Server sample's
`code/sys/server/-sample/files.http.cmd/-start.ts::prepareRuntime` already checks `computed.error`;
update its contract/fixtures without misclassifying that guard as missing. Preserve the R2 sample's
publish-selected-build behavior; do not silently rebuild or repin when publishing.

Add the integrated signer regression: create a real root `__proto__` payload file, compute its Dist,
write the detached signature descriptor, load the result, and strictly verify against the retained
content pin. Assert the part and digest survive. Changing a prototype-sensitive descriptive member
changes canonical signed bytes but not payload identity. Keep standalone signer proofs distinct from
this cross-owner test; place signature sidecars outside the strict payload tree when needed.

Replace active two-identity assumptions in Cell's `u.sample.deploy.proof.ts` and
`-u.dist.fixture.ts`, pulled-view help/README and fixtures, Server/HTTP static samples/status, Tools
configuration/help, and generated examples. In
`code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts`, update Dist fixtures/FilesStatic
inputs while retaining the generic Fetch response checksum as a byte checksum, not a Dist pin.
Negative old-input fixtures are intentional refusals, not working examples.

Use one primary content-identity row per distribution. Exact-document checksums remain only where a
named byte-level operation or explicit diagnostic needs them, not as competing primary identity.
Short displays are presentation only; pin/copy/comparison boundaries retain the full scheme/digest.
Reconcile observation UI, including `Http.Origin/use.Verify.ts`, so manifest schema recognition or
self-consistency is not labeled independent payload or execution verification.

The deferred `test(dist): prove canonical build projection and serving composition` item owns two
real normal builds with fixed source/configuration and the same admitted payload inventories,
through build → projection → recorded pin → materialize → serve. Prove changed manifest
timestamps/layout/root labels do not churn their content identities. Prove path renames and payload
edits change identity and refuse stale expectations. Include whole-tree and per-read proof, not only
encoder equality or refreshed fixtures. This remains required composition evidence, but is not a
prerequisite to each earlier source commit. No live provider is required for this local pipeline
proof; real publication still requires separate authority.

Re-scan producers/consumers and record the disposition of every remaining identity assumption. The
residue pass must find no accepted old Dist shape, legacy export, old pin/configuration field,
opt-in mode, compatibility adapter, conversion routine, or checksum-store lookup in the completed
paths. Keep negative old-input fixtures and historical evidence clearly separated from active
API/examples.

Run narrow proofs, then impacted owner suites/checks. Dependency regeneration uses only owning
workflows. These are acceptance criteria, not a new `GATE`. Neither a renamed field/test nor passing
existing suites establishes the new protocol. Release, provider/browser approval, and real evidence
rebinding remain independently owned.

### 4. Bounded post-replacement ownership and failure-evidence cleanup

`refactor(dist): consolidate inventory accounting and retain build failure causes` follows the
integrated replacement. This is one bounded follow-up, not a general cleanup campaign or another
identity protocol. The TMIND/DMIND design pass inspected live types, implementations, tests, and
owning tasks; it executed no runtime proof. The opening arc already contains this item once.
Reinspect the landed predecessor before implementation; these notes do not attest future bytes or
make this later item current.

#### Design decision: share accounting, not authority

Server's `code/sys/server/src/m.server.dist/u.generation/u.is.ts::isVerification` repeats
structural-entry, path/prefix-work, and byte-total accounting from FS's
`code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts::captureContent` / `assertEntryLimit`. The
duplication is real, but the surrounding checks have different jobs. Generation admits hostile
programmatic settlement evidence; FS admits a parsed/producer-owned inventory and then verifies
paths and files. Do not merge those trust boundaries to remove similar-looking loops.

The strongest case for leaving the accounting duplicated is avoiding a larger public abstraction
than the duplicated algorithm. Extraction is earned only if it removes the semantic duplication with
immediate adoption by these two real callers. The proposed smallest surface below is a design for
this follow-up, not an existing API:

- Extend the existing FS `Pkg.Dist` owner with `Inventory.inspect({ parts, limits })`, a
  synchronous, no-I/O, one-shot inspection. Add its public types under FS `Pkg.Dist.Inventory` and
  implement it within the existing `m.Pkg.Dist` area; no new package or directory scaffold.
  Structural descendants and the reserved manifest entry are FS Dist semantics, not a reason to
  widen Std's pure encoder.
- `parts` is an unknown parts dictionary. `Inventory.Limits` uses the existing verification fields
  `entries`, `fileBytes`, `totalBytes`, `pathLength`, and `pathTotal`; no manifest-byte budget
  applies to an already structured inventory. Capture/validate limits without borrowed hooks and
  apply the existing Content hard ceilings. No caller-selectable interpretation or default remote
  authority.
- Success is an owned frozen `kind: 'inspected'` result with `files`, `totalBytes`, and
  `packageBytes`. `files` contains frozen `{ path, hash, size }` records; its length is the
  payload-file count. Refusal uses `invalid-input`, `malformed`, `unsafe-path`, or `limit-exceeded`
  as appropriate to the existing owner distinctions. No digest, pin, manifest observation, or
  `verified` evidence is minted. Preserve enumeration order here; canonical sorting remains with its
  existing owners.
- The one bounded traversal owns Part parsing, the pre-parse part-string length ceiling, Unicode
  scalar checks, safe byte addition, package-byte classification, and inventory/prefix accounting.
  Count one `dist.json`, every payload file, and each distinct implied directory. Charge every
  encountered prefix's UTF-16 length, including repeated prefixes, before slicing or Set insertion.
  `pathTotal` independently bounds full-path units and prefix-work units; never combine those sums.
- Refuse proxies and accessors without invoking them; preserve selected own enumerable keys,
  including `__proto__`. Do not allocate a whole key/entry array, sort, normalize, serialize, or
  copy unbounded caller data before admission. Freeze newly owned results, never caller inputs.
  Preserve the admitted dictionary/property semantics of the predecessor; any deliberate tightening
  needs an explicit owner-level contract decision rather than hiding inside a refactor.

Responsibilities remain split:

- **FS:** consume the inspected file records, retain Rooted's exact portable-target/collision
  checks, reserved-name refusal, and the unchanged Std encoder/Crypto digest composition. Producer
  and manifest admission use the same accounting; complete verification still reads the actual tree.
  Inspection alone does not establish path safety, independent expectation, or file-byte truth.
- **Generation:** retain scalar/envelope refusal before touching parts, native/frozen-data checks,
  binding to the expected pin, canonical document-checksum shape, and comparison of claimed
  file/byte totals with the inspection. Preserve the early claimed-file-count bound with a bounded
  own-key preflight if necessary; do not expand an entire inventory before discovering it exceeds
  its declared count. This structural preflight is not a second arithmetic implementation. Keep
  shared encoder/hash recomputation and all source/seal/publication/lease checks. Never treat
  `inspected` as `verified`.
- **Std/Crypto:** encoding bytes, tuple ordering, domain token, Part grammar, and SHA-256 behavior
  remain unchanged. Do not add FS policy or a second encoder there. Independent security decisions
  remain independent even though their deterministic accounting is shared.

No mode flags, validation callbacks, mutable public accountant, opaque certification token, JSON
round-trip adapter, reverse dependency, or consumer deep-import of private FS files. Preserve the
narrow verification dependency closure. If this one-shot surface requires a broader framework,
changes established admission outcomes, or loses bounded ordering, stop and bring that concrete
trade-off back; retaining explained duplication is preferable to a dishonest shared primitive.

#### Design decision: failed build results carry their own explanation

`code/sys.driver/driver-vite/src/m.vite/u/u.build.ts::buildWith` drops `written.error` and
`computed.error`; its failure response and formatter retain only child-process output. A successful
child followed by failed package publication or Dist computation therefore lacks the returned cause.

- Require `readonly error: t.StdError` on the existing `Vite.Build.Response` failure arm. Keep
  `ok: true` and its Dist/pin/document fields unchanged; failures expose none of those success
  fields. Do not invent a second result wrapper or parallel stage/reason taxonomy.
- Each existing returned failure creates one contextual error through `Err.std`; package-write and
  Dist-compute failures retain their upstream StdError as `cause`. Child failure and empty-output
  refusal get their own truthful context. Keep `cmd.output` untouched: the child really may have
  exited successfully. Do not synthesize an exit code or hide child output to explain driver
  failure.
- Pass the same owned error into the build's reporting path and `toString()`. Use `Err.summary` and
  existing width/ANSI helpers for a useful cause summary without raw object/manifest dumps or
  unsolicited stacks. This is local build diagnosis, not new remotely safe error disclosure. A log
  line alone does not satisfy the returned-result contract; silent mode must still return it.
- Extend only the package-internal `buildWith` fault seam as needed to inject compute failure as
  well as package-write failure. No public Build.Args testing knobs, global monkey-patching, or
  re-computation on the failure path. Preserve existing throw/exit/disposal behavior; do not turn a
  broad catch into success or let diagnostic rendering discard an independent cleanup failure.

#### Implementation sequence and falsification proof

1. Reopen the landed predecessor and the owning `deno.json` files. Confirm the two findings still
   exist, attribute only their deltas, and write the proposed public types before implementation.
   Preserve all current migration fixes and unrelated open work; no production edits follow merely
   from these notes.
2. Pin accounting behavior with literal owner-level expectations before extraction. For example,
   `a/b.txt` and `a/c.txt`, sizes 2 and 3, imply four structural entries, 14 path units, two charged
   prefix units, five total bytes, and zero package bytes. Separately, `a/b/c/d` needs five entries
   and nine prefix units despite only seven path units. Cover exact limits and one-less limits,
   repeated shared prefixes, astral names, malformed scalars/parts, safe-integer overflow, empty
   input, prototype-sensitive keys, and output independence. Preserve literal identity vectors.
3. Adopt inspection in FS and Generation and delete the duplicated arithmetic. Extend
   `-content.admission.test.ts` and `-generation.authority.test.ts` at their existing owners. Keep
   positive real-FS controls, scalar-first refusal with zero inventory work, accessor/proxy hook
   counts of zero, forged totals/digests, tighter caller limits, and exactly-once release on
   refusal. Agreement between callers of one helper is not an independent oracle. Test the helper
   against literal expectations and each trust boundary against its own forbidden effects.
4. For Vite, first demonstrate loss of returned/rendered cause, then add the failure field and
   reporting. Extend the existing successful-child/failed-package-write test and add deterministic
   compute refusal. Assert child success remains true, driver success is false, contextual error and
   original cause survive, no Dist/pin/checksum escapes, rendered output is width-bounded, and
   cleanup still occurs. Retain ordinary success and real child-failure controls; test unsupported
   access to success-only fields after failure narrowing through the existing type-check surface.
5. Use the declared owner tasks: FS and Server `test:unit` on the named files, then affected owner
   checks/suites; Vite `test:unit` for scoped build/formatter tests and `test:dist:pipeline` for the
   final composition proof. Inspect current tasks and child-process containment before execution; no
   permission widening, fallback dependency fetch, release rebuild, or evidence rebinding. Review
   the changed owners and their composition, not an automatic repeat of every migration review.
   Wider proof is warranted only by an actual changed invariant or dependency.

#### Boundary and stop conditions

Identity bytes, scheme, supported formats, filesystem protections, and publication/lease semantics
stay unchanged. No adjacent workspace, UI, profile, release-evidence, or plan-buffer cleanup. No
unfinished source-owner obligation is moved into this refactor. The three explicitly deferred
integration proofs retain their own arc items. A discovered admission, ownership or failure-truth
defect must be assigned to its affected owner, not hidden as a proof-environment problem or absorbed
into this refactor. The later implementation must prove the proposed extraction fits; this
source-based design review is neither S-tier implementation closure nor landing clearance.

### Dependency and landing boundary

The signer and collection corrections precede the source migration. Freeze A's contract before
B's admission and C/D/E's consumers, then complete F/G and the source obligations in H. Record actual
source-unit dependencies without requiring standalone CI-green intermediate commits or inventing
compatibility machinery. These commits form one migration sequence, not independently supported
partial Dist products.

The three named proof commits follow their source dependencies. Their execution does not hold all
reviewed source changes uncommitted; it remains necessary evidence before claiming the corresponding
composition behavior verified. The inventory-accounting/build-failure refactor follows separately
and is not a prerequisite to source landing or an extraction of unfinished consumer migration.

The independent R2 repair is outside this chain. This plan revision authorizes no production
implementation, Git mutation, publication, evidence rebinding, or external operation.

## Required adversarial proof matrix

Each row needs an owner-level test with concrete input, expected identity/admission result, and
forbidden side effects. Record whether evidence is executed, source-derived, proposed, or blocked.
Include positive controls and literal independently established expected values; a verifier that
rejects everything or two components sharing one mistaken helper cannot satisfy this matrix.

- Identical exact inventory, different time/builder/runtime/JSON layout/root package label or label
  absence → same identity; unchanged authenticated policy facts.
- Same sorted file-hash sequence, different exact path mapping → different identity; stale pin
  refused.
- Same path, changed payload bytes; missing/extra file; forged declared size → refusal. A
  legitimately rebuilt inventory with changed bytes/length has a different identity, not a parsing
  failure.
- Covered package declaration bytes changed → changed content identity. Pi's expected package and
  verified declaration disagree, or the required file is absent/unlisted/malformed → GUI refusal.
  Root-label-only disagreement is not authenticated package substitution.
- Prototype-sensitive names, including root `__proto__`, survive collection, overwrite/remove,
  serialization, admission, verification, and content/name changes. Empty v2 inventory is refused;
  secondary producers propagate failure without saving/reporting a successful output or pin.
- Signer canonicalization retains own keys with and without descriptor writeback under today's
  contract. Integrated real-file compute → sign/writeback → load → strict verification preserves
  inventory and content identity. Descriptive own-member mutation changes canonical signed bytes,
  not payload identity; ordinary signature vectors and raw-file signing remain unchanged.
- Supported matching child inventories → reuse/direct selection and identity equivalence. Parent
  filters/ignores still exclude child entries, exact rebasing preserves spaces, and invalid paths or
  collisions refuse. Reuse does not authenticate stale hashes or excluded child metadata.
- Leading spaces and other supported exact spellings survive producer-to-consumer mapping; aliases
  and structural collisions are refused, not repaired. The independent R2 repair owns its cold/warm
  publication regressions; the replacement must not regress that exact-path contract.
- Forged `hash.digest`, valid-but-different inventory, unknown/omitted scheme, old composite value
  under v2 pin → refusal without self-report, heuristic fallback, or remote algorithm selection.
- Member order, escaped-equivalent strings, conflicting duplicate members, non-ASCII/astral names,
  unpaired surrogates, single/double BOM, malformed UTF-8, case/normalization variants, reserved
  names, and canonical hash/length syntax → the specified single interpretation and exact-path
  policy.
- Caller byte/entry/path/string/work budgets, deep/oversized JSON, directory expansion, unsafe
  arithmetic, input/callback mutation, and cancellation → bounded refusal before authority escapes.
  Account separately for synchronous parsing and post-parse work; prove absence of premature IO.
- Excluded metadata attempts to influence selection, routes, or package admission → no authenticated
  policy effect. Schema recognition/self-consistency alone never produces a verified-execution
  label.
- Metadata replacement between projection phases or staged/final materialization checks → typed
  refusal with truthful phase/partial-publication results, even though content identity is
  unchanged.
- Tools staging supported metadata-only M → M′ → finalization/cleanup refusal and no deletion of M′,
  despite equal content identity. Unchanged temporary manifests are removed; root retention,
  rollback, directory-identity checks, and combined failure reporting remain truthful.
- Established separate equal-content/different-document winner → allowed verified reuse with its own
  retained observations, not overwritten metadata or the losing download's document evidence.
- Ambiguous committed promotion failure with visible target → preserve the owned document fence;
  metadata-only M → M′ refuses, unchanged M can retain conservative `existing` classification, and
  unavailable continuity evidence refuses without fabricated provenance. Preserve publication,
  cleanup, and lease-release evidence separately from candidate identity.
- Observed mutation inside a verifier/read → existing mutation refusal; local-unpinned manifest
  reads retain their byte check and pinned Server `/dist.json` remains refused.
- Old or mixed pin/configuration inputs → refusal before manifest acquisition. Old manifests or
  missing/unsupported manifest schemes → refusal after bounded document acquisition, before policy
  callbacks, payload acquisition, or publication. No fallback; remove old acceptance APIs and tests.
  `checkSelfReported` and active examples must not retain an old algorithm/shape as observation-only
  compatibility; locally checked consistency still has no independent pin authority.
- Old checksum-addressed stores alongside valid new generations → never searched or converted; valid
  new cold/warm use succeeds, unsupported occupied candidates refuse, and no automatic repinning,
  sealed-document refresh, store renaming/deletion, or downgrade occurs.
- Old Pi rehearsal evidence → explicit refusal; a newly producer-pinned valid test/preview build
  succeeds. Neither automatic evidence rebinding nor an old-checksum execution lane is permitted.
- Signer, generic HTTP, and SRI checksums → unchanged meanings. R2 inventory admission alone does
  not promise checksummed later bodies or browser execution integrity.
- Two real builds through projection → recorded pins → materialization → serving → display prove
  stable identities for unchanged inventories and stale-expectation refusal after path/byte changes.

## Source map and evidence limits

Source anchors inspected during research and adjudication (paths within the named owning module):

- Crypto: `src/m.Hash.Composite/{u.builder.ts,u.digest.ts,t.ts,-.test.ts}` and
  `src/m.Hash/u.hash.ts`.
- Types: `src/t/t.Pkg.dist.ts`, including the old byte-pin shape and `DistPkgLegacy` to remove.
- Std: `src/m.Pkg/{t.ts,t.dist.ts,m/m.Is.ts,m/m.Dist.Pins.ts,m/m.Compat.ts}` and
  `src/m.Json/{t.ts,u.parse.ts,u.stringify.ts}`.
- FS: `src/m.Pkg/t.ts`,
  `src/m.Pkg.Dist/u/{u.compute.ts,u.hash.ts,u.project.ts,u.load.ts,u.checkSelfReported.ts}`,
  `m.Pins.ts`, `u.verify/{u.manifest.ts,u.verify.ts,u.admitManifest.ts,u.io.ts}`, producer tests,
  `src/m.Dir.Hash/u.compute.ts`, and `src/m.Fs.capability/m.Rooted/u/u.target.ts`.
- Server: `src/m.server.dist/u.materialize/{u.manifest.ts,u.run.ts}`, pinned/local startup,
  `u.server.start.verified/u.request.handler.ts`, hosting types, and serve-screen layout.
- R2: `src/m.r2/m.ReadRoute/{m.fromDist.ts,u/u.dist.ts,u/u.handler.ts}`,
  `src/m.r2/-test/-m.ReadRoute.fromDist.test.ts`, `src/m.r2/m.Files/u/path.ts`, sample manifest
  display/loader/record, and the completed extraction plan's contracts.
- Tools: `src/cli.deploy/u.providers/provider.r2/u.push.ts`, API tests and local store fixtures,
  `src/cli.pull/u.bundle/u.pull/u.pull.dist.ts`,
  `src/cli.deploy/u.staging/{u.manifest.ts,u.finalizeDistTree.ts,u.verifyStagedDist.ts,-test/-u.execute.test.ts}`,
  and `src/cli.crdt/cmd.doc.snapshot/u.calcAndSaveDist.ts`.
- Pi: `src/m.cli/m.profiles/u.start/u.gui/{u.service.ts,u.service.evidence.ts}`, local evidence
  generation, preview build runtime, and selected release-plan authority/display/release-boundary
  sections.
- Vite: `src/m.vite/u/u.build.ts`; signer: `src/m.dist/{u.run.ts,u.run.dist.ts,-test/-.test.ts}`;
  Deno driver: `src/m.cloud/m.DenoEntry/{u.path.ts,u.checkSelfReported.ts}`.
- Model: `src/m.files.static/u/u.index.ts`, an actual verified-hosting dependency, not merely UI;
  HTTP: `src/http.cmd/-test/-static-dist-files.test.ts`; Server sample:
  `code/sys/server/-sample/files.http.cmd/-start.ts`.
- Cell: `src/m.cell/-test/{u.sample.deploy.proof.ts,-u.dist.fixture.ts}` and
  `src/m.help/yaml/dsl.pulled-view.yaml`.
- Deploy: `deploy/@tdb.data/src/fs/m.DataPipeline/u.dist.ts` and
  `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/u.dist.ts`.
- UI components: `src/ui.react/ui/Http.Origin/use.Verify.ts`, whose present success state recognizes
  fetched manifest shape without an independent pin or asset verification.

### Consumer coverage obligations

| Surface                                                  | Required disposition across the completed source sequence                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Types / Std / Crypto / FS                                | One identity contract and lossless inventory; remove Dist compatibility types/guards/helpers/load results; preserve generic hashing   |
| FS child reuse                                           | Supported descriptor admission, exact rebasing, collision refusal, parent-selection equivalence; no current-byte assurance from reuse |
| FS `checkSelfReported` / DenoEntry                       | Replace or remove the old generic-digest/ignore-replay path and its callers; retained local consistency remains `UNPINNED`            |
| FS projections and named Pins                            | Own output identities, frozen expectations, operation-wide source fences, no metadata authority or old pin acceptance                 |
| Server / service / Model FilesStatic / HTTP static tests | Admitted-inventory contract, scheme-bound store, candidate/winner fences; preserve hosting boundaries and generic response checksums  |
| R2 route admission                                       | Shared interpretation and narrowed callback input; no old byte-pin input or new continuing-body guarantee                             |
| Tools staging                                            | Retain private `manifestChecksum` plus directory identity for validation/removal/retraction; prove metadata-only cleanup refusal      |
| Tools Pull/service/crypto and help/configuration         | Replace pin/configuration fields without aliases; truthful local/pinned states, refusal tests, and current generated examples         |
| Tools CRDT / deploy data pipeline / slug compiler        | Propagate compute refusal before writes, success paths/counts, or pins; positive valid-output controls                                |
| Cell proof/fixtures/help / Server samples                | Remove two-identity assertions and active byte-pin examples; adopt admitted evidence and content pins without assurance inflation     |
| Pi GUI build/evidence/start consumers                    | Verified payload package policy at both boundaries; old evidence refusal without root-label, byte-pin, or development fallback        |
| Vite / sample build record / sample UI                   | Sole-contract output, per-inventory build/pin/display equality, two-build proof; publishing never silently rebuilds or repins         |
| Model-slug caching / UI `use.Dist` / `Http.Origin`       | Update Dist format/cache assumptions; no conversion lane or false independent verification claims                                     |
| Signer                                                   | Lossless canonical-document signing first; integrated compute/writeback/strict-verification proof; raw-file signing unchanged         |
| Generic directory and Vite caches / Monaco emission      | Keep separate hash/path-map contracts; every actual Dist-consuming path adopts the sole supported shape                               |

Discovery is not a complete audit of every call site. Re-scan source and tests, trace actual
consumers, and bind every remaining assumption to its source unit and acceptance proof. Close each
owner's attributable obligations before its unit lands; complete the migration across the sequence.
Do not classify an uninspected surface as safe, fabricate full-manifest evidence for an old API, or
leave a legacy Dist consumer in place as a documented exception. An unrelated generic hash or
document-signing operation is a different contract, not such an exception.

[html-subresource-integrity.plan.md](../@sys.driver-vite/html-subresource-integrity.plan.md) owns
browser SRI and the sample's paired-image comparison, not this identity protocol. Preserve the
integrity plugin's final asset-byte ordering, the sample's two native image references, and
public-only PNG projection when replacing Dist identity. The image comparison does not enable SRI;
completion of that separate plan is not a prerequisite for canonical Dist identity. Preserve
unrelated work. Existing Pi/R2 release gates and plans are not edited or superseded by this research
file; reconcile overlapping future work explicitly when its owner adopts the replacement.

The evidence is repository/source/history inspection, not an external standards survey or a live
provider audit. The proposed tuple is not claimed to implement JCS, OCI, Git trees, or another
external protocol. Source-confirmed defects and replacement failure sequences are not claims of a
production exploit or a bypass of today's strict verifier.

## Verification evidence and execution boundary

The original research executed these commands successfully against its recorded baseline:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/crypto
deno task test --trace-leaks ./src/m.Hash.Composite/-.test.ts

cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task test:unit --trace-leaks ./src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts
```

Results: Crypto 1 test / 34 steps; FS 1 test / 39 steps; zero failures. These establish existing
algorithm/producer behavior under those tests, not the replacement protocol or new failure vectors.

Human-supplied reviews reported green existing suites across Crypto, FS, Tools R2, Server, and R2
`fromDist`; the latest clean-break review at `482e42505` reported existing Crypto/FS producer tests
and Server materialization (1 test / 38 steps). These are reviewer-reported baseline results, not
new execution by this plan revision. Source adjudication confirmed the staging-checksum dependency,
signer own-key loss, and child-selection bypass, plus the consumer obligations above. It did not
execute new counterexample harnesses or prove the replacement. No production behavior is changed by
editing this document.

For implementation, inspect each current owning `deno.json` before selecting its declared tests,
checks, and permission presets. The signer and collection fixes are reachable prerequisites, not
work to restart. Reuse their applicable evidence and preserve the integrated own-key controls.
Source-unit work proceeds from S1's Types/Std contract through the documented dependency sequence.
Name whether each receipt applies to an isolated commit or an integrated dependency snapshot; do not
demand per-commit CI green. Do not use separate Tools publication tests as proof of the identity
protocol. Preserve narrow red/green and literal-vector proof, then impacted owner checks. The three
named integration items own their
later execution. Stop on security/permission failures rather than widening grants.
Never regenerate external expectations, publish artifacts, or alter profiles as a way to obtain a
green result.

## Completion boundary

The replacement is complete only when first-party production, independent pins, verification, store
identity, and primary displays share one content identity per exact payload inventory under the sole
supported scheme; manifest-only metadata/root-label changes do not churn it; path/content
substitutions are refused; and consumer package checks rely on verified payload facts. No accepted
old Dist format, compatibility API, conversion helper, old pin/configuration alias, or dual-mode
producer/verifier remains. Internal document observations, generic file checksums, and signatures
retain truthful, separate meanings without becoming competing Dist identities.

All affected consumers, old-input refusal controls and attributable residue belong to the source
sequence; the three explicit proof commits own the deferred real-build/composition evidence. Earlier
source commits need not wait for those proofs or pass CI in isolation, and they do not claim those
proofs have passed. Independently owned old evidence may remain only as unsupported input awaiting
separately authorized rebuilding, never as a functioning compatibility lane. Passing a renamed test
suite or replacing one field is not completion. Whole-plan completion also requires the separately
recorded bounded ownership/failure-evidence follow-up; it does not block earlier source landing.

No provenance discovery, arbitrary execution-policy manifest, Merkle-tree framework, generic JSON
canonicalization framework, browser whole-module-graph integrity, remote deployment, profile change,
independent R2 publication repair, or rewrite of unrelated generic digest algorithms belongs in this
arc. Lossless selected-key collection and canonical-document signing are required corrections, not
permission to redesign generic hashing or change the signature subject.
