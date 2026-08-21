start-ui-release-evidence.plan.md
- [ ] [start-ui.design.md](start-ui.design.md)
- [ ] feat(driver-pi): serve the GUI Dist source on localhost for development
- [ ] feat(driver-pi): bind local GUI Dist evidence through the release path
- [ ] GATE release owner selects immutable artifact provider/path, public HTTPS proof origin, browser/filesystem floors, and prior-local-worker migration
- [ ] feat(driver-pi): bind published GUI Dist evidence for release

## Purpose

Finish Driver Pi GUI release evidence in two honest stages:

1. make the complete release acquisition path work against an operator-owned
   `http://localhost:8080` Dist source; then
2. replace only the local publication assumptions once real immutable hosting and public HTTPS proof
   authority exist.

The first item is a development release-path rehearsal, not a public release claim. The second item
remains human-gated. Planning and readiness do not authorize implementation, publication, or Git
mutation.

## Foundation

[start-ui.design.md](start-ui.design.md) owns the landed launcher, materialization, verified-host,
boot-state, browser-policy, reset, diagnostics, preview, and lifecycle architecture through
`969df90c9 refactor(http): fit direct service startup output to terminal width`. Its unchecked
failed-exit follow-up must land before this successor begins. This plan consumes the completed
predecessor contracts without reopening or restating their internal commit history.

Current repository truth at plan creation and handoff:

- `START_GUI_SERVICE` already selects the release variant and
  `http://localhost:8080/dist.json`, but its transitional package expectation and manifest pin do not
  describe the current checked-out Dist;
- after the human ran reset and launched a fresh real session, the terminal correctly displayed
  `failed: source-unavailable` with
  `manifest-fetch · resource-failure · cleanup:not-needed`; that evidence proves only that the
  manifest request failed, not why it failed;
- the existing verified application-host surface deliberately does not expose `dist.json`. It cannot
  become the development artifact source merely by running on port `8080`, and its application
  security contract must not be weakened to make acquisition work;
- `src/index.html` still names `./-test/entry.tsx`, and that entry mixes production Splash,
  development DevHarness, and Service Worker startup concerns. This remains product/publication debt,
  not a dependency of the post-build local substrate proof;
- `deno task build` is the existing explicit producer of a fresh `dist/` candidate. Neither the
  development source nor `start:gui` may build or mutate that candidate;
- the local `:8080` source lifecycle is operator-owned development infrastructure. Driver Pi must
  consume it but must not silently start it, infer trust from its presence, or fall back when it is
  absent;
- local verified-loopback policy is already authoritative. Public HTTPS Service Worker registration
  remains unproved until the final item.

## Fixed authority

- `localhost:8080` is the exact development artifact origin for the first item. The manifest URL is
  `http://localhost:8080/dist.json`; manifest and declared assets remain on that origin.
- The launcher consumes one frozen tuple: manifest URL, exact manifest integrity, and expected
  package identity. It never obtains its pin or expected identity from the artifact endpoint.
- The tuple remains launcher-owned compile-time evidence, outside profile YAML, environment, CLI
  flags, browser state, and runtime discovery.
- The local source is location, not trust. Exact manifest bytes, their independently captured pin,
  package expectation, and lower verification remain authority.
- Release and development input variants stay disjoint. This rehearsal exercises the release variant
  and does not replace the direct-build development preview.
- The local milestone begins with one already-built, frozen, internally coherent `dist/`. It
  authenticates, materializes, and executes those selected bytes; it does not attest source-code,
  bundler, or product-UI correctness.
- Reset remains explicit checkout maintenance. It is recovery before a fresh cold acquisition, not a
  way to reproduce `repair-required` and not an automatic retry.
- A stopped or unreachable `:8080` source after reset must remain `source-unavailable`. No cache-reset
  guidance is added to source failures.
- No runtime fallback to an older generation, development directory, mutable URL, or provider result
  is permitted.

## `feat(driver-pi): serve the GUI Dist source on localhost for development`

- Add one development-only package task that serves the built Driver Pi Dist as an acquisition
  source at exactly `http://localhost:8080`.
- Serve exact saved `dist.json` bytes at `/dist.json` and every manifest-declared part at its exact
  relative path as observed through the platform-normalized `Request.url`. Admit only those resulting
  routes; refuse every malformed, invalid, or undeclared path that survives normalization. A raw
  target normalized to an admitted route has only that canonical route's authority.
- Fail visibly when `dist/` or `dist.json` is absent, or when the manifest cannot yield one confined
  declared-route set. Never invoke the build, silently replace the candidate, or pre-attest its
  integrity; missing or changed part bytes remain evidence for the consuming verifier to refuse.
- Keep this source distinct from `DistServer` application hosting. Do not expose manifest metadata
  from the verified application origin or weaken its Host, browser-response, routing, pin, or
  `no-store` contracts.
- Reuse existing lower HTTP and checked-read primitives where they fit; add no generic publisher,
  upload API, provider framework, runtime configuration surface, or source discovery.
- Bind the exact fixed port or fail visibly if it is occupied. Do not select another port and then
  mutate launcher evidence to follow it.
- Keep lifecycle operator-owned and development-only. The task starts the source, prints its exact
  URL, retains foreground ownership, and shuts down cleanly on trusted quit; `start:gui` never starts
  or controls it.
- Source serving proves location and bytes only. It does not generate or supply launcher trust,
  claim immutability, mutate the candidate, or authorize package identity.

Focused proof:

```text
GET /dist.json                    → exact saved manifest bytes
GET each declared part            → exact saved asset bytes
HEAD declared path                → matching metadata and no body
raw alias normalized to a route   → canonical route outcome only
surviving invalid/undeclared path → fixed refusal; no application bytes
substrate-rejected raw target     → no application bytes; substrate owns its status
missing/malformed source manifest → visible startup failure; no build attempt
missing declared part             → fixed refusal; no build attempt
port 8080 occupied                → visible startup failure; no fallback listener
trusted quit                      → listener closes once without an uncaught stack
```

Before any destructive reset in the real integration, positively fetch
`http://localhost:8080/dist.json` through the same named CLI network authority and compare it with
the frozen candidate. A green application page at `/` is not source readiness evidence.

## `feat(driver-pi): bind local GUI Dist evidence through the release path`

### Frozen candidate and evidence

- Take one candidate already produced by the existing `deno task build` surface and freeze its exact
  generated `dist.json` bytes before changing launcher evidence.
- Verify the candidate locally and require its embedded package identity to equal the independently
  selected Driver Pi package expectation.
- Generate the launcher evidence leaf outside the Vite application graph from the owner-selected
  local manifest URL, exact saved-manifest integrity, and package expectation.
- Replace the transitional tuple as one complete value after the candidate exists. Updating evidence
  must not rebuild or mutate that candidate.
- Serve the unchanged candidate through the preceding fixed development source at
  `localhost:8080`; do not route acquisition through the verified application host.
- Keep source lifecycle human-owned: the operator starts and stops `:8080`; `start:gui` only consumes
  the source or the verified cache.
- Use the existing narrow localhost CLI network authority. Do not widen permissions or publish an
  `-A` invocation as proof.

### Local proof

Prove the actual state transitions, not just generated strings:

```text
source running + reset store         → cold fetch, exact verification, promotion, ready GUI
source stopped + verified generation → zero source work, warm offline ready GUI
source stopped + reset store         → source-unavailable; no GUI execution or reset guidance
wrong manifest pin                   → authority refusal; no promotion or GUI execution
changed served manifest/asset        → tamper refusal; no changed bytes admitted
package identity skew                → refusal before browser redirect
verified loopback browser            → bundled UI renders; Service Worker registration denied
```

- Use disposable source/store fixtures for tamper cases; never damage the developer's real `.pi`
  generation to manufacture evidence.
- Assert the generated evidence equals the exact candidate manifest bytes and package identity.
- Prove the local source serves `dist.json` and every declared part from the exact allowed origin,
  without redirecting to another host.
- Run Driver Pi checks, focused release-materialization/supervisor tests, the real local cold/warm
  integration, and browser proof because verified browser execution is part of the end-to-end local
  milestone. Expand lower-owner suites only when their code or contract changes.
- Do not claim product-entry correctness, build provenance, immutable provider publication, public
  HTTPS behavior, supported-browser coverage, or supported-filesystem coverage from this item.

## Human release gate

Authority: the human release owner.

The gate blocks only `feat(driver-pi): bind published GUI Dist evidence for release`. The local item
may land and remain useful while the gate is unresolved.

Pass evidence records all of the following as concrete values in this plan:

- one artifact provider, exact HTTPS hostname and immutable/versioned path namespace;
- provider retention, overwrite-refusal, redirect, and credential boundaries;
- one normally trusted non-loopback public HTTPS proof origin;
- the supported browser engines and minimum versions;
- the supported OS/filesystem set for locking, sealing, cold materialization, and warm reuse; and
- either evidence that no prior product build exposed the selected local Service Worker authority or
  an explicit fresh-origin/site-data migration decision.

If the selected provider needs separately owned publication mechanics, add its plan as a prerequisite
rather than implementing credentials, object-store settlement, or a reusable uploader in Driver Pi.
Deferral leaves the public item unchecked and makes no negative claim about the completed local path.

## `feat(driver-pi): bind published GUI Dist evidence for release`

- Replace the test-rooted entry with the owner-authorized product entry and browser graph; production
  contains no module rooted under `src/-test` and no DevHarness code.
- Freeze one owner-selected Driver Pi package expectation and that authorized production graph, then
  build and verify one candidate exactly as established by the local item.
- Upload the unchanged candidate to the selected immutable/versioned path. Fetch and verify its
  published manifest and every declared asset against the frozen build evidence before generating
  launcher evidence.
- Require manifest and resources to remain on the one selected artifact hostname, with no userinfo,
  query authority, fragment, mutable `latest`, overwrite, or redirect to an unlisted host.
- Generate the launcher evidence leaf only after remote verification, replace the local tuple as one
  complete value, and publish the launcher package without rebuilding the GUI.
- Add only the selected artifact hostname to the named CLI permission surface. Credentials and
  provider mutation mechanics remain outside Driver Pi.
- Execute the same exact Dist under verified-loopback and normally trusted public HTTPS policy.
  Observe local Service Worker denial and public registration without certificate, secure-context,
  or browser-profile bypass.
- Prove cold acquisition, warm offline reuse, package/Dist identity, exact remote pin equality,
  frozen-artifact publication, public/local byte equality, tamper refusal, and the selected
  browser/filesystem floors.
- Never add runtime TOFU, provider-supplied authority, post-pin mutation, previous-generation
  fallback, release-to-development fallback, a credential manager, or a release-receipt subsystem.

## Review calibration

- Local source item: implementation and landed review start at `gpt-5.6-terra • high`; use BMIND →
  DMIND → TMIND → S-tier because it exposes the exact acquisition bytes and owns a listener.
- Local release-path item: implementation and landed review start at `gpt-5.6-sol • high`; use BMIND
  → DMIND → TMIND → S-tier because it binds launcher trust and proves real acquisition and reuse.
- Published release item: implementation and landed review start at `gpt-5.6-sol • max`; use BMIND →
  DMIND → TMIND → S-tier because publication ordering and external provenance are irreversible.
- Recalibrate from the actual delta before closure. Estimates are not proof and do not authorize
  work.

## Stop conditions

Stop rather than broaden the plan if:

- `localhost:8080` would be represented as immutable public publication or public HTTPS proof;
- the verified application host would expose `dist.json` or be conflated with the development source;
- source presence, first fetched bytes, browser state, or provider responses would become trust;
- the local substrate proof would require product-entry redesign or implicit build ownership;
- the published-release item would keep a test-rooted entry or include DevHarness code;
- evidence generation would enter the Vite application graph or rebuild the candidate after pinning;
- raw request spelling would become application authority or require a custom parser solely to reject
  aliases already normalized by the HTTP substrate;
- the launcher would start the source, repair automatically, or merge release/development authority;
- the public item would proceed without the recorded human gate values;
- selected provider mechanics would require a generic Driver Pi uploader or credential surface; or
- proof would require weakening URL, redirect, certificate, browser, filesystem, sealing, or
  permission checks.
