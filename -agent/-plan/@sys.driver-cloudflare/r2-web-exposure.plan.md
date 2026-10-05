@sys.driver-cloudflare
r2-web-exposure.plan.md
- [x] 07a0a8028 chore(tmpl:pkg): scaffold @sys/web package
- [x] [r2-files-delivery.plan.md](../@sys.tools/r2-files-delivery.plan.md)
- [x] 12167cd70 feat(driver-cloudflare): expose presigned object reads
- [x] a54a39f98 feat(driver-cloudflare): add R2-backed application read routes
- [x] e242fbce4 feat(driver-cloudflare): add self-contained R2 deployment sample
- [x] db0e67864 docs(driver-cloudflare): clarify R2 sample workflow
- [x] e2e0afd44 feat(driver-cloudflare): add explicit sample routes and root redirect
- [x] 9f062ede0 refactor(driver-cloudflare): group sample application helpers
- [x] 6153361a0 refactor(driver-cloudflare): normalize sample app module layout
- [x] 3bb85eb9f chore(driver-cloudflare): remove unused sample staging task
- [x] d5248f6fa style(driver-cloudflare): separate sample explanation lines
- [x] 920158a72 style(driver-cloudflare): separate sample explanation lines
- [x] GATE owner authorizes local application proof against selected live R2 objects
- [x] 54afcb4a4 test(driver-cloudflare): add pinned local delivery probe
- [x] 204fca7d9 refactor(exports)!: standardize package type entrypoints on /t
- [x] 867add7c5 fix(tools): compare R2 manifest identity before skipping publication
- [x] e01433a26 docs(driver-cloudflare): describe the local proof task
- [x] 4f72461bb style(driver-cloudflare): clarify build checksum output
- [x] 4f5ebb73a feat(cli): add fitted label-value pair rendering
- [x] 35be4e1b0 feat(driver-cloudflare): add push progress and consolidate script helpers
- [x] 20e0464b7 feat(driver-cloudflare): clarify sample UI and show same-origin fetches
- [x] 43799c643 feat(http): support cell-aware startup detail presentation
- [x] 1a3667ffc refactor(http): separate startup presentation and file-serving helpers
- [x] 7c9fecaa5 refactor(driver-cloudflare): centralize sample build selection
- [x] 0169c2c20 feat(pkg): add canonical Dist pin contracts
- [x] 73c59650d refactor(driver-cloudflare): bootstrap sample routes from a pinned manifest
- [x] e210dc608 test(driver-cloudflare): verify local R2 application delivery
- [x] [r2-delivery-extraction.plan.md](r2-delivery-extraction.plan.md)
- [ ] fix(driver-cloudflare): align the R2 sample with the Deno entry contract
- [ ] feat(driver-deno): prepare explicit mixed-delivery deployment artifacts
- [ ] GATE owner authorizes the first R2-backed app hostname and bounded deployment/exposure operations
- [ ] test(driver-cloudflare): verify hosted R2 application delivery

## Purpose and reconciliation boundary

Own the first hosted mixed-delivery sample: native Deno Deploy production execution, then
`https://db.team` through Cloudflare, with public assets at `https://cdn.db.team`. Keep the existing
application and library owners. No competing roadmap, new application copy, or proxy runtime.
Read the active architecture and two preparation items first; then [rollout](#rollout-order),
[security/cache](#security-and-cache-contract), and [acceptance](#acceptance-evidence). The long
middle section is retained historical proof, not another execution sequence.

Phil requested this plan reconciliation after the local sample and extracted components landed,
and proposed `cdn.db.team` instead of `assets.db.team`. This selects the planned public delivery
hostname, not its bucket binding or any remote mutation. `db.team` is canonical; no `www` or further
subdomains. No source, credential, build artifact, DNS, bucket, or deployment change is authorized
by this plan edit.

Reconciliation inspected reachable history at `1c6941f50` and live sample/deployment source. The
opening arc preserves the original landed items and adds the completed extraction prerequisite
plus two bounded preparation items before the existing live-operation gate. Completed extraction
items remain solely in their own arc; this plan does not wait for the public-delivery plan's
unfinished service worker.

Current consumer context, not additional work to repeat:

- `3c8f9c38e` introduced public Vite assets with private shell delivery; the mixed-delivery plan
  owns that landing and its proof record.
- The extraction prerequisite owns reusable Dist, Vite, R2, Deploy, and HTTP mechanisms and their
  immediate adoption. Its evidence is candidate-bound, not hosted proof.
- `be4edd54c` shares `SampleService` between local direct and Cell startup; `c25e7ed06` adds clean;
  `c4ecc15e8` shares walkthrough handoffs. Inspected changes remain local service/task concerns,
  not a Deno Deploy adapter, hosted configuration, or refreshed provider proof.
- Phil's current `serve` output establishes reported local startup with a private-shell digest
  display. That abbreviated content digest is not a full manifest pin or hosted delivery receipt.

The original four-/six-file single-origin receipts remain below as historical evidence, including
the failed manifest attempts and later successful readback. They must not supply current pins,
bucket choices, budgets, or instructions for the mixed release. No tests or live application/provider
requests were run in this reconciliation; public documentation was consulted separately.

## Owner-selected application prefix

The old private-only receipt used `sys-test/tmp.sys.driver-cloudflare/r2-proof-ui`; the owner later
retired earlier `tmp.sys.tools/` proof prefixes. Do not restore those objects or use that old target.

Live `r2.config.json` now selects account `1e6ec0395407e49eef7ee54f667d61de`, buckets
`sys-test-private` and `sys-test-public`, each at `tmp.sys.driver-cloudflare/r2-proof-ui`, with a
public `r2.dev` base. These are development configuration facts, not approval for production reuse.
Phil must confirm the hosted buckets/prefixes and that the `db.team` zone and selected public bucket
are in the same Cloudflare account. No new bucket or prefix is invented here. The final
`https://cdn.db.team/` base must include the exact confirmed public key prefix and trailing slash.

## Selected architecture

The application remains the private workspace member at
`code/sys.driver/driver-cloudflare/-sample/deploy`. It is not a new root `deploy/` app or published
driver export. R2 is already a required dependency of this selected sample; do not add another
persistence service.

```text
one Vite build → verified Dist projections + dist.pins.json
                 ├─ dist.private/ → private R2: index.html + dist.json
                 └─ dist.public/  → public R2: JS/CSS/assets + dist.json

browser → https://db.team → Cloudflare → HTTPS → Deno Deploy
                                                ├─ /api/hello → JSON
                                                └─ /ui/ + /ui/dist.json
                                                     → signed private R2 reads

browser → https://cdn.db.team/<confirmed-prefix>/<public-file>
          → Cloudflare security/cache → public R2
```

This is the production target, not a claim that either binding exists. Use current Deno Deploy at
`console.deno.com`, not Deploy Classic. The local listener remains `127.0.0.1:8080`; its dotenv,
terminal presentation, and Cell lifecycle are not hosted runtime configuration.

Preserve `appFrom` as the shared bootstrap: captured package configuration and pins, runtime secret
lookup, `R2.ReadRoute.fromDist` admission, then HTTP application construction. Missing or mismatched
private manifests refuse the whole application before serving. The private manifest pins admission
and routes, not every later payload read. No public-only, local-static, unpinned, or signed-browser-URL
fallback. Application access stays explicitly anonymous; private storage is not a login boundary.

Keep HTML, API, and private-manifest requests at the application origin. Public JS/CSS/assets must
arrive directly from the CDN origin, without Deno proxying or an HTTP redirect hop. A failed public
bundle leaves the static HTML notice; it must not activate a Deno asset fallback. No Cloudflare
Worker or service worker is required for first hosting.

### Vite URL closure

Use the existing Vite build, audience policy, Dist projections, and shared pins. Capture the exact
public base before build; emit final absolute CDN URLs in the HTML/module graph. Changing from
`r2.dev` to `cdn.db.team` selects a new candidate: rebuild, retain both new pins, publish and prove
that candidate. Never rewrite selected HTML, relabel old pins, or infer expectations from storage.

Keep `/` and `/ui` redirects to `/ui/`, same-origin `/api/hello` and `/ui/dist.json`, and exact
private route admission. The build determines public filenames; do not assume `pkg/` is the entire
inventory or discover expectations by listing R2. Exercise the emitted imports, preloads, CSS,
fonts, and images actually used. Verify CDN CORS/MIME and decoded bytes. CORS is not authentication;
server-side private R2 reads need no bucket CORS. Missing paths remain missing, never SPA fallback.
The service-worker follow-up remains in the public-delivery plan and cannot silently alter this
candidate's inventory or cache policy.

### Retained capability and cost boundaries

The landed presigning capability remains intact and is used internally by `R2.ReadRoute`.
Independent signed-download routes and before/after-expiry demonstrations are outside this
sample's remaining arc. They require a separately selected consumer, not more work hidden in this
composition. Presigned URLs remain reusable bearer capabilities until expiry, use the R2 S3
hostname rather than an owned custom domain, and must never appear in logs or sample responses.

R2 documents no egress bandwidth charge; storage, operations, and applicable retrieval charges
remain. Relaying through another host may add that host's transfer/runtime charges. Workers also
documents no additional egress/bandwidth charge, but requests/compute remain metered. No exact Deno
Deploy allowance or rate was established here: its pricing table exceeded the available read-output
limit. Confirm the selected hosting plan before claiming a cost comparison. Do not claim streaming
through Deno is free, nor that every R2 transfer pays two egress charges.

Request byte/deadline limits and per-instance admission limits are not deployment-wide traffic or
spending caps. Deno may run isolated instances concurrently. The hosting owner must select
operational controls and accept residual metering before public exposure. This does not require a
distributed limiter or a new cost-control service.

## Scope and trust posture

Trust the deliberately configured infrastructure and operator-owned deployment: Cloudflare, the Deno
runtime host, private R2, credentials, and application configuration. Enforce ordinary
untrusted-request boundaries inside that setup: caller authority, route/key selection, resource
limits, and response semantics. This is a composition of powerful primitives, not a campaign to
prove those trusted operators or platforms cannot be compromised.

Do not turn alternative Deno hostnames, hostile administrators, universal origin lockdown, every
provider edge feature, or a repository-wide security audit into prerequisites. Selected controls
must be configured and described truthfully; this plan does not claim an exclusive Cloudflare
perimeter or protection that was never configured. Never weaken an existing security check to make a
proof succeed.

Private origin storage and caller authorization are separate. This sample deliberately permits
anonymous reads of its admitted private shell and manifest; its separate public bucket contains
only intentionally public assets. Retain `authorize: () => true` as explicit sample policy, not a
primitive default or confidentiality claim. Bucket exposure requires provider/owner evidence.
Storage credentials are not browser credentials, Files policy is not caller authentication, and
anonymity does not grant arbitrary bucket reads.

## Revision and retained evidence

The earlier single-origin design led to the bounded private read route and local proof. The landed
mixed-delivery sample now supersedes that topology: private shell/API through Deno, public assets
direct from R2 through a Cloudflare custom domain. Preserve the earlier work as evidence, not an
instruction to relay all assets or prohibit a public asset binding. The broader exposure vocabulary
at `8f2826881` remains historical; do not restore its model/verify/plan/apply programme.

The selected sample remains one Vite UI plus JSON API. No independent-download route, sign-in proof,
or mandatory worker/lazy-loading showcase is added. No landed library capability is reopened.

Preserve the completed foundation:

- `r2-files-delivery.plan.md` records the existing Files-backed upload and authenticated readback
  at `efdd7cdde`:
  bucket `sys-test`, prefix `tmp.sys.tools/r2-proof`, three objects / 1,253 decoded bytes. The
  namespace was reused, not fresh. Its retained local manifest and per-object expectations remain
  evidence; no new uploader or repeated storage proof is implied.
- `2d4e9d2ce fix(driver-cloudflare): bound R2 Files enumeration work` supplies finite Files
  enumeration/index budgets. It does not bound public HTTP GET bodies, request lifetime, or total
  service concurrency. The public read route should select exact objects, not list the bucket or
  rebuild a Files index for every asset request.
- Existing Pi acquisition, retained manifest/package authority, local verification, and browser
  execution policy remain unchanged. This non-release application proof does not complete Pi's
  product release.

The storage proof does not establish either current bucket's production configuration. The completed
`r2-files-delivery.plan.md` snapshot is retained at `0687bc053` and was removed by `67466fed9`;
preserve its checked relative reference for recovery. The actual hosted buckets, exposure, and
credential roles require current owner evidence. Replacement, copy, publication, or public access
is never implied by a historical receipt.

Dependency direction:

```text
completed storage/private-route foundation
→ landed mixed-delivery sample + completed reusable-owner extraction
→ hosted entry compatibility + explicit candidate packaging/publication workflow
→ owner-authorized native Deno proof
→ CDN binding + final-base candidate proof
→ db.team TLS/proxy/security configuration + mixed-delivery acceptance
→ independent product adoption; service-worker work remains separately owned
```

## Existing primitives and ownership

- `@sys/driver-cloudflare/r2` owns signed R2 access and the existing Files backing. Reuse its
  storage transport. The R2-backed route integration belongs with that owner; the application
  supplies route selection and caller-authorization policy. Do not put an identity system or product
  router inside the storage driver.
- `src/m.app/u.http.ts` composes Hono with literal URL paths and explicit routes; `m.app/u.routes.ts`
  maps only the private inventory. `@sys/http/server` owns local listener settlement. Preserve these
  existing owners, not a new filesystem-static host, transparent proxy, or routing framework.
- `@sys/server` owns verified Dist hosting with a deliberate loopback boundary. Do not widen or
  route around that boundary. This application neither uses that host nor needs a new server
  primitive; `HttpServer` plus `R2.ReadRoute` supplies the selected serving composition.
- `@sys/driver-deno/cloud` owns the staged workspace and `DenoEntry` deployment contract, documented
  in the [package README](../../../code/sys.driver/driver-deno/README.md#deployment-contract).
  `deploy/sample.proxy/src/entry.ts` demonstrates application composition through this entry seam;
  it is a reference, not a production R2 app or a command to redeploy that sample.
- `code/sys.driver/driver-cloudflare/-sample/deploy` owns the sample's UI/API paths, explicit
  anonymous policy, configured bucket/key mapping, limits, and response policy. Share `appFrom`
  between local and hosted adapters. The nested application is already registered in the workspace;
  do not add a root `deploy/` application or sample routes/exports to reusable driver APIs.
- `@sys/tools` remains the existing upload/operator-workflow consumer, not a Cloudflare control
  plane or application authorization owner.
- `@sys/web` retains its scaffold. A provider-neutral exposure model is not mandatory for this
  composition; introduce only vocabulary earned by actual consumers.

The security audit at `-agent/-plan/@sys.security/audit.plan.md` is an input for relevant selected
HTTP/proxy boundaries, not proof of current source and not a prerequisite to fix unrelated systems.

## Plan ownership and recovery

Keep the three existing plan identities; their boundaries are independently useful:

- This file owns hosted preparation, first deployment, `db.team` ingress, `cdn.db.team` delivery,
  and the sole hosted acceptance record.
- [r2-public-delivery.plan.md](r2-public-delivery.plan.md) owns the landed mixed-delivery contract,
  local/provider/browser evidence, credential closeout, and its unfinished service-worker follow-up.
  This plan consumes its existing source, not completion of its entire arc.
- [r2-delivery-extraction.plan.md](r2-delivery-extraction.plan.md) is the completed owner-contract
  and extraction record. Both consumers retain checked references through later archival; record a
  final committed snapshot before removal. Neither consumer is a prerequisite of extraction.

The source commits are reachable; the public-delivery and extraction plan files are untracked at
this reconciliation. Do not confuse source landing with a committed plan snapshot. This edit
preserves all three plans and migrates their identity headers; it neither commits nor archives them.

The checked archived storage reference remains recoverable through `0687bc053` / `67466fed9`.
Enumeration's completed record was archived by `3b1f8c758`; exact-key serving is not another
whole-bucket enumeration project. Pi's
[start-ui-release-evidence.plan.md](../@sys.driver-pi/start-ui-release-evidence.plan.md) remains an
independent product boundary, not a hosting prerequisite. The buffer and unrelated plans are not
changed by this reconciliation. Withdrawn generation/CAS publication work is not revived.

The Deno [deployment contract](../../../code/sys.driver/driver-deno/README.md#deployment-contract)
and live implementation constrain the next work. Historic source-local planning notes, old preview
successes, and generic security audits do not prove this target or authorize a broader campaign.

## `fix(driver-cloudflare): align the R2 sample with the Deno entry contract`

Observed seam: sample `src/-entry.ts` exports `main`, while
`code/sys.driver/driver-deno/src/m.cloud/m.DenoEntry/u.path.ts` selects only `src/entry.ts`. Its
absence invokes the static Dist fallback. The current sample bootstrap tests call `appFrom`, not
the actual Deno entry resolver, so their passing history does not cover this seam.

Scope:

- Align the sample's single hosted adapter with the existing `DenoEntry.Main` contract. Prefer
  the established `src/entry.ts` convention over a configurable discovery API or changing every
  Deno consumer. Preserve shared `appFrom`; do not copy bootstrap into a second application.
- Keep process-environment lookup for hosting distinct from local dotenv/Cell startup. Do not point
  Deploy at the loopback `serve` task or include its CLI UI as the production lifecycle.
- Prove the real `DenoEntry.serve` path with the sample composition and fixture storage. Missing
  credentials/configuration/build record, wrong pins, and refused storage must reject application
  startup; no static fallback may masquerade as success. An admitted fixture must expose the API
  and private shell, and refuse public-asset relay paths even when full local Dist bytes exist.
- Preserve static fallback for its existing unrelated consumers. Tests target this sample's explicit
  entry and fail-closed behavior, not a blanket driver redesign.

Use red → green coverage at the narrowest sample/entry seam, then owning checks. No retained UI
rebuild, repin, live R2 read, upload, deployment, or provider operation belongs to this item.

## `feat(driver-deno): prepare explicit mixed-delivery deployment artifacts`

Own the reusable deployment-artifact boundary in `@sys/driver-deno`, with immediate thin sample
adoption and an operator runbook. Keep R2 audience policy, resource selection, and publication in
existing sample/Deploy owners. This is not a general release coordinator or new uploader.

Source-derived gaps to close:

1. `m.stage/u.executeStage.ts` runs the target build before copying. Sample `task.build.ts` removes
   earlier outputs and records and generates two new pins. Preparation is therefore candidate
   creation, not pass-through of the already-proven local release.
2. `m.stage/u.materializeWorkspace.ts` copies a retained closure and excludes `.env`; the sample's
   `.gitignore` excludes `dist.pins.json` and all Dist roots. Presence in a local stage does not
   prove inclusion by the native uploader. Inspect the actual supported upload selection and prove
   required non-secret files reach the runtime without uploading dotenv/credentials or unrelated
   workspace material. Do not solve this by committing generated pins or disabling ignore/security
   boundaries wholesale.
3. `m.pipeline/u.prepare.ts` removes root workspace membership, writes flat
   `deploy.entrypoint`/`deploy.cwd`, and adds inclusion rules only for the full `dist/` root.
   Current provider docs describe `deploy.runtime` configuration. Verify the actual native CLI and
   provider contract before changing this owner; neither the README nor old pipeline success proves
   current runtime configuration, dependency closure, or mixed-record inclusion.
4. `m.pipeline/m.execute.ts` stages/prepares/deploys without an intervening R2 publication boundary.
   Do not run it over a selected/published candidate. Reuse separate existing stage/deploy surfaces;
   expose only a proven missing preparation capability if public composition cannot express the
   required sequence. Avoid a duplicated sample-local packager or private deep imports.
5. Local `serve` selects `--unstable-no-legacy-abort`; the hosted runtime does not accept custom
   runtime flags. Establish its actual runtime version, generated-entry execution mode, startup,
   abort/disposal behavior, and required dependency compatibility. Do not infer parity from local
   flags or weaken cancellation/permission/integrity checks to get a successful boot.

Required lifecycle, with each remote action separately authorized:

```text
confirm targets/base/configuration
→ stage/build once through existing owners
→ finish runtime/upload configuration and verify retained dependency/data closure
→ capture both pins, expected bytes, final asset base, source identity, and staged app
→ publish public projection, then private projection, from that same retained candidate
→ verify selected remote delivery against independent retained expectations
→ deploy the same prepared app/configuration/pins without another build
→ prove native runtime, then final custom-domain paths
```

No second frontend build may run in the remote builder. Pin metadata may include build time; this
plan promises one retained candidate through the workflow, not bit-identical independent rebuilds.
Final runtime packaging must include configuration and `dist.pins.json` even though startup does not
need local Dist bodies. Public/private projections remain the publication and proof authority,
not an alternative runtime static host. Inspect dependency resolution outside the development
workspace, including any preparation rewrite and import cache behavior; no fallback to source-tree
paths. Unrelated closure optimization is not an acceptance criterion.

Verification:

- Prove required-file inclusion and secret exclusion with synthetic data, not real `.env` contents.
- Exercise the actual generated external entry with fixture storage and no development-workspace
  dependency. A file inventory or typecheck alone is insufficient.
- Prove no hidden rebuild between candidate capture, the two publications, and deployment; mismatched
  bases/pins and changed staged inputs stop before remote work. Retained-file checks are not locks
  or atomic publication; keep competing writers and local build/clean tasks out of the operation.
- Keep local preparation credential-free; do not require real Deno or R2 secrets to test packaging.
  Hosted runtime tests and candidate delivery are evidence in the later live-proof item, not facts
  established by these fixtures. Missing provider compatibility evidence remains an explicit stop.
- Use existing module tasks after inspecting their permissions/help. Any new task must be narrowly
  scoped and non-interactive where invoked by automation; no live push/deploy in ordinary tests.

## Historical foundation and local proof record

The following completed design/proof sections retain their original candidate, filenames, and
operations. Their old `artifact.json`/`dist.pin.json`, all-assets-through-Deno topology, targets,
commands, and authorization budgets are historical, not the current runbook. Active mixed delivery
and the preparation items above supersede them. No work or live authority is recreated by retaining
these receipts. The current hosted gate and acceptance contract resume after this record.

## `feat(driver-cloudflare): expose presigned object reads`

Expose the smallest driver-owned read delegation over the pinned S3 client. Version 0.9.6 provides
`presignedGetObject` and `getPresignedUrl`; prove the actual signer path before publishing our
contract. No new signer or dependency replacement.

The narrow surface is optional `bucket.presignGet(key, { expirySeconds }) → Promise<string>`, backed
by the selected transport's optional signer. Native transport uses `getPresignedUrl('GET', ...)` on
its existing SDK client. Legacy injected transports and structural bucket implementations remain
valid without the method; no native signing fallback is supplied behind an injected transport.
Applications must require the capability before offering delegation.

Key admission is specific to this operation: nonblank well-formed strings, at most 1024 UTF-8 bytes,
with nonempty rootless segments other than `.` or `..`. Reject controls, backslash, `?`, and `!'()*`;
the latter five differ between the pinned SDK's URL encoding and AWS canonical URI encoding. Retain
admitted Unicode, spaces, and literal percent/plus/fragment characters exactly through encoding;
never decode or normalize an input key. Options project only an explicit integer `expirySeconds`.

The SDK passes a raw object path to `presignV4`, which splits it at `?`: `reports/report?` would
address `reports/report`. Its expiry check rejects values outside 1-604800 seconds but not `NaN` or
fractions; omission defaults to seven days. These source-derived limits constrain the new
capability, not existing unrelated Bucket operations.

- Bind the configured bucket, exact admitted key, and read method before signing. Reject keys the
  signing/URL path cannot preserve; never silently normalize them into another object.
- Require explicit finite integer expiry in 1-604800 seconds; the application chooses a short value.
  Begin with object GET; HEAD is separately signed only if needed, never a reused GET signature.
- Keep caller authorization in the app before delegation. Do not expose arbitrary endpoint,
  credential, method, query, or signing options to incoming requests.
- Preserve existing bucket callers, injected transports, ordinary reads, and Files/Cmd behavior.
  Decide the smallest capability/API boundary from real consumers, not a speculative universal
  storage interface or by duplicating SDK configuration in the application.
- Return an intentional bearer URL only through the authorized application response. Never emit the
  signing secret, include live bearer URLs in logs/evidence, or claim one-time/revocable-user
  access.
- Invoke the actual pinned signer with dummy credentials to prove bucket/key/method/expiry binding,
  punctuation/encoding admission, session-token handling, and rejection before signing. Issuance
  must perform zero fetches, not merely avoid downloading the object body. Preserve injected
  transport compatibility. Those tests do not establish live signature acceptance or expiry.
  The remaining inline live proof observes provider acceptance; expiry behavior remains unproved
  and outside this sample's narrowed scope.

## `feat(driver-cloudflare): add R2-backed application read routes`

Define the smallest reusable read-route contract before adding a public API. Start with an ordinary
Web `Request` to `Response` handler and an explicit object-read capability. Deno globals,
environment lookup, listener startup, and Cloudflare Worker binding types must stay outside that
handler's contract. The current SDK/import graph need not be claimed portable; a future Worker
adapter may use a native R2 binding behind the same logical read boundary.

Required behavior:

- Admit the configured read methods and application caller policy before issuing storage work. Begin
  with GET/HEAD; writes, deletes, bucket listing, uploads, and administration are not public route
  capabilities. Public-read policy must be explicit, not an omitted authorization check.
- Resolve an admitted route to a fixed configured bucket and exact owned key. Requests cannot choose
  arbitrary upstream hosts, buckets, credentials, or unrestricted keys. Preserve key identity and
  reject unsupported encodings/traversal rather than treating Files normalization as a lossless
  object-key map.
- Make root/index mapping explicit. An application route `/` may name the selected `index.html`;
  missing assets remain missing, not fallback HTML. Do not silently rewrite the document's module,
  CSS, worker, or asset URL graph.
- Reuse driver-owned R2 signing with server-only least-authority credentials. Do not forward browser
  cookies, Authorization headers, or arbitrary query/header options to storage. Keep application
  authentication independent of storage authentication.
- Bound object response consumption and active read work; define timeout, cancellation, failure, and
  body-close behavior at the actual transport boundary. The current `R2.Bucket.read(key)` has no
  caller cancellation/deadline option. Resolve that concrete seam narrowly under the R2 owner; a
  timer race or body cap must not masquerade as cancellation of an in-flight request. Tie permit
  release to the owned operation's cleanup, not just the caller's timeout response.
- Specify per-request byte/deadline limits and per-instance admission limits. Immediate refusal is
  sufficient; no queue is required. Account for buffering and response copies when selecting memory
  headroom; a byte cap is not a process-memory cap. Do not advertise these limits as deployment-wide
  or as bounding delegated downloads.
- Define MIME, encoding, length, cache, error, and GET/HEAD behavior coherently. Start with explicit
  refusal of unsupported Range behavior; conditional caching and partial responses require their own
  real contract before being advertised. Never put user-specific responses into a public cache.
- Return sanitized application errors, not provider credentials, signed-request diagnostics, or raw
  SDK failures. Distinguish missing objects, denied callers, upstream failure, and budget refusal.
  Intentional presigned-download responses belong to the separate delegation contract, not errors.

The concrete surface is `R2.ReadRoute.create({ bucket, storageOrigin, routes, authorize, limits })`,
returning a Web request handler. Routes are an exact canonical encoded-path → object-key map; `/`
requires an explicit entry. Authorization is mandatory, including an explicit `true` decision for
anonymous access. Limits require positive safe-integer `maxBytes`, `timeout` milliseconds, and
`maxConcurrent`; timeout cannot exceed seven days. The handler snapshots configuration, requires
presigning support, and derives the internal GET expiry by rounding timeout up to whole seconds.

The read adapter uses the existing SDK-backed signer and native Fetch with an owned abort signal,
exact origin/bucket/key admission, no redirects, and no browser credential/header forwarding.
`HttpFetch` was evaluated but its caller-facing result may settle before late-fetch or body-cancel
cleanup, and its public API exposes no separate cleanup completion. Releasing a route permit on
that result would violate this item's ownership contract. Keep the narrow read/body lifetime under
the R2 route owner rather than widening HttpFetch or duplicating the signer.

A deadline or caller abort settles the HTTP response promptly, but the worker retains its permit
until pending authorization, signing, fetch, and body cancellation settle. A dependency that never
settles can exhaust that instance's capacity; fail closed rather than accumulate abandoned reads.
Default tests must exercise delayed and rejected cleanup, not merely observe an abort signal.

Bounded buffering is sufficient; streaming is not a prerequisite. Reuse `serveFileBytes` for MIME,
computed length, `no-store`, and GET/HEAD projection. HEAD acquires the same budgeted bytes as GET.
Native Fetch supplies decoded gzip/deflate/Brotli bytes; refuse other or stacked content codings.
Never copy upstream encoding/length headers onto those bytes. Route admission, authorization, and
budget failures remain outside the byte-response helper; no general response framework is required.

Authenticated R2 transport is not independent artifact authenticity: use retained Dist expectations
for verification and preserve consumer pins where required. Do not add full-tree materialization or
hashing to every ordinary asset request merely because Pi needs verified executable artifacts.

Deterministic proof covers allowed/denied callers before storage work, exact route/key mapping,
unsupported requests issuing no storage work, missing assets, root mapping, and GET/HEAD
consistency. Exercise stalls before headers and during bodies, unknown/misleading lengths, overflow,
cancellation, late responses, cleanup/permit release, saturation/refusal, and sanitized errors. Use
injected storage and HTTP fixtures, not live credentials. Verify the selected package entry/import
surface; future Workers execution is outside this item's proof.

## Sample composition and operating contract

This section describes the baseline through `7c9fecaa5`. The canonical pin and sample-bootstrap items
below replace its persisted selection and startup contracts. Historical `artifact.json` and inventory
references are not compatibility requirements for that replacement. Unchanged route behavior,
resource limits, and transport/trust boundaries continue to apply.

### Application and entry

The driver-owned private workspace member is `@sample/r2@0.0.1` at
`code/sys.driver/driver-cloudflare/-sample/deploy`. It is registered in the root workspace;
there is no nested workspace. The parent driver excludes `-sample/` from publication and adds no
sample API export. The earlier root `deploy/sample.r2` scaffold is not the selected application.

- `src/entry.ts` exports `main` satisfying `DenoEntry.Main`. It reads bounded package-relative
  `config.json` and `artifact.json`, resolves credentials through an injected environment reader,
  creates the real R2 bucket adapter, and returns the application without opening a listener.
- `src/m.app/mod.ts` re-exports `createApp` from `u.create.ts`. The factory composes explicit Hono
  routes and one shared `R2.ReadRoute`; its small middleware and route helpers stay local.
  `u.credentials.ts`, `u.data.ts`, and `u.selection.ts` retain their focused support concerns.
- `src/ui/` owns the React entry and HTML. The UI shows a labelled, quoted message and a short
  explanation of R2 asset delivery versus the same-origin Deno API, with a relative API link.
  Body padding is 30px; the heading has no margin. No centred container, SPA router, or dev server.
- `-scripts/task.serve.ts` loads the existing upward dotenv reader, calls the same entry, and uses
  `HttpServer.start` with strict `127.0.0.1:8080` binding. The service label comes from `pkg.name`;
  `/`, `/ui/`, and `/api/hello` are printed. SIGINT cleanup remains explicit. No port fallback.

### Public behavior

| Request | Response |
| --- | --- |
| `GET /` or `HEAD /` | `308` to `/ui/` |
| `GET /ui` or `HEAD /ui` | `308` to `/ui/` |
| `GET /ui/` or `HEAD /ui/` | Selected `index.html` through `R2.ReadRoute` |
| `GET /ui/<admitted-file>` or `HEAD /ui/<admitted-file>` | Exact selected file through `R2.ReadRoute` |
| `GET /api/hello` | JSON `{ "msg": "👋 hello world!" }` |
| `HEAD /api/hello` | Corresponding GET headers without a body |
| Unsupported methods on declared routes | `405`, with `Allow: GET, HEAD` |
| Other paths | Empty `404`, never fallback HTML |

The API returns one complete fixed message. Query inputs are not used to construct it; the fixture
also checks that the old `?msg=foo` request cannot change the reply. The UI calls `/api/hello` and
renders the returned string as text. All responses receive `no-store` and `nosniff`.

Hono's `getPath` hook retains literal parsed URL paths; native `app.mount('/ui', read)` removes the
mount prefix and preserves cancellation. `/ui/` becomes `/` for the read handler. Queries on `/`
and `/ui` are refused rather than discarded by redirects; UI read queries and unsupported encoded
aliases remain refused. No filesystem fallback, CORS middleware, arbitrary bucket selection,
request-time listing, or storage work on the API/redirect paths is added.

### Build → push → serve

The ordinary sample tasks are `test`, `build`, `push`, and `serve`. A separate opt-in
`proof:local` task exercises the explicitly authorized pinned candidate; it is not another step
in build → push → serve:

- `build`: normal `@sys/driver-vite` build, bounded `Pkg.Dist.Local.verify`, then regeneration of
  `artifact.json` from the admitted manifest integrity and filenames, including `dist.json`.
- `push`: verify the existing Dist against that selection with `Pkg.Dist.Pinned.verify` and exact
  filename comparison; write `.tmp/push.yaml` containing credential environment references, never
  values; delegate to public `Deploy.push`. It does not rebuild. Provider diagnostics are redacted,
  while permission denials stay visible. It can prune stale objects within the configured prefix;
  publication is not atomic and has no automatic retry or rollback.
- `serve`: start the local Deno application. It does not build or upload. Restart after replacing
  the runtime selection; rebuild and push UI edits before expecting them in the browser.
- `test`: fixture-only application, credential-reader, bounded-data, and fake-publisher tests.
  Tests may load their own temporary dotenv fixture, never the repository's live credentials.

There is no sample `stage` task or `start` alias. The uploader's `staging: { dir: './dist' }` field
merely points its existing publisher at the already-built directory; it is not Deno application
staging or an additional user workflow.

Current non-secret target and limits:

- Account `1e6ec0395407e49eef7ee54f667d61de`, bucket `sys-test`, prefix
  `tmp.sys.tools/r2-ui-proof`. Preserve the historical `tmp.sys.tools/r2-proof` namespace.
- Credential references: `SYS_TEST_R2_ACCESS_KEY_ID` and `SYS_TEST_R2_SECRET_ACCESS_KEY`.
  Serving and pushing currently use the same references; do not claim separate least-authority
  provider credentials have been provisioned. Credentials stay server-side.
- The R2 network grant is account-host-specific, not bucket-specific. Changing a bucket or prefix
  within the same account does not change the hostname; changing the account requires updating
  `config.json` and the `push`/`serve` R2 network grants together.
- UI reads: 1,048,576 bytes, 5,000ms, four concurrent owned operations per instance.
- Dist admission: 65,536 manifest bytes, 256 entries, 1MiB per file, 4MiB total.
- Build keeps the explicitly selected local env/FFI/Deno-subprocess and `osRelease` permissions.
  Serving keeps strict port 8080 and `--unstable-no-legacy-abort`; no permission broadening is
  implied by this plan.

Keep `dist/`, `artifact.json`, and `config.json` aligned during publication and any selected proof.
Local verification is not a transaction over the uploader's later reads, and ordinary serving does
not verify each R2 response against the retained file hashes. A rebuild selects a new candidate.

### Commit-content and contemporaneous anchors

The opening arc is the landing ledger. These notes identify what the actual commits contain;
proposed standalone commit messages from the conversation are not additional landed commits.

- `9f062ede0` includes both grouping the application helpers and moving the UI under `src/ui/`.
- `6153361a0` includes the `m.app`/`u.create.ts` structure, `start` → `serve`, the package service
  label, the complete fixed API message, top-left layout, and self-describing UI copy.
- `d5248f6fa` adds the explanation's line break. `920158a72` has the same actual subject but its
  delta adds the greeting's wave emoji, updates the test expectation, and records a new artifact
  selection. Keep both hashes; do not infer identical content from the repeated subject.

Related reachable commits are context, not extra tasks in this application arc:

- `22efdb1aa feat(driver-deno): prune staged workspaces to the target package closure`.
- `83ae0d4d3 docs(driver-deno): consolidate deployment contracts and follow-ups - cleanup`.
- `849176888 docs(driver-deno): document staged deployment contract`.
- `af30f0b69 fix(driver-vite): align startup and dependency resolution`.
- `5995ecc08 fix(driver-vite): restore external consumer build and dev`.
- `50d32fa61 refactor(driver-vite): reuse canonical prefix stripping`.
- `8d7448e21 chore(publish): exclude package-local samples and test fixtures`.
- `1b9377722 chore(workspace): refreshed 9 workspace packages (34 jsr:publish modules)`.
- `9db25b85d fix(driver-vite): decouple published fixture pins from workspace bumps`.

The sample's own workspace registration and parent publication exclusion are in `e242fbce4`;
`8d7448e21` supplies related exclusions in other packages. These source/configuration anchors are
not a new execution of publication or external-host proof.

### Evidence observed at reconciliation

Against source at `920158a72`, from the sample directory:

```sh
deno task test
deno check ./src/ ./-scripts/ ./vite.config.ts
deno lint ./src/ ./-scripts/ ./vite.config.ts
```

All passed: four suites / 19 steps (application 7, credentials 3, bounded data 3, push 6), typecheck,
and lint. Application tests retain real Hono/R2 composition and mock only the storage boundary.
They cover mapping/HEAD, redirects, the fixed API, literal-path/query refusals, write refusal,
mount cancellation, and invalid configuration. Driver tests own the deeper read-lifecycle matrix;
do not duplicate it or turn this sample into a broad dependency test harness.

The owner supplied a browser screenshot at `http://localhost:8080/ui/` showing the top-left
`R2 + Deno` page, `message: "hello world!"`, explanatory text, and the API link. The inspected
session attachment is
`/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-clipboard-e0a3f2f5-da41-485b-bd1b-25cdacf4e801.png`.
It predates the line break and wave emoji. This is manual rendering evidence, not an automated
browser trace, a retained all-object byte comparison, or a binding to the latest candidate.
The attachment is a temporary session artifact, not a checked-in durable proof receipt.

At reconciliation, local `artifact.json` declares
`sha256-11b1ce74a71fa46fc4516456218f97ae6b249c59f05856f4833407ce0091ac93`
and four selected files: `dist.json`, `index.html`, `pkg/-entry.C_OUxBuS.js`, and `pkg/-pkg.json`.
The local manifest identifies `@sample/r2@0.0.1`, builder `@sys/driver-vite@0.0.477`, and
Deno 2.9.6 / TypeScript 6.0.3. These are inspected local metadata, not fresh pinned verification
or evidence that R2 currently holds those bytes. No build, upload, or remote read was run for
this reconciliation.

Historical `.tmp/stage.json` points to
`/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys.driver.deno.deploy.staged-a46c9b6b64352768`.
That earlier preparation is not execution of a staged application and is not the current candidate.
The native completion probe's `127.0.0.1:0` permission denial also remains an unverified auxiliary
probe, not a defect in the sample's explicit 8080 serving grant. Do not broaden permissions or
restore a staging task to disguise either evidence limit.

### Authorized local proof attempt

The owner resolved the local-read gate below and explicitly requested execution. The initial
command was run once from `code/sys.driver/driver-cloudflare/-sample/deploy`:

```sh
deno task proof:local
```

The proof script is `-scripts/task.proof.local.ts`, using the existing `serve` permission preset
without widening it. It starts the real `src/entry.ts` application on strict port 8080 with the
existing dotenv reader; no storage mock or filesystem-serving fallback is installed. It retains
local expected bytes before network work and never builds, uploads, prunes, or retries.

Observed result:

- Local `Pkg.Dist.Pinned.verify` passed for
  `sha256-11b1ce74a71fa46fc4516456218f97ae6b249c59f05856f4833407ce0091ac93`;
  exact selected filenames matched, and a second local verification passed after capturing bytes.
- The first request, `GET http://127.0.0.1:8080/ui/dist.json`, failed the proof with
  `GET dist.json failed: HTTP 412.` The bounded Fetch helper uses status `412` for checksum
  refusal; this is not evidence of an R2 authorization denial or of an on-wire HTTP 412 response.
- No file was admitted as matching. Execution stopped after that one application request, before
  HEAD, asset, API, redirect, missing-path, or browser checks. The original diagnostic did not
  retain the received digest; it is unknown, not inferred from a different candidate.
- The owned listener was closed in `finally`; a subsequent listener probe found nothing on 8080.
  No unrelated process was stopped. No upload, pruning, permission change, or automatic repair ran.
- The script's failure reporting was then improved to retain public expected/received checksum
  diagnostics for a future authorized attempt. The live operation was not repeated during that edit.

#### Resumed attempt at `204fca7d9`

After the probe landed as `54afcb4a4`, the owner instructed this verification item to "keep going
to completion". Ran `deno task proof:local` once more, without building or publishing. Local
configuration and artifact selection were unchanged; the sample worktree was clean. The probe
again completed local pinned verification and expectation capture before its first HTTP request.

The emitted selection named the same account, bucket, prefix, and four files, with ceilings of
14 application requests and nine internal storage reads. Actual execution stopped after the first
application request, `GET http://127.0.0.1:8080/ui/dist.json`, with this checksum evidence:

```text
expected: sha256-11b1ce74a71fa46fc4516456218f97ae6b249c59f05856f4833407ce0091ac93
received: sha256-028fd411689df7e0efc275ac7dbadc72920307ffaa77846bd12992a873fed10a
valid: false
Fetch status: 412
```

The task exited unsuccessfully with `GET dist.json refused: Fetch status 412.` No remaining HTTP
checks or browser checks ran, and no selected remote file was accepted as matching. The owned
listener closed; a subsequent `lsof` probe listed no listener on 8080. No additional remote request,
upload, pruning, rebuild, repinning, or permission change followed the refusal.

A read-only search of the reachable history of this sample's `artifact.json` found no occurrence
of the received digest. This does not identify the served manifest as a particular older build.
The mismatch is now evidenced by both digests, but its cause remains unestablished.

#### Authorized push and post-push verification

The owner replied "you may - go" to the explicit request to run the existing `push` task for
`sys-test/tmp.sys.tools/r2-ui-proof`, including replacement and stale-file pruning, then rerun
verification. With the same retained artifact and clean sample worktree at `204fca7d9`, ran:

```sh
deno task push
deno task proof:local
```

Each command ran once. Push reported `R2 push: 0 written, 4 skipped, 0 removed.` The subsequent
proof again stopped on its first `dist.json` request with the same expected and received hashes
above and Fetch status `412`. No remaining HTTP or browser checks ran. A subsequent listener probe
listed nothing on 8080. No rebuild, forced publication, permission change, or further live request
followed that refusal; the historical `tmp.sys.tools/r2-proof` prefix was not targeted.

Local source inspection explains why ordinary push did not replace the differing manifest:

- `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts` parses the remote manifest,
  then `publishFiles` sets `remoteMatchesDist` from `remote.hash.digest === dist.hash.digest`.
- It marks `dist.json` itself skipped when that asset-tree digest matches, the marker exists, and
  no asset needs writing. It does not compare the exact local and remote manifest bytes.
- `Pkg.Dist.compute` computes manifest integrity separately over the serialized document, including
  build metadata. The retained manifest's hash policy excludes `dist.json` from the asset tree.
  Equal tree digests therefore do not establish equal manifest bytes.
- Existing provider tests explicitly exercise whole-target skipping on equal tree digests. They do
  not establish exact manifest equality for the live result above.

This identifies a publication-contract defect: normal push can preserve a manifest that fails the
sample's exact manifest pin. It does not establish which fields or formatting differ in the remote
document, nor verify its asset bytes. Another unchanged normal push is not a demonstrated repair.
The next code change should make manifest skipping depend on exact manifest identity and add a
focused regression for equal asset-tree digests with different manifest bytes. That publisher fix
is distinct from weakening the proof, forced publication, or adding a new uploader.

At that point delivery verification still failed; the local-read authorization was already
resolved. The next subsection records the subsequent correction and successful HTTP proof.

#### Manifest-identity correction and successful HTTP readback

The owner explicitly instructed the publisher fix, regression tests, plan update, publication of
the existing sample build to the same prefix, and another verification run. Execution used source
base `204fca7d9` plus the publisher correction described by
`fix(tools): compare R2 manifest identity before skipping publication`. No build, forced push,
permission expansion, or change to the expected pin was performed.

Offline evidence:

- The three regression cases (changed metadata, formatting, and UTF-8 BOM with unchanged assets)
  failed against the old implementation at the expected skip/write assertion, then passed after
  the correction through the real Files → R2 backing over an in-memory bucket.
- An additional content-ref test checks different raw bytes despite equal parsed JSON. Existing
  exact-match tests and repeated pushes still skip unchanged manifests. Manifest-last publication
  and asset skip behavior remain covered.
- `deno task test:deploy`: 34 suites / 285 steps passed. After fixture Promise-return cleanup,
  the focused R2 provider suite passed 29 steps. Provider lint and changed-file formatting passed.
- Sample `deno task test`: five suites / 23 steps passed, with typechecking.

From `code/sys.driver/driver-cloudflare/-sample/deploy`, ran each command once:

```sh
deno task push
deno task proof:local
```

Push reported **1 written, 3 skipped, 0 removed**. The subsequent proof completed successfully
against `sys-test/tmp.sys.tools/r2-ui-proof`, using the same account and local artifact pin:
`sha256-11b1ce74a71fa46fc4516456218f97ae6b249c59f05856f4833407ce0091ac93`.

Every selected object matched retained local bytes and its expected hash:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist.json` | 1137 | `11b1ce74a71fa46fc4516456218f97ae6b249c59f05856f4833407ce0091ac93` |
| `index.html` | 449 | `9eefd3637ebee6d742eb654fd24f06ce72a9105e9dddeaadf60a3c88255f6d14` |
| `pkg/-entry.C_OUxBuS.js` | 226451 | `229c422e8b4da89aa19ff2823b7f98ba73180be725ed165db1c1333ab6da55db` |
| `pkg/-pkg.json` | 49 | `7fac3ccbff2a361f0a5521134511997ed0716160b63dbb9f4a19e9ca54aff465` |

Selected bytes total: **228,086**. The proof made **14 sequential application requests**, within
its nine-storage-read ceiling, without retries. GET/HEAD metadata, MIME, no-store/nosniff headers,
absence of content encoding, content lengths, `/ui/` index delivery, both 308 redirects, and the
unselected-path 404 passed. `/api/hello` returned `👋 hello world!`; its HEAD check passed.
Final local pinned verification also passed. The owned listener closed, and a subsequent listener
probe listed nothing on 8080. The historical `tmp.sys.tools/r2-proof` namespace was not targeted.

The receipt explicitly reports `browser: not exercised` and `bucketPrivacy: not attested`.
This establishes candidate-bound HTTP delivery, not browser execution, private bucket settings,
external hosted execution, or public HTTPS exposure. Those remaining boundaries are unchanged.

### Remaining proof boundaries

The remaining `test(driver-cloudflare)` items cover executing bounded verification and recording
its results, not documentation alone. Add only the small proof scripts needed to exercise existing
helpers. If hosted delivery needs checked-in deployment configuration, identify it as a separate
implementation commit when that concrete scope is known; do not hide it inside a proof receipt.
The gates authorize live operations and are not commit items.

The local sample is useful without a hosted deployment. For this exposure plan's remaining proof,
retain one candidate and obtain bounded authority for any new upload/readback; compare every
selected object with local expectations and record browser/API observations for that candidate.
Bucket privacy requires owner/provider evidence rather than inference from authenticated reads.

When hosted work is selected, reuse the existing Deno deployment/entry contract and prove the
actual external entry, dependency/data closure, secret delivery, and deployed UI/API journey.
Do not claim those checks from historical stage creation. Do not add another uploader, router,
packaging framework, or local task just to anticipate that work. If host preparation rebuilds the
UI, select and prove the resulting candidate before claiming continuity with local evidence.

## GATE owner authorizes local application proof against selected live R2 objects

Resolver: the human controlling the selected R2 account and sample data. The owner explicitly
resolved this gate: "so yes, you have it", and instructed execution of the local application proof.
Preserve the checked gate as the authorization record; do not request the same approval again.

Authorized scope: read-only local application proof for account
`1e6ec0395407e49eef7ee54f667d61de`, bucket `sys-test`, prefix `tmp.sys.tools/r2-ui-proof`, and
artifact `sha256-11b1ce74a71fa46fc4516456218f97ae6b249c59f05856f4833407ce0091ac93`.
Use the existing configured credential reader and strict `127.0.0.1:8080` listener. Reuse existing
permission grants; never stop an unrelated listener. This pass permits at most 15 sequential HTTP
requests, nine internal R2 object GETs, no retries, at most 1MiB per object read, and an 8-second
client deadline per request around the application's 5-second storage deadline. It covers the four
selected files, GET/HEAD, root index delivery, redirects, the API, and a locally refused missing
path. No upload, pruning, provider setting change, or hosted exposure is authorized by this gate.

This gate controls live operations for `test(driver-cloudflare): verify local R2 application
delivery`. Authorization is resolved independently of whether the verification succeeds.

Pass evidence names the loopback listener, configured private bucket and admitted Vite build keys,
retained manifest and expected bytes, explicit anonymous policy, permitted serving credential
references/access, and finite request/byte/time/retry limits including browser resource requests.
It authorizes only the stated reads and client retrievals, with the read handler's internal signing.
A selected missing-key probe must fit that budget; independent downloads and expiry experiments are
not part of this proof. Existing upload/readback permission was consumed by its completed proof and
is not a standing grant.

The Vite build is distinct from the historical three-object storage sample. Bind an existing
owner-performed upload to the retained candidate where evidence permits; do not repeat writes just
to fill this ledger. If a new upload is needed, separately name and authorize the existing `push`
task's exact target, stale pruning/replacement, and retention. Keep the old storage proof's artifact
and objects unchanged. Record the selected Vite manifest/bytes and the actual publication result;
a write acknowledgement is not byte verification. The read-only proof compares served bytes with
that retained local authority. No new uploader, automatic upload during serving, or silently reused
upload approval is allowed.

No public domain or Cloudflare edge setup is required. Both UI and API are same-origin, so this
sample requires no browser-to-R2 CORS configuration. Bucket privacy or other provider setup still
requires separately named authority and owner evidence. Missing artifact/setup/read authorization
keeps the live proof unchecked while local fixture implementation and proof remain possible.

## `test(driver-cloudflare): add pinned local delivery probe`

Own the proof implementation in `-scripts/u.proof.ts`, its thin `-scripts/task.proof.local.ts`
launcher, and the opt-in `proof:local` task. Keep offline tests alongside the implementation in
`-scripts/-test/-u.proof.test.ts`; the sample test task includes both application and script tests.
Reuse the existing serving permissions, real application entry, bounded Fetch client, and local
pinned Dist verification.
Select the target from validated `config.json` and the candidate from the build-owned
`artifact.json` once per invocation, not from source-code copies of the hash, target, or file count.
Verify the complete local Dist against that pin, check each retained snapshot against its pinned
manifest checksum, and retain those expectations for the whole run. Report the selected target,
pin, files, and derived request ceilings before live work. A later build is a new candidate for a
later invocation, never permission to repin an active run or adopt expectations from R2.

Stop on the first mismatch without retry or repair, emit only safe checksum diagnostics, and close
the owned listener. Keep local build/configuration inputs unchanged during proof. Do not add this
live probe to ordinary fixture tests or the build → push → serve workflow. These tooling changes
do not enlarge the historical run authorization or establish success for its failed candidate.

Offline selection tests cover a changed build/hash/file count, retention of the first run's bytes
and verification pin, stale artifact rejection, changed asset rejection, and filename drift. The
pre-change red run was skipped because the old task executed live work on import; the preparation
seam in the inert utility module now permits those checks without credentials, a listener, or R2
requests. Tests import the utility, not the executable task.

The probe passed typecheck, lint, and formatting checks. Its first live execution detected the
manifest refusal recorded above; that failure is not a successful delivery proof. This item owns
the checking tool. The following item owns investigation of the mismatch and completion of the
candidate-wide verification, including the actual evidence record.

## `fix(tools): compare R2 manifest identity before skipping publication`

The owner explicitly authorized the publisher fix, its regression test, this plan update, and
publication of the existing sample build to the same approved prefix followed by verification.
Keep the selected artifact unchanged; no rebuild, alternate uploader, forced publication, or
change to checksum expectations is part of the fix.

Preserve per-asset skip decisions and manifest-last publication. Skip `dist.json` only when its
own exact identity matches the retained local manifest, not merely when asset-tree digests match.
Use existing Files reads; do not treat decoded or truncated content as byte-exact without the
needed evidence. Test equal asset trees with different manifest metadata/representation and
confirm unchanged manifests still skip. Then run the existing sample push once for
`sys-test/tmp.sys.tools/r2-ui-proof` (including normal replacement/pruning there), followed by the
read-only proof. Keep the historical `tmp.sys.tools/r2-proof` namespace untouched.

Identity evidence assumes a stable remote object during inspection. The R2 inline backing uses
fatal UTF-8 decoding without normalization, but obtains metadata by `stat` before a separate read.
Its round-trip size check detects BOM loss only when metadata and payload describe the same object
version. Concurrent replacement can defeat that evidence; this correction does not promise
concurrent-publication safety or an atomic metadata/body read. Content-reference identity covers
fetched bytes, not freshness or faithful origin mapping beyond the configured transport contract.

The local manifest buffer is retained through comparison and publication. Staged assets are not
snapshotted with it, and ordinary asset skipping does not rehash remote objects. Keep staging
unchanged during publication. Atomic publication, corruption repair, and concurrent-writer control
remain outside this correction; the candidate-bound delivery probe is separate evidence, not an
expansion of the publisher's guarantees.

## `refactor(driver-cloudflare): centralize sample build selection`

Keep the initial DRY change sample-local in `-scripts/u.selection.ts`: load and validate the recorded
artifact, call `Pkg.Dist.Pinned.verify` with the sample limits, and compare the exact filename set.
Reuse one pure filename projection in admission and the build writer; include `dist.json` explicitly
because it is not an asset in `dist.hash.parts`. Keep script-only result types in `-scripts/t.ts`,
composing the existing verifier contracts rather than copying their evidence or failure vocabulary.

Status, push, and proof own their existing refusal policy and messages. Malformed selection metadata
still throws; failed local verification is informational for startup and fatal for push/proof.
Proof rechecks must capture the initial directory and manifest pin, never reload a later artifact or
silently select a newer build. Preserve the bounded snapshots and checks before and after expectation
capture. Prove filename ordering, manifest inclusion, unchanged hash parts, and retained-pin behavior
with offline fixtures; do not rebuild, repin, publish, or run a live delivery probe for this refactor.

This is shared sample composition, not the canonical pin contract below. Required `index.html`,
filename restrictions, fixed limits, R2 routes, and presentation remain application policy. It does not
create a new public `@sys` surface or change the persisted selection format.

The same source slice includes the startup `build` detail, its terminal-aware path/digest presentation,
and README alignment. The detail reports the verified local Dist digest, not the manifest-byte pin or
R2 delivery proof. Its formatter must match both the label and plain value before substituting linked
presentation. Serving remains independent of local `dist/`, but valid selection metadata is required.

Offline validation covered 42 sample test steps, including retained-pin rechecks after artifact edits,
filename ordering and manifest inclusion, caller refusals, and startup presentation boundaries.
Build, push, serve, and local-proof script entrypoints passed type checks; all eight changed TypeScript
files passed formatting, and the scoped diff check passed. These checks used fixtures, not a retained
candidate rebuild, repin, publication, browser session, or live R2 delivery probe.

## `feat(pkg): add canonical Dist pin contracts`

### Dist pin: one expected manifest identity

A Dist pin records the expected checksum of one exact `dist.json` document. It does not repeat the
manifest's asset inventory, introduce another aggregate, or prove its own provenance. The selected
wire filename is `dist.pin.json`, with this one-key shape:

```json
{
  "dist.json": "sha256-3f2e2ec7cdf84a16b76aba70940e07f0804180de0f7610e51744f4da91373811"
}
```

This example illustrates the representation; it does not approve or verify a retained candidate.
The key names the manifest at the caller-selected Dist root, not necessarily beside the pin file.
The value pins the exact file bytes, not re-serialized JSON or the embedded `hash.digest`. Do not
add `:digest`, a JSON-pointer suffix, an algorithm selector, or arbitrary file-reference keys.

The distinction is substantive: `CompositeHash.digest` sorts keys but hashes the ordered constituent
hash values. Equal asset aggregates do not establish equal paths, metadata, or manifest bytes.
Keep that algorithm unchanged. Reuse `t.StringHash`, existing manifest integrity vocabulary, and
existing verification rather than creating another hash concept.

### Ownership and admission contracts

- Define one readonly `t.DistPin` in `code/sys/types/src/t/t.Pkg.dist.ts` with the literal key
  `dist.json` and a `t.StringHash` value. Project it through normal type exports and local type
  funnels; do not duplicate its definition in consuming modules.
- Add `Pkg.Is.distPin(input: unknown): input is t.DistPin` under the standard Pkg owner. Reuse
  `Pkg.Dist.Part.parse` for checksum syntax. Require a plain data record with exactly the own
  `dist.json` key and a canonical `sha256-` plus 64 lowercase hexadecimal characters. Reject arrays,
  null, missing/extra keys, nonstrings, inherited/accessor-backed values, size suffixes, whitespace,
  and trailing newlines. Do not add a second `parsePin` validator or a property-access wrapper.
- The guard establishes only document shape and checksum syntax. It does not freeze caller data,
  establish provenance, read a manifest, or verify assets. Consumers retain their own immutable
  snapshot before asynchronous work. Bounded JSON loading remains a caller responsibility; keep
  the sample's 65,536-byte and five-second package-data bounds.
- Retain standard `Json` duplicate-member behavior: last member wins. A decoded-object guard must
  not claim to detect repeated members in source text. Do not add a new JSON parser for this feature.
- Expose `Pkg.Dist.Pinned.admitManifest` from the existing filesystem Pkg.Dist verification owner.
  Its inputs are manifest bytes, an externally supplied `integrity`, finite verification limits,
  and optional cancellation, following the existing verifier's argument conventions. It performs
  no filesystem/network access, credential lookup, or distribution materialization.
- Admission validates and snapshots the bounded input before asynchronous work, checks exact-byte
  integrity before fatal UTF-8 decoding and JSON parsing, and reuses the strict kernel in
  `code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts`. Preserve its path/collision, part-size,
  aggregate, ignore-policy, declared-total, and manifest-extension rules. `Pkg.Is.dist` alone is
  insufficient. Do not copy the kernel into the sample or expose a private deep-import dependency.
- Return a distinct `manifest-admitted` success with immutable evidence: observed integrity,
  manifest byte count, and admitted Dist metadata. Use the existing admission-applicable refusal
  vocabulary. Do not return `Pkg.Dist.Verify.Verified` or claim observed/verified asset totals.
  Preserve `Pinned.verify`, `Local.verify`, and `Pinned.readPart` contracts and full-tree checks.
- Entry bounds must account for the manifest, declared asset paths, and implied directories in the
  derived graph. Declared sizes remain bounded. These checks do not enumerate storage or establish
  the actual remote tree. Keep acquisition limits separate from assertions about declared assets.

The public primitive owns the pin shape and manifest admission, not R2, app startup, fixed sample
budgets, ASCII filename restrictions, required `index.html`, route aliases, or terminal formatting.
This library slice leaves sample files and retained candidate metadata unchanged; the next item owns
consumer replacement. No new constructor framework, compatibility layer, or hash implementation.

### Canonical proof boundary

Use focused offline fixtures and owner-module checks, then scoped regression tests:

- Pin guards cover valid input, malformed shapes/values, exact checksum syntax, and the chosen
  own-data-property and JSON duplicate-member semantics.
- Equal asset aggregates with changed manifest metadata, whitespace, or BOM remain distinct pins.
  A path rename preserving constituent-hash order demonstrates that the aggregate does not bind names.
- Checksum-matched malformed manifests still refuse: invalid UTF-8/JSON, unsafe/colliding paths,
  missing sizes, incorrect aggregates/totals/ignore metadata, and exact-boundary/overflow cases.
- Valid manifest bytes admit without filesystem or network IO. Cancellation and mutation of
  caller-owned inputs cannot change the captured expectation or admitted result.
- Changing an asset without changing the manifest leaves manifest admission successful but makes
  full Dist verification fail. This difference is required evidence, not a missing admission check.
- Existing full-tree verification and part-read fixtures remain green. No sample build, repin,
  publication, browser session, or live delivery probe belongs to this item.

## `refactor(driver-cloudflare): bootstrap sample routes from a pinned manifest`

### Greenfield replacement, not legacy migration

The owner selected a greenfield replacement for this new sample. Use only `dist.pin.json`; remove
`artifact.json`, sample-owned `Artifact`/`artifactFrom`, persisted `files`, and obsolete selection-only
helpers and fixtures as consumers change coherently. Do not build a converter, dual-format reader,
legacy fallback, deprecation period, or migration framework. Rewrite affected tests for the new
contract instead of preserving the old inventory format. Reuse the canonical guard and admission API.

Keep `dist.pin.json` in the sample package root, outside `dist/`. No duplicated filename/hash map
belongs in it. Derive filenames from admitted manifest parts plus `dist.json`, exactly once, in
stable order. Sample filename restrictions, required `index.html`, prefix mapping, and resource
budgets remain sample policy. Removing compatibility machinery does not authorize silently selecting
a different manifest: carry the independently selected expectation, never hash current remote bytes
to manufacture the expected pin. Candidate confirmation and delivery evidence remain separate.

### One fail-closed startup lifecycle

The owner selected fail-closed startup as the only supported posture. Admission failure prevents
returning the whole application, including its API. There is no partial-start, unpinned, offline,
legacy, local-asset fallback, or automatic retry mode, and no switch for one.

1. Read bounded configuration and pin metadata; validate them and capture an immutable snapshot
   before the first storage operation. Resolve credentials through the existing injected reader.
2. Acquire exactly `<configured-prefix>/dist.json` once per application instance, independently of
   the final application routes. Invoke a manifest-only public `R2.ReadRoute.create` handler directly;
   no listener or call through `/ui/dist.json` is needed. Reuse its signing, origin/key validation,
   bounded body acquisition, cancellation, and redacted-error behavior. Do not deep-import its reader
   or add a generic R2 download API. Apply the manifest byte cap, five-second deadline, and one owned
   bootstrap operation. No listing, redirects, retries, discovery, or credential/URL disclosure.
3. Admit the captured manifest bytes against the captured pin through the canonical operation.
   Apply sample filename/index policy and existing Dist limits. Missing, malformed, oversized,
   timed-out, cancelled, or mismatched input refuses startup before app construction/listening.
4. Derive and retain the immutable route map from admitted parts plus the manifest. Only then create
   and return the application. Local `dist/` is not required. No request-time manifest refresh or
   metadata reload may silently change this instance's target, pin, or admitted routes.

This pins the startup manifest and route inventory. Ordinary R2 asset responses remain the existing
bounded byte relay within the trusted-storage posture; do not label them independently verified.
A later manifest/asset replacement is not prevented by this startup check. Per-response verification,
immutable remote generations, and concurrent-publication control are not hidden additions here.

### Consumer and proof handoff

All entry paths use one bootstrap composition. Keep file loading, credential resolution, and listener
startup at their existing adapters; do not duplicate bootstrap for scripts and hosted entry.

- Build: after explicit `Local.verify`, write the manifest-byte expectation as `dist.pin.json`.
  Building intentionally selects a candidate; it is not proof of independent provenance or delivery.
- Push: load the retained pin and use complete `Pinned.verify` before the existing publisher.
  No rebuild, repinning, persisted inventory comparison, or new uploader.
- Entry: capture inputs once and perform remote manifest admission before returning the app.
  Fixture seams exercise the same composition without live credentials or network.
- Serve/status: use the same captured pin. Local Dist verification and its displayed asset aggregate
  remain informational; missing local output is not a serving prerequisite. Do not mislabel the
  local status row as the admitted remote manifest or verified R2 delivery.
- Proof: capture config, pin, and local expected bytes once; pass those inputs to the bootstrap used
  by the application. Close the baseline gap where `prepareProof` captures configuration but `main`
  reloads it. Preserve bounded expectation snapshots and before/after local verification. Later
  config/pin edits cannot retarget the application or alter the reported authority for that run.

For `N` expected files, the existing HTTP probe's application-request ceiling remains `2 * N + 6`;
its internal storage-read ceiling becomes `2 * N + 2`, including the one bootstrap manifest GET.
Emit the captured target, pin, and ceilings before acquisition. Count bootstrap even when it refuses;
stop on the first failure. Instrument storage fixtures rather than treating a formula as observed
read counts. Keep browser requests separately within any later approved live budget.

The historical four-file authorization allowed nine storage reads; this lifecycle needs ten for
that same probe. Preserve the historical gate and proof unchanged. A fresh live invocation requires
explicit authority covering its actual candidate and bootstrap-inclusive budget; this plan update
and offline implementation grant no such authority.

### Sample proof boundary

Prove offline that no-local-output startup succeeds with an admitted fixture manifest, and every
acquisition/admission/policy failure prevents the whole app from being returned. Observe exactly one
permitted bootstrap key and no fallback/listing/retry. Derived routes include `dist.json` once and
refuse unadmitted paths. Existing API, redirects, HEAD, MIME, cache, cancellation, and error boundaries
remain covered after successful startup.

Edit config/pin metadata after capture and prove the app still uses the retained target and checksum;
assert bootstrap-inclusive request counts and first-failure termination. Changed asset bytes must
fail complete local verification and delivery comparison without falsely making manifest admission
an asset check. Guard rejection covers obsolete/extra-field shapes; no legacy conversion behavior
is supported. Update README, task output, and entrypoint fixtures to name the new pin and startup
posture. Verify affected owner modules and all sample fixtures, not live R2 or a retained build.

These two implementation items preserve the historical publication/readback evidence and live
operation boundaries. They do not confirm or repin the retained candidate, authorize rebuilding or
publication, or establish new browser/provider/delivery evidence.

Offline validation covered 54 sample steps and 29 ReadRoute regression steps. The driver owner check,
five affected sample entrypoint checks, 26-file formatting check, 24-file lint check, and scoped diff
check passed. Fixtures exercised retained configuration/pin through credential callbacks, signing,
and metadata replacement after proof announcement; bootstrap refusal before any listener; complete
request/storage ceilings; and first-failure termination. A negative-probe filename present in the
admitted build reproduced an extra-read defect red → green: the probe now chooses an absent name
from its retained inventory instead of assuming the hard-coded name is absent.

The sample-local `.gitignore` exception makes `dist.pin.json` visible despite the root `dist.*` rule.
The format replacement carries the pre-existing candidate checksum unchanged; it does not confirm
that candidate. Validation created only fixture-owned distributions and synthetic credentials. No
retained-candidate build, repin, publication, live R2 read, or application listener was executed.

## `test(driver-cloudflare): verify local R2 application delivery`

The manifest-skip defect was identified and corrected. The historical owner-selected candidate has
both manual rendering observation and separate all-file HTTP proof below; later private-target
verification records the owner's privacy evidence. This item landed as recorded in the opening
arc. None of those receipts transfers to a later candidate, current bucket, or hosted lifecycle.

### Authorized six-file bootstrap-inclusive HTTP proof

After the actual six-file candidate and ceilings were explained, the owner instructed this exact
item → `GO`. Preflight found an existing Deno listener on 8080; no proof or R2 request ran then.
The owner reported it cleared, and a second listener probe found port 8080 free. No process was
killed by the agent, and no alternate port was used.

Source: `73c59650d2f604094eb6c047f558ca7887327a18`, with a clean sample worktree before and after.
Runtime: Deno 2.9.6, V8 15.0.245.2-rusty, TypeScript 6.0.3, aarch64-apple-darwin.
Captured inputs: sample-root `dist.pin.json` and `r2.config.json`.
Target: account `1e6ec0395407e49eef7ee54f667d61de`, bucket `sys-test`, prefix
`tmp.sys.tools/r2-ui-proof`. Retained manifest pin:
`sha256-3f2e2ec7cdf84a16b76aba70940e07f0804180de0f7610e51744f4da91373811`.

Ran once from `code/sys.driver/driver-cloudflare/-sample/deploy`:

```sh
deno task proof:local
```

The run selected six files after complete local pinned verification and bounded byte capture,
announcing ceilings of 18 application requests and 14 storage reads before bootstrap. The storage
ceiling includes startup manifest acquisition; it is not a separately instrumented live GET count.
Existing limits remained: 65,536 bootstrap-manifest bytes, 1MiB per asset response, five-second
storage deadline and eight-second proof-client deadline, no retries or permission expansion.

Result: **verified**, **18 application requests**, **one bootstrap attempt**, **six exact byte and
SHA-256 matches**:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist.json` | 1360 | `3f2e2ec7cdf84a16b76aba70940e07f0804180de0f7610e51744f4da91373811` |
| `index.html` | 423 | `4e83791f41cf3fdd9ebdbe0facf12d59f5f5907915e33f0161170ac5d1026c40` |
| `pkg/-entry.DZ3LNzzI.js` | 483807 | `b35b6baca2e1e9072dce0bfab9d2228076c00a0ae47efadc5cd2e4245f338527` |
| `pkg/-pkg.json` | 49 | `7fac3ccbff2a361f0a5521134511997ed0716160b63dbb9f4a19e9ca54aff465` |
| `pkg/a.IjgKAlT6.css` | 288 | `ca541042f5e4a6ff04d927da01cbfb3ccd1fc4c471a7a1893dd51c6fd27cf633` |
| `pkg/m.C4vdwh18.js` | 341 | `d78e778a6ba7f85b671712a924fabc8d7f34724f9efbea6342ea71fcfdee6b96` |

Selected bytes total: 486,268. GET/HEAD, MIME, content lengths, absent content encoding,
no-store/nosniff, index alias, both redirects, and the unselected-path 404 passed. The API returned
`👋 hello world!`; its HEAD check and final local pinned verification passed. The owned listener
closed, and a subsequent listener probe found nothing on 8080. No rebuild, repin, upload, pruning,
provider change, or additional live attempt occurred. The historical storage prefix was untouched.

The receipt explicitly reports `browser: not exercised` and `bucketPrivacy: not attested`.
This is evidence of current HTTP delivery only, not browser execution, provider privacy, or hosted
exposure. The authorization above covered this one HTTP run; browser reads need their own bounded
execution scope, and bucket privacy requires owner/provider evidence.

### Owner-published replacement candidate: browser observation and HTTP proof

The owner supplied the build → push → serve terminal sequence and a browser screenshot for a new
six-file candidate. The build reported manifest pin
`sha256-4301a43c82c53788da07677e68db086a16bece153162b3a58e10e9a2fbebbf8d`;
the owner-run push reported **4 written, 2 skipped, 2 removed**. These are owner-reported operations,
not agent-run publication or independently counted writes. Local pin and manifest inspection matched
the report. No earlier candidate's proof was reused for this replacement.

The owner then stopped `serve` and explicitly instructed the bounded proof to proceed and record
its evidence. Preflight confirmed port 8080 free. Ran once:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare/-sample/deploy && deno task proof:local
```

Source baseline: `73c59650d2f604094eb6c047f558ca7887327a18`. The only tracked sample delta before and
after was the owner-selected `dist.pin.json`; the agent did not edit it. Runtime: Deno 2.9.6,
V8 15.0.245.2-rusty, TypeScript 6.0.3, aarch64-apple-darwin. Build metadata identifies
`@sample/r2@0.0.1`, builder `@sys/driver-vite@0.0.477`, and build time `1789713888236`.
Captured `r2.config.json` targeted account `1e6ec0395407e49eef7ee54f667d61de`, bucket `sys-test`,
prefix `tmp.sys.tools/r2-ui-proof`, using the existing credential reader and permission preset.

The complete local pinned verification, bounded expectation capture, and final local recheck
passed. Pin, target, six selected files, and ceilings were announced before remote acquisition.
Result: **verified**, **18 application requests**, **one bootstrap attempt**. The **14 storage
reads** value is the bootstrap-inclusive ceiling, not a separately measured live transport count.
Limits remained 65,536 bootstrap-manifest bytes, 1MiB per asset response, five-second storage and
eight-second proof-client deadlines, with no retries, redirects to storage, or permission expansion.

All six served files matched retained local bytes and expected SHA-256 values:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist.json` | 1360 | `4301a43c82c53788da07677e68db086a16bece153162b3a58e10e9a2fbebbf8d` |
| `index.html` | 423 | `8be8767770dbe4ee0ee7b8468d95e3a58698305e8044155855e5cf1d5a60e8a7` |
| `pkg/-entry.C8r9TevT.js` | 484082 | `11972bac737081bc31fe27a5fe8aa6e9289cdfbe594d07c11fbd233a56be402b` |
| `pkg/-pkg.json` | 49 | `7fac3ccbff2a361f0a5521134511997ed0716160b63dbb9f4a19e9ca54aff465` |
| `pkg/a.IjgKAlT6.css` | 288 | `ca541042f5e4a6ff04d927da01cbfb3ccd1fc4c471a7a1893dd51c6fd27cf633` |
| `pkg/m.ChjSroQS.js` | 341 | `74eca2d582a4d6c1abcce3edd78add28122da3a5ef3a864bfb4d14633a800a63` |

Selected bytes total: **486,543**. GET/HEAD metadata, MIME, length, absent content encoding,
no-store/nosniff, `/ui/` index delivery, both 308 redirects, unselected-path 404, and API GET/HEAD
checks passed. The API returned `👋 hello world!`. The owned listener closed, and a subsequent
listener probe found nothing on 8080. The agent performed no build, upload, pruning, repin, retry,
provider change, or additional live attempt. The historical storage prefix was not targeted.

#### Manual browser observation

The owner observed `/ui/` rendering `👋 hello world!` and `sha256-52311f22…4ba03965` after the
reported build/push/serve sequence. This is manual rendering evidence, not an automated browser
trace or exact-byte proof. The separate HTTP run provides byte comparisons; its own receipt
correctly reports `browser: not exercised` and `bucketPrivacy: not attested`.

### Private-target verification

After the owner disabled `r2.dev`, confirmed no custom domains, and reported a fresh push, the agent
ran `deno task proof:local` once from the sample directory against
`sys-test/tmp.sys.driver-cloudflare/r2-proof-ui`. The selected pin and all six file hashes/lengths
matched the replacement-candidate table above: **486,543 bytes**, **18 application requests**, one
bootstrap attempt, and a **14-storage-read ceiling** (not an independently measured transport count).
All byte/SHA-256, GET/HEAD, MIME, length/encoding, cache/header, redirect, missing-path, API, and final
local verification checks passed. Port 8080 was free before and after; no retry, rebuild, upload,
provider change, or permission expansion was performed by the agent.

Code baseline remained `73c59650d` with the selected pin and prefix/README worktree changes;
runtime remained Deno 2.9.6 / TypeScript 6.0.3. Privacy evidence is the owner's provider Settings and
Objects observations, not an inference from signed reads or an agent control-plane inspection.
The HTTP task still reports `browser: not exercised` and `bucketPrivacy: not attested` for its own
scope. The earlier manual browser observation concerns the same unchanged build, before the prefix
and privacy changes; no new browser session is claimed.

### Operating constraints

Do not repeat an upload automatically or rewrite the resolved historical local-read gate. Confirm
the selected candidate and authority for the actual bootstrap-inclusive request/byte budget before
a new probe. If another live attempt fails, retain the refusal rather than repairing or repinning.

Run the same Deno application locally against the approved private R2 objects for the retained
Vite build, not a storage mock, filesystem asset fallback, or separately written probe server.
Open `/ui/`, observe the built UI requesting `/api/hello`, and verify the rendered
`👋 hello world!` reply for the current source. Bind the expected greeting to the selected source
identity rather than treating an older screenshot as proof of a later revision. Compare the
complete manifest and every admitted build file served beneath `/ui/` with independently retained
local bytes, lengths, and hashes. Observe GET/HEAD, MIME,
encoding/length projection, cache policy, and the selected missing-key case within the budget.
Internal signed reads establish provider acceptance for those requests; they do not prove expiry
or browser-delegated downloads. Never print signed storage URLs.

The completed storage sample has `index.html`, `hello.txt`, and `dist.json`, not this Vite bundle.
Its earlier upload/readback remains storage evidence only. The selected build must have separately
authorized upload and retained expectations before this proof. Do not substitute the old HTML/text
sample, rebuild the selected candidate, or acquire expected hashes from R2. Denial/path/error
matrices remain deterministic tests, not permission to fuzz or stress the live bucket.

Record exact app/runtime/artifact identity, invocation, permitted operations, counts, byte
comparisons, browser/API observations, and failures. Listener cleanup must settle without stopping
unrelated processes. No upload, deletion, public exposure, or automatic repair belongs to this
read-only proof. Its success establishes local app-to-provider and browser composition for the
selected build, not hosted runtime, public DNS/TLS, or Cloudflare edge behavior.

## GATE owner authorizes the first R2-backed app hostname and bounded deployment/exposure operations

Resolver: Phil, as owner of the hostname, Cloudflare resources, Deno application, and served data.
This is a finite authorization decision for the remote rollout and observations required by
`test(driver-cloudflare): verify hosted R2 application delivery`, not a review/test completion gate.
The local preparation items do not require it; any live operation does. The old local-read grant
above is consumed historical authority, not permission for this run.

Selected planning facts: `db.team` is canonical; `cdn.db.team` is the public asset hostname;
Cloudflare is public ingress, current Deno Deploy is compute, and R2 is storage. Production mail
(ImprovMX inbound, Resend outbound, DMARC policy/reporting) is immutable. The handoff reports
`donna.ns.cloudflare.com` and `ruben.ns.cloudflare.com`; no live DNS verification is claimed.

Before checking this gate, record Phil's explicit decision and the approved scope:

- Exact Deno organization/app, native production hostname, intended final public base,
  buckets/prefixes, and ownership of each resource. Bind the first authorized phase to its retained
  source/staged candidate and both full pins. Any later base-change candidate needs its own exact
  selection and budget confirmation before remote work, not automatic approval from this checkbox.
  Confirm whether development buckets may be reused and that the CDN zone and public bucket share
  a Cloudflare account.
- Each permitted deployment, R2 publication/replacement/pruning, domain binding, DNS/proxy/TLS,
  public-access, cache/security, and secret-configuration action, or verification-only against
  owner-configured state. No unlisted action follows from a diagram or a checked gate.
- Serving credential names, scope, and runtime contexts. Recommend a distinct Object Read-only
  credential for the private bucket in Deno secrets; the shared write-capable local sample default
  remains unchanged. Phil decides the hosted role and records any retained write authority honestly.
  Build/publishing secrets must not enter browser assets or the uploaded runtime artifact. Do not
  read or paste secret values into evidence. Provision only required Production/Development
  contexts; provider preview warmup may need runtime secrets independently of the Build context.
- One frozen candidate per proof phase; finite request, decoded-byte, time, and retry bounds,
  including bootstrap, native/production/preview warmup where observable, and browser asset loads.
  Provider-managed starts cannot be claimed bounded by the local proof counter. No load/attack test.
- Hosting plan, operational controls, resource owner, and accepted residual aggregate traffic/cost.
  Local concurrency limits, Free WAF, and a CDN are not deployment-wide spending caps.
- Retention and failure response: no concurrent publisher; keep selected local/staged artifacts and
  remote objects through proof. Existing push may prune and leave partial writes. Stop on mismatch
  or failure, record residue, and obtain authority before retry/repair/cleanup. No rollback claim.

A rejected or incomplete decision leaves the gate unchecked and blocks live rollout, not offline
fixture work. Manual console setup is acceptable; record exact provider-generated records and
redacted configuration evidence. Do not build a control plane merely to automate the checklist.
Before execution, recheck provider mechanics and the exact operation authority. This plan update
neither resolves the gate nor grants Git mutation, resource creation, or a live request budget.

## `test(driver-cloudflare): verify hosted R2 application delivery`

Execute the prepared application, not a replacement probe server. Publish and deploy only the
candidate selected after preparation; no historical local build is implicitly reused. This item owns
bounded live verification and its durable receipt, not hidden implementation of entry/configuration
or packaging changes. If a source defect is exposed, stop and scope its correction separately.

### Rollout order

1. Prove the native Deno production hostname before assigning `db.team`. Record the organization,
   app, revision, runtime version/configuration, both pins, targets, and secret contexts without
   values. Verify startup admission, `/`, `/ui`, `/ui/`, `/ui/dist.json`, and `/api/hello` using
   the same composition as local. A preview URL alone is not the native production acceptance.
   The development `r2.dev` base may be used for this bounded compatibility milestone only; record
   that candidate separately and make no production-CDN claim.
2. Bind the confirmed public bucket to `cdn.db.team` through R2's custom-domain surface, not a CNAME
   to `r2.dev`. Binding exposes the bucket, not just the configured prefix: establish that its whole
   contents are intentionally public before approval. Keep the private bucket's development URL
   and custom domains disabled. Verify the CDN certificate, final key mapping, CORS, MIME, and
   eligible cache behavior. Once the custom-domain candidate is working and known consumers are
   accounted for, disable that public bucket's `r2.dev` URL under the approved migration scope so
   it is not an alternate unprotected delivery path.
3. Set the confirmed CDN asset base before a new stage/build, publish public then private projections,
   and deploy the same new candidate. Reprove it on the native Deno hostname. No old pin or
   local receipt transfers across the base change. Explicitly end the development-candidate proof
   and agree its retirement/maintenance or retention before replacing shared prefixes; do not claim
   uninterrupted operation of that earlier app. If the final CDN base was already selected for step
   1, reuse that unchanged proven candidate instead of manufacturing another rebuild.
4. Add/assign only `db.team` in Deno. Use exactly its ownership, routing, and certificate records.
   Choose a supported apex method that coexists with existing mail; never replace MX/TXT/mail
   records to fit an ordinary apex CNAME. Keep ACME verification DNS-only, obtain a valid Deno
   certificate first, then proxy only application routing through Cloudflare with Full (strict).
   No Flexible mode or plaintext origin leg. Leave ongoing ACME/renewal records intact.
5. Verify the restrained Cloudflare baseline and final mixed-delivery journey below. Preserve the
   native hostname as evidence, but document that requests directly to it do not pass through this
   Cloudflare zone. No exclusive perimeter or universal origin-lockdown claim is made.

### Security and cache contract

- Confirm DDoS protection, Free Managed WAF Ruleset, Browser Integrity Check, and Universal SSL
  for the selected surfaces; provider documentation is not proof of account settings. Exercise
  legitimate API/machine requests as well as browser loads for false-positive compatibility.
- Bot Fight Mode remains off for the initial mixed API/browser proof unless Phil explicitly selects
  a browser-only policy after compatibility evidence. The Free mode cannot be skipped per API path
  with WAF custom rules. No blanket bot challenge, invented allowlist, or extra proxy layer.
- Reserve the Free rate-limit rule for an actual named abuse-sensitive endpoint. No arbitrary limit
  on the hello endpoint. Turnstile requires a real interaction boundary, absent in this read-only
  sample. Do not add either merely to fill a security checklist.
- Preserve `no-store` for the application/private relay, API, redirects, and refusals. No Cache
  Everything or edge-TTL override on `db.team` may turn those responses into shared cached content.
  Private bucket storage does not by itself establish private response caching or caller auth.
- On `cdn.db.team`, cache deliberately public assets only. Long-lived `immutable` policy requires
  non-overwritten versioned/content-addressed keys and retention covering their promised lifetime.
  Stable names such as `dist.json` and `pkg/-pkg.json` are not immutable merely because other files
  are hashed. Record actual cache metadata/rules; ordinary publishing has not been shown to set the
  desired production cache policy. Do not add blanket caching to conceal missing metadata.
- CORS must admit the actual credential-free module/font requests from `db.team` and the native
  proof origin. An intentionally public wildcard policy is valid if selected; never combine it
  with credentialed access or confuse it with authorization. Keep browser credentials and signed
  R2 URLs out of public requests and responses.
- Preserve selected executable/document bytes through the edge. Compression may change wire
  representation; compare decoded bytes and metadata correctly. Unexpected rewriting/injection
  fails byte proof; record it and resolve the precise provider configuration without weakening an
  existing security check or silently accepting a new artifact.

### Release retention and stopping point

First acceptance is one frozen hosted sample, not routine production-release safety. Both current
private shell keys and public manifests/metadata are mutable; startup pin admission does not freeze
later private reads. Republishing into the same prefixes can mix old running instances with new
HTML/manifest bytes, and pruning public assets can break old browser sessions. Hashed JS alone
solves neither problem. Keep both targets unchanged during the proof and retained operation.

Before a subsequent release, Phil selects the required retention/rollback or maintenance-window
behavior. Prefer a simple owned versioned namespace when actual retained-client/rollback needs
require it; do not invent its name now or revive a generation/CAS/GC framework. Retain the matching
application, configuration, pins, private shell, and public assets together. Deno rollback alone
cannot recover overwritten/deleted R2 objects. No second release is implicitly authorized here.
Credential closeout stays owned by the public-delivery plan; first hosting does not mark it complete.

### Acceptance evidence

- Native and final custom-domain observations identify the exact app/revision, actual runtime, two
  manifest pins, full public asset base, buckets/prefixes, and owner-confirmed exposure. An HTTPS
  response or digest display alone does not establish that mapping.
- At `db.team`, GET/HEAD the admitted private HTML/manifest against independently retained bytes,
  hashes, and lengths; verify MIME, decoded/wire length distinction, no-store/nosniff, API response,
  redirects, method refusal, and an unadmitted path. No signed URLs or credentials may escape.
- At `cdn.db.team`, compare both the public manifest and every selected public payload with its
  retained projection, then verify the real cold-browser resource graph: entry, imports/preloads,
  CSS, fonts/images actually exercised. Record CORS/MIME, compression and cache headers, and a
  bounded repeat for eligible cache behavior. A cache hit is not byte identity; a miss is not by
  itself failure. Public data bypasses Deno, rather than taking a hidden proxy/redirect fallback.
- Use an empty browser cache and no controlling service worker. Render the UI/API greeting and
  private manifest status. Browser-block the public entry to confirm a readable static notice and
  no Deno fallback; do not break live objects for a negative test. Human-run browser evidence is
  acceptable when attributed. The driver preview verifier is not a browser execution substitute.
- Verify DNS NS/MX and the web-specific records against retained pre-change owner evidence. Preserve
  ImprovMX/Resend/DMARC records exactly. Verify Deno TLS issuance and Cloudflare Full (strict), not
  merely the public edge certificate. Keep exact DNS values in the operation receipt, never guesses.
- Stay within the approved per-phase request/byte/time/retry budget; report observed counts separately
  from ceilings, provider-managed starts, and unavailable checks. Stop on the first failed invariant;
  no automatic repin, upload retry, exposure expansion, cleanup, or fault-hiding fallback.

The result is this sample's observed end-to-end hosted delivery, not a Pi/product release, spending
cap, authentication system, perpetual availability, atomic publication, or service-worker proof.

## Non-goals and stop conditions

No public binding for the private bucket, transparent proxy application, Cloudflare Worker, new
uploader, owned SDK/signer, single-use token system, conditional settlement, CAS/receipt protocol,
generic cloud ontology, universal security audit, or blanket verify/plan/apply framework. Public
R2 through `cdn.db.team` is intentional and confined to the selected public bucket. No sign-in proof,
independent-download sample, client-side router, SPA fallback, forced worker showcase, new browser
control framework, or mail configuration change belongs to this composition.

Do not exclude future Workers hosting by coupling the route contract to Deno entry or environment
APIs. Conversely, do not add an adapter registry, multiple implementations, or Workers proof before
there is a concrete need. Runtime-specific capabilities belong at adapters.

Stop and refine the concrete item if its owner or contract cannot be named, transport bounds cannot
be enforced honestly, the selected caller policy needs an unspecified identity system, or execution
requires weakening an existing check. Additional middleware or automation must solve an observed
requirement, not expand the security posture for its own sake.

## External evidence and unresolved provider details

Public official documents fetched during the 2026-09-25 planning session, not live account proof:

- [Deno domains](https://docs.deno.com/deploy/reference/domains/): native organization/app domains,
  exact provider-generated ownership/routing records, automatic TLS, and DNS-only ACME CNAME when
  Cloudflare is the DNS provider. Do not guess this app's records or introduce `www`.
- [Deno builds](https://docs.deno.com/deploy/reference/builds/): current app-directory/runtime
  configuration, source configuration precedence, `deploy.runtime`, and preview warmup.
- [Deno environments](https://docs.deno.com/deploy/reference/env_vars_and_contexts/): separate
  Build, Production, and Development contexts; secrets are runtime-accessible values, not a reason
  to package `.env`.
- [Deno runtime](https://docs.deno.com/deploy/reference/runtime/): isolated instances and fixed
  runtime flags; custom `--unstable-*` flags are unavailable. The page's reported runtime version
  is not an observation of the eventual app; record actual hosted compatibility independently.
- [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/): custom-domain
  security/cache integration, same-account zone requirement, whole-bucket exposure, independently
  enabled `r2.dev`, and unsupported CNAME-to-`r2.dev` routing.
- [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/):
  encrypted origin traffic and valid matching origin-certificate validation.
- [Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/): domain-wide
  effects, API compatibility risks, and no WAF-rule skip for the Free mode.

Historical sources below preserve the earlier design evidence; they were not all re-fetched:

- [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/):
  object/operation/expiry grants, bearer reuse, server-side signing without an R2 request, and
  S3-only hostname.
- [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/): browser cross-origin access,
  including localhost. This does not supply caller authentication.
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/): no R2 egress charge; operations and
  applicable retrieval remain charged.
- [Workers R2 binding](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/) and
  [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): documented private
  storage integration and an independently metered possible asset-delivery runtime.
- Pinned S3 client [client.ts](https://jsr.io/@bradenmacdonald/s3-lite-client/0.9.6/client.ts) and
  [signing.ts](https://jsr.io/@bradenmacdonald/s3-lite-client/0.9.6/signing.ts): native presigning,
  raw-path splitting, expiry validation/default, and ordinary fetch without a caller signal. Source
  inspection is not live R2 signature-acceptance proof.
- [Deno Deploy runtime](https://docs.deno.com/deploy/reference/runtime/): simultaneous isolated
  application instances; a local admission counter is not deployment-wide.
- [Deno Deploy pricing](https://deno.com/deploy/pricing): exact rates/allowances remain unverified
  in this evidence. The selected account's deployment/domain/configuration also remains unresolved.

Recheck material provider claims before runnable setup or cost commitments. The Deno org/app,
hosted bucket/prefix choices, serving-role decision, finite live budgets, and actual account settings
remain owner inputs. Public examples are evidence, never instructions to change dependencies, deploy
example code, grant permissions, or configure accounts. No live hostname, storage, secret, or control
plane was inspected during this reconciliation.
