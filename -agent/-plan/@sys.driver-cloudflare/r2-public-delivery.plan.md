@sys.driver-cloudflare
r2-public-delivery.plan.md
- [x] bb6fad039 feat(tools): admit captured endpoint inputs for Deploy.push
- [x] bc0d8e416 refactor(driver-cloudflare): remove temporary sample push configuration
- [x] GATE Phil confirms the public/private R2 targets, public HTTPS asset base, and owned prefix
- [x] 0deb22c3c docs(driver-cloudflare): simplify R2 sample setup and verification
- [x] e8a88471a feat(yaml): add non-empty env resolution and unavailable-ref metadata
- [x] 2889d1e89 feat(event): transport explicitly exposed command diagnostics
- [x] fd417a579 refactor(event): organize command implementation by file role
- [x] ccaf213fd refactor(event): separate command client orchestration from adapters
- [x] 3c8f9c38e feat(driver-cloudflare): demonstrate public Vite assets with private R2 shell delivery
- [x] [r2-delivery-extraction.plan.md](r2-delivery-extraction.plan.md)
- [ ] feat(driver-cloudflare): integrate the template service worker with mixed R2 delivery

## Landing and extraction decision

The 62-file commit `3c8f9c38e` contains the mixed-delivery sample together with safe R2 diagnostics,
Deploy non-empty environment admission, and acquisition-failure refusal. The review's A–D split was
a proposed decomposition, not the eventual history; do not invent separate landed items or hashes
for those boundaries. The preceding setup documentation is recorded under its actual `0deb22c3c`
subject. Relevant driver/sample and Deploy source matched the landed tree during reconciliation.

Phil requested landing the proven behavior, then extracting reusable machinery rather than leaving
infrastructure in the call site. The completed prerequisite
[r2-delivery-extraction.plan.md](r2-delivery-extraction.plan.md) records the owner contracts,
complete implementation arc, final sample composition, measured footprint, and bounded review/proof
receipts. It includes the shared-Dist identity work: there is no second identity-cleanup phase after
`sw.js`.

The post-extraction sample baseline is `b3f14a5ee7f28284095649c96bc273cae880e7f1`. The child remains
live for its final completion snapshot before archival; this parent's checked reference must survive
its later removal. Any recovery hash must name the final committed plan snapshot, not that source
commit. Detailed extraction history belongs in the child, not a duplicated ledger here.

This plan owns the mixed-delivery contract, its candidate-specific local/provider/browser proof,
template service-worker integration, and human credential closeout. The first hosted deployment,
`db.team` application ingress, and `cdn.db.team` public asset delivery belong solely to
[r2-web-exposure.plan.md](r2-web-exposure.plan.md). Do not record a second hosted execution here.
Service-worker integration is a separate follow-up, not a prerequisite for that first hosted proof;
its unchecked item remains in this arc and is not claimed complete or abandoned.

The exposure plan consumes the landed mixed-delivery implementation and the completed extraction,
not completion of this whole plan. These are sibling work boundaries; neither plan depends on the
other's unfinished arc. No new roadmap or circular prerequisite is needed. After implementation,
worker-specific browser proof belongs here; any hosted run still needs its own explicit authority.

Earlier delivery receipts remain historical; local extraction tests and a build do not refresh them.
Credential rotation, replacement verification, and revocation remain mandatory under **Credential
closeout** below, not silently completed or converted into a gate.

## Shared sample credential contract

Phil changed the sample requirement during the integrated blind review: use one S3 key pair,
`SYS_TEST_R2_KEY_ID` and `SYS_TEST_R2_KEY_SECRET`, for both pushes, serving, and local proof. This
supersedes the review prompt's requirement for separate private-read credentials. The pair is Object
Read & Write scoped to both sample buckets. Serving/proof still perform only private reads, but
their credential has write authority; document that tradeoff rather than claiming read-only
credential isolation. Per-role configuration and underlying library support for separate credentials
must remain available. The repository `.env` remains human-owned.

The sample `r2.config.json`, `README.md`, and `src/-test/-selection.test.ts` embody this default.
Separate credential roles remain configurable, not mandatory sample setup. A review requiring
separate default serving credentials would assess a superseded requirement.

## Upstream contracts and verification

The opening arc records the independently landed owner changes and subsequent Event refactors. Their
bounded contracts and proof are:

- YAML owns opt-in non-empty environment resolution and unavailable-reference metadata. Default
  empty-string behavior and accepted bytes remain unchanged. `unavailable` is present only when
  unavailable values explain every resolution error; its absence does not establish availability.
  Post-documentation verification recorded 25 tests / 252 steps, type check, and scoped formatting.
- Event owns explicit approval, capture, and transport of flat diagnostic detail. Wire detail
  remains `unknown` until validated. A changing or throwing message getter cannot turn the tested
  handler failures into success; unreadable optional detail cannot suppress the legacy rejection.
  Exposure follows registered identity, not mutable properties or prototypes. Wrapping, cloning,
  standard-error conversion before the host, and forwarding a received error do not inherit
  approval.
- Event's internal layout is now `src/m.cmd/m/`, `u/`, `m.transport/`, `m.testing/`, and
  `u.client/`. Client orchestration and all five request-state maps remain in
  `u.client/u.create.ts`; iterator adaptation and error construction are separate helpers. Public
  import names remain unchanged. Final verification for the client extraction recorded 20 tests / 80
  steps with leak tracing, type check, scoped formatting/lint, and diff checks.

YAML's independent review returned GO. Event's independent review identified three blockers; owner
regressions reproduced them, corrections passed, and a later in-thread TMIND pass also corrected
prototype-dependent exposure lookup. The final in-thread pass and structural refactors are not
additional independent blind reviews.

These receipts establish owner behavior only. They do not establish downstream Deploy admission, R2
acquisition policy, sample cleanup correctness, or live delivery integrity. No upstream API redesign
is required merely to resume the integrated review.

## Integrated review intake — acquisition and proof cleanup

The earlier integrated R2/Deploy/sample review raised two failure-path findings. Both were confirmed
against source after `ccaf213fd`, and Phil authorized local red/green corrections before landing
mixed delivery. The following historical receipt records those regressions and their owner-level
fixes; it is not an additional independent blind review or live provider evidence.

### 1. Failed manifest acquisition must not become absence

- Regression
  `code/sys.tools/src/cli.deploy/u.providers/provider.r2/-test/-u.push.acquisition.test.ts`
  reproduced publication after failed acquisition: the mocked S3 body failure issued three PUTs,
  descendant-enumeration refusal issued two, and failed content-reference acquisition issued three.
  The SDK, Files/Cmd, and publisher were real; fetch terminated at a synthetic fixture.
- `provider.r2/u.push.ts::readRemoteDist` now admits fallback only for explicit Files/R2 absence or
  unusable metadata reaching Deploy after successful Files read and content-reference acquisition.
  Inline UTF-8 decoding failure is a Files read refusal; invalid UTF-8 content-reference bytes can
  reach Deploy's fallback. Content-reference acquisition is outside the metadata parsing catch.
  Unknown acquisition failures stop too. Storage/runtime refusals retain priority over nested
  absence detail; a conflicting runtime-error fixture reproduced and guards that rule.
- `code/sys.driver/driver-cloudflare/src/m.r2/m.Files/u/error.ts::provider` explicitly approves the
  existing `FilesR2Error.NotFound` name/message for Cmd transport. No public API or message parser
  was added. The provider fixture now models that received absence rather than a generic rejection.
- `m.Files/u.cmd/read.ts` projects body-consumption failures into safe R2 `read` diagnostics while
  preserving local byte-limit refusal. Owner tests verify body runtime-denial classification,
  explicit absence across Cmd, and exclusion of private source messages.

Green regressions assert zero PUT/DELETE after failed acquisition and one client disposal. Genuine
absence, acquired malformed metadata, and acquired invalid-UTF-8 content-reference bytes retain full
publication fallback. Existing exact-manifest, force, pruning, and byte-limit tests also pass. No
retry, publication coordinator, extra preflight, or replacement publisher was introduced.

### 2. Proof cleanup must retain earlier failures and observe completion

At the initial mixed-delivery landing, `deliveryFixture` in sample `-scripts/-test/-u.proof.test.ts`
reproduced loss of reporting or proof/reporting failure when close rejected, plus skipped completion
observation. The then-current `-scripts/u.proof.ts::prove` observed `server.finished` immediately
and retained its outcome for cleanup. It attempted each owned cleanup step in
primary/reporting/cleanup order, did not retry reporting, preserved a lone failure, and used
`AggregateError` with the primary failure as cause for multiple failures.

Those regressions covered rejected close/completion, earlier proof/reporting failures, cleanup-only
failures, and delayed completion. This is historical mechanism/proof, not the current API contract.
Extraction moved completion settlement to HTTP and replaced the sample accumulator with standard
disposal in `-scripts/task.proof.local.ts`. Its intentional `SuppressedError` compatibility change
is documented beside `prove` and in the completed extraction record. Cleanup still waits for owned
settlement without a force-stop/deadline guarantee; a verified receipt still precedes cleanup and
does not attest successful shutdown.

### Correction verification receipt

- Tools `deno task test:deploy`: 39 tests / 325 steps passed with leak tracing.
- Driver `deno task test --trace-leaks ./src/m.r2`: 12 tests / 118 steps passed.
- Sample `deno task test --trace-leaks`: 22 tests / 115 steps passed.
- Tools and driver owning-module `deno task check` passed. The driver task enumerates its own `src/`
  and root `-scripts/`, not the nested sample. Sample tests type-check their imported graph; that is
  not evidence that every executable entrypoint was checked. Scoped source formatting/lint and diff
  checks accompany the correction.

These corrections close the reproduced acquisition and cleanup defects; later review and delivery
receipts follow below. Reusable-owner extraction, service-worker integration, and human credential
closeout are separate obligations. Working uploads and a rendered UI do not close this arc.

## Integrated review and subsequent evidence

The independent integrated review against HEAD `ccaf213fd` reported GO for its bounded source
candidate, with no material source findings. It reported 39 tests / 325 steps for Deploy, 12 / 118
for R2, 22 / 115 for the sample, and passing tools/driver checks. Its source-traced qualification of
inline versus content-reference UTF-8 refusal is reflected above and in the sample README. This
receipt is neither whole-arc completion nor approval of later source changes.

Subsequent local sample verification passed 22 tests / 119 steps with leak tracing after browser
checksum and identity-table changes. Later wording/link changes passed the focused
delivery-description suite: 1 test / 4 steps, with scoped formatting/lint and diff checks. Those
runs are local fixture and static-rendering evidence, not another independent review or browser
proof.

A separate local check explicitly included all four sample executable entrypoints and passed:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare/-sample/deploy
deno check -- ./-scripts/task.build.ts ./-scripts/task.push.ts ./-scripts/task.serve.ts ./-scripts/task.proof.local.ts
```

This checks types, not executable exit behavior, publication, or storage access.

### Canon quality review — bounded landing, not a finished reusable API

The independent code-quality/commit-boundary review reported GO at `ccaf213fd`, with no demonstrated
source blocker. It supported the R2 diagnostics, Deploy env admission, Deploy acquisition refusal,
and mixed-delivery sample boundaries. It did not construct or verify intermediate commit trees. Its
reported receipts were R2 12 tests / 118 steps, Deploy 39 / 325, sample 22 / 119, tools/driver
checks, formatting of 76 scoped files, and scoped diff checks. No live delivery or lint rerun was
claimed by that reviewer.

Both requested reductions were accepted:

- The sample README distinguishes inline UTF-8 read refusal from unusable content-reference bytes
  reaching Deploy's fallback. The SDK-backed acquisition fixture now executes the inline case with
  no `readOrigin`: refusal, zero PUT/DELETE, and one disposal. The existing reference case still
  proves full-upload fallback. This adds coverage of existing behavior; no production red/green
  change was needed.
- `src/-test/-ui.description.test.tsx` no longer forbids historical explanatory phrases. Positive
  delivery/link/identity assertions and the no-premature-worker assertion remain. UI source and
  appearance are unchanged.

Fresh local closing verification passed Deploy 39 tests / 326 steps and sample 22 / 119, both with
leak tracing, after targeted acquisition and description checks. Formatting/lint of the two changed
tests and scoped tracked-diff checks passed. These receipts do not imply provider or browser work.

That source GO did not settle the call-site ownership objection: the candidate still contained
reusable projection, multi-inventory identity/admission, and private-manifest bootstrap mechanics.
Phil's subsequent plan-scope instruction required owner extraction and immediate sample adoption
before the service-worker item; the review GO alone did not authorize that structural revision. The
completed prerequisite records that correction. Application policy, routes, UI, and the small
sample-specific proof remain distinct from reusable mechanisms; relocating them is not extraction
credit.

### Human delivery evidence — bound to the observed candidates

Phil supplied these browser/terminal observations before the later UI rebuilds:

- Network showed the HTML, API greeting, and private `dist.json` at localhost with HTTP 200;
  exercised entry JavaScript and CSS used the configured public R2 host with HTTP 200. Disable cache
  was checked. The entry response showed `text/javascript` and `Access-Control-Allow-Origin: *`.
  These observations do not establish every asset's headers, a service-worker-free session, or
  public-asset byte integrity.
- Blocking the public entry left the pre-JavaScript HTML readable. The interactive UI/API/manifest
  requests did not start, and no replacement JavaScript was delivered from localhost. Requesting
  that entry under localhost `/ui/pkg/` returned HTTP 404.
- Manual HEAD requests to `/` and `/ui` returned HTTP 308 with `Location: /ui/`, `no-store`,
  `nosniff`, and zero content length.
- `proof:local` emitted a verified private-only receipt, followed by an immediately reported process
  exit status of 0. It covered two files, 10 application requests, one bootstrap attempt, and a
  declared storage-read ceiling of 6. The receipt itself does not count live provider reads.
  `dist.json` was 896 bytes and `index.html` was 966 bytes. The selected private manifest pin was
  `sha256-da2044f1b2cb85044aef4b45bf373388586b681271bfd64a5a72756e90f8ebb9`. The proof covered
  GET/HEAD private bytes and headers, GET redirects, API, and unknown-path refusal.

Later screenshots demonstrate the refined UI rendering after further local builds/publication. They
do not rerun the earlier private-byte proof against those new selections. Keep these receipts
separate; neither establishes hosted execution or current bucket exposure independently.

### Source attribution for the landing inventory

These are ownership facts, not additional opening-arc items or a staging recipe:

- Sample `src/ui/u.load.ts`, `src/ui/common.ts`, `src/ui/styles.css`, and
  `src/-test/-ui.load.test.ts` belong with the mixed-delivery sample. The loader hashes the exact
  received private manifest bytes, retains bounded independent API/manifest requests, and reports
  the stored digest separately. Its tests cover the selected private pin, whitespace/BOM identity,
  failure, and disposal. The test file is not an optional adjacent-maintenance unit.
- `code/sys.driver/driver-cloudflare/src/m.r2/README.md` belongs with the R2 owner's documentation,
  alongside its linking package README. It separates detailed read-route/error contracts from the
  package introduction. Source inspection checked its path/signing rules, limits/cancellation,
  response acquisition, and diagnostic/Files error descriptions against those owners. This is
  documentation attribution and a bounded source check, not a new independent correctness verdict.
- Keep the producer and all consumers of `dist.pins.json`, `dist.private/`, and `dist.public/`
  together in the sample unit, including the extraction's coordinated filename migration from
  `dist.selection.json`. Source inventories must include untracked files; directory membership alone
  does not establish a commit boundary. The opening arc remains the landing ledger.

## Goal and stopping point

Extend `code/sys.driver/driver-cloudflare/-sample/deploy` into one application managing public and
private R2 delivery:

```text
browser → Deno application origin
          /ui/          → bounded private-R2 HTML relay
          /ui/dist.json → bounded private-R2 shell manifest relay
          /api/hello    → Deno API

browser → public R2 (r2.dev) → Vite-built JS, CSS, and referenced public assets
```

The sample owns two-target configuration, audience policy, application routes/UI, and thin task
composition. Vite owns building and captured build-configuration handoff; Pkg.Dist owns verified
projection and shared inventory identity; Deploy owns input admission, credential resolution,
failure interpretation, and publication; R2 owns object access and bounded private delivery; HTTP
owns managed listener settlement. The completed extraction establishes those owner boundaries,
including shared multi-inventory identity and immediate sample adoption. Preserve them while adding
the existing template service worker; do not reintroduce sample-local infrastructure or another
persisted identity wrapper.

The confirmed `r2.dev` endpoint is the existing development baseline, not the production target.
The human-selected production asset hostname is now `cdn.db.team`; its bucket binding, final
URL-to-key prefix, configuration/build migration, and verification belong to
[r2-web-exposure.plan.md](r2-web-exposure.plan.md). A different base requires a new build and both
pins; never relabel an old receipt. No source/configuration or provider setting was changed by this
plan reconciliation. Bucket creation and exposure remain owner-managed settings, not sample tasks.

The real UI asset graph must bypass Deno, not merely an additional demonstration image. Deno still
sends HTML, API, and private-relay responses. The invariant is no Deno delivery of the selected
public asset bodies, not zero Deno traffic or a cost-free application.

Keep one UI and one Vite build. Distinct publication inventories are not distinct applications. The
existing private-only sample composition may evolve; preserve the private relay's contract, not a
legacy mode switch. The sample remains deliberately anonymous and private-bucket-backed HTML is not
represented as confidential application content.

No Cloudflare Worker, HTTP redirect layer for public assets, new browser service-worker framework,
login system, `R2.ReadRoute` rename, generic delivery framework, or copied sample application. The
service-worker item reuses the existing template and cache owners rather than creating a subsystem.

## Evidence and relationship to existing work

The design reviews used source baseline `9a6fab06efef82ad08bd696aaadef54b6aed56a3`. Relevant
implementation source remained unchanged at authoring HEAD
`c0b3f15e27d7d5233560c8388a5aa8a295eed7e2`. Reviewer-reported fixture results are not browser,
public-bucket configuration, or Deno Deploy evidence for this extension.

Existing owners:

- `code/sys.tools/src/cli.deploy/t.namespace.ts` and `u.push/u.endpoint.ts`: file-backed and
  captured-document `Deploy.push`, validation, target resolution, and publication orchestration.
- `code/sys.tools/src/cli.deploy/u.endpoints/`: endpoint schema, environment references, and path
  authority. Reuse these checks for programmatic admission.
- `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts`: asset publication,
  manifest-last ordering, and namespace pruning. This is not an atomic or remotely verified push.
- `code/sys.driver/driver-vite/src/m.vite.config/u/u.paths.ts` and `u.app.ts`: existing public-base
  configuration. `src/m.vite/u/u.build.ts` owns the normal Vite build and Dist generation.
- `code/sys.driver/driver-cloudflare/src/m.r2/m.ReadRoute/`: explicit authorization followed by
  server-side signing and bounded acquisition. Do not replace or generalize this contract.
- Sample `src/m.deployment/`: inputs, audience policy, selection calls, and shared app bootstrap.
  `src/m.app/` owns only HTTP composition; `-scripts/` owns explicit task orchestration and proof.

The original single-origin foundation is recorded in
[r2-web-exposure.plan.md](r2-web-exposure.plan.md). Its active hosted contract now consumes this
mixed-delivery design; its older all-assets-through-Deno receipts remain historical. Neither plan
requires completion of the other's unfinished work. The exposure plan is the sole first-hosting
ledger; local, hosted, and future worker-controlled evidence must retain their own candidates.

Do not revive the conditional-publication/generation-management proposal withdrawn in `cf03b4555`.
Its historical source is
`cf03b4555^:-agent/-plan/@sys.tools/r2-dist-generation-publication.plan.md`.

## Delivery and auth composition contracts

1. Keep the document at the Deno application origin. Existing same-origin `/` and `/ui` redirects
   may remain; a top-level document does not require a literal `/` response.
2. Use the existing Vite base configuration to emit final public asset URLs. Do not rewrite built
   HTML after selection, proxy public bodies through Deno, or depend on an installed service worker.
3. Keep the API and private manifest fetches explicitly application-origin requests. The existing
   client admits one origin, permits zero redirects, and omits browser credentials. Do not change
   those policies merely to make public asset loading appear same-origin.
4. Retain private manifest admission before constructing application routes/listening. No unpinned
   or public-only startup fallback. Public object availability is not an additional server-side
   bootstrap fetch; the browser observes that dependency.
5. Keep the required `ReadRoute.authorize` seam and caller request context intact. The sample's
   anonymous policy remains an explicit application decision, not a default embedded in a primitive.
   A composing application must be able to apply middleware or the existing authorization callback
   before private storage work without replacing the relay or changing public delivery.
6. Preserve authorization-before-signing, exact target validation, resource bounds, cancellation
   ownership, and private `no-store` responses. Caller credentials must not become R2 credentials or
   be forwarded to public storage. Do not cache private responses in a public cache.
7. Auth composability is not an authentication implementation. No users, sessions, tokens, login UI,
   or new auth abstraction. The current Fetch helper's credential omission means cookie-based login
   would require separately scoped client work; do not claim it already works unchanged.
8. Public objects remain readable independently of Deno authorization. Public executable assets are
   trusted application code, not sandboxed code because they have another source origin. Trust the
   configured publisher and storage/delivery authorities; do not add a provenance system here.
9. The template service worker follows reusable-owner extraction, not the initial mixed-delivery
   landing. Its entry script must be directly served from the application origin with appropriate
   scope. Its cache policy must explicitly exclude private responses; HTTP `no-store` alone does not
   govern Cache Storage. Cold application startup must remain independent of worker installation.

## One build, explicit publication inventories

Use the sample's normal `@sys/driver-vite` build and canonical `Pkg.Dist` verification. Configure
the public asset base before building. The public URL prefix and publication key prefix must
describe one operator-confirmed mapping; no guessed hostname or runtime-origin substitution.

Generated layout after extraction:

- `dist/`: complete Vite output, verified locally; never publish this root indiscriminately to both
  audiences.
- `dist.private/`: `index.html` and its own generated `dist.json`.
- `dist.public/`: selected public build assets at their emitted relative paths, plus their own
  generated `dist.json`.
- `dist.pins.json`: the sample-owned `{ publicAssetBase, selection: { pins } }` build record, base
  first. Its shared `DistPins<'private' | 'public'>` value contains canonical manifest pins; its
  base is the exact URL captured for the build. The filename migration did not rename `selection`
  fields or introduce another nested identity schema.

Keep generated roots and the build record ignored. The record remains outside both Dist roots; it
holds no filename inventory or credentials. Delegate nested pin/name validation to
`Pkg.Dist.Pins.capture`; the sample still owns outer-record admission and exact asset-base
comparison. Before rebuilding, invalidate `dist.pins.json` and the obsolete `dist.selection.json` by
exact name. Readers use only the new filename, with explicit rebuild guidance when it is missing.
Neither `dist.selection.json` nor the older single `dist.pin.json` is a fallback; never derive an
expectation from remote storage. Follow the extraction plan's migration/refusal tests and preserve
dated historical filename receipts below.

Derive inventories from the admitted build, not manually maintained hash filenames, bucket listing,
matching remote metadata, or an assumption that `pkg/` is the whole artifact. Explicitly classify
`index.html` as Deno/private delivery and the remaining selected frontend assets as public. Account
for any additional document or worker output before admitting it; do not silently publish a new
output role. Private data, fixtures, credentials, and task inputs must not enter the frontend build.

Partition application payloads without changing their bytes or relative asset paths. The verified
projection algorithm belongs at the `Pkg.Dist` filesystem owner, using existing generation, pinned
reads, and verification; the sample supplies audience policy. Do not implement another hasher or
promote a generic partitioning framework. Capture the public asset base once and use that authority
through the Vite invocation and selection. Verify both outputs before writing the selection. Reject
malformed/partial selection and a configured base that differs from the selected build; changing the
base requires a new build, not retargeting publication of old HTML.

A failed build is not a publishable new candidate. Before each audience push, verify both local
projections against one captured selection; publish only that audience. The combined `push` task
runs `push:public && push:private`, stopping on failure. Keep selection, configuration, and staged
bytes unchanged across both tasks; this is not an atomic capture or publication. Serve needs the
captured selection and private remote manifest, not local Dist directories or a public network
preflight.

Update all selection consumers together: private startup, push, local build status, proof, and UI
manifest labels must refer to the appropriate projection. The private digest no longer describes the
complete UI bundle. No expectation is derived from R2.

## Work items

### 1. Captured publication input at the Deploy owner

The motivating gap was the sample's JSON/configuration → generated YAML file → reopened endpoint
handoff. The file-only input requirement belonged to Deploy, not the sample. Moving that file into
another `.tmp` directory would not remove the shared authority hazard.

`Deploy.push({ cwd, document })` accepts endpoint configuration directly; `config` / `paths.config`
remain the file-backed alternative. This generalizes configuration input, not deployment machinery.
The sample chooses its target and verifies its build; Deploy owns capture, admission, credential
resolution, target checks, and the existing publisher. Publication consumes already-staged files,
not a build request.

Contract to preserve:

- Keep existing `config` / `paths.config` callers and file-mode results compatible. Do not widen
  shared `Tools.ConfigRefArgs` or add an unused programmatic staging surface.
- Make file-backed and document-backed sources mutually exclusive. Capture caller-owned document
  data before asynchronous resolution; caller mutation must not retarget the operation.
- Reuse endpoint schema, environment-reference handling, path checks, target resolution, and the
  same provider execution. No weaker validator, private-module import from the sample, or second
  publisher. Resolve credential references only within the owner; never persist resolved secrets.
- Represent source identity honestly in result/error types. Document mode must not manufacture a
  config pathname. If preserving existing caller compatibility requires a breaking change, stop and
  refine this item rather than silently enlarging it.
- Do not create a generated config file in the sample, installed package, or global scratch area.
  Preserve permission-denial behavior and existing provider failure semantics.
- Prove file/document admission parity, mixed-source refusal, mutation isolation, independent
  concurrent calls with distinct targets, and absence of generated config files on success/failure.

This captures configuration authority, not immutable staging bytes or remote publication. Keep the
existing stable-input operating requirement explicit. Concurrent writes to the same staging root or
remote namespace are not made safe by this change.

#### API and dependency boundaries

- `PushFileArgs` retains file-call result inference as `PushResult`, including `config`.
  `PushDocumentArgs` returns `PushDocumentResult`; document success and expected-failure causes
  identify `source: 'document'`, without a synthetic pathname. Union inputs have a union-result
  overload.
- Capture serializes and reparses the endpoint in memory before asynchronous admission. Validation
  applies to that serialized representation; this is not a runtime plain-object-only contract.
- File-only injected publishers should use `PushFileArgs → Promise<PushResult>`, not implement the
  expanded `DeployTool.Lib['push']` capability. Phil approved the type-only adjustments in the
  sample task and its fixture; they do not constitute document-input adoption.
- The sample publishing task depends on `@sys/tools/deploy`, which depends on
  `@sys/driver-cloudflare/r2`. The sample is a separate private workspace package and the driver's
  publication configuration excludes `-sample/`. Do not introduce a driver production dependency on
  tools or import publishing machinery into the application's browser/runtime graph.

#### Publication-input proof boundary

The six-file publication-input candidate was independently reviewed against baseline HEAD
`78078a5a5ecdc1c30b849ae6492e84c3b940d8fa`. Implementation-thread verification and the returned
blind review both recorded Deploy 35 tests / 294 steps, sample 9 tests / 54 steps, authority checks
4 tests / 40 steps plus the staging authority proof, and the tools type check. The implementation
pass also checked formatting; default lint retained the existing namespace-rule findings. These are
historical fixture/check results, not live publication evidence or proof of later deltas.

The blind review found no material introduced defect. Accepted proof limits:

- The injected admission-denial test proves orchestration propagation, not universal filesystem or
  environment permission-error identity. Existing diagnostic conversion and missing-metadata
  handling are not strengthened by this item.
- Before/after directory listings prove no residue, not absence of transient or out-of-root writes.
  The no-generated-config conclusion additionally relies on the inspected in-memory capture path.
- Additional serialization, alias, missing-reference, union-inference, and restricted-permission
  regressions were optional suggestions, not demonstrated defects or new completion gates.

### 2. Immediate sample adoption and residue removal

Adopt `Deploy.push({ cwd: root, document: endpoint })` in `-scripts/task.push.ts`, retaining local
pinned verification before publication, credential references rather than secret values, and
redacted failures without retries. Change the injected publisher and fixture to the document-mode
contract together; do not retain the file-mode callback contract after migrating its caller.

Remove YAML serialization, the filesystem handoff, and obsolete fixture assertions. Prove the exact
captured target passed to the owner, refusal before publication for changed inputs, and no generated
config residue after either success or failure.

After removing the producer, remove only the stale sample `.tmp/push.yaml` with the canonical remove
surface. Do not delete unrelated `.tmp` contents. Do not leave a fallback writer or a deep import of
an internal provider. This item is independently useful before any public bucket is available.

### 3. Mixed delivery in the existing sample

Keep application policy local to the sample and use the existing Vite, R2, HTTP, Files, and Dist
owners. Direct public delivery requires no change to the low-level read-route contract; the R2 error
additions address observed failure transport. The completed extraction removes reusable mechanics
from the sample without promoting this initial workflow into a library.

- Add explicit public bucket/key-prefix and HTTPS asset-base configuration alongside the private
  target, using the confirmed mapping below. Keep configurable credential references by operation,
  with all sample roles defaulting to one shared S3 pair. Serving performs only private reads; it
  must also remain usable with separately configured read-only credentials.
- Implement the build projections above. Preserve the normal Vite build rather than adding a raw
  Vite invocation or restoring a separate sample `stage` workflow.
- Provide explicit `push:public` and `push:private` tasks. Phil requested that `push` compose both
  in public-first order with fail-fast task-shell sequencing. Each audience task verifies the
  captured local selection, then publishes exactly one requested projection. No target fallback or
  publication of the whole original Dist to both buckets.
- Use only dedicated, owned destination prefixes. Publish the public assets before the private shell
  referencing them; report each target separately. This ordering is not atomic publication.
- Serve only the admitted private inventory through Deno. Do not retain public-asset relay routes as
  hidden fallbacks. Missing public assets must not start consuming Deno body bandwidth.
- Keep API/private JSON loads at the application origin. Do not add a public manifest fetch solely
  to create another result row. Existing digest display must identify its private-shell scope.
- Update `src/ui/ui.App.tsx` and the README together. State both byte paths, anonymous application
  access, and integrity/cost boundaries tersely. Describe direct delivery, not HTTP redirects. Keep
  the private relay's short-lived presigned GET URLs explicit in the view: Deno uses them
  internally; the browser receives bytes, not signed URLs or R2 credentials.
- If the public entry bundle fails, React cannot render its own failure UI. Keep the HTML shell
  legible without the bundle and test the actual failure boundary; do not claim independent
  interactive UI status or silently fetch a backup bundle through Deno.

Suggested explanatory copy:

> Deno serves this page and API from the application origin. UI scripts and styles load directly
> from public R2. Deno fetches the private shell and manifest with short-lived presigned GET URLs;
> the browser receives bytes, not signed URLs or R2 credentials.

Preserve the distinction between manifest admission, local file verification, and actual delivered
bytes. Neither a displayed digest nor a successful push verifies executed browser assets.

### Local implementation evidence — 2026-09-21

Initial mixed-delivery verification against source baseline `8ee43d151` used the existing
shared-library public APIs without changing their implementations:

- Sample `deno task test`: 12 tests / 71 steps passed, including rendered-view coverage retaining
  the server-side presigned GET explanation. The task-wiring regression first failed against the old
  private-default `push`, then passed with explicit audience tasks and the public-first `&&` chain.
  It checks task declarations, not live command execution. Publication tests inject a recording
  publisher; transport fixtures use synthetic credentials, not live storage.
- Driver `deno task test --filter ReadRoute`: 2 tests / 29 steps passed.
- Tools `deno task test:deploy`: 37 tests / 309 steps passed.
- Sample lint, formatting, and type checks passed. Two existing UI lint nits were corrected without
  changing fetch policy.
- Normal `deno task build` passed with the confirmed public base. Its emitted HTML references the
  public entry and stylesheet with `crossorigin`; the same HTML bytes appear in the private
  projection. The final local build selected one private payload (966 bytes) and four public
  payloads (484,826 bytes), each audience with its own verified manifest. These are local build
  facts, not browser transfer measurements.
- All selection consumers migrated to `dist.selection.json`; the obsolete local `dist.pin.json` was
  removed. No generated publication configuration or public-asset relay fallback remains.

This verification performed no new-bucket credential validation, live publication, live private HTTP
proof, browser failure/network capstone, or hosted deployment. Those operations still require their
named authority; fixture results and static shell rendering do not substitute for them. Credential
setup and the public-first/private-second workflow are documented in the sample README.

### Credential setup diagnostics

Phil requested actionable setup output for absent, commented-out, or blank credentials instead of an
uncaught stack. Resolution remains at its existing owners: YAML exposes unavailable-reference
metadata and opt-in non-empty validation; Deploy opts in and carries names-only `missingEnv`
metadata from input admission. Default YAML empty-string behavior remains compatible, and accepted
values are not trimmed. Resolver failures never become missing-value advice.

The sample consumes only admission metadata for the selected credential pair. Its task runner
explains setup once and returns code 1 before R2 work; that return value does not prove the host
process exits with status 1. Provider failures stay redacted; unrelated errors and surfaced runtime
permission denials are not swallowed. Preserve the approved output: red blocked heading, indented
copyable assignments (cyan names, magenta equals signs, yellow quoted placeholders), cyan unquoted
`.env`, dotenv precedence guidance, italic-gray notes, and cyan rerun guidance/divider. The
executable owns the final prompt-separating blank line. The repository `.env` remains human-owned.

Local verification: sample 15 tests / 80 steps, Deploy 37 / 310, and YAML 25 / 249 passed, with
focused rechecks after presentation/test cleanup. YAML/tools type checks, all 24 changed-file format
checks, sample and shared runtime/test lint, and `git diff --check` passed. Default lint still
reports pre-existing namespace-rule findings in the three shared type files. These checks use
synthetic credentials and fixture providers; no live R2 publication or credential-permission proof
was run.

### Safe publication diagnostics

Phil reported another private push failure after credential setup. Its generic sample message does
not establish the provider cause or whether that attempt partially wrote objects. No assistant
retry, live credential inspection, or provider operation is authorized by this diagnostic repair.

Repair the error boundary, not sample-owned string parsing: Cmd explicitly transports approved
public error detail; R2 owns operation/status/allow-listed S3-code projection; Deploy and the sample
consume that owner. Raw provider messages, URLs, headers, bodies, and credentials remain excluded.
Recognized remote-manifest R2 failures and runtime permission denials stop before fallback writes,
not become cache misses. Fixture evidence and human-run provider results remain separate.

### Bounded CLI continuation

Human terminal output exposed a missing-public-credentials invocation exiting 0, allowing private
execution despite `&&`, plus uncaught stacks for recognized R2 refusals. The push entrypoint now
explicitly exits nonzero after task reporting and spinner cleanup. Phil reran public-only with
missing credentials and observed exit status 1 and normal prompt positioning. This proves that
reported path, not every terminal lifecycle. Private HTTP 403 and later 401 reports establish
refusal, not the exact credential cause.

The abandoned PTY subprocess harness and its added task/permission preset were removed. The approved
formatter, names-only setup tests, safe Cmd/R2 diagnostic tests, and Deploy refusal guard remain.
Cleanup verification: sample 20 tests / 104 steps; focused Cmd 1 / 5, R2 diagnostic and
listing-boundary 2 / 12, and Deploy manifest-refusal 1 / 3 passed. Source/doc format checks covered
26 files; lint covered 22 files. These checks do not establish terminal behavior or live access.

Missing credentials and recognized R2 push failures now share one failure layout in `u.fmt.ts` and
one reporting/return-code path in `runTask`. A task-local weak association retains only captured R2
diagnostic fields for the native redacted error; no raw provider cause is retained or parsed. The
missing-key text/colors remain unchanged. R2 refusals receive an operation/status/code summary,
recovery guidance, partial-write caution, and the selected task's command. Unknown failures and
runtime permission denials still escape. No upstream API was added for this presentation change.

The existing mocked-SDK capstone failed at the runner before this repair and now passes through
formatted reporting. Focused formatting/runner/publication tests passed: 5 tests / 19 steps. Live R2
refusal presentation remains for human confirmation; no provider retry or credential change was
performed. Continue one small human-run step at a time. Do not add probe harnesses or land upstream
changes before the consumer demonstrates their necessity.

Phil reported a combined live push with 5 public objects and 2 private objects written, with none
skipped or removed. This is human-provided publication evidence, not remote byte verification or
browser/hosted proof. Horizontal terminal displacement remains visible in the reported output.

Phil subsequently chose one S3 pair for all sample tasks, superseding the earlier separate-serving
credential requirement as recorded above. The sample-default regression and full sample suite then
passed: 21 tests / 110 steps, with scoped formatting/lint and diff checks. These are historical
fixture receipts, not a fresh run during plan reconciliation. No live request or credential
inspection is authorized by this configuration change.

Phil also supplied a browser screenshot showing the rendered UI, API greeting, and private-shell
manifest digest. This is human-reported rendering evidence, not a cold-cache network trace, remote
byte verification, or hosted execution proof. A separately pasted missing-credential serve attempt
must not be treated as the invocation that produced that rendered page.

### 4. Completed reusable-owner extraction prerequisite

[r2-delivery-extraction.plan.md](r2-delivery-extraction.plan.md) is the sole owner of the completed
extraction arc, implemented contracts, compatibility decisions, footprint attribution, and
owner/sample proof. Its final record replaces obsolete proposals and review prompts; do not
duplicate its internal commit items here. Preserve this checked dependency through the child's
eventual archival.

The integration boundary is now sample-owned configuration/policy composed with verified Dist
projections/pins, captured Vite build base, `R2.ReadRoute.fromDist`, authenticated Deploy
diagnostics, and HTTP-managed settlement. Shared bootstrap belongs in `src/m.deployment/u.app.ts`;
`m.app` is HTTP-only and both entrypoints are thin. Build/push/serve/proof remain explicit sample
task flows, not a new workflow engine. The private proof keeps bounded Fetch assertions and standard
disposal, not the rejected generic byte-verifier API or a sample lease/cleanup framework.

Final pre-landing sample verification recorded 22 tests / 104 steps, executable checks, formatting,
lint, and a credential-free build. These receipts do not prove current public delivery, hosted
execution, real SIGINT shutdown, or refreshed credentials. Preserve the mixed-delivery contract and
candidate-specific evidence limits above when extending this consumer. No additional extraction
cleanup phase is required before the service-worker item.

### 5. Integrate the existing template service worker through the extracted APIs

Build on the extracted owners to preserve the normal template's existing service-worker capability
in one bounded follow-up, not a new worker framework or second application. The post-extraction
sample still has no SW entry/registration and rejects worker outputs; this slice changes that policy
explicitly rather than treating an uploaded `sw.js` as sufficient.

Starting points:

- `code/-tmpl/-templates/tmpl.pkg/src/-test/-sw.ts`: existing `Http.Cache.pkg` and command handlers.
- `code/-tmpl/-templates/tmpl.pkg/src/-test/entry.tsx`: production registration.
- `code/-tmpl/-templates/tmpl.pkg/vite.config.ts`: canonical Vite service-worker entry
  configuration.

Scope and proof:

- Reuse the extracted projection, identity, and delivery APIs, existing template/cache owners, and
  normal Vite build. Explicitly admit the SW entry in the private inventory and serve it through the
  application origin with deliberate UI scope. Unrelated worker outputs remain outside the
  inventory. Do not rebuild the extracted mechanics inside the sample to accommodate this role.
- Register against the application origin, not the public bundle's `import.meta.url`: the template's
  current relative registration would otherwise resolve to the public R2 origin.
- Verify emitted worker dependency URLs across the split origins. Do not proxy public chunks through
  Deno or rewrite selected bytes after hashing to make the worker load.
- Inspect the existing cache owner's manifest assumptions against the split inventories. Keep
  private shell/manifest and API responses out of Cache Storage; no signed URLs or R2 credentials
  reach the browser. Reuse supported configuration rather than copying cache mechanics.
- Test classification, registration URL/scope, dependency resolution, and cache exclusions. Obtain
  human-run cold-browser and worker-controlled reload evidence; distinguish real network paths from
  cache hits. Installation failure must not prevent the ordinary mixed-delivery application loading.

Resolve the exact cache-owner integration from source before implementation. Keep one sample key
pair by default and preserve independently configurable credentials. This slice does not authorize
remote operations, another sample-owned selection contract, or changes to single-root `DistPin`
semantics.

## Target-selection gate

This resolved gate records the development mapping below. It does not approve reuse of those
buckets/prefixes for production or creation of `cdn.db.team`. The exposure plan owns that explicit
resource and operation decision; preserve this historical gate rather than retargeting it.

Resolver: Phil, as the deployment/resource owner. The gate controls which live resources item 3 may
target: the account, both buckets, owned key namespace, public HTTPS asset base, and intended
exposure. An unconfirmed replacement must not be used to retarget configuration or publication.

Phil resolved this decision through the bucket/prefix selection and supplied Cloudflare dashboard
screenshots. Confirmed mapping:

```text
Account:               1e6ec0395407e49eef7ee54f667d61de
Public bucket:         sys-test-public
Private bucket:        sys-test-private
Key namespace (both):  tmp.sys.driver-cloudflare/r2-proof-ui/
Public bucket URL:     https://pub-72d4e716dcae492f9e174c58866d5533.r2.dev
Public asset base:     https://pub-72d4e716dcae492f9e174c58866d5533.r2.dev/tmp.sys.driver-cloudflare/r2-proof-ui/
```

Dashboard evidence:

- Public bucket: `r2.dev` enabled; CORS allows origins `["*"]` and methods `["GET", "HEAD"]`.
- Private bucket: `r2.dev` disabled and no custom-domain binding. Its additional CORS rule is
  unnecessary for server-side reads but does not make the bucket public.

Only intentionally public build assets belong in the public bucket. The setup instructions are
recorded in `0deb22c3c` at `code/sys.driver/driver-cloudflare/-sample/deploy/README.md`. This is
owner-confirmed setup, not proof of published bytes, credential validity, browser delivery, or
hosted execution.

### Before live use

Item 3 defines and documents the credential environment-variable names. Phil's reported successful
combined push establishes working publication credentials for both selected buckets on that run;
credential setup is no longer the unresolved review blocker. It does not attest to future key
validity, rotation/revocation, or hosted secret provisioning.

For each separately authorized credentialed operation, Phil supplies the appropriate credentials
through the process environment or an untracked `.env`. The sample defaults to one Object Read &
Write pair scoped to both buckets. Serving performs only private reads and also supports a
separately configured read-only pair. Do not inspect or record secrets as part of plan
reconciliation; fixtures use synthetic credentials and make no live provider calls.

Retain `http://127.0.0.1:8080` for the initial local application. The selected wildcard CORS policy
requires no application-origin allowlist. Choose a hosted origin with the separately authorized
hosted proof, not as a prerequisite for implementing this sample. Inspect task permissions for the
actual code paths before execution; this plan grants no new network permissions.

Verify public asset URLs, CORS, MIME, and content encoding during the separately authorized browser
proof. Public requests must not inherit application credentials. Respect any deployed CSP without
adding an unrelated security-policy framework. The `r2.dev` endpoint is rate-limited development
infrastructure; no production-delivery claim follows from this setup.

## Credential closeout

Before closing this arc, Phil rotates credentials used during development, installs bucket-scoped
replacements in the appropriate local/hosted secret stores, and verifies each required role before
revoking the retired keys. Check known consumers before revocation, including any legacy keys; do
not assume they are unused. Record completion and scope without values. If exposure is suspected,
revoke promptly rather than waiting for arc completion. Rotation never excuses unsafe diagnostics.
This is a human-owned closeout obligation, not authorization for agent key creation or revocation.

## Operating limits

Use small disposable sample namespaces and one stable candidate during proof. Keep staged bytes,
pins, and configuration unchanged during publication. Existing publication is manifest-last then
prune, not rollback, corruption-repair verification, or concurrent-release coordination. Do not
republish while asserting continuity for old browser sessions. This arc does not promise seamless
cached upgrades or introduce immutable-generation/CAS/GC machinery. Future retained-client support
requires an explicit release-retention policy; hash-shaped names alone do not provide it.

Gate resolution supplies configuration facts. It does not authorize live writes, deletions,
deployment, reads under another proof budget, or Git mutation. Obtain the exact operation authority
before those actions; this plan creates no remote resources and grants no broader permissions.

## Proof and acceptance

Use red → green → refactor at the narrowest owning boundary. Extend existing fixture seams rather
than adding a second publisher, browser platform, or general observability system.

Minimum fixture evidence:

- Deploy file/document parity, source exclusivity and capture, credential-reference handling,
  permission/failure behavior, and concurrent-call isolation without a config file.
- One Vite build yields verified, non-overlapping application payload inventories with unchanged
  bytes; each projection has its own manifest. Stale outputs and unrelated/private inputs do not
  enter public publication.
- Captured build-base mutation, mismatched later configuration, mixed/changed projection bytes, and
  incomplete selection are refused. Serving does not require local projection directories.
- Each audience task selects the correct root, pin, target, and deletion namespace. Invalid
  selection makes zero provider calls; neither audience task implicitly publishes the other target.
  The combined `push` task invokes public then private, with no private invocation after public
  failure.
- Existing private bootstrap refusal remains fail-closed. Public configuration cannot bypass it.
- Existing authorization-before-storage, target validation, bounds, cancellation, and redaction
  tests remain valid. No new auth implementation is needed to retain these seams.
- Deno routes do not serve the public JS/CSS inventory, even if a storage fixture contains those
  keys. Public delivery failure never falls back to either relay or signed browser URLs.
- Private proof/status receipts retain their precise scope after projection changes; their request
  counts are recomputed from their actual selected files, not reused as public-delivery evidence.

Configured task surfaces, to be inspected again before execution:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task test:deploy

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare
deno task test --filter ReadRoute

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare/-sample/deploy
deno task test
```

Use narrower owner filters during iteration, then the owning suites and checks. Fixtures must not
use live credentials/storage. Read actual tasks and permissions before builds, CLIs, or runtime
proof; never broaden permissions to get a green result.

Browser/network capstone, after separately authorized publication:

1. Hold one verified candidate and record both pins, selected targets, and finite probe budgets.
2. Load the application with an empty browser cache and no controlling service worker. Confirm the
   document remains at the application origin and API/private reads reach Deno.
3. Inspect every resource actually exercised by that build: entry, preloads, styles, imports, and
   referenced assets. Their final public URLs, MIME, CORS behavior, and byte ownership must agree
   with the selected graph. Do not add unused workers or lazy-loading features to inflate proof.
4. Correlate browser requests with the reviewed Deno route inventory and confirmed public URL/bucket
   mapping. Establish cold-cache public bodies bypass Deno; a hostname, digest display, or cache-hit
   header alone is not proof. Use available server transfer evidence without building a platform.
5. Block a public entry/resource in the browser and request an unmapped private path. Record the
   different failures without fallback, false success, or leaked credentials/presigned URLs. Use
   isolated fixtures or browser request blocking, not unapproved changes to live objects.
6. Keep public delivery, private HTTP proof, and hosted execution as separate evidence. A human-run
   browser check is acceptable if reported as such; never substitute fixture results for it.

Deno Deploy at `console.deno.com` is the selected hosting target. Packaged configuration/pin
availability, runtime compatibility, `db.team` ingress, and `cdn.db.team` delivery require the
candidate-bound evidence in [r2-web-exposure.plan.md](r2-web-exposure.plan.md) before claiming hosted
support or measured cost savings. Neither this local proof nor an old exposure receipt covers a
new deployed candidate. This plan adds no duplicate deployment item.

The stopping point is an honest, repeatable mixed-delivery sample that declares application policy
and calls reusable owners, with projection, shared identity, captured build configuration, and
pinned delivery mechanics extracted before template service-worker integration. No competing
sample-only persisted Dist identity format, copied verification/bootstrap algorithm, generated YAML
bridge, or transitional delivery fallback may remain. Credential closeout remains human-owned. No
material source/proof claim may exceed the recorded evidence.
