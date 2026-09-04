direct-gui-release-composition.plan.md
- [x] 971409e55 refactor(driver-pi): collapse GUI release orchestration to direct composition
- [x] 253a7b254 refactor(driver-pi): move CLI modules beside core

## Purpose

Make the Driver Pi GUI release call site visibly and semantically thin from the landed
ownership-migration baseline. Begin from the public package contracts available at that baseline,
not from the current Driver Pi module graph or the implementation history that produced it.

This plan is the final referenced child of
[verified-package-ui-release.plan.md](verified-package-ui-release.plan.md). That parent establishes
the ownership foundation. Its local lifecycle shape, proof matrix, and preservation decisions are
evidence to reassess, not requirements to reproduce.

## Entry assessment

Before implementation, enter DMIND and derive the endpoint from live source and public package
contracts rather than inherited decomposition. These planning probes are body deliverables, not
implementation commits, opening-arc items, or gates.

- Census every surviving GUI-release responsibility from live source and public package contracts;
  for each, record its classification, product need, truthful owner, and current mechanism.
- Derive the minimum endpoint by assigning every responsibility one disposition: retain, remove, or
  move; compare direct composition, the minimum lower-owner correction, and no further change.
- Record the selected design: one visible success path, ownership and settlement order, retained
  product behavior, rejected inherited behavior, production-module ownership, invariants, non-goals,
  and proof boundary.
- Blindly falsify the design from source and contracts, adjudicate every material finding, and
  revise the implementation arc only if the coherent change boundary differs.

The census has one entry per responsibility with the stable fields `responsibility`,
`classification`, `product need`, `truthful owner`, and `current mechanism`. Classification is
exactly one of package or product policy, browser or terminal presentation, unavoidable direct
call-site sequencing, or lifecycle and ownership machinery that belongs below Driver Pi or should no
longer exist. Recording a current mechanism does not make it a preservation requirement.

The comparison must answer whether landed package contracts support one linear call site without
local lifecycle emulation, which inherited behaviors are product-visible requirements, and what the
strongest evidence-based case is for leaving the design unchanged. If a lower contract is missing,
name its exact owner and minimal semantics without designing a speculative API.

The first three probes must leave a concrete responsibility census and proposed endpoint in this
plan before independent review. Plan conclusions remain claims to falsify, not proof of themselves;
do not carry bridge-review conclusions forward as endpoint premises.

If the answer requires a lower-package change or more than the current local item, stop and revise
the opening arc only under explicit plan-scope authority before implementation.

## DMIND assessment

The live target paths have no source delta after the landed ownership bridge. Current mechanisms
below are relative to `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/` unless a
repository-root-relative path is shown. A current mechanism is evidence of behavior, not evidence
that its abstraction should survive.

### Responsibility census

#### Package or product policy

- **Runtime-root selection** — product need: place the package store under the selected Pi runtime
  root; truthful owner: Driver Pi; current: `u.start/u.gui/u.session.ts:start` calls
  `code/sys.driver/driver-pi/src/m.core/m.cli/u.runtime.ts:runtimeRoot`; disposition: retain in the
  linear orchestration module.
- **Release versus development authority** — product need: release uses frozen evidence while the
  isolated preview uses one completed build directly; truthful owner: Driver Pi; current:
  `u/u.start.gui.service.ts` and `u.start/u.authority.ts:snapshotAuthorityEvidence`; disposition:
  retain and collapse into immutable policy.
- **Preview-generation lifetime** — product need: isolate one development build and remove it only
  after GUI settlement is known; truthful owner: the preview task, not the GUI endpoint; current:
  `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/u.runtime.ts`; disposition: retain
  outside the three-module budget and adapt only to the endpoint's typed outcome.
- **Release source and manifest pin** — product need: authenticate one selected `dist.json` without
  TOFU, query, fragment, or credential-bearing URL ambiguity; truthful owner: Driver Pi selects and
  Server verifies; current: `u/u.start.gui.service.evidence.ts`, `u/u.start.gui.service.ts`, and
  `u.start/u.source.ts`; disposition: retain in immutable policy.
- **Acquisition and verification bounds** — product need: bound manifest, resource, retry, timeout,
  concurrency, and total-byte authority; truthful owner: Driver Pi selects and Server enforces;
  current: `u.start/u.source.ts:materializePolicy` and `u.start/u.limits.ts`; disposition: retain in
  immutable policy.
- **Release-store address** — product need: use `.pi/@sys/dist/@sys.driver-pi` under the runtime
  root; truthful owner: Driver Pi selects and Server confines; current: `START_GUI_SERVICE.store`
  and `u.start/u.gui/u.boot.ts:releaseStore`; disposition: retain in immutable policy.
- **Expected package identity** — product need: bind both release and preview hosts to the intended
  Driver Pi package and version; truthful owner: Driver Pi; current:
  `u.start/u.identity/u.source.ts:snapshotExpectedPkg`; disposition: retain in immutable policy.
- **Generation package admission** — product need: refuse a materialized generation before hosting
  when its verified package differs; truthful owner: Driver Pi; current:
  `u.start/u.identity/u.source.ts:admitGenerationPkg`; disposition: retain as a direct policy check.
- **Hosted package admission** — product need: independently refuse the freshly verified host when
  its package differs; truthful owner: Driver Pi; current:
  `u.start/u.identity/u.application.ts:admitApplicationPkg`; disposition: retain as a second direct
  policy check.
- **Browser authority** — product need: numeric loopback, no dedicated workers, and one verified
  Service Worker tombstone; truthful owner: Driver Pi selects and DistServer enforces; current:
  `u.start/u.browser.ts:VERIFIED_LOOPBACK_BROWSER_POLICY`; disposition: retain in immutable policy.
- **Service identity and recovery guidance** — product need: identify `sys.ui:pi` and distinguish
  local evidence rebinding, cache reset, and source recovery; truthful owner: Driver Pi; current:
  `u/u.start.gui.service.ts` and `u.start/u.screen/u.render.serviceRow.ts:failureGuidance`;
  disposition: retain policy values and presentation copy.
- **Failure vocabulary and safe diagnostics** — product need: present configuration, source,
  artifact, repair, local, and cancellation outcomes without leaking lower causes; truthful owner:
  Driver Pi; current: `u.start/u.state.ts`, `u.start/u.failure.ts`, and
  `u.start/u.failure.materialization.ts`; disposition: retain only product-visible categories and
  bounded evidence in presentation.
- **Profile navigation and process outcome** — product need: back reopens the profile menu, quit or
  external cancellation closes it, and a presented product failure exits with code `1`; truthful
  owner: Driver Pi; current: `u/u.start.gui.settlement.ts`, `m.main.ts`, and
  `code/sys.driver/driver-pi/src/m.core/m.cli/mod.ts`; disposition: retain as an ordinary
  `Start.Gui.Outcome`, carry non-back settlement through `PiCliProfiles.Gui.outcome`, and derive
  process status only at executable boundaries; remove identity-authenticated completion/error
  tokens.
- **Public GUI source vocabulary** — product need: none for the incomplete manifest-and-integrity
  alias; truthful owner: the internal immutable policy contract; current:
  `t.ts:PiCliProfiles.StartGuiSource`, referenced only by its compatibility test; disposition:
  remove the stale public alias rather than preserve a type that omits package authority.

#### Browser or terminal presentation

- **Early bootstrap URL** — product need: open useful browser feedback before a cold acquisition
  that may take minutes, then redirect to the admitted application; truthful owner: Driver Pi owns
  copy and projection while `BootstrapStatus` owns the listener; current: `u.start/u.bootstrap.ts`
  and `u.start/u.gui/u.session.ts`; disposition: retain through direct package composition.
- **Finite boot projection** — product need: show preparing, host startup, ready, failed, and
  stopping states in the terminal and browser; truthful owner: Driver Pi; current:
  `u.start/u.state.ts` and `u.start/u.bootstrap.ts:projectBootstrap`; disposition: retain a minimal
  presentation snapshot and remove the general transition queue.
- **Responsive terminal frame** — product need: show service, state, admitted links, diagnostics,
  guidance, and controls within the current viewport; truthful owner: Driver Pi; current:
  `u.start/u.screen/u.render.ts` and `u.start/u.screen/u.render.serviceRow.ts`; disposition: retain
  as pure presentation leaves.
- **Presented-link admission** — product need: format the status/application capability, release
  manifest, and development directory without turning malformed or credential-bearing data into
  terminal links; truthful owner: Driver Pi presentation over package-returned origins; current:
  `u.start/u.url.ts` and `u.start/u.screen/u.input.ts`; disposition: move each minimal capture
  beside its rendering consumer and remove the mixed input-helper bucket.
- **Screen observation and resize** — product need: repaint the finite view after state or viewport
  changes and release presentation subscriptions; truthful owner: Driver Pi over CLI screen
  primitives; current: `u.start/u.screen/u.owner.ts`, `u.input.ts`, and `u.resize.ts`; disposition:
  absorb direct screen acquisition, viewport admission, resize observation, and release into
  `u.start/u.gui/u.presentation.ts`; retain no separate screen or resize owner.
- **Keyboard meaning** — product need: `q` and Ctrl+C quit, Ctrl+Left returns only from a clean
  navigable state, and `r` redraws; truthful owner: Driver Pi assigns product meaning while
  `Cli.Keyboard` owns the listener; current: `u.start/u.gui/u.session.ts`,
  `u/u.start.gui.settlement.ts:allowsBack`, and screen footer rendering; disposition: retain with
  one direct control outcome and package-owned keyboard shutdown.
- **Browser opening warning** — product need: failure to invoke the default browser must not stop a
  healthy local host and must leave the capability URL visible; truthful owner: Driver Pi presents
  while `Open.invokeDetached` owns invocation; current: `u.start/u.gui/u.session.ts`; disposition:
  retain synchronous throw handling only, matching the public `void` contract.
- **Failure foreground** — product need: keep actionable product failures visible while terminal
  presentation remains viable, until trusted keyboard dismissal or caller cancellation; truthful
  owner: Driver Pi; current: foreground deferred and flags in `u.start/u.gui/u.session.ts`;
  disposition: retain one direct failure branch that preserves the selected failure while observing
  dismissal and presentation viability, not a second terminal arbiter.

#### Unavoidable direct call-site sequencing

- **Presentation acquisition before slow work** — product need: establish status, controls, screen,
  and browser feedback before release acquisition; truthful owner: Driver Pi orders package owners;
  current: `u.start/u.gui/u.session.ts`; disposition: retain visibly in the orchestration function.
- **Release acquisition or development selection** — product need: open `Dist.Generation` only for
  release and use the preview directory directly for development; truthful owner: Driver Pi orders,
  Server Generation owns release acquisition; current: `u.start/u.gui/u.boot.ts:runBoot`;
  disposition: retain as one explicit branch.
- **Admission before hosting** — product need: never start a host for a refused release package;
  truthful owner: Driver Pi; current: `openRelease` before `startApplication`; disposition: retain
  in the visible success path.
- **Verified host before readiness** — product need: publish ready only after `DistServer.start`
  returns and the second package check passes; truthful owner: Driver Pi orders, DistServer owns
  host verification and listener startup; current: `runBoot`; disposition: retain in the visible
  success path.
- **One outcome across phased acquisition** — product need: select one immutable control or failure
  outcome while status, Generation, host, and application completion become available at different
  times; truthful owner: Driver Pi selects product outcome while each package owns settlement;
  current: terminal deferred, listeners, and arbitration in `u.start/u.gui/u.session.ts`;
  disposition: retain one conceptual outcome channel and observe it in phase-local races. When an
  outcome wins, request the policy-selected shutdown and drain the in-flight lower operation before
  releasing any dependency it may use; bind every returned owner before applying policy.
- **Ordered owner settlement** — product need: distinguish clean-control shutdown from fatal backend
  quiescence, prove application termination before releasing a Generation, and close status last;
  truthful owner: Driver Pi orders while each package settles itself; current: `closeResources` and
  helpers in `u.start/u.gui/u.session.ts`; disposition: retain a fixed lexical request/settlement
  chain. Own presentation and application-close completions immediately, await application
  `finished` independently, then release Generation; preserve failures with nested `try/finally` and
  native `SuppressedError`, not a cleanup graph.
- **Cancellation propagation** — product need: one caller or trusted-control request must interrupt
  pending lower work without letting its callback invert shutdown order; truthful owner: Driver Pi
  bridges intent while Generation and DistServer own response; current: local `AbortController` and
  `observeExternalAbort` in `u.start/u.gui/u.session.ts`; disposition: retain one local work signal,
  but callbacks select outcomes rather than aborting it directly. For clean shutdown, session
  initiates presentation stop before aborting pending work or invoking application close; after an
  application owner exists, invoke `application.close()` before aborting the signal. Fatal failure
  instead quiesces pending or unadmitted backend work immediately while usable failure presentation
  remains foregrounded.

#### Lifecycle or ownership machinery to remove

- **Mutable resource bag** — product need: none; truthful owner: lexical call-site scopes; current:
  `BootResources` and `SessionResources`; disposition: remove in favor of visible local owners.
- **First-terminal arbitration** — product need: preserve the first naturally observed product
  outcome without a bespoke same-turn policy; truthful owner: the direct Driver Pi call site;
  current: `current`, `pending`, `queueTerminal`, `commitTerminal`, and `ObservedReaction`;
  disposition: replace with one first-resolution outcome channel and ordinary Promise settlement;
  remove pending candidates, scheduler displacement, and reaction-specific overwrite rules.
- **Scheduler interlocks** — product need: none beyond lower-owner startup contracts; truthful
  owner: package owners; current: repeated `Schedule.micro` checkpoints in `u.session.ts` and
  `u.boot.ts`; disposition: remove.
- **Custom state publication queue** — product need: the finite presentation snapshot, not reentrant
  transition machinery; truthful owner: presentation; current: publication array, cursor, and
  dispatch guard in `u.start/u.state.ts`; disposition: replace with the smallest presentation-local
  snapshot compatible with status and screen observation.
- **Cleanup evidence graph** — product need: continue required later cleanup while preserving the
  primary settled failure, not reconstruct every partial state; truthful owner: each package owner
  and language-level error propagation; current: `u.start/u.final.ts`, cleanup issue arrays,
  retrying screen disposal, and broad parallel settlement; disposition: remove. Retain only the
  exact completion promises started by the lexical sequence, nested `try/finally`, and native
  `SuppressedError` when both primary and later cleanup fail.
- **Deferred Generation release** — product need: preserve host-before-generation safety, not a
  detached local retry; truthful owner: direct call-site ordering and package-owner completion;
  current: `deferGenerationRelease`; disposition: remove. Drain pending host startup, observe
  application close without blocking on it, and keep the orchestration pending with a strong
  Generation reference until application `finished` settles.
- **Authenticated local completions and errors** — product need: ordinary typed profile outcomes and
  bounded product failures; truthful owner: Driver Pi's direct boundary; current: WeakSets and
  singleton objects in `u.start/u.error.ts` and `u/u.start.gui.settlement.ts`; disposition: remove.
- **Opaque browser-return and Promise admission** — product need: none against the trusted
  `Open.invokeDetached(...): void` contract; truthful owner: `@sys/process`; current:
  `Is.Native.promise` branching and opaque-result warning in `u.start/u.gui/u.session.ts`;
  disposition: remove.
- **Fine-grained local operation and listener taxonomy** — product need: selected product failure
  categories only; truthful owner: presentation mapping plus package classifiers; current:
  `FailureOperation`, `CapturedFailure`, `listenerFailure`, and listener-specific cleanup issues;
  disposition: collapse into direct branches.
- **Mechanism-shaped module fanout** — product need: none; truthful owner: the three endpoint nouns;
  current: separate authority, browser, bootstrap, dependency, error, failure, final, identity,
  limits, source, state, boot, settlement, screen-owner, resize, input-helper, barrel, and
  screen-type modules; disposition: absorb retained policy, presentation, and sequencing, then
  remove empty seams and implementation-detail fixtures.

### Contract sufficiency

The landed public contracts are sufficient for direct composition:

- `Dist.Generation.open` owns store preparation, materialization, failed-open cleanup, opening
  cancellation, and one returned owner's terminal release.
- `DistServer.start` independently verifies the selected directory and returns the application
  lifecycle, observed `finished` settlement, and fresh verification evidence for Driver Pi's second
  package check.
- `BootstrapStatus.start` owns the inert status listener and exposes one idempotent close operation.
- `Cli.Keyboard.bind` and `Cli.Keyboard.shutdown` own the keyboard listener lifecycle.
- `Cli.Screen` exposes repaint and event-source ownership directly; Driver Pi needs one local
  product projection, not a second screen-owner contract.
- `Open.invokeDetached` is a synchronous `void` invocation boundary.

`DistServer.serve` is not the endpoint: it hides the returned `Started` evidence needed for Driver
Pi's independent hosted-package check, replaces Driver Pi's bootstrap and recovery presentation with
a generic server screen, and opens no early redirect capability. Widening it would move product
policy into Server.

### Competing endpoints

1. **No further change.** Strongest case: the bridge already has deterministic race precedence,
   detailed cleanup evidence, late-owner handling, and extensive tests. Rejected because those
   guarantees chiefly defend internal test seams or inherited timing rather than named product
   behavior, and they obscure package-owned lifecycles behind another Driver-owned supervisor.
2. **Add a lower-owner composition contract.** Strongest case: one Server owner could bind
   Generation and DistServer cleanup. Rejected because current owners already compose directly, the
   extra contract would couple acquisition to hosting, and Driver Pi must still own both package
   checks, browser policy, bootstrap presentation, and navigation.
3. **Direct composition.** Selected because it preserves every named product decision while making
   package ownership and the irreducible ordering visible without a new facade.

No lower-package change is selected. A blind finding that disproves contract sufficiency stops this
plan before implementation and requires explicit arc revision.

### Selected endpoint

One orchestration function owns one conceptual outcome across explicit acquisition phases:

```text
snapshot immutable Driver Pi policy and create the outcome channel
  → start BootstrapStatus, bind keyboard, acquire screen, and open the status URL
  → release: observe outcome while opening Generation, bind it, then admit its package
    | development: select the completed-build directory
  → observe outcome while starting DistServer, then bind the returned application
  → admit the freshly hosted package
  → publish ready and observe controls plus package-owner completion
  → apply clean-control or fatal-failure shutdown policy
  → settle lexical owners through fixed completion dependencies
  → return one ordinary typed `back | quit | external-cancellation | failed` outcome
```

#### Outcome phases

- Create one first-resolution outcome channel before acquiring presentation. Ordinary Promise
  settlement selects the first observed outcome; there is no queued candidate, scheduler
  displacement, or same-turn reprioritization.
- At each owner-producing asynchronous boundary, race the retained operation against the existing
  outcome channel. If outcome wins, request the appropriate shutdown and still drain that exact
  operation before releasing anything it may use. Bind any successfully returned owner immediately,
  before validation or another await.
- Attach application `finished` observation immediately when binding the owner and before hosted
  package admission. Never publish ready after application termination has already been observed. At
  readiness, observe trusted controls, status, keyboard, screen, and application `finished`
  directly; package completion remains package-owned and Driver Pi only maps it to product outcome.
- After failure is selected, retain that outcome while racing trusted dismissal or external
  cancellation against loss of viable terminal presentation. Back is unavailable. Later events never
  rewrite the failure; loss of trustworthy dismissal makes the endpoint reject.

#### Shutdown classes

- **Clean control:** `back`, `quit`, or first-selected external cancellation initiates screen and
  keyboard shutdown before Driver Pi interrupts backend work. A control callback only resolves the
  outcome channel. Session orchestration then aborts and drains a pending Generation or host
  operation; once an application owner exists, it invokes `application.close()` exactly once before
  aborting the local work signal.
- **Fatal failure or refusal:** quiesce a pending or live backend immediately. A returned but
  refused application is closed before it can remain hosted; a pending lower operation is aborted
  and drained. Keep BootstrapStatus and any viable terminal presentation foregrounded until trusted
  dismissal while backend settlement proceeds. External cancellation during this foreground ends the
  wait but does not replace the already-selected `failed` outcome.
- **Presentation loss:** if screen or keyboard failure makes truthful failure display or trusted
  dismissal impossible, quiesce backend work and reject after owner settlement rather than claiming
  a presented product failure.

#### Lexical settlement

The orchestration holds concrete local owner variables, not a bag or registry, and applies these
request and settlement dependencies:

1. Initiate presentation shutdown immediately for clean control, or after foreground release for a
   presentable fatal failure; capture its exact completion without waiting before backend shutdown.
2. Invoke application close at most once, capture synchronous throw, and observe its returned
   completion immediately. Observe `application.finished` independently; close completion alone is
   not termination evidence.
3. Drain any in-flight owner-producing operation. Await application `finished` settlement whenever
   an application owner exists. Resolution or rejection proves listener termination; preserve a
   rejection as failure evidence.
4. Release Generation only when no pending host operation can use it and application termination, if
   applicable, has been proven. Keep its owner strongly referenced while either prerequisite is
   pending.
5. Await the already-started presentation, application-close, and Generation-release completions.
   Continue required later cleanup after rejection through nested `try/finally`; preserve primary
   plus later failure with native `SuppressedError`, never arrays or a cleanup graph.
6. Invoke and await BootstrapStatus close last. A non-settling prerequisite keeps status and the
   endpoint pending; no detached retry or retention registry substitutes for settlement.

The required consequences are finite:

| Observed condition                                              | Consequence                                                                                          |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| BootstrapStatus startup remains pending                         | Retain and drain that exact startup operation; keep the endpoint pending.                            |
| BootstrapStatus startup settles after outcome selection         | Bind and close a returned owner; preserve a rejection as failure.                                    |
| Generation or host startup remains pending                      | Retain every dependency, keep status open, and keep the endpoint pending after cancellation request. |
| Presentation shutdown remains pending                           | Backend shutdown still proceeds; status and endpoint remain pending.                                 |
| Application close throws or rejects while `finished` is pending | Preserve the failure; retain Generation and status; remain pending.                                  |
| Application close remains pending while `finished` settles      | Release Generation, then await close before closing status.                                          |
| Application `finished` rejects                                  | Treat rejection as termination plus failure; release Generation, continue cleanup, then reject.      |
| Generation release rejects                                      | Continue to status close after terminal release settlement, then reject with failure preserved.      |
| Generation release does not settle                              | Retain status and keep the endpoint pending.                                                         |
| Status close rejects or does not settle                         | Reject or remain pending respectively; no later owner exists.                                        |

A product failure returns `failed` only after trustworthy presentation, dismissal, and all required
owner cleanup succeed; presentation, owner, or cleanup failure rejects. `m.main.ts` loops only on
`back` and carries every other outcome in `PiCliProfiles.Gui.outcome`. The package CLI and preview
executable boundaries map only `failed` to exit code `1`; embedded callers receive the same typed
truth. Apply that projection explicitly at the package-root executable alias, the `/cli` executable
alias, the local task wrapper, and the preview worker. Preview projects only after removing its
temporary Generation for any resolved outcome; it retains that Generation while the endpoint is
pending or when it rejects. A presented failure exits without an uncaught stack. This removes
`settleCliRun`, settled-error WeakSets, and catch-based normal control flow.

The canonical `start` entry snapshots `START_GUI_SERVICE` and accepts no release-source override. A
separate package-internal development entry accepts one complete frozen preview build and invokes
the same unexported composition function. Exact typed dependency substitution may remain in that
module for focused tests, but it grants no wider source authority and contract-violating substitutes
earn no production machinery.

### Production-module ownership

At most three production modules own the endpoint:

1. `u/u.start.gui.service.ts` — immutable policy and evidence; absorb source admission, store,
   acquisition limits, expected package, browser authority, and package checks.
2. `u.start/u.gui/u.session.ts` — one linear orchestration function; absorb boot sequencing, local
   dependency seams, cancellation bridge, typed outcome, and explicit cleanup order.
3. `u.start/u.gui/u.presentation.ts` — one browser-and-terminal presentation adapter; absorb the
   current screen owner, finite presentation snapshot, bootstrap page projection, failure
   projection, keyboard-facing state, and browser-open warning while owning no Generation,
   application, or status-close authority.

The target local layout is a ceiling, not a file quota:

```text
u.start/
|-- u.gui/
|   |-- mod.ts                    external entry exports
|   |-- t.ts                      shared input/outcome contracts
|   |-- u.session.ts              direct policy composition
|   `-- u.presentation.ts         finite browser-and-terminal presentation
|
`-- u.screen/
    |-- u.render.ts               pure frame projection
    `-- u.render.serviceRow.ts    substantial pure service formatting
```

`u.session.ts` keeps upstream owner handles and their settlement order visible. `u.presentation.ts`
owns product projection and direct presentation subscriptions, not a facade over package lifecycle.
The two screen files survive only because each is a coherent pure rendering unit; no screen barrel,
type plane, input bucket, owner, or resize wrapper remains.

The generated `u/u.start.gui.service.evidence.ts` leaf remains immutable data, not an orchestration
module. Only `u.start/u.gui/mod.ts` and `u.start/u.gui/t.ts` remain as thin entry and contract
planes. `m.main.ts` remains the upstream profile-menu owner and consumes the typed outcome without
acquiring release resources.

Retained responsibilities currently split across `u.start/u.authority.ts`, `u.browser.ts`,
`u.bootstrap.ts`, `u.deps.ts`, `u.error.ts`, `u.failure.ts`, `u.failure.materialization.ts`,
`u.final.ts`, `u.limits.ts`, `u.source.ts`, `u.state.ts`, `u.url.ts`, `u.identity/`,
`u.gui/u.boot.ts`, `u/u.start.gui.settlement.ts`, `u.start/u.screen/mod.ts`,
`u.start/u.screen/t.ts`, `u.start/u.screen/u.input.ts`, `u.start/u.screen/u.owner.ts`, and
`u.start/u.screen/u.resize.ts` move into one of the three owners above or one of the two pure
renderer leaves. The stale `PiCliProfiles.StartGuiSource` alias is removed from the public type
spine, and `PiCliProfiles.Gui.outcome` carries the endpoint's non-back result. Empty mechanism
files, compatibility exports, and tests for rejected behavior are removed rather than renamed.

### Selected product behavior

Retain:

- frozen canonical release evidence with no runtime release-source override, plus isolated
  package-internal development preview authority;
- release store, source, retry, byte, timeout, verification, browser, and recovery policy;
- early browser bootstrap, static browser-safe failure copy with no interpolated evidence, redirect
  on readiness, responsive terminal presentation, and nonfatal browser-open warning;
- Generation package admission before hosting and independent hosted-package admission afterward;
- `back`, `quit`, external cancellation, clean-only profile-menu return, failure foreground, and one
  immutable first-observed outcome without bespoke same-turn reprioritization;
- phase-local cancellation races that drain owner-producing work before releasing its dependencies;
- the six product-facing failure categories, checksum mismatch diagnostics, admitted links, and
  actionable recovery copy;
- presentation-stop request before backend interruption for clean control, but immediate backend
  quiescence with retained usable presentation for fatal failure or refusal; and
- application `finished` → Generation release → BootstrapStatus close settlement, with independent
  presentation and application-close completions owned before awaiting dependencies.

Reject as inherited implementation behavior:

- custom same-turn precedence among control, listener, Generation, host, and package-refusal events;
- exact microtask publication sequences and reentrant state-transition buffering;
- cleanup issue arrays, cleanup retry choreography, and final-error attachment graphs;
- deferred Generation release after failed application close;
- late successful owners manufactured by dependencies after violating lower package cancellation
  contracts;
- native-Promise and opaque-thenable defenses around typed package-internal seams; and
- identity-authenticated completion objects and settled-error WeakSets.

### Non-goals

- Do not change Server, BootstrapStatus, HTTP, CLI, FS, or Process contracts merely to centralize
  Driver Pi composition.
- Do not make GUI release source, integrity, package identity, browser policy, or store authority
  runtime-configurable.
- Do not build the UI, bind generated evidence, or start a local evidence server from `start:gui`.
- Do not redesign the reset flow, preview builder, terminal visual grammar, or generic Dist serving.
- Do not introduce another screen, input, resize, state, or presentation sub-framework beneath the
  selected adapter.
- Do not mistake one conceptual outcome for one literal race; phase-local observation and draining
  stay visible in the composition function.
- Do not preserve bridge-era scheduler order, hostile internal fakes, or cleanup evidence as hidden
  compatibility requirements.

### Proof boundary

Driver Pi proof must establish:

- release and development success, exact policy arguments, and both package checks;
- early bootstrap, readiness redirect, selected failure projection and foreground, browser warning,
  and loss of presentation viability;
- clean-control presentation-first requests versus immediate fatal backend quiescence;
- pending BootstrapStatus, Generation, and host operations drained after cancellation before any
  returned owner or dependency can be abandoned;
- application termination before Generation release and BootstrapStatus close requested last;
- distinct close, `finished`, keyboard, Generation, and status settlement, including rejection and
  non-settlement at each dependency edge; and
- typed back/quit/external-cancellation/failed propagation through the profile result, package-root
  and `/cli` executable aliases, local task wrapper, embedded API, and preview worker, including
  preview cleanup before exit projection.

Cover each distinct dependency edge, not the Cartesian product or rejected scheduler ordering. A
faithful host seam must react to `until`, and at least one real DistServer lifecycle proof must
verify clean-control and fatal-failure request order. Server, BootstrapStatus, DistServer, CLI, FS,
and Process suites remain authoritative for their internal input admission, listener, Promise,
cancellation, release, retry, and rollback semantics. Driver Pi tests must not violate those public
contracts to manufacture late owners or opaque transport.

#### Proof lanes

- During implementation, use focused `test:unit` and `test:profiles:process` runs for the changed
  behavior. Focused lifecycle fixtures cover cancellation during BootstrapStatus startup followed by
  late resolution, rejection, and non-settlement, plus each distinct close/`finished`/release/status
  dependency edge.
- Process proof invokes the package-root alias, `/cli` alias, and local task wrapper for presented
  failure and unexpected rejection. Preview proof covers every resolved outcome and rejection, and
  proves cleanup precedes failed-exit projection.
- Final package proof runs `deno task test`, `deno task check`, and `deno task dry` once, plus
  scoped formatting, scoped linting, residue scans, exact production-module accounting, and
  `git diff --check`. Package `test` intentionally includes the isolated `test:preview:real` Vite
  build; do not run that task a second time without diagnostic need.
- Adapt `test:release:local:runtime` to invoke canonical release policy. Its injected
  `openGeneration` may remap only the manifest transport and corresponding admitted source origin
  after first asserting the canonical manifest, pin, store, and materialization policy it received;
  companion assertions cover expected package, host limits, and browser policy. This is an
  explicitly side-effecting ephemeral-server integration lane, not runtime source authority.
- Run `test:release:local:browser:frozen` as its own explicitly side-effecting browser lane when its
  declared Chrome environment is available.
- Do not run the `test:release:local` umbrella for this endpoint proof: it includes
  `test:release:local:evidence:process`, which intentionally invokes the evidence binder and
  transiently writes the generated evidence leaf. Run that reproducibility lane only under separate
  explicit authority when the evidence pipeline itself changes; this arc does not select such a
  change.
- Before and after any authorized lane capable of touching candidate bytes, verify the generated
  evidence leaf and `dist` are byte-identical. The runtime and browser lanes must retain their
  explicit write denials.
- Because the selected design removes one public type and adds `PiCliProfiles.Gui.outcome`, root
  `deno task check:graph` is required.

#### Final production responsibility census

1. `u/u.start.gui.service.ts` owns immutable Driver Pi policy: canonical release evidence, preview
   admission, store and acquisition bounds, expected package, browser policy, independent Generation
   and hosted-package admission, bounded product-failure mapping, recovery copy, and exact package
   argument projection. It acquires no runtime owner.
2. `u.start/u.gui/u.session.ts` owns unavoidable sequencing: release and development entries,
   phase-local outcome races, immediate owner binding, control/fatal shutdown selection, failure
   foregrounding, operation draining, application termination observation, Generation release, and
   BootstrapStatus-last lexical settlement. It contains no registry, cleanup graph, or detached
   release continuation.
3. `u.start/u.gui/u.presentation.ts` owns finite presentation: BootstrapStatus page projection,
   screen and keyboard acquisition, resize/redraw observation, browser redirect and open warning,
   failure display and dismissal, and presentation shutdown. It owns no Generation, application, or
   BootstrapStatus-close lifecycle.

`u.start/u.screen/u.render.ts` and `u.start/u.screen/u.render.serviceRow.ts` are the only excluded
production leaves; both are pure frame formatting and acquire no owner. `u.start/common.ts`,
`u.start/u.gui/mod.ts`, and `u.start/u.gui/t.ts` remain thin shared, entry, and contract planes. The
generated `u/u.start.gui.service.evidence.ts` remains immutable data. Exact accounting is therefore
three behavioral production modules and two justified pure renderer leaves.

#### Final proof record

- Final `deno task test`: passed 62 package tests with 392 unit steps, one reset-process step, eight
  executable-process steps, and four real-preview steps. The direct-composition suite passed 27
  lifecycle steps; presentation and pure-renderer suites passed 14 further GUI steps.
- The final S-tier closure delta consolidates semantic contracts under `Start.Gui.*`, removes the
  preview-only `GUI` namespace wrapper, narrows presentation event authority, keeps captured
  root-link authority immutable, preserves primary plus cleanup failures in integration fixtures,
  and uses method shorthand for structured object returns and block-bodied object-literal
  implementations throughout the attributable surface. Compact single-expression callback properties
  retain canonical lambda form. The method-form delta passed 68 focused steps and the eight-step
  executable-process lane; all other affected direct-composition, policy, presentation, rendering,
  evidence, preview, menu/task, and real-preview proofs passed after their respective final edits.
- The transition-identity correction's focused presentation, renderer, and direct-composition run
  passed all 36 steps.
- `deno task check` and `deno task dry`: passed; dry-run emitted only the established unrelated
  dynamic-import warnings.
- Scoped source `deno fmt --check`, scoped source `deno lint`, `git diff --check`, and root
  `deno task check:graph`: passed.
- `deno task test:release:local:runtime`: passed six integration steps under explicit write,
  network, environment, and run denials.
- `CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' deno task
  test:release:local:browser:frozen`:
  passed admission and five browser steps under the frozen evidence policy.
- `dist/` and `u/u.start.gui.service.evidence.ts` have no worktree delta. The release-runtime and
  frozen-browser lanes remain separately authorized historical successful-path evidence and were not
  rerun for the failure-path-only correction; the evidence-binding umbrella was not run.
- Final residue scans found no imports of removed GUI modules, settlement authentication, identity
  diagnostics, cleanup graph, `DistServer.serve`, release-source override, or discarded failure
  operations in the live target.

#### Closure-review adjudication and correction

- The initial fresh blind closure review returned `CHANGES REQUIRED` with one P1 finding: the
  architecture and production ownership shape were coherent, but lifecycle proof relied on
  contract-invalid fixtures. The finding was accepted in full after independent comparison with
  `DistServer.Started`, Generation-owner, and `Cli.Keyboard.shutdown` contracts.
- The application test seam now returns `Start.Gui.Application.Owner`, the exact capability subset
  consumed by composition (`close`, `finished`, `origin`, and `verification`), rather than casting a
  partial object to `DistServer.Started`. Application close and Generation release fixtures each
  expose one memoized terminal operation; Generation `release()` and `[Symbol.asyncDispose]()`
  return the same Promise.
- Presentation fixtures now delegate shutdown to real `Cli.Keyboard.shutdown`. Rejected keyboard
  listener settlement preserves the exact rejection through presentation shutdown; non-settling
  listener settlement keeps presentation shutdown, session settlement, and BootstrapStatus close
  pending.
- Two integrated direct-composition proofs use the production presentation owner. They establish
  rejected and pending keyboard-loss settlement through application close/termination, Generation
  release, presentation shutdown, and BootstrapStatus-last cleanup, including exact primary and
  suppressed error identities.
- All GUI production contracts, including formerly file-local configuration, store, composition
  event, page-copy, and service-row contracts, now live under `Start.Gui.*` in `u.start/u.gui/t.ts`.
  Behavioral owners and renderer leaves contain no local semantic type declarations, import the
  single `Start` type namespace, and `u.start/u.gui/mod.ts` remains runtime/value-only.
- The repeat blind closure review returned `CHANGES REQUIRED` with one P1 finding: a synchronous
  presentation transition could publish a cleanup-preserving native `SuppressedError` to
  `owner.lost` yet throw a newly wrapped repaint error to its direct caller. Session settlement
  could therefore select the direct transition rejection and discard the exact screen-release
  failure. The finding was accepted in full; an executable regression first reproduced both the
  error split and the missing full-session cleanup identity.
- `lose()` now returns the exact terminal error it publishes and `update()` throws that same object.
  Presentation cleanup composition preserves native `Error` identities and only context-wraps
  non-Error throws, so repaint remains primary and resize/screen release remains the exact
  suppressed value.
- The unit proof establishes transition rejection identity with `owner.lost`, primary and suppressed
  cause identity, and screen-before-keyboard shutdown. The full-session proof establishes the same
  native `SuppressedError` through application close and termination, Generation release, and
  BootstrapStatus-last settlement, including that status remains open until presentation shutdown
  settles. No session-level arbitration or cleanup layer was added.
- The repeat review's seam observations are nonblocking and intentionally outside the P1 correction.
  `Presentation.Owner.current` and `redraw` support transparent external release-proof decoration,
  while `Presentation.Lib.toString` is the lifecycle-free renderer proof seam. `MainDependencies`
  and the preview source/input names remain narrow boundary-local contracts; they add no runtime
  owner or package-root export. Their role is now explicit and must not be confused with permission
  to broaden the later mechanical CLI move.
- The final bounded correction-only blind review returned `CHANGES REQUIRED` with three P1 findings.
  First, an event-driven presentation loss was published exactly once but was not retained for a
  later direct state transition. Second, a late exact `BootstrapStatus.finished` rejection could be
  replaced by a derived `close()` rejection. Third, this plan did not retain the mandatory opening
  shape and carried transient body-local implementation checklists. All three findings were
  accepted.
- Presentation now memoizes its first cleanup-composed terminal loss. `owner.lost`, every later
  state transition, and session settlement therefore observe the same error object, including the
  exact screen-release value in native `SuppressedError.suppressed`.
- BootstrapStatus settlement now captures `close()` rejection separately, waits for the
  already-bound `finished` event after close settles, prefers the exact `finished` rejection, and
  records an independent close rejection only when `finished` fulfilled. Existing primary errors
  retain precedence, and status close remains lexically last after application termination,
  Generation release, presentation shutdown, and application close.
- Contract-valid fixtures model distinct status-finished and derived-close errors. New proofs cover
  event-driven loss followed by transition, the same loss across a deferred Generation race, late
  status failure after clean selection and during product-failure foregrounding, status failure
  suppressed beneath an earlier Generation-release primary, and status-last ordering.
- This file now starts with its filename immediately followed by exactly the two opening arc
  checkboxes. Body-local transient status ledgers and planning checklists are absent; ordinary prose
  bullets retain the durable assessment and adjudication record.
- Final post-correction proof passes the 41-step focused presentation/rendering/composition suite;
  full package `deno task test` with 392 unit steps, one reset-process step, eight
  executable-process steps, and four real-preview steps; package `deno task check` and
  `deno task dry`; root `deno task check:graph`; scoped source format checking and lint; and
  `git diff --check`.

## Hard outcome

At most three Driver Pi production modules own GUI release orchestration and package policy:

1. one obvious linear orchestration module;
2. one immutable policy and evidence module; and
3. optionally, one presentation adapter.

Existing terminal-rendering implementation and tests are excluded from this budget only while they
remain presentation-only and acquire no release ownership or lifecycle coordination. Do not satisfy
the budget by concatenating unrelated responsibilities into large files or hiding machinery behind
nested closures.

A reader must be able to see the successful path in one place:

```text
snapshot immutable Driver Pi policy
  → establish status, controls, screen, and early browser feedback
  → open a release Generation, or select the development directory directly
  → apply generation package policy when applicable
  → start the verified application host
  → apply hosted package policy
  → publish readiness and run the session
  → settle package owners in their declared order
```

The final shape has no Driver-owned:

- resource registry or mutable resource bag;
- cleanup graph or cleanup-evidence model;
- supervisor-shaped closure of mutable flags, pending candidates, or competing outcome deferreds;
- operation or retention registry;
- Promise transport or captured-intrinsic substrate;
- emulation of lower-owner release, retry, or settlement semantics; or
- duplicated materialization, Rooted, hosting, or package-result graph validation.

## Responsibility rule

Every retained branch must be justified by a product-visible decision. Exact compatibility with an
inherited internal sequence is not sufficient. For each non-presentation failure or race, choose one
coherent disposition:

- remove behavior that is not a product requirement;
- rely directly on the typed package owner;
- move generic ownership into its semantic package; or
- retain the smallest visible Driver Pi policy response.

Do not create a higher-level facade merely to reduce file count. If a missing lower contract is the
only coherent answer, name its owner and minimal semantics before designing its API.

## Invariants

- Release and development authority remain explicitly distinct; canonical release startup accepts no
  source override, and development never opens release evidence.
- Generation and hosted package admission remain independent unless the assessment establishes a
  stronger package-owned contract.
- Control callbacks select an outcome but do not abort lower work directly. Clean shutdown requests
  presentation stop before backend interruption; fatal failure quiesces backend work immediately.
- Every owner-producing operation is drained after cancellation, and every successful owner is bound
  before validation or another await.
- An opened Generation remains strongly referenced until no pending host startup can use it and the
  application `finished` settlement, when applicable, proves termination. Driver Pi does not retry
  or reconstruct Server-owned terminal release truth.
- Application close, application `finished`, presentation shutdown, Generation release, and status
  close retain distinct completion truth; status close is requested last.
- Frozen evidence, package expectation, store selection, browser policy, and retained diagnostics
  remain bounded and immutable.
- No filesystem, network, subprocess, fixture, publication, or browser authority is widened.
- Generated release evidence and browser bytes do not change incidentally.
- Unrelated worktree changes and reachable history remain untouched.
- Planning, review, and completion do not authorize staging, committing, publication, or release.

## Blind review sequence

### Before implementation

After the first three DMIND probes are coherent, prepare one self-contained architecture-review
prompt for human handoff into a fresh reviewer session. Calibrate the pass from the live target and
follow the canonical blind-review prompt contract.

Give the reviewer the exact repository root, this plan and local arc item, landed public contracts,
live source and tests, reachable history, hard outcome, and decision to falsify. Because the plan
contains the responsibility census and selected design, require the reviewer to derive its verdict
independently and treat those conclusions as evidence rather than proof. Never provide the
implementing transcript, bridge-review report, prior review reports, verdicts or adjudication,
unpublished candidate conclusions, or praise.

The reviewer must independently derive the minimum coherent endpoint, inspect every surviving
orchestration or policy responsibility by exact symbol, identify shadow lifecycle machinery, and
make the strongest evidence-based case for direct composition, a lower-owner correction, or no
further change. Require a clear verdict and prioritized findings. Every material finding must name
exact source evidence, an executable failure or misuse sequence, the violated invariant, the
smallest coherent correction and owner, and the proof that would close it.

Return the report to the implementing thread for evidence-based adjudication. Accept, reject, or
defer every material finding and record only durable design, constraint, and proof consequences in
this plan; the report itself has no authority and does not become a second ledger.

Run one primary blind pass. Add another pre-implementation pass only for named information gain:
independent replication of a disputed claim or orthogonal falsification of a demonstrated coverage
gap. Do not commission broad duplicate review for reassurance. If a supported finding exposes a
missing lower-owner contract or a larger coherent unit, stop and revise the opening arc only under
explicit plan-scope authority before implementation.

One narrow orthogonal pass then falsified clean-control versus fatal-failure request order, phased
operation draining, the close/`finished`/presentation/Generation/status settlement dependencies,
canonical policy transport in integration tests, typed outcome propagation, and exact owner/residue
counts. No further pre-implementation pass is warranted absent a new disputed claim or demonstrated
gap.

### After implementation

Prepare a separate self-contained closure-review prompt for human handoff into another fresh
reviewer session. Bind it to the resulting live source and proof, not the pre-implementation
verdict. It must falsify the module budget, linear happy path, responsibility census, selected
product behavior, ownership and cleanup boundaries, and absence of hidden lifecycle machinery. Do
not award success for net deletion, renamed abstractions, test volume, or exact preservation of
unselected inherited behavior. Repeat only for a named unresolved risk or deliberately different
evidence surface, then adjudicate every material finding under the same evidence rules.

## Verification

- Produce a final responsibility census for every orchestration or policy module.
- Prove the retained release and development paths and both retained package-admission boundaries.
- Prove only product-selected cancellation, presentation, phased draining, and cleanup dependency
  behavior; cover each distinct non-settlement edge without recreating a Cartesian timing matrix.
- Run scoped format and lint, final package `test`, `check`, `dry`, the separately selected release
  runtime and browser lanes, and `git diff --check`; do not run the evidence-binding umbrella.
- Run root `deno task check:graph` because the selected implementation changes Driver Pi's public
  type boundary.
- Report the exact production-module count; the only excluded renderer paths are
  `u.start/u.screen/u.render.ts` and `u.start/u.screen/u.render.serviceRow.ts`, each justified as a
  pure presentation unit.

## Stop conditions

Stop and return to assessment if:

- the successful path cannot remain legible in one module;
- more than three production modules need orchestration or package-policy responsibility;
- preserving an inherited edge case recreates a supervisor, cleanup graph, or lifecycle substrate;
- a control callback must abort lower work directly, or an owner-producing operation can outlive a
  dependency released by Driver Pi;
- the fixed request/settlement dependencies cannot remain visible without a registry or detached
  continuation;
- a lower package must change but the opening arc still names only Driver Pi;
- meeting the file budget would require file concatenation or a speculative facade;
- the screen subtree grows beyond the two selected pure render leaves without a new product noun; or
- implementation would widen authority, alter generated evidence, or mix unrelated work.

## Completion

This plan completes only when the hard module budget, linear ownership story, responsibility census,
selected product behavior, package proof, and every material finding from both blind review stages
have supported dispositions. A smaller diff or another round of cleanup is not completion if Driver
Pi still wears a shadow implementation around package-owned lifecycles.

## Follow-on module-path cleanup

Begin this only after the current implementation, proof, and closure-review cycle lands. Keep it as
an independent architecture/API-path migration with no GUI or CLI behavior change.

### Locked topology

Reachable history shows that `afb0fd9a9` mechanically carried the former `m.pi/m.cli*` roots beneath
`m.core` while moving the core API. The live `m.core/mod.ts` now owns only the `Pi` boundary, while
the package root and `/cli` address CLI composition directly. No owner, lifecycle, or type invariant
requires CLI containment beneath `m.core`.

The three current paths are not three peer root subjects. `m.cli.profiles` owns the profile-driven
product mode, while `m.cli.raw` is a one-file public adapter over launch machinery that still lives
in `m.cli`. Moving all three to flat `src/m.cli*` siblings would repeat the CLI category at package
root and preserve that misleading peer relationship. Use one recursive CLI family beside core:

```text
src/
├── m.core/
└── m.cli/
    ├── mod.ts
    ├── t.ts
    ├── common.ts
    ├── m.profiles/
    └── m.raw/
```

This is a grouping, not a merge. `m.cli/mod.ts` remains the default profile-driven composition and
executable settlement edge; `m.profiles/` remains the independent profile, menu, migration, launch,
and GUI owner; `m.raw/` remains the explicit profile-free public entry surface. Existing shared Pi
launch mechanics remain directly under `m.cli/` because both modes consume them.

The exact relocation is:

```text
src/m.core/m.cli          → src/m.cli
src/m.core/m.cli.profiles → src/m.cli/m.profiles
src/m.core/m.cli.raw      → src/m.cli/m.raw
```

### Raw vocabulary

`Raw` means raw relative to Driver Pi profile policy: it bypasses profile YAML, profile context, and
the wrapper-owned default system prompt. It is not an unwrapped operating-system process; Driver Pi
still owns cwd resolution, sandbox permissions, package resolution, environment setup, and process
launch. Preserve the public `Raw` name and `/cli/raw` subpath. Do not rename it to `direct`,
`upstream`, `base`, or `runtime`: those names respectively overstate bypass, hide retained wrapper
policy, describe layering rather than purpose, or collide with existing runtime-root concerns.

Do not rename the whole shared `m.cli` substrate to `raw`; profiles already consume its runner,
argument projection, cwd/runtime-root handling, package resolution, sandbox projection, and process
seams. Do not invent another shared module merely for visual symmetry. The small `m.raw/` entry
module earns its boundary because `/cli/raw` is a deliberate public and executable package surface.

### Preserved contracts

The migration must preserve all of the following exactly:

- package exports `@sys/driver-pi`, `/cli`, and `/cli/raw`, with no new `/cli/profiles` subpath;
- `Cli === Profiles`, `main === Profiles.main`, the `Raw.main` and `Raw.run` contracts, and the
  existing `exitCode` projection;
- the public `PiCli` and `PiCliProfiles` namespaces and all result, profile, and GUI outcome shapes;
- profile-driven default behavior, explicit profile-free behavior, package-root executable alias,
  task wrapper, preview worker, and process status;
- current common/type dependency flow without widening runtime or package-root exports;
- byte-identical generated GUI evidence content after its path move and no change under `dist/`; and
- unchanged README-facing import paths and operational behavior. README edits are required only if a
  factual reference becomes stale; the current README contains no internal source path to migrate.

The move makes existing imports between `m.core/m.extension` and `m.cli/u.runtime.ts` more visually
explicit. Treat them as pre-existing graph edges and update them mechanically. Do not use this arc
to redesign runtime-root contracts, extension ownership, profile policy, or the shared launch
substrate unless dependency-graph proof exposes an actual cycle or invalid boundary; stop and open a
separate design decision if it does.

### Migration sequence

1. Start only from the separately landed GUI-composition arc and preserve unrelated worktree state.
2. Census every incoming, outgoing, and path-literal reference before moving. Include `deno.json`
   exports, test tasks, `cli:raw`, release-lane write denials, `src/mod.ts`, `src/types.ts`,
   scripts, fixtures, generated-evidence output paths, browser constants, process-proof URLs and
   import maps, module-graph assertions, and imports from `m.core/m.extension`.
3. Apply the three directory moves above without changing source behavior or generated evidence.
4. Repair relative imports, recursive common/type chains, package exports, task paths, permissions,
   scripts, fixtures, tests, and exact path assertions. Keep `m.cli/mod.ts` as the visible default
   composition edge and keep the two child modules distinct.
5. Perform a residue pass for every old `src/m.core/m.cli*` path and for the rejected flat
   `src/m.cli.profiles` and `src/m.cli.raw` targets. Inspect the final diff with rename detection
   and account for every non-rename line as a required path, import, assertion, or
   module-description update.
6. Land the migration as its own commit only after independent behavioral and graph equivalence
   proof. Do not combine opportunistic owner extraction, API renaming, GUI changes, generated
   evidence rebinding, or distribution rebuilding.

### Proof and stop gates

Proof must cover focused raw-CLI and profile suites; package-root, `/cli`, `/cli/raw`, local-task,
and preview executable boundaries; profile GUI and process proofs; package exports and public types;
package `test`, `check`, and `dry`; root dependency-graph checking; scoped format and lint;
`git diff --check`; old-path residue; and exact generated-evidence and `dist/` preservation. Treat
release-runtime, evidence-binding, and frozen-browser lanes according to their existing separate
authority gates rather than inferring permission from this plan.

Stop instead of broadening the arc if the move requires a public import change, behavior or outcome
change, a new compatibility facade, a new semantic module, a common-chain export widening, generated
evidence regeneration, distribution rebuilding, or an unrelated core/extension redesign. A thin path
migration is complete only when the grouped topology is truthful and no transitional flat-root or
old `m.core/m.cli*` residue remains.
