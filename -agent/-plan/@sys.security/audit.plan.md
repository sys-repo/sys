audit.plan.md

Source-security triage, not an implementation arc or a completed security audit. These first-party
concerns are not recoverable from `deno audit`. Source rechecked on 2026-09-21 at HEAD `14754b13c`;
no exploit tests, credential inspection, provider calls, or deployment observations were performed.
Severity and exposure remain unestablished. Recheck callers and source before selecting a fix.

## Unresolved source-backed concerns

### SEC-1 — Static-file containment

[serveStatic](../../../code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts) decodes the
request pathname, joins it to the root, and admits it with a bare normalized `startsWith(root)`
check. That predicate has no directory-separator boundary. Prioritize isolated tests for encoded
traversal, sibling-prefix paths, relative roots, and symlinks before claiming containment. A lexical
path check alone does not establish filesystem confinement.

### SEC-2 — Default wildcard CORS

[HttpServer.create](../../../code/sys/http/src/http.server/m.HttpServer/m.Server.create.ts) enables
wildcard CORS unless explicitly disabled, allowing GET/POST and the Authorization header. Check
consumer intent before changing this default. CORS is browser response-access policy, not caller
authentication or a general defense against cross-site requests; wildcard CORS alone proves no
credential theft.

### SEC-3 — WebSocket Origin admission

[acceptRequest](../../../code/sys/server/src/m.server.websocket/u/u.accept.ts) checks path and
upgrade headers, then delegates further admission to an optional `accept` callback. Omission admits
the request without an Origin check here. Inspect callers' authentication and Origin policy; test
refusal before upgrade where cross-site access is unwanted. Hijacking impact depends on the
consumer.

### SEC-4 — Stripe fixture access

The [app](../../../code/sys.driver/driver-stripe/src/server/m.StripeFixture/u.app.ts) installs no
route authentication or throttling and inherits wildcard CORS.
[Session creation](../../../code/sys.driver/driver-stripe/src/server/m.StripeFixture/u.session.ts)
uses server-held credentials and server-selected amount/currency to request a PaymentIntent.
[Startup](../../../code/sys.driver/driver-stripe/src/server/m.StripeFixture/u.start.ts) defaults to
`127.0.0.1`, but permits another hostname. Determine intended callers and browser/network exposure
before selecting access controls. Loopback binding is not authentication; no public deployment or
live-payment impact was verified.

### SEC-5 — SHA-1 content verification

[verifyContent](../../../code/sys.model/model/src/m.files/m.ContentRef/u.verify.ts) accepts SHA-1 or
SHA-256 according to the supplied reference. Determine which callers require collision-resistant
integrity versus legacy content identification, then select and test an explicit algorithm policy. A
supplied digest does not establish its own provenance; no concrete substitution attack was tested.

### SEC-6 — Proxy target confinement

[HttpProxyResolver](../../../code/sys/http/src/http.server/m.HttpProxy/m/m.Resolver.ts) validates
only a leading slash on the input pathname, then resolves a suffix with `new URL(relative, base)`.
Test dot segments and URL-like suffixes against the actual caller path; establish final origin and
base-path confinement. An operator-configured base alone is not proof of the resolved target's
scope.

### SEC-7 — Stripe client secret in console output

The
[development helper](../../../code/sys.driver/driver-stripe/-scripts/-tmp.createPaymentIntent.ts)
prints the returned PaymentIntent client secret. Review whether this output is needed and who
retains or receives it; prefer avoiding routine secret logging. This is source evidence of a logging
path, not evidence that a secret was committed, published, or captured in any particular log.

## Boundary

The former blanket "confirmed clean" assurances, speculative remediation phases, human-decision
queue, and generic assessment wishlist are removed, not completed. No claim is made about repository
secret absence, publication payload safety, process confinement, or full-source audit coverage.
Dependency advisories need a fresh `deno audit` and owner-graph investigation, not the obsolete
remediation ledger. Select concrete work separately; this note authorizes no fixes or live
operations.
