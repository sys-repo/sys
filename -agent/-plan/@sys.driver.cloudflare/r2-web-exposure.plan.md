r2-web-exposure.plan.md
- [x] 07a0a8028 chore(tmpl:pkg): scaffold @sys/web package
- [ ] feat(web): add exposure model types
- [ ] feat(driver-cloudflare): add web exposure verify seam
- [ ] feat(driver-cloudflare): verify R2 files exposure
- [ ] feat(tools): surface web exposure verification
- [ ] [r2-dist-generation-publication.plan.md](../@sys.tools/r2-dist-generation-publication.plan.md)
- [ ] docs(plan): record first R2 web exposure proof

## Purpose and collaboration boundary

Own the `@sys/web` exposure contract and its first Cloudflare/R2 realization: intentional surfacing
of a system resource through an owned, protected public HTTPS host. This is larger than `readOrigin`
and smaller than a generic CDN/cloud abstraction. Deno Deploy app/API exposure is a sibling resource
kind, not an implicit reverse proxy in the R2 files path.

Keep the primitive and its Cloudflare realization in this one plan. Record durable decisions,
verified provider facts, ownership, and scoped proof requirements, not transcripts, speculative
option lists, duplicate commit arcs, or review-count gates. The opening block is the sole ledger.

## First complete files journey

```text
one frozen, verified Dist
→ separately verified R2 generation publication
→ owned HTTPS hostname
→ Cloudflare edge + R2 custom-domain binding
→ exact generation-qualified manifest and declared assets
```

The client-to-storage request path is:

```text
browser or downloader → owned HTTPS host → Cloudflare/R2 → object
```

No Deno server, Worker, Files-over-Cmd server, or reverse proxy is required merely to serve public
objects. Cloudflare supplies the serving infrastructure. Actual hostname, TLS, protection, cache,
and path behavior still need verification; this topology is not evidence of a configured live host.

The first proof needs one owner-selected files hostname and one frozen Dist. The second domain pair,
Deno app exposure, automated apply, and Pi's product release do not block it. A small non-release
proof Dist is sufficient here; it must not be reported as Pi release evidence. Pi later proves its
own selected product artifact against the realized exposure without rebuilding that candidate.

## Ownership and dependency direction

| Owner                        | Responsibility                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `@sys/web`                   | Pure owned-web intent, resource references, access, URL, and protection vocabulary   |
| `@sys/driver-cloudflare/web` | Cloudflare realization and read-only verification; later earned plan/apply           |
| `@sys/driver-cloudflare/r2`  | Existing bucket and ordinary Files backing; provider-specific conditional primitives |
| `@sys/tools`                 | Publication and operator-facing exposure verification consumers                      |
| Driver Pi                    | Product graph, independent pin/package authority, release policy and execution proof |

Exposure consumes stored objects. It does not own generation writes, receipts, pointer activation,
retry/settlement, artifact rebuilding, or launcher evidence. Deploy consumes the host contract and
must not own Cloudflare control-plane configuration. Neither the R2 driver nor `@sys/web` imports
Deploy policy.

### Execution dependencies

- Model and read-only verifier implementation may proceed independently of publication, using
  deterministic injected provider/HTTP observations. No production exposure success follows from
  those fixtures.
- The publication prerequisite appears immediately before the live generation-proof item. That item
  consumes the completed storage protocol; it does not use the old mutable flat publisher.
- The publication plan does not wait for this plan. Its documentation reports generation URLs as
  unverified exposure until public proof exists. Do not create a documentation dependency cycle.
- [start-ui-release-evidence.plan.md](../@sys.driver-pi/start-ui-release-evidence.plan.md) consumes
  publication and exposure for its published binding. Its product-entry work, owner choices, and
  public-browser proof remain Pi-owned; none is a prerequisite for this plan's non-release proof.

## Landed Files foundation

`28faad7b4 feat(driver-cloudflare): add R2 Files backing` supplied
`code/sys.driver/driver-cloudflare/src/m.r2/m.Files/m.create.ts`. It binds Files/Cmd handlers to an
R2 bucket. Current Deploy's `createFilesClient` composes `R2.Files.create(...)` with
`Files.Client.local(...)` in `code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts`.

```text
Files client → Files/Cmd handlers → R2.Bucket → authenticated S3 requests → R2
```

The former `r2-files-backing.plan.md` is recoverable at `bd7d0e6c7` and was removed by `dd5bd2450`.
Do not recreate that completed integration or treat ordinary object access as conditional
publication.

Ordinary namespace operations remain through Files. Generation publication deliberately uses the
bucket directly because Files/Cmd do not promise conditional writes or coherent bytes/validators.
Public HTTP reads do not traverse Files/Cmd and do not inherit Files policy checks. In particular, a
Files prefix does not establish the public custom domain's access boundary. Verify the actual public
namespace and known alternate public endpoints, including any enabled R2 development origin, against
the declared access/protection policy. An alternate route that bypasses required protection prevents
a protected-exposure claim; changing it requires separate setup authority.

[r2-files-enumeration-bounds.plan.md](r2-files-enumeration-bounds.plan.md) separately owns finite
scan/index budgets for the existing Files backing. Result paging currently follows a whole-prefix
index; it does not bound provider work. That correction is neither completed by the publication
plan's bounded generation listing nor a prerequisite for direct public object delivery.

## Exposure model

The root concept is `Web.Exposure`: owned public web exposure with declared access, URL, protection,
and origin policy. The first resource kinds are `Web.FilesExposure` and `Web.AppExposure`.

Contract vocabulary, not a shipping API declaration:

```text
Web.Exposure
  kind: files | app
  host
  origin
  accessPolicy
  urlPolicy
  protection
```

- `Web.FilesExposure`: a Files-backed namespace exposed as public web objects under an owned HTTPS
  hostname. Public reads are for public-by-design objects; public listing is denied by default.
- `Web.AppExposure`: app/API traffic, for example Deno Deploy, under an owned HTTPS hostname. Its
  auth, entitlement, CORS/origin, request-size, rate, and cost/abuse controls belong at the
  appropriate app/control-plane boundary, not in the R2 object adapter.
- `host`: the owned public hostname, not a raw provider endpoint.
- `origin`: a system resource reference. R2 and Deno Deploy identifiers belong to provider
  realizations, not the root model.
- `Web.AccessPolicy`: audience and permitted public operations, not a general ACL engine.
- `Web.UrlPolicy`: emitted product URLs use admitted owned hosts; provider endpoints remain
  substrate.
- `Web.Protection`: required HTTPS and an explicit public DDoS/abuse baseline; declaring it does not
  prove Cloudflare enforces it. Record verified limits and residual cost exposure honestly.
- `Web.Origin`: the resource-reference vocabulary needed by the selected files/app forms.

Use `Exposure`, not `Host`, because the subject includes the act and policy of surfacing a resource.
Use `Protection`, not provider-specific edge-profile terms. Do not split API exposure from app
exposure without a demonstrated route-policy requirement.

Keep Cloudflare WAF/rulesets, DNS ceremony, account IDs, credentials, regions, S3 terms, Worker
routing, plan tiers, Deno project IDs, and provider cache knobs out of `@sys/web`. Add pure types
and only the guards/schema required by the actual verification boundary; no generic cloud ontology.

Rejected owners/names remain `@sys/surface` (vague), `@sys/http` (HTTP mechanics),
`@sys/model/files` (bounded file capabilities), Tools alone (consumer, not host authority), and the
Cloudflare driver alone (too provider-specific for the root model).

## Intended topology and domain instances

```text
owned Web.Exposure
├─ app: owned protected HTTPS host → Deno Deploy app/API
│  └─ auth/entitlement/routing; emits only admitted owned URLs
└─ files: owned protected HTTPS host → Cloudflare edge + R2 custom domain
   └─ public-by-design generation-qualified objects
```

The intended domain instances remain:

```text
nz.accountants        → Cloudflare edge → Deno Deploy app exposure
cdn.nz.accountants    → Cloudflare edge → R2 files exposure

db.team               → Cloudflare edge → Deno Deploy app exposure
cdn.db.team           → Cloudflare edge → R2 files exposure
```

These are intended instances, not verified configurations or mandatory simultaneous first proofs.
Select one files host for the first proof; keep the other instances unclaimed until separately
verified. Do not fork the model by domain.

Deno may decide whether to emit a public asset URL. Once emitted, direct R2 reads are not subject to
Deno's per-request authorization. Private or revocable reads, required rewrites, header-sensitive
behavior, or a stable-current resolver may earn a gateway. Name the failed invariant and prove the
smallest realization before adding one; a Worker is not the default.

## Reader and URL contracts

The publication plan owns the exact generation layout and per-segment key encoding:

```text
<readOrigin>/<prefix>/generations/<generation>/content/<path>
```

- Discovery readers resolve `current.json` once and bind the subsequent graph to that generation.
- Independently pinned readers such as Pi already have the manifest URL, pin, and expected package.
  They do not acquire execution authority from `current.json`, receipts, ETags, or public responses.
- Direct R2 does not resolve the pointer, provide implicit `/index.html` routing, rewrite
  root-absolute HTML/CSS/module paths, or select a stable-current generation.
- For generation publication, derive an origin-only owned HTTPS `readOrigin` from the admitted
  realized `Web.FilesExposure`; no credentials, query, fragment, or path prefix. Encode each
  admitted object-key segment once. Do not silently reinterpret existing ordinary Files URL
  contracts.
- Tools verification reports that derived origin and compares any configured Deploy `readOrigin`. A
  mismatch is visible refusal/drift, not silent YAML mutation or a second host authority. This
  projection is part of `feat(tools): surface web exposure verification`, not an orphaned extra arc.
- A generation prefix is not a distinct browser origin. Retention and immutable object names do not
  isolate Service Workers or CacheStorage by themselves.

## Three distinct proof boundaries

### Authenticated storage proof — publication owner

Exact S3 readback establishes stored bytes, representation metadata, key-set correspondence,
receipt, and observed activation settlement. It does not establish public reachability, cache
behavior, public authorization, TLS policy, or browser execution.

### Public artifact-delivery proof — this plan

Tools derives finite object/byte expectations from independently retained `Pkg.Dist` evidence. The
Cloudflare verifier owns provider/URL/HTTP observations against those supplied expectations, not a
second Dist parser, generation-layout policy, or artifact-selection authority. Reuse the existing
Dist owner to admit manifest/package truth; never bootstrap expected hashes from the public target.

Against that retained authority for the frozen proof Dist:

- verify the selected owned hostname, normally trusted HTTPS, R2 custom-domain realization, and
  declared protection/access posture using bounded read-only observations;
- fetch the generation-qualified manifest and every declared asset; verify complete bytes, sizes,
  hashes, package identity, representation headers, and admitted redirects against that authority;
- test exact key-segment roundtrips, including spaces, literal `%`, `?`, `#`, and Unicode;
- verify cache and negative-cache behavior at the public host. Where a missing-key observation must
  precede publication, arrange it before the separately authorized publication of that exact proof
  generation. Do not manufacture fixtures with unconditional writes inside the protocol namespace;
- use the actual product URL without cache-busting queries or bypass headers. Missing visibility or
  stale responses are failures/pending evidence, not permission to relax pins or claim success;
- retain operator evidence that lifecycle expiration and legacy-writer authority cannot delete the
  selected retained namespace. New prefix spelling or absence of an expiry header is insufficient;
- record configured intent, observed facts, unmet invariants, exact code/artifact identity, and
  bounded request/byte counts separately. No credentials, signed headers, or raw private provider
  responses enter reports.

A successful representative object is a smoke test, not full Dist delivery proof. Pi's Deno
acquisition does not inherently require browser CORS to the R2 origin; apply CORS checks only to the
client journey that needs them. Header-only or authenticated S3 success cannot replace public byte
verification.

### Direct public-browser execution — product/release owner

The selected product must separately prove the full HTML/CSS/module/asset/worker request graph stays
within admitted generation-bound URLs, with correct MIME/headers, redirects, relevant CORS, cache
behavior, and supported browser floors. `base: './'` is useful configuration, not transitive proof.
Separately admitted app/API traffic is not generation content and does not turn Deno into an R2
proxy.

Pi's release plan owns the concrete product entry, direct-public and verified-loopback execution,
worker/migration policy, cold acquisition, warm offline reuse, and tamper refusal. No-store response
headers alone disable neither explicit Service Worker CacheStorage nor prior-worker authority.
Public browsing does not inherit the launcher's independent manifest pin. Do not close that release
item merely because this plan has verified downloadable bytes.

## Phased realization and authority

Cloudflare realization belongs in `@sys/driver-cloudflare/web`: hostname/zone lookup, R2
custom-domain binding, DNS/TLS/protection observations, provider drift, and eventually narrow
reconciliation. The Deno app realization remains a sibling and needs its own provider facts before
automation.

1. **Model and local verification tests:** no credentials, network, domain setup, app deployment, or
   publication required. Keep unavailable observations explicitly unverified/unsupported.
2. **Live files verification:** requires a selected owned files host, concrete source-backed API and
   DNS/TLS/protection facts for the checks used, least-authority read credentials where necessary,
   the committed proof generation, and explicit bounded probe authorization. Default tests never
   perform these calls. Inability to establish a required invariant prevents a verified result.
3. **Plan/apply, later:** requires source-backed mutation resources, separately approved token
   scopes and targets, a narrow idempotent diff, and explicit mutation authorization. This arc adds
   no apply path. Deno app-provider facts and both domain pairs are not prerequisites for files
   verify.

Account creation, domain purchase/delegation, and API-token creation remain bootstrap exceptions. A
manual host setup is acceptable if its desired state and subsequent verification are recorded; first
use is not blocked on automated apply. Never weaken certificate, secure-context, credential,
permission, or provider-policy checks to obtain a proof.

## Commit contracts

### `chore(tmpl:pkg): scaffold @sys/web package`

Landed in `07a0a8028`: lean package namespace, types/common spine, and minimal test; no runtime
exposure model, Cloudflare behavior, R2 or Deno deployment, or product proof was established.

### `feat(web): add exposure model types`

Define the smallest files/app exposure vocabulary above, with pure boundary admission as required.
No vendor dependencies, routing engine, provider configuration, or runtime reachability claim.

### `feat(driver-cloudflare): add web exposure verify seam`

Add the Cloudflare web entry point with injected read-only observations and truthful result shapes:
configured intent is distinct from verified, failed, and unavailable evidence. Validate targets and
finite work bounds before effects. No automatic apply, retries with broadened authority, or secrets
in result values. Default tests are deterministic and credential-free.

### `feat(driver-cloudflare): verify R2 files exposure`

Implement the selected files checks and bounded public-byte verification described above. Prove
host/URL/redirect refusal, wrong bytes/headers, unavailable provider facts, stale/negative cache
observations, alternate-public-route policy failures, and finite work with injected effects. Verify
supplied complete object expectations without importing Deploy layout or duplicating Dist parsing.
This implementation commit does not require a live product release or claim the later live proof.
Keep gateway decisions tied to named failures.

### `feat(tools): surface web exposure verification`

Expose read-only operator verification through existing Tools composition. Report independent
storage and exposure status, derived `readOrigin`, configuration drift, and generation-qualified
locations. Do not change provider state, silently rewrite endpoint YAML, rebuild artifacts, or turn
an unverified configured URL into success. Test projection and mismatch/refusal at the consumer
seam.

### `docs(plan): record first R2 web exposure proof`

After the publication prerequisite, record one explicitly authorized first files-host proof against
one frozen Dist and its independent authority. Preserve exact same-artifact public readback and
cache evidence. Record the selected hostname and verified protection/retention boundaries; do not
mark the other domain, Deno app exposure, automated apply, or Pi release complete by association.
Unmet required evidence leaves this item incomplete; no review or upload receipt substitutes for it.

## Verification and non-goals

Each implementation item must pass the affected package's configured check/test tasks with no live
credentials or provider mutation in the default suite. The final proof uses the bounded opt-in
workflow implemented by this plan, with separately authorized publication/setup where needed.

No generic cloud facade, Files publication API, uploader in Pi, default reverse proxy, private-read
design, GC, browser-policy bypass, or speculative apply framework is authorized. Keep first files
verification useful while independently owned product, app, and provider-automation work proceeds.
