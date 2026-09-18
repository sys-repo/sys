start-ui.design.md
- [x] 6bf22370f [verified-dist-materialization.plan.md](../@sys.server/verified-dist-materialization.plan.md)
- [x] b59dbdd7b [local-dist-host.plan.md](../@sys.server/local-dist-host.plan.md)
- [x] 1ddeb15d feat(driver-pi): split profile start modes to CLI vs local UI launch
- [x] 58a62cb7d feat(driver-pi): persist interactive start-mode preference
- [x] 3698692a feat(driver-pi): compose start:ui through verified Dist runtime
- [x] 714adb95a feat(server): expose explicit local Dist serving authority
- [x] 90f4e64ab fix(http)!: confine package service-worker cache ownership
- [x] 1b6d1be5d style(http): normalize package service-worker cache module formatting
- [x] 8e9c9f398 feat(testing): add exact property fixture transactions
- [x] dc244efba feat(http): expose fail-closed service-worker deployment admission
- [x] ccdd57863 [self-hosted-assets.plan.md](../@sys.driver-monaco/self-hosted-assets.plan.md)
- [x] 789cc0e6a feat(testing): expose isolated service-worker lifecycle observations
- [x] 87f968f8e feat(http): expose exact loopback listener origins
- [x] 1ac62b764 fix(server.dist): avoid Deno.serve legacy per-request abort in dist asset reads
- [x] 29afbf59a feat(server.dist): expose explicit browser-origin policy for verified Dist hosts
- [x] e050ecad3 fix(driver-pi): deny service-worker authority on verified loopback origins
- [x] dd627678c feat(fs): expose owned-tree lifecycle leases
- [x] 52bd78839 feat(fs): expose sealed owned-tree publication and removal
- [x] 6a18c31d refactor(fs)!: move Rooted metadata to .sys.rooted
- [x] e5ab20e02 fix(server.dist): publish Dist generations through sealed promotion
- [x] 0cefa30b7 feat(driver-pi): admit GUI Dist identity from frozen launcher evidence
- [x] 923f23990 feat(server): expose an inert loopback bootstrap status host
- [x] 8a93318f8 feat(std): expose trap-free server predicates
- [x] a860cdebb feat(cli): expose owned keyboard listener completion
- [x] c99ddaf3e fix(http): retain keyboard ownership through server shutdown
- [x] 765be8c04 refactor(server.bootstrap-status): use canonical server predicates
- [x] 46a42d181 fix(server.websocket): retain keyboard ownership through shutdown
- [x] 1852ddf73 fix(server.dist): retain keyboard ownership through serve shutdown
- [x] d76c7471e fix(http): own listener settlement without ambient Promise reactions
- [x] f53a05a62 fix(server.bootstrap-status): retain listener ownership across Promise substrate failure
- [x] b99c8ca9a fix(server.dist): retain listener ownership across Promise substrate failure
- [x] d005f8772 fix(std): own disposal lifecycles without ambient async authority
- [x] 46c2c5161 fix(cli): own keyboard acquisition without ambient Promise reactions
- [x] f2d3c2a07 fix(cli): own terminal text presentation authority.
- [x] c953b90d2 refactor(cli): group terminal text utilities
- [x] 0ae39a4d5 chore(deps): refresh workspace dependency state
- [x] 45a13ace2 test(cli): align Text namespace ordering contract
- [x] fea59dbf0 feat(driver-pi): supervise start:gui through one boot state
- [x] 41e2befec fix(driver-pi): render failed start:gui state in yellow
- [x] 849546287 test(driver-pi): align bootstrap padding assertion
- [x] a8c457d79 fix(process): support sanitized child environments
- [x] ba76d365c fix(testing): stop encoding browser dependency probes as policy
- [x] 7499ade21 fix(net): preserve listener-owned port zero
- [x] 4f94687c5 fix(driver-vite): honor explicit build output authority
- [x] 3c56638a6 feat(driver-pi): bind local GUI preview directly to Vite build evidence
- [x] 40c4b925b fix(driver-pi): complete GUI preview integration from 3c56638a6
- [x] e827e2655 feat(driver-pi): link development GUI roots in terminal
- [x] 4a0e8522a fix(cli): underline terminal hyperlinks by default
- [x] 0f39b80fe fix(driver-pi): preserve Deno cache across preview isolation
- [x] 6a6abfec6 fix(driver-pi): render evidence separators gray
- [x] 0cb1caffa fix(driver-pi): wrap GUI evidence at item boundaries
- [x] 8dc50bf0d fix(fs): preserve Rooted removal commitment and read scope
- [x] b3c5de862 docs(driver-pi): restore conceptual hierarchy and runtime truth
- [x] 1f39d9fa9 feat(driver-pi): expose scoped start:gui Dist reset
- [x] 0fc21126c fix(driver-pi): diagnose invalid GUI cache
- [x] 7f1853239 refactor(driver-pi): split GUI screen test concerns
- [x] 17f68a5af feat(driver-pi): diagnose unavailable start:gui manifest sources
- [x] 969df90c9 refactor(http): fit direct service startup output to terminal width
- [x] 5055ec0a6 fix(driver-pi): settle failed start:gui exits without uncaught stacks

## Closure boundary

The landed structure through `5055ec0a6` is uniquely reachable with its recorded subjects, and the
three checked prerequisite snapshots are reachable completion commits. The final process-settlement
commit preserves exact internal rejection and cleanup truth while converting only privately
authenticated, fully settled GUI failures to deliberate user-facing exit status `1`. This plan is
complete and retirement-ready.

Product-entry, local `:8080` source/rehearsal, immutable publication, and public HTTPS proof work is
owned by [start-ui-release-evidence.plan.md](start-ui-release-evidence.plan.md). Its prerequisite
reference to this completed plan is checked; none of that successor work is claimed here.

## Final runtime shape

The interactive profile menu exposes two explicit modes:

```text
start:tui
start:gui
```

- `start:tui` preserves the existing Pi child-process path and remains the default.
- `start:gui` launches no Pi child. Direct and non-interactive profile selection remain TUI mode.
- The last interactive mode is persisted at `.pi/@sys/state/@sys.driver-pi/menu.json`; missing,
  invalid, or unsupported state falls back to TUI.
- GUI startup snapshots one closed release or development authority. The variants cannot merge or
  fall back to one another.

The GUI host lifecycle is:

```text
inert package-owned bootstrap status host
  → best-effort detached browser open
  → one frozen GUI authority
      release      → exact URL + manifest pin + expected package identity
      development  → exact isolated Vite output + build pin + expected package identity
  → verified Dist application host on a separate numeric-loopback origin
  → one foreground boot state projected to terminal and browser
  → ordered owned cleanup
```

The bootstrap is a read-only status projection, not an application, proxy, retry endpoint, or browser
control plane. It redirects only after verified application-host settlement. The application origin
serves only admitted verified Dist bytes and strict unknown-route responses.

## Artifact and filesystem authority

- URL is location; an independently distributed exact manifest pin and launcher-owned package
  expectation are release authority.
- Release mode materializes through the lower verified Dist owner: bounded source policy, exact
  manifest authentication, private staging, package-identity admission, sealing, atomic promotion,
  and fresh verification before execution.
- A valid promoted generation supports warm startup with zero source or credential work.
- An occupied refused generation is retained; startup never deletes, repairs, reacquires, or runs its
  bytes automatically.
- Promoted generations remain exact trees and gain accidental-mutation resistance without claiming
  an OS sandbox.
- Released sessions retain lower Rooted shared ownership. Unsupported locking or sealing fails
  released startup closed.
- Driver Pi does not reimplement lower hash, path, MIME, HTTP, filesystem, lock, seal, or promotion
  kernels and does not import `@sys/tools` for runtime composition.

Development preview is a separate prepared-generation path:

- one package expectation is frozen before callbacks;
- one unique task-owned output directory is allocated;
- Vite builds directly into that directory once;
- the returned producer pin is checked against the independent expectation;
- pinned local hosting reads that generation until session settlement; and
- cleanup removes it only after reader absence is positively established, otherwise retaining it.

The preview launcher, GUI worker, build parent, nested Vite process, and browser opener use explicit
process and permission boundaries. Sanitized child environments prevent ambient parent values from
becoming application authority. Shared `dist/`, release-store, unrelated-write, wildcard-network,
and unlisted-process access are not granted merely because preview succeeds.

## Browser authority

One exact Dist can be hosted under separate explicit browser policies:

- verified loopback denies application Service Worker registration, admits only exact-Dist declared
  dedicated-worker sources, and refuses observed Service Worker destinations outside the verified
  tombstone asset;
- syntactically non-loopback HTTPS may be admitted by the canonical browser helper, but URL syntax
  alone never proves publication, provider trust, certificate validity, reachability, or release
  provenance; and
- unknown or non-HTTPS non-loopback contexts fail closed.

Browser observations are observations, not attestation. No browser result proves absence of a prior
controller outside the isolated run. The verified host also enforces canonical Host authority,
Fetch-Metadata policy where present, strict routing, package-owned CSP/CORP/framing/referrer policy,
no cookies, and `no-store` loopback responses.

The exact Driver Pi product graph and normally trusted public HTTPS proof are deliberately not claims
of this plan; the successor plan owns them.

## Lifecycle and failure truth

- One trusted supervisor owns status host, application host, keyboard, screen, release lease,
  cancellation, and refresh bookkeeping.
- First failure remains primary. Cleanup failure or unresolved settlement is retained as explicit
  evidence rather than overwritten or mislabeled as absence.
- Browser-open failure is nonfatal: the secure session remains available and the terminal retains a
  clickable capability URL.
- Terminal and browser status are projections of one finite boot state, never competing state
  machines.
- Terminal output fits measured terminal cells across ANSI, emoji, wide, and combining text. Direct
  TTY output clips to width while non-TTY output remains byte-complete.

Released materialization failures preserve the exact lower base message and only sanitized
`stage`/`reason`/`cleanup`/`publication` evidence:

- occupied existing-verification evidence maps to `repair-required`; terminal guidance says the cache
  was refused and retained and may direct the developer to `deno task reset` before a fresh launch;
- manifest-fetch/resource-pull `source-denied`, `timeout`, and `resource-failure` map to
  `source-unavailable`; terminal guidance remains generic and never suggests reset; and
- malformed release configuration remains distinct because it fails before materialization.

The browser retains fixed generic failure pages and receives no raw causes, credentials, secret URLs,
manifest bytes, pins, or absolute host paths.

## `fix(driver-pi): settle failed start:gui exits without uncaught stacks`

### Observed failure

A real `source-unavailable` session remained foreground as designed. After trusted `Ctrl+C`, the
screen entered `stopping`, then the already-rendered materialization failure escaped through the task
entrypoint as `Uncaught (in promise)` with an internal stack rooted at `u.error.ts`,
`u.materialize.ts`, and `u.gui.ts`.

This is not a source-classification defect. It is a missing user-facing settlement boundary after a
failed foreground session. The stack duplicates an error the screen already presented, exposes
internal paths, and makes normal trusted quit look like an unhandled program failure.

### Required behavior

- Keep the failed screen foreground until trusted `q` or `Ctrl+C`; do not auto-exit, auto-reset, or
  replace the primary failure.
- Complete owned application/status/keyboard/screen/lease cleanup before terminal settlement.
- Exit the user-facing CLI with a deliberate nonzero status after an already-presented failed GUI
  session, with no `Uncaught`, stack trace, duplicate base error, or internal path output.
- Preserve zero exit after a ready GUI session closes through trusted quit.
- Preserve exact primary rejection and cleanup evidence at the internal supervisor boundary where
  programmatic owners depend on it; fix the CLI/task settlement seam rather than weakening lower
  failure truth.
- Do not blanket-catch every launcher error, compare error-message text, mark programmer failures as
  handled, call `Deno.exit` inside reusable library code, or add a second failure taxonomy.

### Proof

Use a real process-level CLI fixture, not only direct `startGui` promise assertions:

```text
source-unavailable + q       → one failed screen, ordered cleanup, nonzero clean exit
source-unavailable + Ctrl+C  → one failed screen, ordered cleanup, nonzero clean exit
repair-required + trusted quit → retained failure, nonzero clean exit
ready + trusted quit         → ordered cleanup, zero clean exit
unowned/programmer failure   → remains visible and is not silently converted
```

For handled failed sessions, assert bounded stdout/stderr and absence of `Uncaught`, stack frames,
internal file URLs, and duplicate base-error output. Retain the existing supervisor tests that prove
exact primary failure, foreground persistence, cancellation precedence, and unresolved cleanup
truth. The item is incomplete if clean presentation is achieved by swallowing an unknown failure or
reporting success.

## Development reset

`deno task reset` is development-only checkout maintenance. It removes only:

```text
.pi/@sys/dist/@sys.driver-pi
.pi/@sys/dist/@sys/driver-pi
```

The operation is direct, idempotent, offline-independent, and reports `deleted` or `already absent`
for each target. It accepts no caller-selected path, removes no shared parent or sibling, performs no
network probe, and never runs automatically. The human operator stops relevant GUI sessions before
using it; the task makes no runtime lease-coordination claim.

## Verification record

Proof was owner-scoped across the landed arc rather than represented by one retrospective mega-suite.
The commits and their tests establish:

- profile menu dispatch, preference persistence, TUI compatibility, and lazy GUI graph boundaries;
- exact release/development authority admission, materialization, package identity, warm reuse,
  tamper refusal, publication truth, and cleanup evidence;
- real loopback status/application hosting, strict browser-response policy, Service Worker denial,
  isolated browser lifecycle observations, and listener shutdown;
- Rooted locking, sealing, promotion, confined removal, unsupported-platform refusal, and destructive
  commitment truth;
- isolated real Vite preview generations, child-environment sanitation, permission confinement, and
  retained-output behavior after unresolved settlement;
- screen ownership, resize ownership, rendering, diagnostics, foreground failure persistence, and
  exact user guidance; and
- direct HTTP startup fitting for Unicode/ANSI TTY output with unchanged non-TTY output.

Final closure validation passed the Driver Pi package check and complete package test graph: 62 unit
suites with 491 steps, 27 profile suites with 327 steps, five process-settlement scenarios, and four
real-preview steps. Focused process proof established clean nonzero dismissal for source-unavailable
and repair-required failures through `q` and `Ctrl+C`, zero status after ready quit, ordered cleanup,
bounded output without duplicate errors or internal stacks, and ordinary uncaught visibility for an
unowned programmer failure. Formatting and `git diff --check` also passed. Future production entry,
local cold/warm rehearsal, and public artifact/browser proof belong only to the successor.

## Durable non-goals

This plan does not provide:

- a real production `App.UI` graph or published Driver Pi GUI artifact;
- an immutable artifact provider, uploader, credential manager, receipt system, or public origin;
- runtime TOFU, mutable `latest`, provider-supplied trust, post-pin mutation, or fallback to an older
  generation or development source;
- browser-selected source/pin authority, browser-triggered repair/reset/retry, or browser attestation;
- fixed or integrity-derived listener ports, durable browser-storage identity, or native app-shell
  integration; or
- automatic cache repair or corruption/tamper claims beyond typed lower evidence.

## Lifecycle

Complete at `5055ec0a6`. The final reality and proof record are reconciled, and the successor's
prerequisite reference is checked. Preserve a `plan(done)` snapshot before deleting this file with
`plan(retire)`; retirement remains a separate Git mutation.
