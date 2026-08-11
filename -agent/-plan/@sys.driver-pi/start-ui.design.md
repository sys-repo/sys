start-ui.design.md
- [x] 6bf22370f [verified-dist-materialization.plan.md](../@sys.server/verified-dist-materialization.plan.md)
- [x] b59dbdd7b [local-dist-host.plan.md](../@sys.server/local-dist-host.plan.md)
- [x] 1ddeb15d feat(driver-pi): split profile start modes to CLI vs local UI launch
- [x] 58a62cb7d feat(driver-pi): persist interactive start-mode preference
- [x] 3698692a feat(driver-pi): compose start:ui through verified Dist runtime
- [x] 714adb95a feat(server): expose explicit local Dist serving authority
- [ ] fix(http): confine package service-worker cache ownership
- [ ] feat(http): expose fail-closed service-worker deployment admission
- [ ] feat(testing): expose isolated service-worker lifecycle observations
- [ ] feat(http): expose exact loopback listener origins
- [ ] fix(server.dist): avoid Deno.serve legacy per-request abort in dist asset reads
- [ ] feat(server.dist): expose explicit browser-origin policy for verified Dist hosts
- [ ] fix(driver-pi): deny service-worker authority on verified loopback origins
- [ ] feat(fs): expose owned-tree lifecycle leases
- [ ] feat(fs): expose sealed owned-tree publication and removal
- [ ] fix(server.dist): publish Dist generations through sealed promotion
- [ ] feat(driver-pi): admit GUI Dist identity from frozen launcher evidence
- [ ] feat(server): expose an inert loopback bootstrap status host
- [ ] feat(driver-pi): supervise start:gui through one boot state
- [ ] feat(driver-pi): bind local GUI preview directly to Vite build evidence
- [ ] feat(driver-pi): expose scoped start:gui Dist reset
- [ ] feat(driver-pi): diagnose unavailable start:gui manifest sources
- [ ] refactor(http): fit direct service startup output to terminal width
- [ ] feat(driver-pi): bind published GUI Dist evidence for release

This file is the anchor. The checked prerequisite records are retired, hash-anchored plan snapshots;
their source files need not remain in the live worktree. The opening arc is the sole state ledger.
Body sections define durable contracts, commit boundaries, and proof without duplicating item status.

Planning does not imply permission to implement.

## Per-item review calibration

The opening arc remains the sole landing-state ledger. The entries below are planning estimates for
semantic burden and likely review spend; they are not authorization, live model selection, completed
review provenance, or a substitute for canonical Ready/Done checks. Checked prerequisites are not
retroactively estimated. Reopening one requires an explicit follow-up item.

`Thing` names the load-bearing semantic burden rather than file count or apparent diff size. Each
`Implementation` and `landed review` value is a likely canonical calibration only. The actual delivered
change always overrides it.

1. `fix(http): confine package service-worker cache ownership`
   - Thing: shared persistent-browser cache ownership and backward-compatible activation cleanup.
   - Likely: implementation `gpt-5.6-sol • xhigh`; landed review `gpt-5.6-sol • xhigh`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
2. `feat(http): expose fail-closed service-worker deployment admission`
   - Thing: foundational browser-persistence authority and fail-closed origin policy.
   - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
3. `feat(testing): expose isolated service-worker lifecycle observations`
   - Thing: reusable real-browser evidence without confusing observation with attestation.
   - Likely: implementation `gpt-5.6-sol • xhigh`; landed review `gpt-5.6-sol • max`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
4. `feat(http): expose exact loopback listener origins`
   - Thing: shared HTTP authority semantics with compatibility-sensitive URL propagation.
   - Likely: implementation `gpt-5.6-terra • high`; landed review `gpt-5.6-sol • xhigh`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
5. `fix(server.dist): avoid Deno.serve legacy per-request abort in dist asset reads`
   - Thing: narrow request/server lifecycle correction on the verified read path.
   - Likely: implementation `gpt-5.6-terra • high`; landed review `gpt-5.6-terra • high`.
   - Posture: BMIND → TMIND → S-tier.
6. `feat(server.dist): expose explicit browser-origin policy for verified Dist hosts`
   - Thing: trust-bearing HTTP admission and browser response enforcement around verified bytes.
   - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
7. `fix(driver-pi): deny service-worker authority on verified loopback origins`
   - Thing: persistent browser-authority migration across application, worker, host, and real browser.
   - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
8. `feat(fs): expose owned-tree lifecycle leases`
   - Thing: foundational cross-process concurrency and deletion exclusion over stable filesystem identity.
   - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
9. `feat(fs): expose sealed owned-tree publication and removal`
   - Thing: foundational cross-platform publication durability plus confined destructive removal.
   - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
   - Posture: BMIND → DMIND → TMIND → S-tier.
10. `fix(server.dist): publish Dist generations through sealed promotion`
    - Thing: integration of strict verification, legacy migration, sealing evidence, and publication truth.
    - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
    - Posture: BMIND → DMIND → TMIND → S-tier.
11. `feat(driver-pi): admit GUI Dist identity from frozen launcher evidence`
    - Thing: launcher-owned provenance and package/Dist identity refusal before execution.
    - Likely: implementation `gpt-5.6-sol • xhigh`; landed review `gpt-5.6-sol • max`.
    - Posture: BMIND → DMIND → TMIND → S-tier.
12. `feat(server): expose an inert loopback bootstrap status host`
    - Thing: reusable capability-routed status hosting with no browser control authority.
    - Likely: implementation `gpt-5.6-sol • xhigh`; landed review `gpt-5.6-sol • xhigh`.
    - Posture: BMIND → DMIND → TMIND → S-tier.
13. `feat(driver-pi): supervise start:gui through one boot state`
    - Thing: cross-resource lifecycle, state projection, failure precedence, and cleanup composition.
    - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
    - Posture: BMIND → DMIND → TMIND → S-tier.
14. `feat(driver-pi): bind local GUI preview directly to Vite build evidence`
    - Thing: build/runtime graph separation and direct prepared-generation authority transfer.
    - Likely: implementation `gpt-5.6-terra • high`; landed review `gpt-5.6-sol • xhigh`.
    - Posture: BMIND → DMIND → TMIND → S-tier.
15. `feat(driver-pi): expose scoped start:gui Dist reset`
    - Thing: published destructive operation with exact identity, locking, and confinement requirements.
    - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
    - Posture: BMIND → DMIND → TMIND → S-tier.
16. `feat(driver-pi): diagnose unavailable start:gui manifest sources`
    - Thing: bounded evidence sanitization and truthful user guidance over ambiguous lower failures.
    - Likely: implementation `gpt-5.6-terra • high`; landed review `gpt-5.6-terra • high`.
    - Posture: BMIND → DMIND → TMIND → S-tier.
17. `refactor(http): fit direct service startup output to terminal width`
    - Thing: presentation-only terminal-cell fitting with Unicode and non-TTY compatibility.
    - Likely: implementation `gpt-5.6-terra • medium`; landed review `gpt-5.6-terra • medium`.
    - Posture: BMIND → DMIND → S-tier.
18. `feat(driver-pi): bind published GUI Dist evidence for release`
    - Thing: final irreversible artifact provenance, public-browser proof, and publication ordering.
    - Likely: implementation `gpt-5.6-sol • max`; landed review `gpt-5.6-sol • max`.
    - Posture: BMIND → DMIND → TMIND → S-tier.

### Actual-change BMIND recalibration

After any item acquires materially attributable implementation or lands, and before judging closure or
the next item, discard its estimate and perform a fresh BMIND pass over what exists now:

1. Reopen this plan and the actual touched public types, implementation, tests, generated artifacts,
   task/permission surfaces, and downstream call sites. Use only evidence permitted by the canonical
   Git and work-state protocols; this section authorizes no Git action.
2. Restate the actual semantic delta, authority gained or removed, persistence, destructiveness,
   reversibility, compatibility propagation, failure modes, and proof burden. Do not infer these from
   the subject, planned file list, model used, or green unit tests.
3. Compare planned versus observed burden. Record whether actual scope stayed bounded, narrowed, or
   expanded, and identify every plan assumption invalidated by the delivered shape.
4. Select exactly one fresh canonical model/level for the immediate review under `protocols.md`.
   Estimates above provide no floor or provenance: lower them when reality is simpler and raise them
   immediately when hidden structure, security, irreversibility, or missing questions appear.
5. Apply BMIND on every item; add DMIND for public/shared API or user-flow fit, TMIND for authority,
   persistence, destructive work, cross-owner behavior, or surprise propagation, and an S-tier residue
   pass across every touched file before claiming finished quality.
6. Re-run only the proofs that can establish the actual behavior, expanding to affected owners and real
   browser/network/filesystem scenarios when the implementation propagated farther than expected.
   Mocks never inherit proof power from the estimate.
7. Stop before the next item if ownership moved, a new primitive appeared, the actual change crossed an
   arc boundary, required evidence is unavailable, or a stop condition now applies. Tighten this plan
   rather than normalizing the surprise in prose.

A human calibration question remains governed by the canonical calibration and work-state protocols;
this section creates no new invocation grammar. The response must correlate the estimate with current
observed evidence and recommend what is needed now, not repeat the table mechanically.

## Anchor

The product change is exactly the selected-profile start menu:

```text
start:tui
start:gui
```

`start:tui` preserves the current child-process flow.

`start:gui` is one trusted host-supervised session:

```text
package-owned bootstrap status host
  → Open.invokeDetached once
  → settle one frozen authority mode in the trusted host
      release      → Dist.materialize(URL + exact manifest pin)
      development  → exact Vite output directory + build manifest pin
  → DistServer.start over verified bytes
  → bootstrap redirects to the verified application origin
  → wait in foreground
  → dispose cleanly
```

The trusted host supervisor is the control plane. The bootstrap is only a read-only status projection,
and the verified Dist is the application origin. Everything else exists only to keep those roles
generic, verified, and reusable.

## Scope boundary

The materializer and Dist host treat application payload bytes as opaque: Driver Pi does not inspect,
reinterpret, repair, or partially reproduce their hash, path, MIME, HTTP, filesystem, or verification
semantics. Browser-origin persistence is the narrow exception to semantic opacity because a service
worker can outlive one host session and bypass later per-request verification. This arc therefore owns
explicit deployment admission for that browser capability without owning product UI behavior.

In scope:

- `deno task dev` remains the Vite source/HMR workflow and stays separate from product startup;
- `deno task serve` remains a standalone verified preview of an already-built local `dist/`; it is not
  an HTTP artifact source because `DistServer.Local.serve` deliberately returns `404` for `dist.json`;
- direct pinned development hosting from one successful `Vite.build` response and its exact output;
- released-artifact acquisition from one immutable HTTPS URL plus an independently distributed pin;
- a generic inert bootstrap status host in `@sys/server`, with package-owned bytes and state mapping in
  Driver Pi;
- explicit browser-origin and service-worker deployment policy over the same exact Dist bytes;
- lower-owner protection of promoted generations from accidental ambient mutation without weakening
  exact-tree verification;
- the two retired lower prerequisite records in the commit arc;
- exact manifest authentication, bounded asset pull, staged verification, atomic promotion, and
  loopback serving for the release path;
- Driver Pi runtime composition over the lower APIs;
- the `start:tui` / `start:gui` menu split and compatibility proof.

Out of scope:

- treating the bootstrap as `App.UI`, a fallback application, a browser control plane, or a second
  product UI;
- creating `App.UI` or changing any product UI component beyond the narrow production-entry and
  service-worker authority wiring required by this arc;
- separate web and verified-loopback Dist builds;
- trusting browser or service-worker self-report as proof that no prior worker controls an origin;
- R2, Cloudflare, deploy-provider, or public-origin publication mechanics;
- `@sys/tools` CLI/config changes;
- signed update channels, aliases, rollback, or generation garbage collection;
- native `sys.app.shell` integration.

## Plan boundary

The opening arc is the complete governing plan set. Do not create another umbrella, pull, tools,
deployment, UI, or runtime plan for this slice.

## Dependency direction

```text
@sys/http/client service-worker admission
  + @sys/http + @sys/fs/pkg + @sys/fs Rooted + @sys/model/files/static
  → @sys/server bootstrap-status + @sys/server/dist
  → @sys/driver-pi lazy start:gui leaf

proof only: @sys/testing/server isolated browser lifecycle → Driver Pi browser tests
```

Driver Pi never imports `@sys/tools`, `@sys/tools/pull`, or `@sys/tools/serve`. `@sys/tools` already
embeds Driver Pi at its CLI surface and must not be pulled back beneath it.

Driver Pi also does not directly compose `HttpFetch`, `HttpPull`, `FilesStatic`, Pkg verification,
filesystem promotion, browser security headers, or service-worker lifecycle mechanics. The lower
owners expose those typed capabilities; Driver Pi selects fixed product policy and composes outcomes.

## Authority and source boundary

The lower materializer accepts typed runtime input:

```text
manifestUrl   abstract absolute HTTP(S) URL
integrity     SHA-256 of exact dist.json bytes
storeDir      immutable-generation parent
policy        required finite manifest/resource/verification authority
credentials   optional separately confined manifest/resource credentials
until         optional cancellation lifecycle
```

The URL is location, not authority. Loopback HTTP and a future HTTPS origin use the same input.

ELI5 mapping (for Phil):
- `manifestUrl` is just the **address** of a `dist.json` file ("where to download").
- `integrity` is the **receipt hash** for that exact `dist.json` file ("make sure it has not changed").
- `Dist.materialize` does: fetch `manifestUrl` → verify its `integrity` hash → fetch the referenced
  immutable assets → unpack them into a pinned local generation.

In short: released `start:gui` does not load a working source tree; it materializes an already-built
Dist package whose bytes are pinned by hash. Explicit development preview may host only the completed
Vite output directory, pinned by the exact integrity returned by that same build. It never serves
source/HMR bytes as the product application.

The exact manifest-integrity pin is authority. Do not substitute `dist.hash.digest`; the existing
composite digest does not bind path names or all manifest metadata. Do not change that established
digest protocol in this slice.

The landed launcher currently supplies this transitional complete pair plus deterministic storage:

```text
manifestUrl   http://localhost:8080/dist.json
integrity     sha256-07d24ba144edb1f84eb2db14b10fcd3c3470775ee389b518c0ae9a9b5b2ddfbc
storeDir      <runtime-root>/.pi/@sys/dist/@sys.driver-pi
```

The non-server launcher graph owns the runtime-frozen pair at `START_GUI_SERVICE.source` and passes it
to the lazy GUI leaf. The leaf snapshots both fields before asynchronous work and accepts one optional
code-level complete-pair replacement for tests or an explicit launcher caller. It exposes no profile,
environment, CLI-flag, selected-profile, per-field merge, store-identity, or limits override.

The static localhost pin is not the final model because every successful Vite build creates new exact
manifest bytes, and `DistServer.Local.serve` intentionally does not expose `dist.json`. Final authority
has two structurally disjoint modes selected before asynchronous work:

```text
development-preview
  Vite.build response {
    output directory
    manifest.integrity
    embedded package identity
  }
  → DistServer.start directly over that exact directory and pin

release
  immutable/versioned HTTPS dist.json URL with no userinfo, query authority, or fragment
  + exact manifest integrity generated from the frozen release candidate
  → Dist.materialize
  → DistServer.start over the returned verified generation
```

The intended internal authority shape is a closed union, not a bag of optional fields:

```text
release {
  readonly kind: 'release'
  readonly manifestUrl
  readonly integrity
  readonly expectedPkg { readonly name; readonly version }
}

development {
  readonly kind: 'development'
  readonly dir
  readonly integrity
  readonly expectedPkg { readonly name; readonly version }
}
```

Development has no artifact-source listener, manifest fetch, store promotion, port-8080 dependency, or
warm-cache promise. Release has no checkout-directory input or development fallback. The two modes
share no mergeable source shape. Development authority flows directly in memory from trusted build
evidence to trusted pinned hosting; release authority is generated into launcher-owned package/release
evidence and never falls back to local bytes because a process or directory exists. Materialization,
server, and browser-response policy remain fixed launcher authority.

## Lower composition contract

The prerequisite plans are authoritative for their internal owner composition. Released startup
consumes `Dist.materialize` and `DistServer.start`; explicit development startup consumes the exact
`Vite.build` result and `DistServer.start`. Driver Pi neither imports their lower primitives nor
absorbs hash, path, MIME, redirect, filesystem, verification, HTTP-response, or service-worker
lifecycle responsibilities.

## Browser trust floorboard

The trusted Driver Pi host supervisor is the control plane. The browser is a presentation plane and
never an artifact-authority plane. Driver Pi alone freezes the authority mode, owns release pins,
fetches, authenticates, stages, verifies, promotes, and hosts Dist bytes. The browser must never choose
a source, discover or accept an integrity value, pull an update, receive credentials, initiate repair,
or trigger a release-to-development trust downgrade.

The browser initially receives only package-owned status bytes from an ephemeral loopback origin and a
launch-scoped cryptographically random path. After the trusted host settles and starts one verified
generation, the browser navigates to a separate ephemeral loopback application origin. The status host never proxies,
interprets, repairs, or executes artifact bytes. The application origin never serves status or control
routes.

Ports are ephemeral. A fixed bootstrap port creates avoidable availability and stale-origin coupling;
an integrity-derived port cannot provide one-to-one generation identity within the finite port space.
The launch capability limits stale tabs and drive-by status probing but grants presentation only and
must never become artifact, retry, reset, or credential authority. Bind-before-open and a listener held
for the session remove the browser handoff race; exact Host and Fetch Metadata reduce remote-web
confusion. Ordinary loopback HTTP does not cryptographically authenticate against a hostile same-user
process or browser extension. That residual threat can deny service but must never be mislabeled as
solved by a port or token.

## Browser-origin and service-worker authority

One exact Dist may be deployed unchanged under two explicit browser policies:

```text
verified loopback
  application admission  → service worker denied
  host response policy   → worker creation denied
  sw.js loopback branch  → inert migration tombstone only

public HTTPS
  application admission  → service worker admitted
  public host policy      → same-origin worker permitted
  sw.js public branch     → normal package cache behavior

unknown or non-HTTPS non-loopback
  → deny by default
```

The current built browser graph is unsafe for verified loopback hosting: `src/-test/entry.tsx` registers
`sw.js`, Vite includes it in the Dist, and `src/-test/-sw.ts` calls both `skipWaiting()` and
`clients.claim()`. Its `Http.Cache.pkg` composition claims clients again and currently deletes every
origin cache outside its own keep-set rather than only package-owned names. That worker can outlive one
process and answer a later same-origin navigation from browser cache without the current `DistServer`
reauthenticating each byte. The current artifact is not release-ready until both cache ownership and
the following deployment policy are proven.

`@sys/http/client` owns one canonical, typed service-worker admission policy. It admits only public
HTTPS non-loopback origins and returns a discriminated observation such as `admitted`, `denied`,
`unsupported`, or `failed`; it never returns an unscoped `safe: true`. Driver Pi supplies no mutable
boolean. Profile data, environment, query parameters, browser storage, and port-number heuristics
cannot alter admission.

The application entry calls `navigator.serviceWorker.register(...)` only after canonical admission.
The same origin classification runs inside `sw.js`. Its loopback/denied branch installs no fetch or
message handlers, never calls `clients.claim()`, invokes neither `Http.Cache.pkg` nor
`Http.Cache.Cmd.listen`, deletes only its own namespaced caches, and unregisters itself as migration
defense. Its public-HTTPS branch may compose the package cache only after that cache's activation
cleanup is confined to the selected package namespace; unrelated same-origin cache names survive.

Artifact-side denial is defense in depth, not the security boundary. Verified `DistServer` startup
receives a fixed typed browser policy from Driver Pi and enforces the local denial with response policy,
including CSP worker denial. Server-start evidence may prove which policy was configured and direct
network tests may prove emitted headers; neither a browser page nor a worker can attest that an older
controller was absent. A tombstone test may prove eventual update, owned-cache cleanup, and unregister,
but cannot prove that the first navigation escaped an already controlling worker. Before product
release, evidence must establish either that no prior published local-worker build reached users or
that a separately reviewed fresh-origin/site-data migration has completed. Tombstoning is defense in
depth, never that release gate. An isolated-profile multi-navigation browser scenario must prove no
local controller is installed on a fresh profile and must observe legacy registration, controller,
owned-cache, update, and unregister transitions without treating those observations as attestation.
Public registration is proven only against a normally trusted non-loopback HTTPS fixture; certificate
validation or secure-context checks are never disabled to manufacture that result.

The verified application host also:

- changes `started.origin` from the current `localhost` normalization to the exact canonical numeric
  loopback authority and admits only that Host, not aliases for the listener; this is a candidate fresh
  origin for migration, not proof that the numeric authority was never previously exposed;
- rejects `Sec-Fetch-Site: cross-site` when the header is present while retaining direct/non-browser
  clients that omit it;
- emits explicit package-owned CSP, `Cross-Origin-Resource-Policy`, framing, referrer, cache, and MIME
  policy through a typed surface rather than an arbitrary header map;
- ignores request cookies, emits no `Set-Cookie`, and never accepts browser storage as application-host
  or artifact authority;
- keeps unknown routes strict and never proxies another origin.

The package-owned application CSP is fixed launcher/release policy, not profile or browser input. A
generic Dist consumer with different browser needs must select its own explicit typed policy; Driver Pi
does not weaken a universal default through ambient overrides.

## Embedded bootstrap status contract

The bootstrap is a read-only status projection over one trusted host state value. It is not a Dist,
`App.UI`, fallback product application, browser control plane, or second state machine. `@sys/server`
owns the generic loopback status-host lifecycle and constrained HTTP behavior; Driver Pi owns finite
package HTML variants, wording, and state projection.

The first slice is server-selected, fixed HTML/CSS with no interpolation, framework, script, remote
import, form, cookie, browser storage, or service worker:

```text
GET /<launch-capability>
  preparing          → fixed status HTML with fixed-rate observational refresh
  starting-app-host  → fixed status HTML with fixed-rate observational refresh
  ready(origin)      → 303 to the exact returned verified Dist origin
  failed(category)   → fixed stable failure HTML with truthful terminal guidance
  stopping           → fixed stopping HTML without refresh

unknown bootstrap route → fixed embedded HTML 404
unknown Dist route      → strict Dist 404
```

The status host generates the capability internally before binding, returns only the resulting URL to
its trusted caller, places it in the path rather than query, never persists it in host logs, removes it
from the application redirect, and protects it with `Referrer-Policy: no-referrer`. The terminal may
display it for manual opening because it carries only presentation authority. If materialization and
application startup finish before the first valid browser request, that first
request may return the `303`; no artificial bootstrap dwell is required.

A failed artifact acquisition page is a successful status response and must not claim literal HTTP
`404` unless typed lower evidence proves that status. The host retains the exact sanitized
`stage`/`reason`/`cleanup`/`publication` tuple for terminal evidence. The browser receives only one finite
pre-authored product category; it never receives dynamically assembled diagnostics, source URLs,
credentials, raw causes, headers, manifest bytes, pins, or absolute paths.

Initial retry authority remains in the trusted terminal/process boundary. A page refresh observes state
and does not initiate network work. The first slice runs at most one host attempt; process restart is
the universal retry. Any later browser mutation requires a new threat model and explicit capability,
origin, method, and cross-site proof.

Bootstrap responses are `no-store` and carry strict CSP, CORP, framing, referrer, MIME, and
cookie-independent policy. First-ever offline launch guarantees this status surface; full GUI launch
is offline after one release generation has been materialized and freshly verified. Shipping a full
package-local Dist for first-ever offline GUI remains a separate product decision.

## One host state value

The supervisor owns exactly one state value:

```text
preparing
starting-app-host
ready(origin)
failed(category, safeEvidence)
stopping
```

The terminal and bootstrap are two projections of that value, not independent state machines. Browser
failure categories are a closed coarser mapping: `configuration-invalid`, `source-unavailable`,
`artifact-refused`, `repair-required`, `local-failure`, or `cancelled`. `repair-required` requires
occupied invalid-generation evidence; `artifact-refused` never claims malicious tampering; and
`source-unavailable` retains the lower transport ambiguity. Hosting failure after readiness maps to
`local-failure` if the status origin remains observable.

The browser must not display unobservable live phases such as “downloading”, “verifying”, or
“promoting”: the current `Dist.materialize` contract exposes one in-flight promise and one terminal
settlement, not a progress stream. A future progress stream belongs to the lower API and is not
inferred here.

## `start:gui` lifecycle

The target composition performs:

```text
snapshot one closed authority input as a frozen valid-or-invalid result; freeze browser policy
  → start status host on 127.0.0.1:0 with state preparing
      → host internally generates and returns the capability URL
  → bind trusted terminal controls and renderer
  → attempt Open.invokeDetached(status capability URL) exactly once
      success → continue
      failure → retain session, print URL, record presentation warning
  → settle authority snapshot
      invalid
        → failed(configuration-invalid); no artifact work
      release
        → create only the deterministic stable Dist parent required by Rooted
        → admit the canonical owner target and acquire its shared lower-owner lease
        → Dist.materialize(URL + pin)
        → admit verified package identity
      development
        → admit exact Vite output directory + build pin + package identity
  → set starting-app-host
  → DistServer.start({ dir, integrity, limits, browserPolicy, 127.0.0.1:0 })
  → set ready(started.origin)
  → next valid status request returns 303
  → await trusted terminal or host terminal state
  → set stopping
  → close application host first and status host last; dispose all presentation resources
```

Failure and lifecycle behavior:

- `Fs.Capability.Rooted.create` requires an existing parent. Released startup uses `Fs.ensureDir` only
  for the deterministic stable Dist parent, binds Rooted there, admits the exact owner target, and
  acquires its lease before materialization creates or opens the owner store. Driver Pi never creates,
  reads, repairs, or deletes an integrity-addressed generation or private stage. Setup failure is
  normalized to the same safe `storage/filesystem-failure` shape as lower materialization failure.
- Authority snapshotting performs no filesystem or network work and returns closed invalid evidence
  rather than throwing; malformed authority can therefore reach the always-available status surface.
- Status-host startup failure opens no browser and begins no authority settlement.
- Terminal binding failure closes the status host and propagates before browser open or settlement.
- Browser-open spawn failure is a nonfatal presentation failure. The trusted session continues and
  prints the capability URL; eventual navigation remains outside `Open.invokeDetached` evidence.
- Materialization failure starts no application listener and executes no artifact bytes. The status
  host remains foreground in `failed` until trusted quit, cancellation, or process restart.
- An occupied invalid generation is preserved. It is never automatically discarded, overwritten, or
  repaired, even if a source appears reachable.
- Development verifies the build-provided pin directly against the completed output directory. It does
  not invoke materialization or mutate the release store.
- `ready` is impossible before `DistServer.start` has verified the exact directory, applied browser
  policy, and settled its listener. Browser refresh cannot expose a partially started host.
- A released session acquires a shared lease for the exact owner target from a Rooted capability bound
  to the stable Dist parent before generation-store setup and retains it through application-host
  close. Reset acquires exclusive leases for the exact canonical and observed-legacy targets through
  the same lower API, closing the deletion race without putting a lock file inside either deletable
  tree or forbidding concurrent read-only GUI sessions. Lease `unsupported` or lost ownership fails
  startup/reset before materialization or deletion.
- At most one materializer or application-start attempt is active. Retry cannot overlap prior work or
  change the frozen authority mode.
- One shared lifecycle owns status host, application host, keyboard, screen, refresh bookkeeping, and
  cancellation. Boolean latches are insufficient; close operations are idempotent and shared.
- Application-host failure after readiness updates the retained host state before terminal settlement;
  it does not redirect the application tab through an unverified fallback.
- Primary failures remain primary while cleanup and opener failures remain typed secondary evidence.
  `Dist.cleanup: 'pending'` means a private stage may remain; Driver Pi preserves that truth and never
  upgrades settlement to a no-residue claim.
- Screen and keyboard disposal are explicit in `finally`; lower server lifecycle owns `until`, so
  Driver Pi adds no redundant AbortSignal-only listener.
- Successful cancellation, keyboard quit, and normal completion prove that both listeners, keyboard,
  private stages, refresh bookkeeping, and owned foreground promises are gone. Cleanup or close
  failure retains typed unresolved-resource evidence, continues independent close attempts, and must
  not claim that a private stage or listener is absent merely because the close promise settled.
- Normal released startup never runs Vite or serves checkout source. Explicit development orchestration
  finishes Vite build before entering this session.
- Current transitional, preview, and local-browser task permissions grant loopback fetch/listen
  authority. They admit `0.0.0.0` only because the shared `Net.Port` availability probe binds that
  wildcard before the final listener binds `127.0.0.1`; this is not broad outbound network authority.
  Provider selection must add the one exact artifact hostname to the named CLI before cold HTTPS
  acquisition can pass. The selected public proof origin is frozen test input to the launched browser,
  whose child-process network is not governed by Deno's parent `net` allowlist; a published `-A`
  invocation or green mocks are not narrow-permission proof.
- A later released launch can reuse the exact freshly verified generation under
  `.pi/@sys/dist/@sys.driver-pi` with zero source or credential work.
- An active `DistServer` returns strict `404` for unknown paths and otherwise serves only admitted
  pinned bytes under the fixed browser policy.
- Version progression is deliberate: `Dist.materialize` does not auto-check a mutable endpoint. A new
  release requires new launcher-owned URL, pin, and expected identity evidence.

The lazy leaf imports no React or browser UI source. It composes package-owned status bytes and
verified Dist hosting only.

## Start-mode semantics

The exact interactive action values and labels are:

```text
start:tui
start:gui
```

Rules:

- `start:tui` is the default action and preserves the current `--allow-all` annotation.
- `start:gui` has no child-process permission annotation.
- Persist the last-selected interactive start mode (`start:tui` | `start:gui`) at
  `.pi/@sys/state/@sys.driver-pi/menu.json` and reuse it as submenu default on subsequent launches
  (fallback: `start:tui`).
- Direct `--profile` and non-interactive profile selection remain TUI mode.
- No new direct `--gui`, `--mode`, or `--start` flag is introduced.
- Pi passthrough arguments and `--install-ocr-deps` fail clearly if interactive GUI mode is selected.
- `start:gui` does not run OCR preflight, write Pi settings, or launch a Pi child.
- Back, edit, reload, rename, delete, migration, TTY, git-root, and error behavior remain unchanged.

The live type surface is:

```text
PiCliProfiles.MenuResult
  kind: 'selected'
  mode: 'tui' | 'gui'

PiCliProfiles.Result = Help | Ran | Gui | Exit
  Help  { kind: 'help'; input; text }
  Ran   { kind: 'run'; input; parsed; output }
  Gui   { kind: 'gui'; input; parsed }
  Exit  { kind: 'exit'; input }
```

Do not claim a `PiCliProfiles.Result.Variant` namespace unless a later explicit refactor introduces
one. `m.main.ts` dynamically imports the GUI runtime leaf only when `mode === 'gui'`. The default TUI
graph must not load `@sys/server`, browser-open logic, or GUI modules.

The selected-profile menu may show its existing sandbox preview. After GUI selection, the launcher
must not render a Pi-child sandbox report as authority for `start:gui`: no Pi child is launched, the
browser receives no selected-profile data, and that sandbox does not govern the Dist host.

## Commit details

Historical landed headings and their local vocabulary remain exact commit identities. Live contracts
and future items use the current TUI/GUI vocabulary.

### `feat(driver-pi): compose start:ui through verified Dist runtime`

- compose the canonical pinned default through one lazy runtime helper that calls `Dist.materialize`,
  `DistServer.start`, and `Open.invokeDetached` directly;
- keep the default CLI import graph free of `@sys/server`, browser-open logic, and UI modules;
- grant the declared CLI and test task surfaces the narrow network authority required for fetch and
  loopback listen;
- create only the deterministic rooted-store parent required by `Fs.Capability.Rooted`; map setup
  failure to stable `storage/filesystem-failure`, and never pre-create or bypass a pinned generation;
- replace mutable exported dependency state with an explicit immutable owner seam;
- bind keyboard before opening the browser and use one shared close promise with explicit keyboard
  disposal, observable bind/close failures, and no redundant lifecycle listener;
- branch UI before final Pi-child sandbox resolution/reporting while preserving the menu preview;
- preserve the exact lower failed-result evidence and open no server or browser after failure;
- test exact runtime arguments, no-child dispatch, lazy default imports, open-once behavior, quit,
  cancellation, bind/open/close failure, and leak-free completion;
- add one real loopback test using an opaque neutral Dist fixture and the real materializer/server;
- type fake generations from the awaited result rather than escaping through `unknown`;
- make no product UI, Vite, or bundle-content change.

### `feat(server): expose explicit local Dist serving authority`

- define the typed source pair in the non-server Driver Pi graph and keep runtime-frozen
  `START_GUI_SERVICE.source` as the canonical URL/integrity defaults;
- have `m.main.ts` pass that pair to the dynamically imported leaf; accept an optional complete source
  replacement only at the internal `start()` boundary;
- snapshot source values before asynchronous work and reject per-field fallback or post-call mutation;
- expose no profile, environment, CLI-flag, selected-profile, store-identity, or limits override;
- preserve the exact defaults when no replacement is supplied;
- test default/override alignment, malformed URL/hash rejection, policy-origin derivation, source
  snapshotting, and unchanged trust limits;
- preserve the landed `714adb95a` subject as historical identity; `afa5700cc` later renamed the live
  actions to TUI/GUI and `73e9d2b71` later grouped source and service identity.

### `fix(http): confine package service-worker cache ownership`

- change `Http.Cache.pkg` activation cleanup from an origin-wide keep-set sweep to one canonical
  package-owned namespace; preserve unrelated same-origin cache names exactly;
- retain public fetch/media strategy, `skipWaiting()`, and client claiming for explicitly admitted
  deployments while deleting only obsolete cache names owned by the selected package;
- expose the same package-cache ownership predicate to denied-context tombstone cleanup rather than
  duplicating cache-name parsing in Driver Pi;
- test current and obsolete owned names, adversarial prefix collisions, unrelated-cache preservation,
  cancellation/failure settlement, and unchanged admitted fetch/media behavior.

### `feat(http): expose fail-closed service-worker deployment admission`

- add one canonical origin classifier and closed policy for service-worker deployment: public HTTPS
  non-loopback may be admitted; loopback, non-HTTPS, unsupported, and unknown contexts deny by default;
- return discriminated admission and registration observations, never an unscoped boolean or
  `safe: true`, and state that browser evidence cannot prove absence of a prior controller;
- let application and worker code share the same policy without reading profile, environment, query,
  browser storage, port convention, or mutable global state;
- expose a denied-context tombstone helper that installs no fetch/message handlers, never claims
  clients, invokes neither the package cache nor command listener, removes only package-owned cache
  namespaces, and unregisters;
- compose the corrected namespace-confined package cache only after explicit public admission;
- test URL classification, exact output variants, malformed inputs, fail-closed defaults, unrelated
  cache preservation, and absence of handlers/claiming in denied contexts.

### `feat(testing): expose isolated service-worker lifecycle observations`

- extend the product-neutral `@sys/testing/server` browser owner with one isolated-profile,
  multi-navigation scenario surface rather than exposing its internal CDP client as application API;
- report typed registration, controller, cache-name, update, and unregister observations for each
  requested step while retaining console/runtime errors and deterministic profile cleanup;
- permit a caller fixture to seed a claiming worker, replace same-origin served bytes with a tombstone,
  reload, and observe eventual transitions in one temporary profile without importing a product
  package into `@sys/testing`;
- accept a caller-supplied normally trusted HTTPS URL for final public-provider proof; do not add
  `--ignore-certificate-errors`, insecure-origin treatment, a default user profile, or any other TLS or
  secure-context bypass;
- state in every result contract that browser observations describe only the controlled run and never
  attest that a prior controller was absent outside a freshly created profile;
- test fresh-profile isolation, multi-step ordering, timeout/error settlement, profile cleanup, and a
  package-neutral synthetic worker migration; Driver Pi owns proof against its checked worker fixture.

### `feat(http): expose exact loopback listener origins`

- add one frozen `HttpServer.start` origin mode that reports the exact routable loopback bind hostname
  (`127.0.0.1` or `::1`) rather than normalizing it to `localhost`; reject wildcard or non-loopback use
  of that mode and preserve current normalization as the default for existing consumers;
- make `Started.origin`, status URLs, printed/open URLs, and caller Host-policy evidence derive from the
  same settled authority rather than rewriting one returned field in Server Dist;
- expose no arbitrary caller-supplied origin string, proxy authority, forwarded-header trust, or alias
  list;
- test default compatibility, IPv4/IPv6 canonical formatting, wildcard/non-loopback refusal, ephemeral
  ports, status/print alignment, and post-call option snapshotting.

### `fix(server.dist): avoid Deno.serve legacy per-request abort in dist asset reads`

- remove `request.signal` from admitted pinned-read lifecycle composition and retain `life.signal` as
  the stable server-owned cancellation authority;
- keep listener shutdown, authority checks, GET/HEAD response shape, and pinned byte verification
  unchanged;
- replace the two-signal assertion with server-lifecycle proof and test delayed-read cancellation via
  `server.close(...)`;
- keep a real-network success proof and require the legacy warning to disappear without unstable flags;
- do not claim client-delivery cancellation: the current Hono adapter does not expose Deno handler
  completion at this layer.

### `feat(server.dist): expose explicit browser-origin policy for verified Dist hosts`

- accept one frozen typed browser policy rather than an arbitrary response-header map; Driver Pi fixes
  its policy in code and exposes no profile, environment, or browser override;
- select the lower exact-loopback origin mode so `started.origin` reports the numeric bind authority
  instead of current `localhost` normalization, then admit only that Host and remove every alias for
  the listener;
- reject `Sec-Fetch-Site: cross-site` when present while retaining direct clients that omit Fetch
  Metadata, and preserve exact Host rejection before route handling;
- emit the selected CSP, `Cross-Origin-Resource-Policy`, framing, referrer, MIME, and `no-store`
  policy on success and error responses; ignore `Cookie`, emit no `Set-Cookie`, and accept no browser
  storage as host or artifact authority;
- support Driver Pi's explicit worker denial without claiming one universal CSP fits every Dist
  consumer;
- expose frozen configuration evidence scoped to what the server applied, not a claim about browser
  controller state;
- test canonical Host admission, alias refusal, cross-site/missing Fetch Metadata, every response
  class, no CORS/cookies, policy snapshotting, and no weakening through malformed input.

### `fix(driver-pi): deny service-worker authority on verified loopback origins`

- retain one exact Dist that may be hosted locally or deployed on public HTTPS; do not create separate
  web and loopback bundles merely to change browser capability;
- replace unconditional production registration with the canonical `@sys/http/client` admission
  result and call `register(...)` only for an admitted public HTTPS context;
- make the same `sw.js` branch on canonical policy: public HTTPS composes the namespace-confined
  package cache; loopback and denied contexts call neither `Http.Cache.pkg` nor
  `Http.Cache.Cmd.listen` and remain inert tombstones with no fetch/message handlers or
  `clients.claim()`;
- start verified loopback hosting with fixed worker-denying browser policy, including CSP enforcement;
- treat typed registration output as browser observation only; trust remains in host response policy
  and verified bytes;
- add a declared isolated-profile real-browser task over the preceding `@sys/testing/server` scenario
  surface with a dedicated permission profile for temporary-profile read/write, browser process launch,
  `CHROME_BIN` discovery, and loopback CDP/fixture access; state that Deno's parent `net` allowlist does
  not sandbox the launched browser's network, and do not broaden unit-test permissions or substitute
  `-A`, DOM mocks, one-shot page-load output, or a human's default browser profile;
- prove local host CSP denial, a fresh-profile no-controller case, unrelated-cache preservation, and
  migration from the currently checked claiming-worker fixture to owned-cache cleanup and eventual
  unregister; retain same-byte public registration as the final trusted-provider proof rather than
  weakening TLS or secure-context validation in a local fixture;
- keep the bootstrap permanently worker-free under its independent stricter policy.

### `feat(fs): expose owned-tree lifecycle leases`

- add a Rooted-owned typed lease over admitted directory targets with shared and exclusive acquisition,
  explicit release, busy/cancelled/unsupported settlement, and no PID-file or process-name inference;
- derive lock identity from the canonical Rooted parent plus admitted target and keep the stable lock
  file in Rooted-owned parent metadata outside the deletable target; never delete or replace a lock
  file while another process could still hold its inode;
- let released sessions hold a shared target lease and reset acquire exact canonical and
  observed-legacy targets exclusively in deterministic order; process death must release OS ownership
  without stale-boolean cleanup;
- preserve canonical path, root/target identity, symlink refusal, and unsupported-platform truth, and
  expose only the high-level capability rather than raw `Deno.open` or `FsFile.tryLock` composition;
  released startup and reset fail closed when owner locking is unsupported;
- test shared/shared admission, shared/exclusive refusal, deterministic multi-target ordering,
  cancellation, process-death release, target deletion while exclusively held, identity replacement,
  and unsupported filesystems.

### `feat(fs): expose sealed owned-tree publication and removal`

- add the smallest Rooted-owned capability that recursively applies and inspects sealing on an admitted
  owned tree, including a staged tree before publication and a valid generation that predates this
  feature, while preserving canonical path, identity, race, cancellation, and committed outcome
  evidence;
- define typed applied/unsupported evidence rather than assuming POSIX `chmod` semantics on every
  platform; a platform that cannot prove the contract must not silently report sealing;
- add identity-confined removal of an admitted owned tree, including a sealed published target or an
  owner store containing sealed descendants, alongside retained private-stage cleanup; removal must
  restore only the minimum permissions required inside that exact target and must not broaden ancestor
  or sibling permissions;
- state explicitly that sealing resists accidental ambient mutation and is not an OS sandbox or a
  boundary against a hostile same-user process;
- test nested trees, symlink/identity races, cancellation before and after commitment, applied and
  unsupported platforms, cleanup retry, mixed sealed-descendant removal, and exact removal
  confinement.

### `fix(server.dist): publish Dist generations through sealed promotion`

- preserve `assertExactTree` and its rejection of every undeclared entry; never ignore `.DS_Store`,
  `desktop.ini`, `Thumbs.db`, or other residue inside a verified generation;
- request lower sealed promotion for every newly materialized generation and carry typed applied seal
  evidence in successful materialization settlement;
- for a freshly verified pre-existing generation, inspect sealing and apply it under the lower target
  lock when absent, then perform another exact-tree verification before returning success; this local
  metadata migration performs no source or credential work and never makes an invalid occupied tree a
  repair candidate;
- on a platform where the lower owner reports sealing unsupported, return honest typed failure or
  explicitly withhold the warm-cache durability claim; never silently claim protection;
- preserve an occupied corrupt generation and require explicit reset rather than automatic discard,
  reachability probing, or reacquisition;
- make reset consume only the lower owned-removal capability for the sealed representation;
- test ambient root/nested entry attempts, unsupported settlement, promotion races, valid unsealed
  legacy migration, applied-evidence snapshotting, final verification, reset removal, and unchanged
  exact-tree refusal.

### `feat(driver-pi): admit GUI Dist identity from frozen launcher evidence`

- extend the frozen launcher-owned materialization evidence with exact expected package name/version;
  keep the complete URL/pin/identity tuple outside the Vite browser graph and expose no profile,
  environment, browser, or per-field override;
- validate and snapshot the complete evidence before asynchronous work, materialize only from that
  source, and refuse package/Dist identity skew before application-host startup or redirect;
- keep the compile-time transitional localhost pair explicit until actual published evidence replaces
  it. Its exact pin remains authority, but it is not immutable HTTPS release evidence and cannot make a
  release proof green; neither a fixture nor the current test/splash artifact may be relabeled as the
  product artifact;
- prove malformed/partial input refusal, expected identity admission, skew refusal, immutable
  snapshotting, and no release-to-development or previous-generation fallback;
- implement no provider upload, production graph fulfillment, generated production evidence, or package
  publication in this item.

### `feat(server): expose an inert loopback bootstrap status host`

- expose a product-neutral `@sys/server` primitive over `127.0.0.1:0` using the lower exact-loopback
  origin mode; Driver Pi remains owner of page bytes, wording, state categories, and composition;
- internally generate one launch-scoped cryptographically random path capability and return its URL;
  accept no caller token or query authority, and expose only side-effect-free `GET`/`HEAD` observation
  plus strict unknown-route `404`;
- select among finite immutable response bytes or one trusted redirect from a synchronous state
  snapshot; map resolver failure to fixed sanitized `500` bytes and provide no template interpolation,
  proxy, retry, reset, source, filesystem, or credential endpoint;
- return `303` only from caller-supplied ready state and only to a pre-admitted loopback origin;
- apply strict no-script/no-worker CSP, CORP, framing, referrer, MIME, cookie-independent, and
  `no-store` policy to every response; reject cross-site Fetch Metadata when present;
- own an idempotent cancellable listener lifecycle without owning the caller's application state;
- test capability entropy/shape, stale and unknown paths, methods, fixed bytes, redirect admission,
  headers, cross-site requests, cancellation, close races, and leak-free settlement.

### `feat(driver-pi): supervise start:gui through one boot state`

- start the generic status host before authority settlement and project one Driver Pi host state value
  into terminal and finite package-owned browser variants;
- use only `preparing`, `starting-app-host`, `ready(origin)`, `failed(category, safeEvidence)`, and
  `stopping`; do not invent internal materializer progress that the lower API does not expose;
- bind terminal controls before attempting browser open; invoke the opener exactly once, retain a
  failed opener as secondary presentation evidence, print the capability URL, and continue securely;
- settle one frozen release or development mode, admit expected package identity, and start the Dist
  host before publishing `ready`; released sessions consume the lower Rooted target API to hold one
  OS-backed shared owner lifecycle lease that reset must acquire exclusively, never raw lock calls or a
  PID-file heuristic;
- keep refresh observational, retain failure in foreground, and add no browser mutation;
- close application host before status host and dispose keyboard, screen, timers, and cancellation
  through one shared idempotent lifecycle; successful closure proves absence, while a rejected lower
  close retains typed unresolved-listener evidence and triggers remaining independent close attempts;
- test state transitions, two projections, malformed-authority status, first-request-ready, nonfatal
  opener failure, bootstrap bind failure, no-application failure, listener death after ready,
  cancellation, cleanup precedence, unresolved-close evidence, and no duplicate attempt or browser
  open.

### `feat(driver-pi): bind local GUI preview directly to Vite build evidence`

- keep `deno task dev` as source/HMR and `deno task serve` as a standalone verified local preview;
  neither is an acquisition provider for `start:gui`;
- add explicit package task `deno task start:gui:preview` whose `Vite.build` orchestration lives under
  `-scripts/`; it snapshots the exact output directory, `manifest.integrity`, and package identity,
  then passes only that prepared-generation authority to the GUI supervisor. The published `src/`
  graph never imports `@sys/driver-vite` or contains build orchestration;
- call pinned `DistServer.start` over that directory and exact build pin; do not call
  `Dist.materialize`, fetch `/dist.json`, start a port-8080 source, or write the release generation
  store;
- keep development and release input types structurally disjoint and prevent any automatic selection,
  fallback, per-field merge, or published-build ambient checkout discovery;
- freeze one build snapshot rather than rebuilding beneath an active host; later builds produce new
  authority and a new session;
- test consecutive pin rotation, exact direct hosting, wrong pin, output mutation before/after startup,
  no network/store work, and release graph isolation.

### `feat(driver-pi): expose scoped start:gui Dist reset`

- expose a package-owned `jsr:@sys/driver-pi/start/gui/reset` executable from an explicit leaf export
  plus a repository-local `deno task start:gui:reset` alias; neither enters the default TUI import graph,
  both use the launcher's canonical cwd/git-root resolution, and neither accepts an arbitrary store
  path;
- target the canonical `<runtime-root>/.pi/@sys/dist/@sys.driver-pi` tree and deliberately handle the
  observed legacy `<runtime-root>/.pi/@sys/dist/@sys/driver-pi` tree as the same product. Both exact
  roots exist in the adjudicating workspace with the same
  `sha256-07d24ba144edb1f84eb2db14b10fcd3c3470775ee389b518c0ae9a9b5b2ddfbc` generation and
  `@sys/driver-pi@0.0.131` manifest; this is live deployment evidence, not a claim that reachable Git
  history created the spelling;
- report both exact targets and remove each only after its own descendant and identity guard; use no
  wildcard sibling matching and never remove the shared `@sys` parent;
- acquire exclusive lower-owner leases for both targets in deterministic order against shared leases
  held by released GUI sessions, and refuse before deletion if either is busy; use no raw lock file,
  PID file, process-name probe, or stale boolean;
- give the local reset task only the read/write/runtime-root authority required by that leaf; do not
  probe source reachability, evaluate credentials, or require network availability before reset;
- safely remove the lower-owner sealed representation and private stages while leaving menu state,
  logs, agent state, sibling Dist owners, and the rest of `.pi` untouched;
- make both missing targets successful and idempotent; warn that reset destroys all Driver Pi warm
  offline generations, print the published executable in repair guidance, and never invoke it as
  automatic source or integrity recovery;
- keep active-generation-only repair out of this cold-start contract unless later field evidence
  justifies a separately named operation;
- test nested/package cwd, published and task invocation surfaces, exact observed-legacy handling,
  confinement, symlinks/identity changes, sibling preservation, repeated absence, active-lock refusal,
  OS lock release after process death, offline reset, reacquisition, and deterministic
  source-unavailable failure.

### `feat(driver-pi): diagnose unavailable start:gui manifest sources`

- preserve the exact base contract
  `start:gui materialization failed: manifest-fetch/resource-failure`;
- use only cautious generic source guidance: the current `resource-failure` result cannot distinguish
  connection refusal, HTTP `404`, or generic HTTP failure; retain `timeout` only where the lower API
  actually reports it;
- retain safe lower evidence such as `stage`, `reason`, `cleanup`, and `publication` without exposing
  raw causes, credentials, headers, URLs with secrets, manifest bytes, pins, or absolute host paths;
- distinguish malformed release configuration, which fails before materialization, from sanitized
  manifest-fetch failure;
- map the tuple to finite browser categories while retaining exact safe terminal evidence; do not claim
  a literal HTTP status, tampering, or navigation result that lower evidence cannot prove;
- change this vocabulary only after a separately reviewed lower typed API carries sanitized status
  evidence; do not infer it in Driver Pi;
- reference reset only for occupied invalid-generation evidence, not generic fetch failure;
- test unavailable/refused/HTTP-error fixtures, malformed configuration, occupied-generation guidance,
  exact stable message equality, status-host persistence, and unchanged successful/menu behavior.

### `refactor(http): fit direct service startup output to terminal width`

- fix the actual direct path `DistServer.start → HttpServer.start → HttpServer.print`; Cell-owned
  services start silently and render through a different formatter;
- constrain every emitted line to the effective terminal width while retaining useful root, URL,
  module, detail, keyboard, and divider information;
- measure ANSI, emoji, wide, and combining text with `Cli.Fmt.Text.Width.measure`, never JavaScript
  `.length`;
- preserve non-TTY byte-complete output and all request, response, authority, and lifecycle behavior;
- test tiny/normal widths, long fields, multiple blocks, Unicode, ANSI, and non-TTY output;
- keep Cell's existing renderer out of scope unless shared code is introduced; its remaining `.length`
  decisions are an adjacent Unicode-width risk, not evidence that DistService owns this output.

### `feat(driver-pi): bind published GUI Dist evidence for release`

- treat this as the final human-gated arc item: freeze the Driver Pi release version and authorized
  production browser graph, build one GUI Dist candidate, and require its embedded package identity to
  match before publication;
- require the production entry to exclude test/DevHarness roots and apply the explicit dual-context
  service-worker policy before calling the artifact release-ready;
- retain exact generated manifest bytes and bind an immutable/versioned HTTPS URL with no userinfo,
  query authority, or fragment plus their exact integrity into launcher-owned evidence distributed
  independently from artifact fetch;
- upload the unchanged artifact first, fetch and verify its published manifest/assets against build
  evidence, then generate the launcher evidence leaf outside the Vite application graph, replace the
  transitional tuple as one complete value, and publish the package without rebuilding the GUI or
  retaining a runtime fallback;
- require the manifest and immutable assets to remain on the provider's one exact artifact hostname,
  deny redirects to unlisted hosts, add that hostname to the named CLI permission surface, and prove
  cold acquisition there; separately freeze the normally trusted public-web proof origin as browser
  scenario input. The two origins may coincide but are not assumed identical, and a published `-A`
  invocation is never narrow-permission evidence;
- execute the same exact Dist under verified-loopback policy and normally trusted public HTTPS policy,
  observing local denial and public registration without certificate or secure-context bypass;
- never use mutable `latest`, runtime TOFU, provider-supplied authority, post-pin mutation, previous
  generation fallback, or release-to-development fallback;
- keep provider mechanics outside Driver Pi while making provider identity, URL immutability, retention,
  and overwrite refusal explicit release inputs;
- prove package/Dist identity, exact remote pin equality, same-byte local/public hosting policy,
  frozen-artifact publication, cold acquisition, warm offline reuse, and tamper refusal.

### `feat(driver-pi): split profile start modes`

- extend type unions before runtime branching;
- retain the landed top-level `Help`, `Ran`, `Ui`, and `Exit` result variants; any future result
  namespacing requires a separate explicit refactor;
- replace internal menu action `run` with `start:cli` and add `start:ui`;
- preserve `start:cli` as default;
- route direct/non-interactive profile selection to CLI mode;
- lazy-import and await the runtime helper only for interactive UI mode;
- update menu, main, help, and compatibility tests;
- make no product UI or Dist-content change.

### `feat(driver-pi): persist interactive start-mode preference`

- define a launcher-owned preference state file at `.pi/@sys/state/@sys.driver-pi/menu.json` with shape
  `{ selectedMode, '.meta' }` keyed by runtime-root, using one persisted value per project.
- write the selected `start:*` action after successful selection (or pre-launch handoff);
- read and seed `YamlConfig.menu.defaultAction` from persisted state; fallback to `start:cli` on miss;
- add tests for read/write lifecycle, fallback determinism, and persistence safety when state is
  missing/corrupt/unauthorized.

## Proof

The retired prerequisites own their lower contracts. Completion proof remains owner-scoped:

- `start:tui` launches exactly the existing child flow;
- `start:gui` snapshots one structurally closed development or release mode without per-field merge;
- release alone materializes into the owner store; development directly hosts the exact completed Vite
  output and build pin with no network or store mutation;
- the trusted host owns one state value; terminal and browser status are projections, not competing
  state machines;
- `start:gui` launches no Pi child, prints no false Pi-child authority, attempts browser open once,
  redirects only after verified-host settlement, waits, proves leak-free successful closure, and
  preserves primary plus unresolved-resource evidence on failed cleanup;
- opener failure leaves a secure usable session and printed capability URL rather than destroying
  verified work;
- the browser never selects, fetches, pins, verifies, promotes, repairs, resets, retries, or hosts
  artifact authority;
- the exact same Dist bytes deny service-worker authority under verified loopback policy and may admit
  it only under explicit public-HTTPS policy;
- no browser or worker observation is accepted as proof of absent prior control;
- promoted generations resist accidental ambient writes while exact-tree verification remains strict;
- a verified release generation starts with zero source and credential work while every source is
  unavailable;
- whole-owner reset is exact, explicit, offline-independent, and includes only the canonical and
  live-observed legacy Driver Pi owner spellings;
- direct/non-interactive profile selection remains TUI mode;
- default TUI imports remain free of server/browser runtime modules;
- Driver Pi contains no `@sys/tools`, raw filesystem lock, or reimplemented lower-kernel dependency;
- named task permissions support each real Deno path, final release adds only the selected artifact
  hostname to CLI, and browser proof does not mislabel the launched Chrome network as Deno-sandboxed;
- real loopback and browser proofs exercise policy, materialization, hosting, redirect, cancellation,
  and worker migration rather than relying on mocks;
- Server Dist tests complete without the Deno legacy-abort warning;
- direct HTTP startup output fits measured terminal-cell width.

Verify narrow-first at the owner changed by each item, then run the full module surface:

```text
code/sys/fs                  deno task check
code/sys/fs                  deno task test

code/sys/http                deno task check
code/sys/http                deno task test

code/sys/testing             deno task check
code/sys/testing             deno task test

code/sys/server              deno task check
code/sys/server              deno task test

code/sys.driver/driver-pi    deno task test:profiles
code/sys.driver/driver-pi    deno task test:browser
code/sys.driver/driver-pi    deno task check
code/sys.driver/driver-pi    deno task test
```

`@sys/driver-vite` remains an unchanged-owner regression surface: run its `deno task check` and
`deno task test` after the script-only preview composition, but do not imply that this arc changes its
build contract.

Green mocked Driver Pi tests are not sufficient proof of network permission, build evidence, filesystem
sealing, materialization, browser policy, listener startup, fetch, shutdown, redirect, worker behavior,
or leaks. The capstone uses the real lower owners. Browser open, responsive terminal rendering, fixed
status-page selection, and keyboard edges remain injected where OS/browser effects are not under test;
no adapter may reproduce lower materialization, verification, hosting, or service-worker policy.

Required development, cold/warm, lifecycle, and browser-security matrix:

```text
development: completed build + matching pin       → direct verified host; no fetch/store write
development: consecutive builds                   → distinct exact pins and sessions
development: wrong pin or pre-start mutation      → no application listener
development: post-start asset mutation            → changed-byte refusal; no changed bytes emitted

release: empty store + source available           → materialize, identity-admit, redirect
release: empty store + source unavailable         → status failed/source-unavailable; no Dist execution
release: verified generation + every source down  → zero source/credential work; redirect offline
release: wrong manifest pin                       → authority refusal; no asset execution/promotion
release: tampered manifest or asset               → refusal; cleanup complete or honestly pending; no app host
release: package/Dist identity skew               → refuse before browser redirect
occupied invalid generation + source available    → preserve occupied tree; no automatic reacquire
occupied invalid generation + every source down   → repair guidance; preserve only offline evidence
valid pre-sealing generation                      → local seal migration + fresh verify; zero source work
ambient undeclared file attempt                   → prevented where supported or freshly refused exactly
target locking unsupported                        → startup/reset refuse before store access or deletion
sealing unsupported                               → typed settlement; no silent warm-durability claim

published reset executable + local task alias     → same canonical runtime root and exact targets
reset canonical + observed legacy roots           → only exact Driver Pi owner trees removed
reset while released session lease is held         → refuse without deleting either tree
reset after owning process death                   → OS releases lock; confined reset succeeds
reset while every source is unavailable           → reset succeeds; next launch fails deterministically
reset then release source available               → clean reacquisition
repeated reset with both roots absent              → idempotent success

materialization ready before first status GET      → first valid GET returns 303 after host settlement
browser opener failure                            → URL printed; secure session remains live
status bind failure                               → no opener, settlement, or orphan listener
application start delayed                         → status remains observational; no early redirect
application listener terminates after ready       → retained host state records failure; no fallback
cancellation during stage/promotion               → lower publication truth retained; no post-cancel host
shutdown with both listeners                      → application closes once, status closes once afterward
cleanup or listener-close failure                 → primary remains; unresolved resources stay explicit

unknown/stale status capability                   → fixed no-store 404; no state change
unknown verified-Dist route                       → strict no-store Dist 404
wrong Host or localhost alias                     → 421 before route handling
cross-site Fetch Metadata                         → fixed rejection; no status/application disclosure
missing Fetch Metadata from direct client         → canonical Host policy still applies
local responses                                   → fixed CSP/CORP/framing/referrer/cookie-independent policy

unrelated same-origin cache                       → survives admitted activation and denied tombstone
fresh isolated local browser profile              → registration denied; no controller installed
legacy claiming-worker browser scenario           → observed owned cleanup/unregister; not attestation
published/preview local-worker migration gate      → no release without no-exposure or fresh-origin proof
trusted provider HTTPS + exact same Dist           → identical pin; admission and normal registration
browser fixture certificate validation             → ordinary trust succeeds; no validation bypass
bootstrap origin                                  → no script, worker, storage, form, or mutation surface
```

# Deferred product-artifact design

This section records deferred product-artifact design without promoting it into the current TODO arc.
The opening arc remains the complete implementation-and-release ledger. Runtime admission of frozen
launcher evidence and every item before final publication are independently implementable with neutral
fixtures. The final published-evidence item is deliberately
last and cannot complete until the human-authorized production entry and provider gates below are
fulfilled; it does not block reset, diagnostics, or unrelated cleanup work. A fixture or current
test/splash graph cannot be relabeled as the product GUI merely to make release green.

## Pi UI component boundary

The selected component noun is `App` at:

```text
code/sys.driver/driver-pi/src/ui/m.App/
public product owner: @sys/driver-pi/ui
runtime surface: App.UI
```

The human initiates `m.App` with the current `@sys/tmpl` `m.mod.ui` scaffold and component name
`App`. The generated scaffold lands by itself before fulfillment.

`App` is a pure renderer:

```text
App.Props snapshot → markup
```

First-slice public props are only:

- `theme?: t.CommonTheme`;
- `style?: t.Style.Input`.

There is no profile path, profile YAML, filesystem handle, process handle, server handle, source URL,
or integrity value in browser props. The first product UI receives no selected-profile boot data.
Future boot data requires a separately designed, bounded host seam; it must not be improvised through
query strings or mutable static files.

The first fulfillment is intentionally small: a full-host Pi application shell showing canonical
product/package identity and version, with no fake controls, fake connection state, or placeholder
pig/hello copy. It renders at real viewport bounds and remains useful as the production smoke surface
for the verified host.

Template rules:

- define `App.Lib` first in `t.ts`, with `UI` as the primary runtime member;
- retain `D`/`DEFAULTS` identity and use `D.displayName` for `data-component`;
- resolve theme once per render;
- use `@sys/ui-css` through local `common.ts`;
- remove template `debug`, storage, scoped stylesheet, and debug-control affordances unless the
  fulfilled App genuinely needs them;
- keep DevHarness state in `-spec`, never in the production renderer.

## Production browser graph

The current entry mixes production, DevHarness, splash, and unconditional service-worker behavior.
The product component remains deferred, but service-worker authority is not deferred because it
crosses the host/browser trust boundary. The target graph is:

```text
src/index.html
  → src/ui/entry.tsx
      → App.UI
      → canonical service-worker admission
          public HTTPS admitted → register the Dist's sw.js
          verified loopback denied → no registration
      → development-only dynamic DevHarness branch guarded by import.meta.env.DEV

sw.js
  → canonical deployment policy
      public HTTPS admitted → package cache
      denied/loopback       → inert tombstone and unregister
```

Deferred product-entry rules, enforced before artifact release:

- `src/index.html` references `./ui/entry.tsx`, never `./-test/entry.tsx`;
- `src/ui/entry.tsx` mounts `App.UI` for production;
- DevHarness is imported only when `import.meta.env.DEV` is true and the explicit dev query is
  present;
- production tree-shakes DevHarness and contains no module rooted under `src/-test`;
- the placeholder splash/test coupling is removed without creating a second Dist build;
- `sw.js` may remain in the exact shared Dist only under the live arc's fail-closed admission,
  tombstone, migration, and host-enforcement contract;
- normal product startup never runs Vite, reads ambient source, or serves the checkout;
- verified loopback responses remain `no-store`; a public HTTPS host owns its separate web caching
  response policy without mutating artifact bytes.

The Vite build remains the canonical producer of `dist/dist.json`. Build output is a frozen candidate,
not a checked-in runtime source directory or mutable authority receipt.

## Release ordering and rebuild truth

`dist.json` contains build metadata such as time, so its exact integrity identifies one frozen
artifact and is not expected to survive a rebuild:

```text
development preview
  Vite.build once
    → exact output directory + saved dist.json + manifest.integrity + package identity
    → pass prepared-generation evidence directly to the development GUI supervisor
    → DistServer.start(dir + exact pin)

release
  freeze Driver Pi release identity and browser graph
    → build candidate once
    → require embedded Dist package identity to match
    → capture exact saved dist.json integrity
    → publish unchanged artifact at an immutable/versioned URL
    → fetch and verify published bytes against build evidence
    → generate URL + pin in a launcher evidence leaf outside the Vite graph
    → publish the launcher package without rebuilding the GUI
```

A later build creates a new candidate and integrity. It does not replace already-pinned evidence.
Mutable `latest` URLs, TOFU pins, authority fetched from the artifact endpoint, post-report manifest
rewrites, and separate local/web bundle rebuilds remain forbidden.

## Human release gates

Code evidence cannot choose or silently erase these gates:

- **First-ever full-GUI offline:** default remains no; choosing yes means shipping matching Dist bytes
  with the package and admitting them through the same verification/store path.
- **Immutable artifact provider:** release needs one concrete versioned path namespace, one exact
  manifest/resource hostname with no unlisted redirect, a retention promise, separately confined
  credential policy, and overwrite refusal before the published-evidence item can complete; URL query
  tokens are not release identity. That hostname must enter the named CLI permission surface.
- **Public HTTPS proof origin:** select one normally trusted non-loopback origin that serves the
  unchanged Dist under public-web response policy and freeze it as dedicated browser-scenario input; it
  may coincide with the artifact provider but is not assumed to. Deno's parent permission profile is
  not represented as a sandbox for Chrome's child-process network.
- **Prior local-worker exposure:** inventory the exact authorities returned or admitted by published
  builds and local `deno task serve` previews. Current hosting returns `localhost` even when bound to
  `127.0.0.1`; moving to canonical numeric loopback with exact Host refusal may qualify as the reviewed
  fresh-origin migration only if evidence shows the numeric authority was not previously exposed as a
  product origin. Otherwise a separately proven fresh-origin/site-data migration is mandatory;
  tombstone self-report is insufficient.
- **Production GUI entry:** the human-authorized product entry must replace the current test/splash graph
  before publication; boot-pipeline fixtures are not the product.
- **Durable product state:** ephemeral application origins intentionally provide no durable browser
  storage identity. Any requirement for persistent GUI state needs a separately designed host-owned
  seam or stable-origin threat model; it must not silently change the port policy.
- **Supported filesystem floor:** release must name the supported OS/filesystem set. Owner-locking
  `unsupported` always fails startup/reset closed; for sealing `unsupported`, the human must decide
  whether to refuse release or explicitly withhold the warm-cache durability claim. The implementation
  cannot silently choose.

## Stop conditions

Stop rather than broaden or weaken the slice if:

- the `Dist.materialize` or pinned-host typed surface remains disputed;
- release URL/integrity or development directory/pin authority would enter profile YAML, environment,
  browser state, mutable global state, or an ad hoc receipt file;
- development and release could be per-field merged, inferred from an available port/directory, or
  used as fallbacks for each other;
- the browser would select a source, receive a pin, pull artifact bytes, initiate repair/reset/retry,
  or report its own worker state as trust proof;
- status and verified application authority would share one ambiguous origin, proxy, route namespace,
  cache, or service worker, or would use host-scoped cookies as cross-port authority;
- fixed or integrity-derived ports would be treated as cryptographic or generation identity;
- local worker denial depended only on `sw.js` voluntarily disabling itself rather than independent
  host enforcement, or a prior published local worker lacked an explicit fresh-origin/site-data
  migration gate;
- exact-tree verification would be relaxed to tolerate ambient filesystem residue;
- reset would probe the network, use wildcard sibling deletion, keep its lock inside a deletable owner
  tree, or run automatically as recovery;
- Driver Pi would need to import `@sys/tools`, call raw filesystem lock primitives, or compose lower
  hash/path/HTTP/filesystem kernels;
- a generic server policy would become an arbitrary caller header map or one CSP would be silently
  imposed on incompatible consumers;
- service-worker or CSP safety would be claimed from DOM mocks, one-shot browser-load output, a human's
  default browser profile, disabled certificate validation, or weakened secure-context checks;
- settled cleanup or close rejection would be relabeled as proof that a private stage or listener is
  absent;
- a test requires product UI redesign beyond the explicit production-entry/service-worker release
  invariant;
- `start:tui` compatibility cannot remain exact;
- the human-gated final publication item would block reset, diagnostics, or independent hardening work;
- another umbrella plan appears necessary instead of tightening this governing anchor.

## Fixed decisions

- URL is location; exact manifest integrity is release generation authority.
- Development preview is a prepared local generation: exact Vite output directory, exact build pin,
  and expected package identity hosted directly with pinned `DistServer.start`.
- Release is immutable URL + exact pin → `Dist.materialize` → expected identity admission → pinned
  `DistServer.start`; it never falls back to development or an older generation.
- Development and release are closed disjoint input variants, never profile, environment, CLI-flag,
  selected-profile, browser, or per-field merge authority.
- The trusted host supervisor is the control plane; the bootstrap is a read-only status projection;
  the verified Dist is the separate application origin.
- Both listeners use ephemeral numeric-loopback origins. The bootstrap additionally uses a
  launch-scoped path capability that carries presentation authority only. No durable browser-storage
  identity is promised; persistent product state requires a separately designed host seam.
- One host state value drives terminal and browser projections. No layer invents lower progress.
- The browser never selects, fetches, pins, verifies, promotes, repairs, resets, retries, or hosts
  artifact authority.
- One exact Dist may serve public HTTPS and verified loopback contexts. Public worker behavior requires
  explicit admission and package-confined cache ownership; verified loopback worker authority is
  denied independently by application and host policy; browser reports are not attestation.
- The bootstrap contains no script, worker, storage, form, mutation, remote import, or application
  bytes.
- First-ever offline startup guarantees the bootstrap status surface; full GUI offline startup
  requires an already verified release generation unless package-local bytes are chosen later.
- Promoted generations remain exact trees and gain ambient-mutation resistance without claiming an OS
  sandbox or automatic recovery. The durable warm-cache claim requires applied sealing evidence on the
  supported platform; unsupported sealing cannot be hidden.
- Released sessions and reset coordinate through lower Rooted target leases whose stable lock identity
  remains outside deletable owner trees; Driver Pi performs no raw locking.
- Reset is whole-owner, explicit, offline-independent, idempotent, and confined to the canonical and
  exact live-observed legacy Driver Pi store IDs.
- Generic source-unavailable wording remains until lower typed evidence proves a narrower status.
- Materialization, verification, browser-response limits, and store identity remain fixed launcher
  authority.
- Interactive start-mode preference remains launcher state at
  `.pi/@sys/state/@sys.driver-pi/menu.json`.
- Browser opening proves detached-opener spawn only; failure is nonfatal presentation evidence and the
  terminal prints the capability URL.
- Successful cleanup proves absence; `cleanup: 'pending'` or listener-close rejection remains explicit
  unresolved-resource evidence and never becomes a no-residue claim.
- Request cancellation in the current Dist/Hono layer is server-lifecycle cancellation, not client
  response-delivery completion.
