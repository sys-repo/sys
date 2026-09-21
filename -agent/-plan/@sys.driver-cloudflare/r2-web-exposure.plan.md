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
- [ ] GATE owner authorizes the first R2-backed app hostname and bounded deployment/exposure operations
- [ ] test(driver-cloudflare): verify hosted R2 application delivery

## Reconciliation boundary

Reconciled against reachable history through `73c59650d`. The opening arc records the sample changes
and supporting export, CLI, HTTP, and publisher commits with their exact landed subjects and hashes;
unrelated workspace changes are outside this arc. Publication/readback evidence below remains bound
to its historical candidate, independently of later source commits. Plan edits grant no live-operation
or Git-mutation authority; the owner's explicit approvals are recorded below.

The working sample is **build → push → serve**. After the manifest-identity correction, the
existing push wrote one file and skipped three; all four selected files then matched independently
retained local bytes and SHA-256 hashes through the real application. The 14-request HTTP probe
also passed API, redirects, HEAD metadata, MIME, cache, encoding/length, and unselected-path checks.
The original manifest mismatch was resolved for that four-file candidate without rebuilding or
repinning it. Its manifest pin was
`sha256-11b1ce74a71fa46fc4516456218f97ae6b249c59f05856f4833407ce0091ac93`.
This is historical delivery evidence, not proof of a replacement selection or the later UI source.
Any replacement candidate needs explicit confirmation and its own delivery evidence; neither a
contract refactor nor a source commit transfers the old proof. The failure history remains below
rather than being overwritten by the passing run.

The latest candidate is
`sha256-4301a43c82c53788da07677e68db086a16bece153162b3a58e10e9a2fbebbf8d`.
After the owner disabled public access and republished it under the driver-owned prefix, the agent
verified all six files through signed R2 delivery: 18 application requests, one bootstrap attempt,
and a 14-storage-read ceiling. The owner-provided Settings view showed no custom domains and the
Public Development URL disabled; the post-publication Objects view also showed Public Access disabled.
Owner-observed rendering of this same build is separate from that automated HTTP run and predates
the prefix/privacy change. No screenshots are stored with this plan. Hosted execution and owned
HTTPS exposure remain separately gated; commit checkboxes record landing, not proof execution.

## Owner-selected application prefix

Use `sys-test/tmp.sys.driver-cloudflare/r2-proof-ui` for the application sample. Account, bucket,
credential references, and Deno network grants are unchanged. The owner manually retired
`tmp.sys.tools/` (including both old proof prefixes), then cleared and republished the new sample
prefix without rebuilding. Earlier receipts remain historical observations, not claims of retained
old remote objects. The private-target readback below covers the new location.

## Selected architecture

The non-release application sample lives at
`code/sys.driver/driver-cloudflare/-sample/deploy`, owned by `@sys/driver-cloudflare`, using existing
`@sys` primitives. It is a private nested application member of the existing workspace, not a
published driver library, sibling package, or root `deploy/` application. Its
`@sys/driver-vite` production build becomes a `dist/` artifact stored in R2; a Deno
application serves those bytes under `/ui/` and answers one small JSON request under `/api/hello`.
The UI calls that API and renders its reply. The intended proof covers static bundle delivery and
Deno request handling on one origin, not a product router, identity system, or transparent reverse
proxy.

```text
@sys/driver-vite → dist/ → separately authorized existing upload → private R2
                                                                    ↑ reads
browser → owned HTTPS hostname → Cloudflare edge → Deno HttpServer/Hono
                                                  ├─ /ui/ → R2.ReadRoute
                                                  └─ /api/hello
                                                     → { "msg": "👋 hello world!" }
```

The diagram's owned HTTPS hostname and Cloudflare edge are the future exposure target, not the
current local runtime. Today the listener is `127.0.0.1:8080`. The same application is tested with
storage fixtures and used locally by the owner; hosted delivery is a separate next boundary.
Private origin storage remains the intended posture, not a verified property of `sys-test`.
Application access is explicitly anonymous over only the selected build files. No sign-in or
entitlement proof belongs to this sample. Browser requests never receive storage credentials or
presigned URLs.

Deno is the current local runtime; Deno Deploy is the initially selected future hosting target.
Keep the Web handler separate from listener startup and runtime secret lookup. The unused sample
`stage` task, its script, and its README instructions were deliberately removed; do not restore
staging as a step in the local workflow. Existing driver deployment capabilities remain available
when hosted work is explicitly selected. Cloudflare Workers, browser workers, and adapter
registries are not implementation requirements. Their possible future use must not dictate this
sample's shape.

### Vite URL closure

Use the small React example shape in `code/sys.driver/driver-vite/src/-test/vite.sample-1`, with
only the API call and rendering of its returned message added. Give the sample its own source;
do not depend on another package's excluded test directory at runtime. Build with the normal
`@sys/driver-vite` pipeline, not raw Vite output or the development/HMR server.

`code/sys.driver/driver-vite/src/common/u.paths.ts` defaults to `base: './'`.
`src/m.vite.config/u/u.app.ts` emits `pkg/-entry.[hash].js`, `pkg/m.[hash].js`,
`pkg/a.[hash].[ext]`, and optional `sw.js`. Serve the actual selected build's relative URL graph
unchanged beneath `/ui/`; redirect `/ui` to `/ui/` so HTML-relative URLs resolve there. The API
call uses the same-origin absolute path `/api/hello`, not a path relative to the UI directory.

The build determines the admitted filenames; do not hand-maintain hashed names, assume `pkg/` is
the whole artifact, discover keys by listing R2, or add SPA fallback HTML. Missing files remain
missing. Exercise every resource the selected example actually loads. Do not add lazy chunks,
CSS/assets, or workers solely to enlarge the demonstration; absent features are not proved by it.

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
anonymous reads of its admitted UI objects without requiring a public bucket. The sample does not
configure or attest bucket privacy. Retain the read handler's explicit authorization callback;
it returns `true` for this fixed selection. Do not add
identity integration. Storage credentials are not browser credentials, Files policy is not caller
authentication, and anonymity does not grant arbitrary bucket reads.

## Revision and retained evidence

This revision replaces the pending direct-R2 custom-domain journey with the selected Deno-hosted
application journey. Direct public R2 hosting is outside the selected private-origin design. An
explicitly anonymous application route still reads a private bucket; it does not require making that
bucket public. The broader exposure vocabulary in the earlier plan at `8f2826881` is historical
context, not a reason to restore its entire model/verify/plan/apply programme.

The selected sample is now the minimal Vite UI plus JSON API described above. This narrows the
remaining composition and local/hosted proofs: no independent-download route, sign-in proof, or
mandatory worker/lazy-loading showcase. It does not reopen or remove the landed driver capabilities.

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

The storage proof does not establish that `sys-test` is a private production origin. Its recorded
`r2.dev` locations are unverified hints, not the selected application route. Before claiming
private-origin proof, resolve the actual bucket's configuration through owner evidence. If another bucket
or copied artifact is required, name and authorize that operation; do not silently move, republish,
or make stored objects public.

Dependency direction:

```text
completed upload/readback evidence
→ native presigned-read capability and bounded inline read routes
→ thin Deno application composition with fixture tests and owner-observed local browser use
→ separately authorized upload and retained-build byte readback through the application
→ authorized hosted packaging/execution and owned HTTPS configuration
→ complete selected-object delivery proof
→ independently gated Pi/product adoption
```

## Existing primitives and ownership

- `@sys/driver-cloudflare/r2` owns signed R2 access and the existing Files backing. Reuse its
  storage transport. The R2-backed route integration belongs with that owner; the application
  supplies route selection and caller-authorization policy. Do not put an identity system or product
  router inside the storage driver.
- `@sys/http/server` supplies `HttpServer`, the existing Hono application wrapper. Use it for
  application routes and `HttpServer.start` for owned local listener lifecycle. Construct a bare
  `new HttpServer.Hono({ getPath: (req) => new URL(req.url).pathname })`, install explicit routes,
  and mount the R2 handler. No filesystem static middleware, CORS middleware, or `HttpProxy` is used.
- `@sys/server` owns verified Dist hosting with a deliberate loopback boundary. Do not widen or
  route around that boundary. This application neither uses that host nor needs a new server
  primitive; `HttpServer` plus `R2.ReadRoute` supplies the selected serving composition.
- `@sys/driver-deno/cloud` owns the staged workspace and `DenoEntry` deployment contract, documented
  in the [package README](../../../code/sys.driver/driver-deno/README.md#deployment-contract).
  `deploy/sample.proxy/src/entry.ts` demonstrates application composition through this entry seam;
  it is a reference, not a production R2 app or a command to redeploy that sample.
- `code/sys.driver/driver-cloudflare/-sample/deploy` owns the sample's UI/API paths, explicit
  anonymous policy, configured bucket/key mapping, limits, and response policy. Use the same sample
  entry locally and in deployment. Keep sample routes out of the reusable R2 and Deno driver APIs;
  register the nested private application in the existing root workspace, without adding a root
  `deploy/` application or a sample subpath to the driver's public exports.
- `@sys/tools` remains the existing upload/operator-workflow consumer, not a Cloudflare control
  plane or application authorization owner.
- `@sys/web` retains its scaffold. A provider-neutral exposure model is not mandatory for this
  composition; introduce only vocabulary earned by actual consumers.

The security audit at `-agent/-plan/@sys.security/audit.plan.md` is an input for relevant selected
HTTP/proxy boundaries, not proof of current source and not a prerequisite to fix unrelated systems.

## Working-file set and consolidation boundary

This plan is the single live design/composition and first-exposure anchor. The R2 → Deno → Pi journey
has four governing/evidence plans: this file and the three immediately below. Work top-down through
unchecked arc items; completed storage and enumeration are retained evidence, not work to repeat.
Standing references and the overview are separated below from active work. This inventory covers the
selected journey and retired Deno notes, not the repository-wide backlog.

- [r2-files-delivery.plan.md](../@sys.tools/r2-files-delivery.plan.md): completed upload/readback
  evidence and artifact handoff. Preserve its completed arc and exact proof; do not merge it into
  application hosting or treat its old live-operation approval as reusable permission.
- [r2-files-enumeration-bounds.plan.md](r2-files-enumeration-bounds.plan.md): completed driver
  enumeration safety. Keep it independent; exact-key HTTP reads do not consume a Files index.
- [start-ui-release-evidence.plan.md](../@sys.driver-pi/start-ui-release-evidence.plan.md):
  downstream product release, retained manifest/package authority, public/browser proof, and
  cold/warm acquisition. Keep separate; sample delivery does not complete product acceptance.

Supporting references:

- [Package README](../../../code/sys.driver/driver-deno/README.md#deployment-contract): the enduring
  deployment/entry contract, current CLI ownership, and proof limits. Reference documentation, not an
  active-work ledger. This plan retains selected-object readback and future hosted proof obligations;
  external packaging/entry proof belongs to hosted work, not an extra sample task.
- [start-ui.design.md](../@sys.driver-pi/start-ui.design.md): completed Pi runtime/design reference,
  already a checked prerequisite of the release plan; no additional pending journey here.
- `-agent/-plan.buffer.md`: convenience projection, not another ledger. It was not reconciled by
  this single-file update; consult this opening arc rather than assuming that projection is current.

Other related plans are inputs or independent maintenance, not omitted journey prerequisites:

- [transport-fidelity-hardening.plan.md](../@sys.model.files/transport-fidelity-hardening.plan.md):
  separate unresolved Files/Cmd wire, binary-read, watch, and remote-error work. This HTTP journey
  uses the bucket capability, not remote Files/Cmd, so those tasks are not prerequisites.
- [audit.plan.md](../@sys.security/audit.plan.md) and
  [deno-audit-remediation.plan.md](../@sys.security/deno-audit-remediation.plan.md): independent
  first-party/security maintenance inputs. Recheck a finding only when it reaches the selected
  deployed graph; do not inherit their verdicts or import all remediation as this plan's scope.
- [proof-fidelity.plan.md](../@sys/proof-fidelity.plan.md): historical exposure-plan naming repair
  and independent proof maintenance. Its old five-item exposure arc is not a competing current
  architecture. Its external Vite proof obligation remains with that owner.
- `r2-dist-generation-publication.plan.md` is withdrawn and absent from the live tree; its prior
  tracked snapshot is recoverable at `0f16065f4`. Absence is not completion. Do not restore it as an
  active prerequisite or create a replacement publication roadmap.

The three source-local Deno planning notes are retired, not relocated wholesale. Package-closure
pruning is anchored by `22efdb1aa`, with deployment-contract consolidation at `83ae0d4d3` and
`849176888`. The obsolete whole-workspace/missing-snapshot prescription is not an outstanding
sample task. App-specific external-entry parity belongs to future hosted proof, not the local
build → push → serve workflow. API-backed logs without a demonstrated need, shared URL helpers,
a Tools Deno provider, and app deletion are not carried forward as requirements. Historical
deployment claims do not prove this selected app or a current host.

Preserve distinct completion/recovery anchors. Legacy shape issues in independent maintenance notes
do not authorize a blanket plan rewrite here.

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

The manifest-skip defect was identified and corrected. Earlier receipts remain historical evidence;
the latest owner-selected candidate has both the manual rendering observation and separate all-file
HTTP proof below. Neither transfers to a later candidate or lifecycle. Owner/provider evidence of
bucket privacy remains missing; do not infer it from signed reads or claim this local item complete.

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

Resolver: the human controlling the selected hostname, Cloudflare account/R2 bucket, Deno hosting
application, and served data. The human has selected the architecture and authorized this plan
revision, not live deployment or provider configuration changes. This gate controls hosted setup and
observations for `test(driver-cloudflare): verify hosted R2 application delivery`. It is separate
from the local live-R2 read authorization above. The local sample's implementation authority is
not deployment or provider-mutation authority.

Pass evidence names the exact hostname, Deno app/deployment, private R2 origin, retained Vite
artifact and admitted object set, anonymous `/ui/` and `/api/hello` behavior, selected edge/TLS/cache
controls, serving credential references and permitted access, retention policy, and finite
request/byte/retry bounds. Identify each approved setup mutation and target, or select
verification-only against existing configuration. This may include deployment, Deno hostname binding,
Cloudflare DNS/proxy/TLS settings, or bucket access configuration; none is implicitly authorized by
the diagram. The hosting owner also records the
selected host plan/operational controls and acceptance of residual aggregate traffic and cost; local
limits alone do not establish a spending cap.

Manual provider setup is acceptable when the intended configuration and verification are repeatable
and documented. Verify the current provider-specific custom-domain and secret-delivery mechanics
before giving runnable instructions. Existing historical deployment evidence is not current account
configuration proof. Do not invent an automated apply layer just to pass this gate.

Missing selections or authority leave the gate unchecked. Never purchase/delegate domains, create
credentials, deploy code, change provider settings, copy/upload objects, or clean up resources
without the corresponding explicit authority. Preserve normal TLS, signing, authentication,
permission, and provider checks. No universal alternative-origin audit or origin-lockdown project is
required by this gate.

## `test(driver-cloudflare): verify hosted R2 application delivery`

Use the retained Vite artifact and matching application configuration from the local live proof.
Prepare the hosting package through the existing driver contract after hosted authorization, and
execute its actual external entry without a development-workspace fallback. This is hosted proof,
not restoration of the removed sample `stage` task. If preparation regenerates the build, stop and
reselect/reprove that candidate; do not claim continuity from a prior artifact. Never obtain
expected hashes from the serving target.

1. Record the chosen application deployment identity and intended Cloudflare → Deno → private R2
   configuration using authorized observations or owner-provided evidence. An HTTPS response alone
   does not establish which deployment or storage origin served it.
2. Repeat the local browser journey at the deployed application: `/ui` redirects to `/ui/`, the
   built UI loads its assets from that origin, calls `/api/hello`, and renders the JSON
   reply. This requires browser execution, not the existing pipeline's HTML/one-JavaScript probe.
3. Fetch `/ui/dist.json` and every admitted build file; compare complete decoded bytes, lengths,
   hashes, and identity with retained local authority. Verify GET/HEAD, MIME/encoding/length/cache
   projection, missing-key behavior, and no credential or signed-URL disclosure. Use ordinary
   requests and a bounded repeat, not cache-busting tricks. No browser asset redirects to R2.
4. Keep response consumption, request counts including browser loads, retries, and request lifetimes
   within the approved bounds. Record commands, code/runtime/artifact identities, actual results,
   unavailable checks, and failures. No credentials or raw private provider responses enter evidence.
5. Retain the selected objects and matching staged application; document ownership of retention and
   later replacement. One successful proof establishes observed delivery, not perpetual
   availability, atomic publication, a competing-writer guarantee, or a particular CDN hit rate.

The result is an owned HTTPS Deno application serving the selected R2-backed material through an
explicit maintained route contract. Pi remains a separate consumer of its selected artifact URLs and
independently retained manifest pin/package. Browser CORS, executable URL closure, Service Worker
scope/cache migration, and browser/filesystem support floors remain product-owned where required;
this sample does not claim a product release.

## Non-goals and stop conditions

No public-origin R2 binding, transparent proxy as the application design, Cloudflare Worker
implementation in the initial arc, new uploader, owned SDK/signer, single-use token system,
conditional settlement, CAS/receipt protocol, generic cloud ontology, universal security audit, or
blanket verify/plan/apply framework. No sign-in proof, independent-download sample, client-side
router, SPA fallback, forced CSS/lazy-chunk/worker showcase, or browser-control framework belongs
to the selected UI/API composition.

Do not exclude future Workers hosting by coupling the route contract to Deno entry or environment
APIs. Conversely, do not add an adapter registry, multiple implementations, or Workers proof before
there is a concrete need. Runtime-specific capabilities belong at adapters.

Stop and refine the concrete item if its owner or contract cannot be named, transport bounds cannot
be enforced honestly, the selected caller policy needs an unspecified identity system, or execution
requires weakening an existing check. Additional middleware or automation must solve an observed
requirement, not expand the security posture for its own sake.

## External evidence and unresolved provider details

Public documentation consulted for the design, not live account proof:

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

These external sources were not re-fetched for this source/history reconciliation. Recheck material
provider claims before runnable setup or cost commitments. Public examples are not instructions to
change dependencies, deploy example code, grant permissions, or configure accounts.
