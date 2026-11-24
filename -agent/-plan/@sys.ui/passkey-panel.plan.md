@sys.ui
passkey-panel.plan.md
- [x] 08ccc7e82 feat(ui): add passkey diagnostic UI baseline
- [x] 1e48de614 style(ui): refine passkey debug panel labels and intent spacing
- [x] 429560650 chore(ui): scaffold passkey integration spec and view navigation
- [x] bc242cbd3 [link-grammar.plan.md](../@sys.ui-components/link-grammar.plan.md)
- [x] b3659c530 feat(ui): expose composable passkey diagnostic sections
- [x] 5bb4c79dc feat(ui): compose passkey UI in integration specimen
- [x] 8ba1a4939 feat(passkey): add UI-independent WebAuthn ceremonies
- [x] c7e4d6686 feat(passkey): define account service contracts
- [x] aba8774ff feat(http)!: bound unary HttpCmd transport
- [ ] feat(passkey): add minimal reference account service
- [ ] feat(passkey): add reusable account runtime
- [ ] feat(ui): connect real passkey operations in sample

## Purpose and boundary

Build a small real passkey reference: account creation establishes a session, returning sign-in
needs no username/email, and an authenticated account can enroll another passkey. DevHarness is the
first host, not the implementation boundary. An ordinary React host must configure, start, render,
and dispose the same runtime/view without copied authentication logic or specimen dependencies.

There is no existing account backend. The planned reference requires library verification and
process-local authority, not a production identity platform. Restart forgets its accounts and
sessions while authenticator entries may survive. Warn visibly **before credential creation**; use
designated human-controlled accounts. Browser reload does not restart the service, but requires
explicit fresh sign-in because browser session credentials and account hints are not persisted.

Keep ceremony distinct from authentication, session inspection from transaction receipts, local
disposal from remote revocation, and automated checks from real-browser proof. The existing view is
pure; integration is unconnected; the browser mechanism invokes ceremonies; account readers validate
structure. None supplies an implemented authentication service.

Budget roughly 200 owned executable service lines across domain logic, wire handlers, runtime
schemas, and bespoke helpers/adapters. Type declarations and tests are separate; disclose upstream
and client costs separately. Feasibility is **unproved**. Do not hide executable cost, compress
code, weaken security, or invent a generic engine to meet it. Return a concrete scope reduction or
earned owner-level primitive if the budget cannot be met honestly.

## Ownership and source of truth

Repository: `/Users/phil/code/org.sys/sys`. Sample root: `code/sys.ui/ui/-sample/passkey/`.

- `ui/`: one existing renderer and its presentation types. Preserve `mod.ts`, `t.ts`, common lanes,
  and independently renderable Actions/Status/Context sections.
- `ui/-spec.integration/`: the single main-menu sample; later composes a host-owned runtime.
- `ui/-spec/`: independently addressable isolated view with supplied fixtures and intent capture. Do
  not merge the specimens or rename/move them into a second sample boundary.
- `m.WebAuthn/`: private UI-independent native ceremonies; browser access is invocation-local.
- `m.Accounts/`: private service/client contracts and structural wire readers, not a service.
- The reusable runtime owns private credentials, concurrency, recovery, and safe observations; the
  service owns authority and commits; the host/Cell owns configuration and lifetime.
- Core common/type lanes remain independent of React, DevHarness, view props, and persistence. UI
  extends them locally. Navigation/link helpers belong in `passkey/-spec/`; generic sample test
  tools belong in `code/sys.ui/ui/-sample/`. Samples stay publication-excluded and included in the
  owning module's check task. No package-root promotion or predetermined service/runtime family.

Use the [account contract](../../../code/sys.ui/ui/-sample/passkey/m.Accounts/README.md) and
[type spine](../../../code/sys.ui/ui/-sample/passkey/m.Accounts/t.ts) for operation authority,
results, ceremony policy, commit obligations, lifetimes, and uncertain-completion semantics. Do not
maintain another operation table here. Use the
[presentation types](../../../code/sys.ui/ui/-sample/passkey/ui/t.ts) and
[browser mechanism](../../../code/sys.ui/ui/-sample/passkey/m.WebAuthn/README.md) for those planes.
This plan constrains remaining work; it is not a competing API definition.

### Related owners and recovery anchors

The checked link prerequisite's completed snapshot is recoverable at
`bc242cbd3:-agent/-plan/@sys.ui-components/link-grammar.plan.md`; `8e90efc8a` removed it. Preserve
that reference and its recovery path. Its closeout excludes browser/AT acceptance. The original
local `refactor(ui-components): consolidate development link presentation` scope moved into that
prerequisite. The original local `style(ui): refine passkey diagnostic labels` scope maps to
`a19bbeb85 feat(ui): adopt shared Passkey links and refine specimen labels`; do not recreate either
as pending work or duplicate the prerequisite's internal arc.

[ui-template-maintenance.plan.md](../@sys.tmpl/ui-template-maintenance.plan.md) owns template
lifecycle repair. At historical baseline `429560650`, the plain UI template discarded redraw and
persistence disposers. The inspected uncommitted candidate instead owns attachment effects and
last-detachment persistence cleanup; that source observation is **not independently verified
repair**. See
[the historical source boundary](./passkey-panel.plan/history.md#template-observation-is-historical-not-a-current-defect-verdict).
Preserve passkey's context ownership without adopting candidate template machinery.

Shared UI composition and Button work remain with
[dev-composition-primitives.plan.md](../@sys.ui-components/dev-composition-primitives.plan.md) and
[button-grammar.plan.md](../@sys.ui-components/button-grammar.plan.md), not new prerequisites here.
Use public canonical components; report owner-level defects rather than patching their internals
from the sample.

## Preserve the presentation and specimen boundaries

### Pure view

- Props supply observations and four distinct intents: create-account, sign-in, add-passkey,
  sign-out. The view owns no authentication IO, domain subscriptions, persistence, or state machine.
  Registration success alone does not imply signed in; failed enrollment need not invalidate a
  session. Supplied principal/count/result values are not inferred from browser credentials.
- Checking and unknown are not confirmed signed out. Offer create/sign-in only when signed out and
  add/sign-out only when signed in. Pending disables every action, including sign-out. Browser
  actions require available prerequisites and callbacks; sign-out does not require WebAuthn. Missing
  callbacks are visibly unavailable, not no-ops. Unknown counts are not zero.
- Preserve callable `Passkey.UI` plus independent Actions/Status/Context. Default order is Actions →
  Status → Context. Omitted `sections` members remain visible. Hiding Context changes presentation,
  not eligibility. No section registry, hidden store, or second ordering API.
- The aggregate owns one Passkey title and separators between effective nonempty sections. Empty
  Actions and wholly hidden/effectively empty panels return `null`, including Actions-only
  checking/unknown. Standalone sections have no aggregate separators; Context retains its title.
- Keep one progress location: detailed Operation when Status is present, otherwise the aggregate
  title's 24×3px reserved slot. The title slot stays allocated while idle; Operation's stable DOM
  slot collapses idle layout space. Pending reserves space before animation loading. Bare Actions
  has neither a pending caption nor spinner. Active title feedback is a named indeterminate
  progressbar, with no role while inactive. No fabricated progress or duplicate live announcement.
- Preserve semantic item IDs, surviving section/control identity, stable Operation/Result status
  nodes, and focus through idle → pending → failure. Removed sections may remount. Do not restore a
  custom focus hook or reassign focus when an action disappears. Titles remain nonfocusable.
- Authentication alone selects the decorative trailing Bullet: green for signed in, neutral
  otherwise, with distinct readable checking/unknown text. Use sentence-case authored captions,
  preserve supplied text/action labels, and keep decorative content hidden from accessibility APIs.
- Context keys use renderer-owned W3C references; values remain selectable plain data, not
  misleading links. Preserve row-level `userSelect: 'text'`, public Anchor opening semantics, and
  the Origin, RP ID, and WebAuthn API destinations. Do not force a WebAuthn reference onto
  application-session or verifier readiness. No Dev-bearing helper imports into production sections.
- Use actual KeyValue.ActionButton/Button, Spinners.Bar, and CSS/theme/style lanes. Resolve theme
  once; preserve caller styles and full long values with shrink/wrap behavior near 360px. No native
  button substitutes, keyboard shims, private styling access, or local shared-component repair.

### Host composition and navigation

Keep `sys.ui: -sample/passkey` as the single main-menu destination for `ui/-spec.integration/`;
`sys.ui: -sample/passkey/view` remains an unlisted, addressable secondary specimen. Preserve lazy
secondary resolution, index/unknown fallback, exact namespace/generated-ID routing, and `dev`/`d`
alias precedence. Do not add hidden-menu CSS, hardcoded IDs, or shared harness routing changes.

Both specimens render the same public view and retain independent debug state/reset/lifetimes.
Reciprocal Dev links remain same-tab; the host-themed, lower-left W3C reference remains new-tab with
Anchor's secure defaults and opening description. Keep navigation/address ownership in
`passkey/-spec/`, not shared UI primitives. Debug chrome stays light independently of subject theme.

A cached suite may serve successive or concurrent contexts. Preserve context-keyed debug state and
owned persistence/redraw/theme effects, disposal cleanup, live-context reload without duplicate
effects, and fresh fixture/intent state on pure-view re-entry. Theme/debug preferences are the only
persisted values. Pure leaf sharing is allowed; importing the sibling spec or its store is not.

The pure specimen renders the panel directly. Simulation labeling stays in the debug sidebar beside
Property States, even when hidden by the harness breakpoint; do not restore the rejected subject
qualifier. Retain Dev.List fixture selection, ephemeral presentation knobs, and intent feedback
below the callback toggle. Fixtures capture intent, never fake authentication success. Reset and
fixture selection clear intent feedback.

Until runtime connection, integration supplies unknown authentication, idle operation, no result or
callbacks, unavailable verifier, unknown browser readiness, and absent origin/RP ID. Do not borrow a
signed-out fixture merely to show buttons, probe capabilities, or introduce a no-op controller.

## Bounded unary HttpCmd

Provide a fixed-endpoint unary Cmd exchange with bounded body consumption and waiting, explicit
request authority, conservative dispatch knowledge, and non-reflective failures. Pair the client
with an equally bounded Web Request/Response handler. Keep `client`, `handle`, and `handler`; no
public raw-POST API, universal transport engine, or new passkey command protocol is needed.

`feat(http)!: bound unary HttpCmd transport` remains one implementation commit, after account
contracts and before reference-service/runtime adoption. Include private shared mechanics, both
transport directions, necessary existing-consumer migration, and owner proof. The breaking marker
records intentional error/options changes, not a release-version choice. No separate owner plan or
Cmd-kernel change is needed for this minimum.

The concrete non-account consumer is `code/sys/server/-sample/files.http.cmd/-start.ts`, backed by
`code/sys.model/model/src/m.files/m.Cmd.ts`; its sample tests and
`code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts` establish compatibility obligations.
Preserve Files policy and unary metadata/content-reference results. Streaming, binary write
encoding, Files authorization, and integration with `sys.ui:files` remain outside this increment.
Unlike Files' raw-command escape hatch, the account runtime's credential-bearing transport is
private.

### Ownership and minimal surface

- Reuse canonical Cmd grammar and correlation. Cmd IDs/namespaces do not authenticate, deduplicate,
  establish idempotency, or prove commit. Runtime payload/result validation belongs to domain
  handlers/bindings, not generic casts. Expected accepted/rejected domain outcomes resolve in
  `R[K]`; transport/protocol failures reject. The account binding translates those failures into its
  total outcome contract without inferring rollback.
- Extract compatible deadline/race/body-lease mechanics and bounded byte reading privately within
  `@sys/http`. The starting points are `http.client/m.HttpFetch/u/u.operation.ts` and `u.body.ts`.
  Leave Fetch-specific progress, checksums, redirects, failure identities, and status/metadata
  interpretation above them. Do not copy a fetch engine or introduce mode parameters merely to unify
  different semantics. Reuse compatible input parsing without importing GET/HEAD policy.
- Use fixed bounded HttpCmd diagnostics, not rich thrown-error disclosure. Suppress arbitrary
  exception details, including `Cmd.Error.expose` details, on this HTTP lane. Its identity-backed
  registry in `code/sys/event/src/m.cmd/m/m.Error.ts` is private; no public Cmd projection API,
  private cross-package import, or second trust registry is needed. Approved disclosure is not
  redaction. A later concrete need for rich disclosure must earn a Cmd-owner capability separately.
- Preserve the injectable fetch seam as trusted code, not a sandbox against a replacement fetch.
  Support explicit per-send headers and cancellation without breaking the existing two-argument send
  form or broadening the shared Cmd kernel. No arbitrary RequestInit overrides, asynchronous
  token-provider framework, multi-origin registry, retries, or public raw-response escape hatch.
- Keep authentication in request-local domain closures around `HttpCmd.handle`. Origin/CORS
  admission belongs to the surrounding Request binding; route/method matching belongs to HttpCmd.
  Neither origin nor namespace admission authenticates an account. No shared mutable principal,
  generic authentication registry, or listener-owning service is needed.

### Required behavior

- **Admit only registered handlers.** Snapshot trusted handler configuration and select an own
  callable entry. Inherited `constructor`, `toString`, and `__proto__` entries are not registered
  commands. Validate the envelope before selection and preserve id/name/namespace correlation. Do
  not expand into unrelated Cmd transports.
- **Bound bodies and waiting.** Validate finite request-byte, response-byte, and operation-time
  policy. Reject malformed/oversized envelopes before handler invocation; include error/non-2xx
  bodies and fallback responses in limits. Do not trust Content-Length alone. Skip zero-length
  chunks rather than retaining unbounded bookkeeping. JSON-compatible DTOs are required: optional
  payloads remain valid, but generic types do not promise structured-clone or binary fidelity.
- **Own settlement.** One operation owns its deadline, terminal state, signal forwarding, timers,
  listeners, and body leases. Check terminal state before fetch/handler invocation and before
  accepting completion. Race external promises; abort forwarding alone does not bound waiting. Do
  not await hanging cancellation indefinitely. Cancel late fetch bodies and discard late handler
  results without serialization or reopening settlement. An already-aborted request must not invoke
  a handler.
- **State honest limits.** Deadlines bound waiting while execution can progress, not synchronous
  CPU, arbitrary handler effects, or rollback. Byte limits bound admitted bodies, not total heap;
  chunk retention, concatenation, and decoding allocate. A post-serialization limit cannot prevent
  prior allocation. Do not claim a handler or authenticator stopped merely because its caller did.
- **Preserve dispatch knowledge.** Distinguish locally ruled-out dispatch from possible dispatch;
  latch possible immediately before invoking fetch, including a synchronous fetch exception. Server
  handler-invocation knowledge is separate. A status code, Cmd error, timeout, or response loss
  cannot upgrade client knowledge to proof of non-commit. No automatic replay or retry.
- **Inspect bounded terminal responses.** Do not discard a valid correlated result solely because
  its non-redirect status is non-2xx. Domain outcomes belong in validated result payloads. Empty,
  malformed, oversized, or uncorrelated bodies remain transport failures; Cmd error envelopes
  produce fixed transport diagnostics, not reflected remote messages. Status alone certifies neither
  domain success nor rejection. Refuse redirects rather than following or accepting them as command
  completion.
- **Keep failures non-reflective.** Use HttpCmd-local safe classification, conservative dispatch
  knowledge, and numeric status where useful. Never attach raw causes, abort reasons, payloads,
  credentials, response headers/status text, parser messages, or command identifiers to diagnostics.
  Retain correlation fields in bounded wire envelopes and handler context, not public error
  metadata. An arbitrary Error named `CmdError.Timeout` is not classification authority; do not
  rethrow it unchanged.
- **Fix request authority.** Validate and snapshot the exact endpoint, namespace, construction
  headers, and finite policy. Snapshot per-call headers before suspension; mutating caller options
  must not redirect credentials. Own POST/JSON headers, credential omission, redirect refusal,
  no-store request/response behavior, and referrer suppression. Keep account endpoint/RP binding,
  bearer ownership, verifier policy, and result interpretation in the private account binding. Never
  expose its transport, credentials, or wire responses through snapshots, debug views, or service
  reporting.

### Compatibility and acceptance

Preserve Cmd wire grammar, namespace/id/name correlation, unary result promises, optional payloads,
and intentionally ignored events. Preserve optional route-path matching with explicit mount-owner
responsibility when the path is omitted. Keep Files help/manifest GET routing outside HttpCmd.
Canonical JSON serialization is not a lossless structured-clone codec; document repeated-reference
handling and prove serialization failures before dispatch without introducing another serializer.

Migrate the existing Files caller and HttpCmd tests together: finite policy, immutable construction
options/per-call headers, fixed errors without reflected command metadata, and bounded non-2xx
inspection. Replace raw `boom`, missing-handler, denial-path, and static-watch message expectations
without changing Files access policy or declaring every exception publicly exposable. Preserve
HttpFetch GET/HEAD authority, redirects, progress, checksums, and error metadata unchanged.

Owner proof must cover inherited/missing/non-callable handlers, exact invocation counts, invalid
DTOs at their domain binding, false/absent Content-Length, oversized and zero-length chunks, empty
or malformed JSON, ignored aborts, hanging cancellation, late completion, and disposal races. Prove
transport-owned cleanup and compare pre-fetch rejection with response loss after commit. Exercise
correlated non-2xx results, Cmd error envelopes, and unrelated failure JSON without retries. Mutate
construction inputs, inspect request authority, interleave request-local credentials, and verify
per-call cancellation isolation. Secret sentinels must stay absent from the entire public failure
surface. Account service/runtime items then adopt this surface without temporary transport copies.

Retain Web Request/Response/fetch/stream/AbortSignal seams. Keep listener startup, filesystem/config
loading, and Cell lifecycle outside transport helpers; no event/std portability surgery belongs
here. A Web-shaped signature is not workerd proof. Future host acceptance must establish the actual
bundled import graph, import-time global behavior, stream/cancellation semantics, request lifetime,
and backing authority. Cell composes owner services; it does not emulate another runtime.

### Selected contract and adoption

Use the [HttpCmd contract](../../../code/sys/http/src/http.cmd/README.md) and
[type spine](../../../code/sys/http/src/http.cmd/t.ts) for exact options, diagnostics, wire/status
rules, and migration. Required positive safe-integer policy has no library defaults; per-call
headers/signal extend only the HTTP-local send signature; fixed failures preserve dispatch
uncertainty; correlated non-redirect results, not HTTP status alone, determine completion.

These choices keep account policy separate from a reusable transport. Files' explicit capacity is
not an account-service default. Peer caps may differ and tiny caps may force an empty failure body.
Canonical serialization retains repeated-reference tagging; a cycle is not a serialization-failure
test. Fatal UTF-8 decoding belongs to Cmd, not the shared byte reader or HttpFetch. Preserve these
constraints without maintaining another option/status table in this plan.

The [transport execution receipt](./passkey-panel.plan/proof.http-cmd.md) records the attributable
source delta, commands/cwds, observed results, red-step limits, and unproved host/security outcomes.
Use owner `test:unit` tasks for scoped tests; aggregate test tasks also execute process proofs and
are not scoped argument-forwarding substitutes. Keep the account service/runtime on this bounded
surface rather than introducing temporary transport copies.

## Reference service handoff

Implement the linked account contract with an established verifier and bounded private process-local
records. No home-grown cryptography, attestation parser, token-signing protocol, database adapter,
or production-deployment project. SimpleWebAuthn 14.1.0 is an investigated candidate, **not an
adopted dependency**; verifier selection and executable native/library interoperability belong here.

Prove real handler behavior without a listener, UI, or Cell. Bind challenges, RP/origin, enrollment
session/account, and credential state/version at the service owner; library verification is not a
substitute for application authority or a coherent commit. Exercise the contract's single-use,
expiry, duplicate association, user-handle consistency, post-await recheck, and zero-counter rules.
An unchanged count or successful inspection cannot resolve a lost completion or delayed commit.

Require concrete duration/capacity and origin/RP/algorithm configuration at construction. Neither
fixtures nor screenshots select a host policy. Unknown credentials after restart fail honestly;
never automatically re-register, overwrite, or reconstruct authority from authenticator remnants.
Disclose the process-local limitation before enrollment and report owned executable LOC, including
runtime validators, with upstream/client costs separate.

If hosting is needed, use existing HTTP/server and lifecycle primitives in a thin non-spec adapter.
The Cell at `code/sys.ui/ui/-config/@sys.cell/cell.yaml` is an option, not a service-test
dependency. Consult the matching DSL before any Cell/config edit and confirm service name, endpoint
selector, module, config path, and lifetime. `sys.ui:accounts` is only a proposed name; no port, RP
ID, or origin list is predetermined. Preserve unrelated services; `sys.ui:files` has no account
integration or storage role in this arc.

## Runtime and lifecycle handoff

- Construction is inert. Explicit start may inspect prerequisites and an existing in-memory session,
  but import, mount, reload, reset, and recovery never open a ceremony. Feature-detect native JSON
  conversion APIs before offering operations; unsupported means readable feedback, not a shim.
  `m.WebAuthn` retains caller-owned policy, original native result identity, nullable results,
  cancellation forwarding, and unmodified platform failures without precise-cause diagnosis.
- The non-spec runtime coordinates the bounded transport and browser, not DebugSignals or a view
  controller. Use neutral observation types rather than depending on `Passkey.Props` or React.
  Acquire one active-operation guard before the first await; validate non-UI invocations.
  Latest-wins cancellation is not mutual exclusion. Prevent stale adoption after refresh races,
  disposal, or configuration/principal replacement even if external work ignores cancellation.
- Keep three independent facts: attempt outcome, observed session/account facts, and private bearer
  possession. Follow the account README's per-operation uncertainty and recovery policy. No
  automatic mutation retries, receipt API, guessed rollback, count-based resolution, or invented
  signed-out success. Full reload is the ordinary-host escape from unknown state without
  DebugSignals or a new panel action; it discards local authority without claiming remote
  revocation.
- Prove a live, coherent, mutation-isolated canonical readonly observation surface. Consumers must
  not mutate owner state through `current`, events, before/after values, or patches. Expose only
  needed facts/change notifications, never bearer or ceremony material. Do not assume
  `asReadonly(clonerRef(...))` suffices: inspected immutable code captured `current` once while the
  cloner replaced objects and events exposed references. Select and prove the substrate; any needed
  owner correction requires its own bounded scope, not a specimen workaround.
- Host-owned lifetime survives ordinary redraw, theme changes, and debug reset. Replace
  configuration through disposal and explicit reconstruction/start, not in-place reconfiguration.
  Bind credentials to their issuing service context, not merely an origin. Validate effective RP
  binding before invoking WebAuthn. Separate contexts must not acquire authority through global
  state/storage; sharing requires an explicitly supplied host-owned runtime.
- **One departure/restoration policy:** as required by the account README, page departure discards
  credentials and invalidates in-flight adoption. BFCache restoration starts without a credential
  and opens no ceremony. There is no retained-authority revalidation alternative. The host must
  deliver lifecycle signals; late grants cannot restore retired authority. Distinguish this browser
  boundary from harness cached-context re-entry and ordinary redraw. Neither unload nor local
  disposal proves remote revocation.
- Appearance persistence stays outside authentication construction/truth. No bearer, challenge, raw
  assertion/registration response, or account hint in storage, caches, URLs, logs, debug views, or
  telemetry. Memory-only credentials do not remove active-script/XSS risk. Authentication uses
  neither ambient cookies nor cookie-backed sessions, and credentials never follow redirects.

## Acceptance for remaining work

Use narrow red → green owner tests before module checks; record skipped reds honestly. Keep existing
pure-view, boundary, WebAuthn, navigation, and specimen lifetime regressions. A shared fixture/type
agreement is not interoperability or authentication proof.

- **Transport:** execute the acceptance matrix in the HttpCmd section, migrate Files
  consumers/tests, and verify unchanged HttpFetch contracts. No service/runtime-local transport
  copies.
- **Service:** exercise valid library-verified registration/assertion and controlled invalid proof,
  origin/RP mismatch, replay, expiry, capacity, duplicate association, wrong user handle, enrollment
  revocation/expiry, and concurrent finish calls. Reorder verification completions against shared
  counter state; reject stale completion without inventing a universal increment rule. Never apply
  metadata from unverified results. Prove reset forgets authority and response loss leaves honest
  uncertainty. Real credentials remain human-controlled. Demonstrate the executable-line budget or
  return the concrete feasibility limit.
- **Runtime:** test duplicate suppression, guard acquisition, phases, fresh-client truth, failed
  inspection, cancellation, disposal, refresh races, and changed service/RP configuration. Mutate
  every exposed observation channel and use secret sentinels across persistence/telemetry. Exercise
  native JSON unavailability without a ceremony or fallback. Test departure during in-flight work,
  late grants after departure, and restoration with no credential, no retained-bearer inspection,
  and no automatic ceremony. Synthetic lifecycle tests do not prove browser BFCache behavior.
- **Connected host:** compose the same runtime/view in the integration specimen and a second
  ordinary React host using only configuration, lifetime, and rendering glue. Preserve independent
  pure-view fixtures, appearance-only reset, and runtime identity across theme changes. Test
  uncertain inspection/revocation, reload recovery, commit-before-response-loss, delayed commit
  after inspection, and unavailable reconciliation without DebugSignals or fabricated success.
- **Presentation regression:** retain standalone sections, all visibility combinations, effective
  emptiness, eligibility despite hidden Context, stable surviving focus/control/status nodes,
  pending suppression for all four intents, progress-slot behavior, exact references, and long-value
  wrapping declarations. Use the real public ActionButton composition, not mocks of its behavior.
- **Browser/authenticator/AT:** with configured test accounts, exercise create, sign-out, sign-in,
  add-passkey, session re-check, cancellation, unavailable service, expired/indeterminate sessions,
  and leaving during work. Reload/restoration must start credential-free and require explicit
  sign-in. Distinguish observed BFCache restoration from fresh load; observe service outcomes, not
  only browser API returns. Check existing-passkey protection and repeat-sign-in convenience.
  Separately verify reciprocal navigation/reload/Back, full-value selection, 360px layout,
  Light/Dark focus/contrast, loaded spinner geometry, keyboard/pointer behavior, and announcements.
  Screenshots and DOM assertions do not prove those outcomes. No unattended real credential creation
  or deletion; human controls ceremonies and cleanup.

For passkey owner checks, cwd is `code/sys.ui/ui`: scoped `deno task test --trace-leaks`,
`deno task check`, `deno task dry`, then `deno task test`. Transport/service owners use their own
module tasks. Format/lint exact changed filenames only. Report actual non-secret configuration and
remaining runtime limitations; do not add an automation framework merely to manufacture acceptance.

## Evidence and non-goals

- [Account execution receipt](./passkey-panel.plan/proof.accounts.md): source baseline, attributable
  delta, exact command/cwd boundaries, red/green results, and limits for the contract landing.
- [Historical evidence](./passkey-panel.plan/history.md): consequential presentation/lifecycle
  choices, archived dependency recovery, and earlier reports with explicit provenance limitations.
- [Transport execution receipt](./passkey-panel.plan/proof.http-cmd.md): bounded settlement/body,
  authority, diagnostics, Files migration, and unchanged HttpFetch regression evidence.
- No real-browser/authenticator/AT, service atomicity, account-runtime secrecy/liveness, deployment
  portability, or overall service-budget acceptance is inferred from these records. Transport
  settlement does not preempt synchronous work, force cooperation, or prove rollback.

Exclude home-grown verification/serialization, browser compatibility shims, cookie authentication,
persistent browser credentials/hints, generic identity/provider frameworks, profile/recovery/roles
systems, extra credential-management UI, files-service integration, Cell framework changes,
workerd/Cloudflare, SQLite/durable-storage setup, distributed/production deployment acceptance,
mobile/Tauri proof, immediate package promotion, and unrelated shared-component cleanup.

Preserve the opening arc and owner boundaries. Planning, documentation, review, and readiness do not
authorize implementation, service startup, Git mutation, or real authenticator operations.
