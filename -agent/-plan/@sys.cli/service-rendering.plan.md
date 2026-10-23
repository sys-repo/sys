@sys.cli
service-rendering.plan.md
- [x] 8a5c3aed6 feat(cli): share service rendering with HTTP startup
- [x] d0925d253 feat(cell): retain owner presentation in shared service rendering
- [x] be4edd54c refactor(sample-r2): share one service endpoint across direct and Cell startup

## Status

**Complete — retained completion record; not archived.**
All three runtime units and the human-approved reduced proof boundary are complete. Earlier design
and verification instructions below are historical, not new execution requests.

## Closeout reconciliation

All three runtime units in the opening arc are reachable with their exact recorded subjects. Their
source trees have no subsequent committed delta through the closeout inspection at `691bb36c9`. The
delivered goals are:

- One CLI-owned service renderer, immediately adopted by HTTP rather than duplicated there.
- Cell-owned capture/projection and lifecycle, preserving optional owner presentation across
  renders.
- One sample-owned HTTP endpoint shared with the direct serve task, plus an optional Cell
  descriptor.

The sample commit contains seven of the nine files reviewed during implementation. The two omitted
files were a concrete R2-through-Cell composition test and its fixture, not runtime implementation.
They were recovered, moved out of Cell, and then explicitly dropped at the human's closeout request.
That request withdraws both permanent delivery of this extra integration witness and the unlanded
sample-owned integration follow-up. The opening arc therefore remains the three landed runtime
units.

Retained proof belongs to its owners: CLI renderer matrices, HTTP propagation/lifecycle tests,
Cell's generic real-HTTP-owner integration and reporter tests, and the sample's networkless
endpoint/shell tests. The optional landed descriptor remains; it does not introduce a Cell import
into sample code. Neither Cell nor the sample retains the extra cross-package test dependency. No
replacement public API, test framework, task, or permission preset is required.

The tradeoff is explicit: the original concrete sample-to-Cell witness passed during implementation
and review, but is not maintained as an automated regression test. Those historical results are not
substitutes for a retained test. Completion is assessed against this human-approved narrower proof
boundary, not by pretending the two omitted files landed.

## Purpose and authority

Describe a service once, then render it directly or through the ordinary Cell service boundary.
Expose `Cli.Fmt.Service.format` with Cell's visual hierarchy as the standard default. Collections
share column measurement. Owner presentation controls detail values, never identity or row
structure.

The completed R2 delivery extraction and its parent record remain closed. This work does not reopen
them; plan retirement remains human-deferred. This plan is not an API source of truth. Types,
implementation, and owner tests must establish the contract below.

Planning grants no implementation, test execution, Git mutation, provider operation, or permission
change authority. Implementation and verification require subsequent explicit authorization.
Preserve unrelated worktree changes. Never bypass a failed authority, provenance, or permission
check.

## Planning baseline and adjudication

During planning, source was inspected at HEAD `647a1cdb19f6f0a834ae778e953a2488fe1b89ca`; a final
concurrent-history recheck reached `e8d76fce2e55552f8b3bfea252476695a62624c4`. The relevant CLI,
HTTP, Cell, types, crypto, and Cloudflare packages had no committed delta from the review's
`c5e9bd79cef123301e6e2399e52c1c72edd9822f` through that recheck, and no staged or unstaged source
delta at that inspection. Existing tests were source evidence only during planning; implementation
and later review execution are recorded below.

- **Accept: two propagation boundaries.** HTTP `u/u.start.ts` captures `formatDetail` for printing,
  but its returned handle omits it. Cell preserves that handle in `u.start.service.ts`, then
  `serviceStatusesOf` discards it from the rendering view. Expose an optional HTTP handle
  capability; capture it in the Cell CLI adapter before projection. No CLI type enters generic Cell
  contracts.
- **Accept: original-fact correspondence.** Cell `u.fmt/u.services.ts::serviceDetails` filters and
  transforms owner details. Associate each surviving projected detail object with its source fact
  inside that service's captured snapshot. Invoke presentation with source facts; retain projected
  labels and projected plain fallback. No label/value lookup, public detail ID, or global map.
- **Accept: navigation policy belongs with shared rendering.** `ServiceUrl` separates original href
  from display but does not perform Cell's admission checks. Move the service-block admission,
  clipping, and final-label link logic upstream without changing the standalone `ServiceUrl` API.
- **Accept, qualified: presentation errors are observable.** HTTP `detailValue` invokes unbound and
  lets exceptions escape; `-u.start.test.ts` asserts original error identity and listener cleanup.
  Preserve that behavior when a render invokes the callback. Silent startup, no surviving details,
  and empty output do not become unconditional callback-validation runs.
- **Accept: HTTP needs an adapter, not just `status()`.** Its printer also owns package provenance,
  legacy info, distribution and port explanations, root projection, and actual keyboard affordances.
  Project these for display without adding synthetic facts to the returned owner status.
- **Accept: layout needs correction, not relocation.** Cell measures labels/reservations with
  `.length` and its frame always supplies finite width. Use `Text.Width` and `Table.pairs`; make
  unbounded non-TTY framing explicit. HTTP's multiline and whole-value fallback contracts survive.
- **Defer: comprehensive status-read hardening.** Cell's `handle.status` getter is accessed outside
  its existing catch. Preserve current behavior: malformed/throwing status method calls become error
  snapshots, while a throwing method getter can escape into startup cleanup. Moving that getter,
  containing hostile error normalization, or changing generic status capture is separate work.
- **Reject: data-only status as sufficient for the required rich case.** One scalar URL cannot carry
  two independently linked shell fragments with owner allocation. Splitting rows changes the desired
  presentation; general segments/allocation instructions create an unearned document language.
- **Reject: service-wide render hooks and display registration.** They surrender identity/layout or
  require a second owner declaration. A single local value callback earns the needed extension.
- **Accept scope, not verbatim code: sample endpoint.** Extract ordinary lifecycle composition from
  `task.serve.ts`; do not import its side-effectful task entrypoint. Keep bootstrap, credentials,
  listener policy, and shell presentation sample-owned. The review's sketches are not verified code.

Planning evidence paths, relative to repository root (including helpers later moved or removed):

- `code/sys/types/src/t/t.Service.ts`
- `code/sys/cli/src/m.core/m.Fmt/{t.ts,m/m.ServiceUrl.ts,u.service/u.url.prepare.ts}`
- `code/sys/cli/src/m.core/m.Table/u.pairs.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/{t.ts,u.width/u.width.ts,u/u.budget.ts}`
- `code/sys/http/src/http.server/m.HttpServer/{t.ts,u/u.start.ts,u.print/u.print.ts,u.print/u.print.url.ts}`
- `code/sys/cell/src/m.cell/u.services/{u.start.service.ts,u.status.ts}`
- `code/sys/cell/src/m.cli/{u.fmt/u.services.ts,u.lifecycle/u.start.ts,u.lifecycle/u.start.reporter.ts}`
- `code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/{task.serve.ts,u.status.ts}`
- `code/sys/crypto/src/m.Fmt/common.ts`

## Settled public boundary

One CLI-owned namespace, `CliFormat.Service`, projected through the existing `@sys/cli/t` type lane:

- `Lib`: `format(input, options?)` and `formatList(inputs, options?)`, both returning `string`.
  `format` uses the same engine as a singleton list, not a separate layout implementation.
- `Input`: required `name`; optional `module`, `annotation`, renderer-neutral `status`,
  `presentation`, `keyboard`, and existing `ServiceUrl.Parts.Options` as `urlDisplay`.
- `Options`: optional `width`, `terminal`, and `urlHyperlinks`.
- `Presentation`: optional `formatDetail` callback.
- `FormatDetail`: `({ detail: Service.Detail, maxWidth?: number }) => string | undefined`.
- `PresentationProvider`: optional `servicePresentation: Presentation` on a local handle.
- `Keyboard`: optional `open` and `quit` strings. This describes affordances, not bindings.

`format({ name: 'example' })` needs no status or presentation object. The explicit name always wins;
`status.name`, `kind`, and `config` do not create implicit rows. URL labels do not create extra
rows. Annotation is separate text, never parsed out of `name`. Cell supplies `--mode=<variant>`
itself.

Keep `Service.Status`, events, and lifecycle endpoint contracts unchanged. The capability is
trusted, local, synchronous code, not serializable status. A selective facade must explicitly
forward it with its corresponding facts; never search nested `.server` or `.handle` fields.
`HttpStatic.start` already returns the HTTP handle directly. No migration sweep of unrelated
wrappers is required.

### Capture, correspondence, and failure

- HTTP captures `Start.Options.formatDetail` once with the other start inputs and exposes that same
  captured function through the handle, including silent starts. Later input mutation cannot replace
  it. `HttpServer.Print.FormatDetail` becomes an exact alias of the CLI callback; keyboard print
  options may likewise alias the shared keyboard shape. Existing option spellings remain supported.
- Cell CLI obtains one status snapshot per started service through the existing status adapter. Copy
  the render-consumed facts at that boundary, then retain source-detail and projected-detail
  correspondence privately per service. Resizes do not reread status, redo cwd projection, or
  replace captured callback references. Do not promise to freeze a callback's external closure
  state.
- Discover presentation only when surviving owner details need it; missing status yields only Cell
  identity/provenance, and absent presentation yields plain facts. Filtered rows never invoke it.
  Read the capability and its callback once at capture. Undefined is absent; an explicitly malformed
  capability or non-function callback is a deterministic TypeError. Getter failures propagate as
  presentation failures, not as fabricated status facts or silent fallback.
- The renderer captures a supplied callback once per render, measures all labels first, then calls
  it unbound exactly once per surviving detail in order. Cell's wrapper calls the captured owner
  function unbound with the associated source fact and current value budget. HTTP's wrapper bypasses
  synthetic context details. No implicit receiver, retry, awaiting, or probing invocation.
- Empty collections and resolved zero-width output return before reading presentation or invoking
  detail callbacks in the renderer. Cell's earlier snapshot/capability capture is separate. A
  callback is not a startup health check. If one throws, rendering stops and propagates the exact
  thrown value.
- Undefined uses the projected plain fact; an empty string is a meaningful empty value. Any
  non-string, non-undefined return, including null or a Promise, throws TypeError in TTY and non-TTY
  output. Do not rely on `.split` or table coercion to discover malformed returns.
- Split values on LF. A rich result is accepted only if every physical line fits its budget; if any
  line exceeds it, use the entire plain fallback, fitted line by line. Preserve blank continuations
  and authored edge lines; add no synthetic edge newline. Never partially retain or clip rich
  output.
- Owners must independently close ANSI styles and OSC links on every physical line. No automatic
  repair, sanitization, callback timeout, sandbox, termination guarantee, or output-wide link
  switch. Substrate authority/finite-limit failures propagate, never becoming ordinary plain
  fallback.

## Standard presentation and layout

Row order: service, module, non-ready state, root, details, structured error, URLs, keyboard. Green
service label; white non-bold identity; one-cell-indented dim-gray child labels; gray details and
module; dim-cyan annotation; underlined root paths; existing Cell state/error and URL treatment. No
label-based detail filtering, filesystem discovery, hash semantics, or cwd lookup in CLI.

- Explicit width wins even with `terminal: false`. Otherwise resolve stdout terminal state once;
  non-TTY is unbounded and terminal output resolves screen width once. `terminal` selects sizing,
  not color policy or callback OSC policy.
- Floor positive widths. A resolved width outside 1..65,535, including zero, negative, non-finite,
  and positive sub-cell widths flooring to zero, yields empty output. Check explicit invalid width
  before `Width.fit`, whose default fallback semantics would otherwise replace it with 80.
- Measure LF-delimited physical labels across the complete collection with `Text.Width`, never
  code-unit length. Indent each nonempty child-label line consistently. Use `Table.pairs` for
  continuation alignment without padding the value column.
- Use the normal three-cell gap. At bounded widths of at least four cells, label allocation is the
  lesser of natural label width and the floored half-width remaining after that gap. At widths 1..3
  collapse the gap and apply the same floored half-width cap. Reserve label allocation plus gap.
  Unbounded output uses natural label width. The value budget is the remaining width, not a second
  independently measured column.
- Fit plain lines by grapheme-aware middle omission, with dim-gray omission markers. Preserve
  annotation styling across clipped retained fragments; never infer annotation from identity text.
  Paths use the existing path formatter without ambient cwd discovery.
- `formatList` owns dim-gray dashed separators only between blocks. With bounded width, separators
  use that width; unbounded separators use the widest rendered physical row in the collection. No
  ambient 80-column separator fallback in an otherwise unbounded list.
- Retain existing Text authority checks and finite ceilings. Service-owned aggregate source/output
  and physical-line assembly must stay within the same package-private presentation envelope; reuse
  existing budget support rather than publishing new limits or catching refusals as fallback.
- Cell keeps its two-cell frame gutter. Pass undefined inner width for unbounded non-TTY output;
  subtract both gutters only from a finite frame width. Tiny finite frames can remain empty.
  Headers, summaries, subscriptions, screen height, reporter sinks, and shutdown remain Cell-owned.

### URL policy

Admission applies even when automatic links are disabled. Check original source text before display
preparation: raw C0/C1 controls, malformed/null-origin URLs, and credentials produce `invalid URL`
without echoing the rejected target. Credential-free HTTP(S)/WS(S) may be linked; safe unsupported
schemes retain the existing unlinked fallback. Local `file:` URLs are not service URLs.

`urlHyperlinks` defaults false and controls only automatic service-URL OSC links. Cell's existing
reporter selects it for terminal output. Trusted detail callbacks may retain their own links even
when it is false or output is non-TTY; do not advertise it as an output-wide prohibition.

Link the final visible label to the admitted original URL's serialized `href`, never its prettified
or clipped display. Empty and omission-only labels remain unlinked. Preserve origin/port/suffix
styling through clipping and reset repeated-origin tracking per service. HTTP supplies settled
origins and exact display policy; WS and HTTP remain distinct origins. Local directory and manifest
links remain sample-owned detail presentation. CLI must not import `crypto/fmt`, which imports CLI.

## Implementation units and proof

### 1. Shared renderer and HTTP adoption

Implement within the existing `m.Fmt` boundary, following its `t.ts`, `m/`, and utility grammar; no
new package or speculative module scaffold. Group the three service helpers under `u.service/`,
importing `../common.ts` directly rather than adding a forwarding file. Write the public types
before runtime fulfillment.

Move service-block rendering semantics upstream and adopt them immediately in HTTP:

- Preserve name selection, package normalization, `status.details ?? infoDetails(info)` (including
  explicit empty-array precedence), root selection/cwd projection, and URL construction in HTTP.
- Append distribution and port explanation details to the display projection, not `status()`;
  preserve existing pkg/hash gating and requested/actual-port behavior. Owner callbacks see only
  genuine details, not synthetic rows with coincidentally matching labels.
- Delegate to `Cli.Fmt.Service.format`; retain HTTP sink-specific separator tracking and outer
  spacing. Keyboard visibility still follows successful binding and existing print options.
- Expose captured optional presentation on `Started`; retain shutdown and startup-failure cleanup.
- Remove superseded HTTP layout/URL-fragment helpers only after checking their remaining references.

CLI proof: singleton/list equivalence, all-label collection alignment, Unicode/graphemes, multiline
labels/plain/rich values, blank/empty values, whole-value fallback, callback receiver/count/capture,
malformed returns, throw identity, styles, width 0..8/invalid/fractional/ceiling edges, TTY
detection count, explicit non-TTY width, unbounded output, separators, URL admission and exact
targets, and finite-limit/authority refusal propagation. Keep common matrices here rather than
duplicating them.

Allocation-order review consequence: reject cumulative physical label-line overflow during capture,
before flattening the measurement collection. Reserve rendered label/value code units, padding, and
physical output lines incrementally before collecting and joining each pair. Eventual rejection
after a styled multiline join is insufficient. Boundary regressions establish refusal before the
affected value callback and before subsequent service facts are collected; both failed against the
prior implementation. Exact 65,535-code-unit output and 4,096-line acceptance guard against double
counting.

Follow-up composition correction: admit separator size, active ANSI framing, newlines, and
repetition before constructing the rule. Preflight each automatic link against the pair's remaining
aggregate budget before encoding it; use one captured serialized target for both measurement and
composition. Keep OSC framing and encoded-size calculation together in `u/u.hyperlink.ts`. Preflight
does not charge the value twice. Five refusal-order regressions ran red → green, observing the real
rule/link composer through internal dependency seams. Exact output and separator-line boundaries,
repeated links/rules, percent-encoded targets, and one-over refusal pass. Long unlinked/clipped-link
acceptance is additional characterization, not a claimed red step. The follow-up passed both package
checks, full CLI tests (53 tests / 392 steps), full HTTP tests (56 tests / 456 steps), both entry
proofs, targeted formatting and lint, and `git diff --check`. This pass did not include an
interactive TTY run or independent corrective re-review.

Styled-row and URL-preparation correction: fitting retains a small set of private, palette-tagged
fragments until the complete textual projection has been admitted. Preflight covers labels, values,
clipped fragments, active ANSI framing, nested style peaks, root underlining, and table
reservations. Fixed-size style probes measure framing and reset rewriting; actual output is still
charged once. Root capture reuses `m.Path.ts::displayPath` without constructing color that would
immediately be stripped. Label capture admits indented code units before constructing the
measurement collection. URL preparation measures captured serialized components before joining them
and admits cumulative prepared display text across the service list; standalone `ServiceUrl` remains
unrestricted by this service-specific envelope. This bounds service-owned projections, not native
URL-parser storage, owner callback allocations, or total JavaScript heap usage.

Six regression steps ran red → green after behavior-preserving composition seams were introduced:
ANSI title overflow, exact/one-over output across nine row families, styled-size preflight,
individual and aggregate encoded URL preparation, exact URL-preparation limits with standalone
compatibility, and indented-label refusal before later fact reads. Nested-style peak and plain-root
equivalence checks are additional passing characterization, not claimed red steps. Verification
passed both package checks, full CLI tests (53 tests / 400 steps), full HTTP tests (59 tests / 456
steps), both entry proofs, scoped leak-traced tests, targeted formatting/lint, and
`git diff --check`. The HTTP run includes the concurrent startup-test split; this correction did not
edit those HTTP files. No interactive TTY run or independent corrective review was performed in this
implementation pass.

LF-admission correction: the combined-unit independent review found that `Str.count` constructs a
split array before the physical-line guards run. Replace it locally with an LF scan that stops at
the first exceeded limit, checking both per-value lines and cumulative labels before the sole split.
Keep the 4,096-line and 65,535-code-unit ceilings unchanged. ANSI reset-size preflight now
accumulates code-unit adjustments by scanning rather than constructing reset collections; `@sys/std`
is unchanged. After exposing the split-first allocation through an internal splitter seam, the
per-value and cumulative-label refusal-order regressions both ran red → green. Public
label/plain/rich exact-limit cases and dense ANSI reset sizing are passing characterizations, not
additional red steps. Verification passed both package checks, scoped leak-traced CLI (17 tests /
164 steps) and HTTP (11 tests / 88 steps), full CLI (53 tests / 404 steps), full HTTP (59 tests /
456 steps), both entry proofs, three-file formatting/lint, and `git diff --check`. No interactive
TTY or new independent review of this correction was performed. The complete 30-path CLI + HTTP
unit, including `m.Fmt/mod.ts` and accompanying documentation cleanup, landed as `8a5c3aed6`. The
human explicitly selected those files in full; earlier advice to exclude documentation hunks was
superseded.

HTTP proof: preserve each print option's projection, explicit empty details, callback aliases and
captured capability, silent handle composition, no callbacks for synthetic rows, exact IPv4/IPv6
origins, keyboard availability, sink spacing, and the existing callback-error port-release test.
Intentional visual changes are asserted separately from unchanged fact and lifecycle behavior.

### 2. Cell adapter and ordinary-boundary witness

Add a private CLI capture/projection adapter over each original `StartedService.handle`; do not add
presentation to `StartedServiceStatus`, generic lifecycle contracts, or status events. Keep existing
filters, `dist`/capabilities normalization, root suppression, selected identity, mode, and
provenance. Delegate the whole list to `formatList` once, not independently formatted blocks joined
afterward. Correct unbounded non-TTY framing; retain reporter-owned links, resize, outer spacing,
and cleanup. Remove duplicate row and URL-fragment rendering, not unrelated `FmtFit` consumers.

Cell proof: projected-label/source-fact pairing, undefined projected fallback, filtered callbacks
not invoked, duplicate equal details in two services with different targets, status captured only
once, resize using new budgets with captured facts/functions, no-presentation and no-status handles,
existing status error snapshots, forwarding/non-forwarding facades, identity not replaced by owner
name, framing and reporter policies, and presentation-error cleanup. Preserve the existing getter
failure boundary rather than claiming comprehensive status-read containment.

Include one test that loads an ordinary Cell endpoint returning an HTTP-owned handle and reaches the
CLI `onReady` render path. It must retain owner detail links, selected identity, module provenance,
and width behavior. A test that merely calls the renderer twice does not meet this boundary.

`Fmt.Services.capture` takes the original started handles and captures one status/capability per
service, preserving private projected-to-source detail identity. `Fmt.Services.started` delegates
the collection to the shared renderer. Startup retains that snapshot across renders; frame sizing
permits unbounded non-terminal output and preserves authored trailing LF rows. Generic Cell
contracts, status capture, reporter lifecycle ownership, and the sample remain unchanged.

The ordinary endpoint witness returns a real HTTP handle through the Cell descriptor loader. The
initial owner-link and formatter-failure cases ran red → green. Further capture/projection, facade,
malformed capability, Unicode alignment, empty/whole-value fallback, frame, and screen-resize cases
are passing characterization; no additional red step is claimed. Initial-render and screen-resize
failures retain the exact cause and release the HTTP listener. Screen effects are supplied by a
reporter harness; endpoint loading, status, presentation capture, rendering, and cleanup stay real.

Initial adoption verification passed CLI/HTTP/Cell package checks and full suites: CLI 53 tests /
404 steps, HTTP 59 tests / 456 steps, Cell 38 tests / 325 steps. The scoped leak-traced Cell run
passed 6 tests / 78 steps. Both CLI/HTTP entry proofs, nine-file formatting and lint, and
`git diff --check` passed. Two pre-existing reporter-test `prefer-const` diagnostics were corrected
in the touched test file.

Screen-row correction: independent review identified that `createScreen.frame` still trimmed the
already-framed service body, removing owner-authored trailing blank continuations. Remove only that
body trim; retain summary trimming, reporter-owned separators, and viewport clipping. A regression
using real capture, shared rendering, and Cell framing with only terminal effects supplied ran red →
green. With no URL/error row after the final detail, it asserts both trailing LF rows survive ready,
resize, and completion. It also checks raw output, summary normalization, and short-viewport content
priority; those are passing characterizations, not separate red steps.

Correction verification passed Cell `check`, leak-traced reporter tests (1 test / 27 steps), the
full leak-traced Cell suite (38 tests / 326 steps), ten-file formatting/lint, and
`git diff --check`. CLI/HTTP suites were not rerun for this Cell-only correction. No interactive TTY
run, independent review of the correction, provider operation, sample execution, permission change,
or Git mutation occurred in that correction pass. A subsequent human-supplied independent review of
the landed Cell unit reported no material findings after inspecting its full commit scope, including
the extracted reporter suites and shared-owner assertions. It reported fresh scoped tests and
Cell/CLI checks; no further Cell change was required. Harnessed screen effects are not
interactive-terminal proof.

### 3. Sample endpoint and owner-local proof

Add the sample-local `-scripts/service.ts` lifecycle endpoint and its contract through the existing
sample script type lane. Extract only the current serve bootstrap: inputs, upward environment load,
app construction, build status, fixed 127.0.0.1:8080 strict-port policy, keyboard false, and URL
paths. Honor the caller's `silent` and runtime `until`; return the HTTP handle directly without
disposing it. Keep task reporting, SIGINT registration, waiting, and disposal in `task.serve.ts`.

Because `readInputs(root)` reads the fixed `r2.config.json`, validate the supplied ordinary config
path resolves to that file; do not silently ignore it or introduce alternate config semantics. Add
the ordinary sample-root Cell descriptor selecting this endpoint and that config. No renderer
reference, shell field, or display registration appears in the descriptor. Do not add a Cell
production dependency on the sample, or a provider-enabled Cell launch task/permission preset.

Retain deterministic, provider-free sample tests for config-path refusal before IO, ordered
bootstrap, fixed listener policy, lifecycle/silence forwarding, original failure identity, and owner
presentation. Reuse the real `buildStatus` and pinned local Dist fixture. Preserve
digest-versus-pin, pin capture, full/path-only/empty fitting, independently linked
directory/manifest targets, and unavailable output. Endpoint unit tests supply inert bootstrap/start
dependencies rather than opening a listener or reading credentials. No Cell CLI implementation or
Cell test helper belongs in these sample tests.

Cell's generic ordinary-HTTP-endpoint witness in item 2 owns capture, selected identity/provenance,
resize, framing, and cleanup. The CLI matrix owns whole-value over-budget fallback; do not make the
real adaptive sample callback misbehave merely to repeat it. The originally required concrete
R2-through-Cell capstone was executed but its permanent delivery was withdrawn by the human at
closeout. Do not replace it with an unearned shared harness. No bootstrap cancellation, credential,
delivery, publication, or service-worker policy change belongs here.

Sample implementation evidence: `SampleService.start` now owns the shared bootstrap and returns the
HTTP handle unchanged. `task.serve.ts` delegates to it while retaining task reporting, SIGINT,
waiting, and async disposal. The sample-root descriptor selects `SampleService` from
`./-scripts/service.ts` with `./r2.config.json`; no renderer registration or provider-enabled task
was added. Contracts stay in the sample script type lane. CLI, HTTP, generic Cell contracts, and
Cell production code are unchanged by this unit.

The config-path refusal test ran red → green against the extracted endpoint: a different config
reached bootstrap before the guard, then refused before input IO after the guard. Ordered bootstrap,
listener options, lifecycle/silence forwarding, original failure identity, and the composed shell
cases are passing characterizations, not additional red steps. The existing shell tests now share
one pinned private-Dist fixture with the new tests; digest-versus-pin, pin capture, fitting, and
unavailable-local-output assertions remain intact.

Historical composition evidence: the now-retired capstone imported the production
descriptor/endpoint without starting it, then used that descriptor with a test-only endpoint module
for direct and ordinary Cell startup. Both callers invoked the sample's `startWith`: input reads,
`buildStatus`, HTTP, endpoint loading, presentation capture, and ready rendering were real.
Environment/app bootstrap was inert; the HTTP adapter asserted production listener policy before
adapting only the listener port. It covered exact directory/manifest targets, Cell path-only
fitting, missing-output fallback, selected identity/provenance, silence, and caller-owned
shutdown/port release. These are historical execution results, not retained regression coverage,
live R2/bootstrap, or interactive-terminal proof.

Verification passed sample scoped tests (2 tests / 13 steps), the leak-traced Cell composition suite
(1 test / 3 steps), CLI/HTTP/Cell package checks, and full suites: sample 23 tests / 109 steps, Cell
42 tests / 335 steps (both leak-traced), CLI 53 tests / 406 steps, HTTP 59 tests / 456 steps. Both
CLI/HTTP entry proofs passed, as did nine-file formatting, eight-file lint, and scoped
`git diff --check`. The sample has no separate check task; no ad-hoc checker was substituted. No
live sample task, provider operation, real credential read, permission change, independent review,
interactive TTY run, or Git mutation occurred in that implementation pass.

A subsequent human-supplied independent review of all nine sample-unit files reported no material
findings. Its fresh verification covered sample endpoint/shell tests (2 tests / 13 steps), the
leak-traced Cell composition suite (1 test / 3 steps), Cell check, and scoped diff checks. The
adjudication retained the runtime implementation. That review included the original Cell-side proof
files; the later human closeout decision below withdraws their permanent delivery. It does not erase
the historical execution or extend that review into a fresh review of the final closeout.

Evidence limit: the provider-free tests invoke the shared implementation through test dependencies,
not the production dependency table or executable task's SIGINT path. Production wiring and task
equivalence were checked against source and the pre-extraction task, not inferred from those tests.
Live R2/bootstrap, fixed-port collision, OS-signal, and interactive-terminal execution remain
outside the established proof; no broader runtime claim is made.

## Closeout scope decision

The human explicitly authorized dropping the extra sample/Cell integration artifacts and reconciling
this plan for closure. The sample owns its endpoint and shell output, not Cell's private CLI. Moving
the capstone from Cell into the sample corrected one dependency direction but introduced a permanent
private-implementation dependency into the sample's test surface. Neither placement is retained.

Removed the untracked `-scripts/-test/-service.cell.ts` and `u.fixture.service.ts` from the sample,
along with the added `test:cell` task and `test-cell` permission preset. Restored the sample's
`deno.json` to its landed content. The earlier Cell-side copies were already absent. Removed the
unlanded fourth arc item rather than falsely checking it or inventing a cleanup implementation
commit. The three landed runtime units, optional descriptor, generic owner tests, and sample unit
tests remain unchanged. No permanent concrete R2-through-Cell test is a remaining closeout
obligation.

The temporary relocated task had passed 1 test / 4 steps before removal; that receipt records an
experiment, not delivered coverage. The retained suite and source audit, rather than this removed
task or a prior verdict, are the final verification surface. No runtime behavior is changed by this
cleanup, so no new red → green bug-fix claim is made.

### Final closeout verification

Fresh verification after deletion used each module's declared tasks. Full suites selected
`--trace-leaks --quiet --reporter=dot`; the sample's unit preset still has no networking grant.

| Owner  | Full test task | Tests / steps | Other checks                            |
| ------ | -------------- | ------------- | --------------------------------------- |
| CLI    | `test:unit`    | 53 / 406      | `check`, `test:keyboard:entry` passed   |
| HTTP   | `test:unit`    | 59 / 456      | `check`, `test:file-bytes:entry` passed |
| Cell   | `test`         | 41 / 332      | `check` passed                          |
| Sample | `test`         | 23 / 109      | No separate check task exists           |

Before the full runs, the retained sample endpoint/shell tests passed 2 tests / 13 steps and Cell's
ordinary HTTP-owner presentation integration passed 1 test / 3 steps, both leak-traced. Source
inspection confirmed HTTP's captured presentation remains outside status, Cell maps projected
details back to originals and delegates layout, and the sample still returns the HTTP handle while
its task owns signals/wait/disposal. Shared renderer source retains pre-allocation admission and
whole-value fallback. The generic Cell integration still covers ready rendering, actual reporter
resize, exact error propagation, and listener cleanup without importing the R2 sample.

The same-thread TMIND/STIER closeout audit found no remaining in-scope implementation or ownership
finding. The three original runtime goals and retained acceptance checks are complete under the
explicitly reduced proof boundary. Scoped Git inspection confirms the four source/configuration
trees match landed content; only this plan snapshot is a target-attributed closeout artifact. No
fresh blind review, live provider/credential operation, executable sample SIGINT test, or
interactive-terminal proof is claimed. Plan archival and all Git mutations remain separate human
operations; they are not unfinished runtime implementation.

## Verification execution boundary

Read owning task definitions again before execution; this plan records commands, not permission to
run them. CLI and HTTP compose `test` tasks, so use their declared `test:unit` for narrow paths:

- `cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test:unit --trace-leaks ./src/m.core/m.Fmt/`
- `cd /Users/phil/code/org.sys/sys/code/sys/http && deno task test:unit --trace-leaks ./src/http.server/m.HttpServer/`
- `cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task test --filter 'service'`
- `cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task test --filter 'start'`
- `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare/-sample/deploy && deno task test --filter '/service endpoint|shell status/'`

Cell's task includes `./src`; its filter is a selection, not proof that every needed suite ran. The
sample's ordinary unit task remains networkless. Its endpoint tests use inert bootstrap/start
dependencies and do not load real credentials. Generic HTTP-owner integration runs under Cell's
owning task; no task imports the downstream R2 sample into Cell's tests or Cell internals into the
sample's tests.

After narrow red/green proof, run CLI/HTTP/Cell owning `check` and full `test` tasks and the
sample's full `test` task when authorized. The sample has no declared `check` task: do not
substitute an ad-hoc checker; ask before adding or selecting an authoritative task if separate
sample checking is needed. Report executed tests, skipped red steps, and unexecuted runtime evidence
explicitly. Listener tests need explicit authorization beyond this planning pass. No live sample
serve/build/push/proof task, provider access, real credential reads, or permission broadening is
authorized by this plan.

## Compatibility and non-goals

Deliberate visual changes: HTTP adopts Cell colors, one-cell child indentation, root-before-details
ordering, root underlining, and shared label allocation; multiline child labels become consistent.
Synthetic HTTP context details precede URLs under the common row order. Shared strings have no
synthetic edge blank rows; existing callers retain their own framing. Unbounded separators are
content-sized. Annotation is styled independently even when clipped.

Deliberate behavior corrections: Cell non-TTY service bodies are unbounded unless width is explicit;
Cell Unicode/multiline measurements become cell-correct; malformed callback returns fail uniformly;
empty-width rendering does not invoke callbacks. The new composed renderer also applies aggregate
presentation ceilings, not merely separate per-line limits. These are not described as byte-for-byte
extraction.

Preserved: owner facts, explicit selected identity, filters and normalizations, exact link targets,
HTTP origin policy, legacy HTTP options, meaningful empty presentation, whole-value fallback,
callback throw identity, ordinary status fallback, output sinks, and existing cleanup ownership.

Non-goals: registries, general rich documents, service-wide render callbacks, remote capability
transport, event redesign, generic Cell status hardening, owner-specific Cell production branches,
output-wide hyperlink controls, shutdown changes, provider/browser/service-worker/credential work,
new publication dependencies, unrelated formatter cleanup, or completed-plan retirement.
