jsr-readme-quality.plan.md
- [x] 7016bda23 docs(jsr): correct foundational README contracts
- [x] c0b3f15e2 docs(jsr): correct adapter and application README contracts
- [x] 78078a5a5 docs(jsr): orient platform package README surfaces
- [x] 989805c39 docs(jsr): orient UI and model README surfaces
- [x] f4d9b8143 docs(jsr): reduce package README reference sprawl
- [x] 9e7f24065 docs(jsr): polish package README residue

## Closeout

The campaign is complete within its README-only scope. Closeout reconciled every opening-arc
subject to one reachable commit and inspected each commit's paths. The cumulative implementation
range changes exactly the 32 assigned package READMEs: 1,156 insertions and 1,294 deletions. The
15 `KEEP` packages, root README, source, configuration, and lockfile are outside that diff.

Additional foundational prose polish landed in `80a4c9644`
(`docs(jsr): polish foundational README prose`), refining the same four owned READMEs without
expanding the six-slice scope. Pi's human-authored Conceptual Primitives and References, Immutable's
diagram, and Cell's unchanged README remain protected.

The sections below preserve the campaign's method, ownership, and constraints as historical context,
not an unfinished work queue. The retained inventory, evidence, and verification limits are recorded
below; this is the single campaign closeout record.
No in-scope README work remains; this does not certify live publication, every external runtime, or
unrelated worktree changes.

Preserve this consolidated plan in history before retiring it. The closeout subject is
`plan(done): jsr-readme-quality.plan.md`; subsequent removal uses
`plan(archived): jsr-readme-quality.plan.md`. Retirement of this plan requires a separate explicit
instruction.

## Purpose

Bring package-root READMEs for JSR-published modules under `code/` to a small, truthful, consistent
standard. The campaign improves the public package landing surface without turning READMEs into API
manuals.

## Scope

A README is in scope only when:

- it is the package-root `README.md` for a module under `code/`;
- the same directory contains `deno.json` with a JSR package `name` and `version`; and
- the module has a publication task or equivalent JSR publication surface.

The inventory accounts for 47 in-scope packages, including `@sys/archive`: the 32 README paths in
the implementation contracts below and the 15 `KEEP` paths in Audited disposition. Historical
observations are not a fresh certification of every published package.

Excluded:

- repository and namespace-folder READMEs without an owning package `deno.json`;
- templates and generated README content beneath a package;
- samples, fixtures, tests, archived trees, `deploy/`, and `-agent/` guidance;
- source documentation, JSDoc, and DSL chapters except as evidence; and
- unpublished or retired modules.

These are implementation exclusions. This plan is a workflow artifact, not a package deliverable.
The active package `code/sys/archive` is not an archived tree. Live JSR score/docs inspection is
required evidence under canon, not permission to change registry settings, publish packages, or
expand the campaign into symbol-coverage work.

## README standard

Each package README should contain only what the package landing page needs:

1. one clear purpose and boundary;
2. primary entry points when there is more than one;
3. one verified minimal example by default; add another only for a distinct usage boundary;
4. a key invariant or limitation when non-obvious; and
5. links to deeper DSL or API documentation.

A package is not required to use five headings. Small packages may satisfy the standard in a few
lines. Metadata-only roots should say so plainly rather than inventing usage.

## Review method

The campaign's review procedure, applied at each slice boundary:

1. read the local `deno.json`, resolve the published identity, and map public exports;
2. inspect the live JSR score page first, then the live docs page; record URLs, observed version,
   source-controlled README gaps, and non-doc or out-of-scope score findings separately;
3. read the package README and relevant entrypoint module docs;
4. inspect exported types, runtime surfaces, implementation, and focused tests behind documented
   claims; distinguish local changes from the published artifact even when version strings match;
5. revalidate `KEEP`, `POLISH`, `CORRECT`, `ORIENT`, or `REDUCE` against that evidence;
6. verify each retained or changed example as its own contract, then run the package's declared
   `check`, `test`, and `dry` tasks after an edit.

Follow `protocol.jsr-doc.md` stop conditions: do not guess through unavailable live pages, an
unpublished package, an unmappable symbol, or clearly different local/live versions. Report
non-doc blockers without treating them as README work. Never claim that unpublished edits have
changed the live surface.

`KEEP` is a valid result, including on revalidation. Do not edit a README merely to make the campaign
appear comprehensive or preserve a stale verdict. Record disposition changes in the plan; do not
silently expand commit ownership.

## Reduction test

Treat material as over-documentation when it does one or more of the following:

- duplicates live API docs, DSL chapters, CLI help, or another package's README;
- narrates implementation history, future APIs, or design speculation;
- inventories every leaf export instead of identifying primary entry points;
- embeds long operational reference material better owned by a DSL or module docs;
- repeats generic philosophy that does not constrain use of the package;
- keeps multiple examples that prove the same basic operation;
- explains upstream libraries or web standards instead of this package's boundary;
- carries stale debugging, task, permission, or deployment detail with low landing-page value.

Length alone is not a defect. Security boundaries, lifecycle contracts, and non-obvious failure
semantics may justify detail. Reduction must preserve the information needed to use the package
safely.

## Audited disposition

The inventory accounts for every package exactly once:

- `CORRECT`: 8
- `ORIENT`: 12
- `REDUCE`: 4
- `POLISH`: 8
- `KEEP`: 15

The six ownership groups cover 32 package READMEs; the 15 `KEEP` packages were not edited by the
campaign. The additional foundational prose pass refined existing ownership, not a seventh group.
Archive is `KEEP`: its bounded ZIP, cooperative cancellation, extraction-versus-publication, and
separate cleanup outcomes justify the length; shortening those contracts is not a landing-page
improvement.

`code/sys/cell/README.md` is preservation-gated and remains unchanged in this campaign. It was
carefully hand-authored; DSL overlap alone does not justify deletion. Any future reduction requires
a dedicated, line-by-line human review rather than inclusion in a bulk README pass.

The 15 unchanged packages complete the inventory:

| Package | Preserved README |
| --- | --- |
| `@sys/archive` | `code/sys/archive/README.md` |
| `@sys/cell` | `code/sys/cell/README.md` |
| `@sys/crdt` | `code/sys/crdt/README.md` |
| `@sys/net` | `code/sys/net/README.md` |
| `@sys/esm` | `code/sys/esm/README.md` |
| `@sys/web` | `code/sys/web/README.md` |
| `@sys/markdown` | `code/sys/markdown/README.md` |
| `@sys/color` | `code/sys/color/README.md` |
| `@sys/fs` | `code/sys/fs/README.md` |
| `@sys/testing` | `code/sys/testing/README.md` |
| `@sys/ui-dev` | `code/sys.ui/ui-dev/README.md` |
| `@sys/driver-cloudflare` | `code/sys.driver/driver-cloudflare/README.md` |
| `@sys/driver-deno` | `code/sys.driver/driver-deno/README.md` |
| `@sys/driver-monaco` | `code/sys.driver/driver-monaco/README.md` |
| `@sys/driver-prosemirror` | `code/sys.driver/driver-prosemirror/README.md` |

Length was justified by Archive's publication/cleanup contract, Fs's filesystem safety boundaries,
Testing's reversible execution fixtures, and Monaco's loader/runtime-asset ownership. Cloudflare's
newer R2/Files guidance was preserved. The other `KEEP` pages already described their public purpose
and entry points without requiring campaign edits; this was not a new runtime certification.

## Concurrent-work boundary

Each slice owned only its listed package-root READMEs. The campaign required path-state checks
before editing and at handoff, with unrelated work preserved. Production source, exports,
dependencies, tests, generated artifacts, samples, and the R2 plans were excluded. The newer
Cloudflare documentation was not reverted to the initial inventory's older service-only description.

Disjoint files do not prove semantic independence. Reopen the source used by each example at the
slice boundary and again before handoff. Later `@sys/std` and `@sys/types` polish must not describe
unlanded Dist pin contracts. If concurrent source changes affect a documented contract, pause that
package and coordinate with its owner rather than adjusting implementation to fit the README.

## Implementation contracts (historical)

### `docs(jsr): correct foundational README contracts`

Own only:

- `code/sys/immutable/README.md`
- `code/sys/schema/README.md`
- `code/sys/http/README.md`
- `code/sys/event/README.md`

Replace broken or retired contracts with current imports and public shapes:

- Immutable: use `/rfc6902` for `Immutable.clonerRef`; observe through `ref.events()` and dispose
  the event handle, not the ref. Remove the retired `.listen()` example.
- Schema: use exported `Schema`, `Type`, `Value`, and `type t`; declare the schema used by validation
  and inference instead of relying on an unavailable named `Static` or implicit sample setup.
- HTTP: keep client and server examples distinct. The client requires an explicit response policy
  (`maxBytes`, `timeout`, `maxRedirects`, `progressInterval`, `sourceOrigins`, `credentialOrigins`);
  do not inherit test-fixture defaults. Use `until` for client lifecycle binding or request `signal`
  for cancellation, not the retired `dispose$` options. Put any checksum in the third argument,
  narrow response `ok`, and dispose the client. Prefer `/server/host` for a bare managed listener;
  do not imply it installs CORS or file serving. Await server disposal.
- Event: call the emitter returned by `emitFor<T>()` as `(bus, schedule, event)`; unlike direct
  `emit`, its schedule precedes the event. Make scheduling and subscription cleanup explicit.
  Preserve Cmd lifecycle material after removing duplication.

Use `/t` for type-only leaves; do not restore the published legacy `/types` alias. Keep additional
examples only when they explain a distinct boundary, such as HTTP client/server or Event bus/Cmd.

### `docs(jsr): correct adapter and application README contracts`

Own only:

- `code/sys.driver/driver-automerge/README.md`
- `code/sys.ui/ui/README.md`
- `code/sys.ui/ui-state/README.md`
- `code/sys.model/model-slug/README.md`

Correct current namespaces, argument shapes, component paths, and CLI permissions. Do not preserve a
stale example merely because adjacent implementation tests wrap it behind defaults.

### `docs(jsr): orient platform package README surfaces`

Own only:

- `code/sys.driver/driver-signer/README.md`
- `code/sys.tools/README.md`
- `code/sys/crypto/README.md`
- `code/sys/workspace/README.md`
- `code/sys/cli/README.md`
- `code/sys/registry/README.md`
- `code/sys/yaml/README.md`
- `code/sys/text/README.md`
- `code/sys/process/README.md`

Add the smallest semantic entry map and one representative example. Do not copy complete export maps
or command help into the README.

The platform preflight at `80a4c9644` retained all nine
`ORIENT` assignments. Eight existing fences passed; YAML's duplicate `Yaml` imports failed and
required replacement. Focused behavior tests passed for all nine packages, with separate Process
authority/retention and CLI Keyboard entry proofs. Those were baseline observations; implementation
verification is summarized below.

Use capability inspection for Signer, root help for Tools, hashing for Crypto, read-only source stats
for Workspace, non-interactive table output for CLI, guarded metadata lookup for Registry, parse/result
handling for YAML, filtering for Text, and bounded no-shell capture for Process. Preserve Tools' pin,
sealing, projection, and advisory limits; Workspace's optional test-count limits; and Process's
owned-child versus ambient-PID authority and restrictive proof guidance. Signer's `/core` is not a
working signing constructor. CLI's missing live `/keyboard` module-doc score credit is outside this
README slice. Do not describe CLI's lexical folder-name regex as filesystem containment.

Use `test:unit` for CLI/Process Markdown checks. Tools' generic test task hard-codes source/script
paths; adding `README.md` does not narrow it. Verification combined focused contract tests with
every changed package's full `check`, `test`, and `dry` tasks. External-service, interactive, Apple-platform,
and published-artifact proofs remain separate; do not execute placeholder downloads or source pulls
just to demonstrate a README command.

### `docs(jsr): orient UI and model README surfaces`

Own only:

- `code/sys.ui/ui-components/README.md`
- `code/sys.ui/ui-dom/README.md`
- `code/sys.model/model/README.md`

State identity-only root boundaries where applicable, group leaves semantically, and link deeper API
documentation instead of enumerating components or symbols.

The slice preflight at `78078a5a5` retained all three
`ORIENT` assignments. Live scores gave full credit without establishing README completeness.
Both existing fences passed their Markdown checks; focused export, mocked-storage, and Files tests
also passed. Subsequent implementation evidence is summarized below.

- UI-components: both the root and `/react` export only `pkg`. Prefer canonical `/react/*` leaves,
  grouped as controls/presentation, content, layout, and media; do not reproduce compatibility aliases.
  Retain the Button example with a standalone JSR import and a React TSX toolchain requirement.
  Button renders a `div` with `role="button"`, not a native button; do not imply native keyboard or
  form behavior. Export tests and fence checks do not establish browser rendering or interaction.
- UI-DOM: the root exports runtime helpers, not just identity. Describe browser-oriented operations
  and their required host APIs rather than declaring every helper browser-only. Prefer a read-only
  `LocalStorage.ns<T>(...).get(key, defaultValue)` example. Storage access and JSON parsing can throw;
  the type argument does not validate stored values. Do not copy the stale callable `LocalStorage<T>`
  example from root module docs or imply a namespace is a security boundary.
- Model: root is metadata/types; `/files` owns Files contracts and clients, with separate memory,
  structural-filesystem, and static-Dist backings. `/timecode/playback` validates manifests, not
  playback effects. Do not call the entire package pure. Use a readonly memory backing plus
  `Files.Client.local`, an explicit read policy and byte cap, `readText`, and `finally` disposal.
  The example needs neither disk nor network. Backings default to deny-all; capabilities alone do
  not authorize paths, and `readText` does not fetch content references.

For all three owning packages, use `deno task test --doc --no-run --frozen-lockfile README.md` for
final fences, then focused contract tests and the full `check`, `test`, and `dry` tasks. Execute
the final Model example separately through the doc-test task. Keep UI-DOM's `DomMock` proof and
UI-components' export/type checks distinct from actual browser execution. No browser execution or
published-artifact execution was performed in preflight; do not add permissions, fixtures, or
persistent proof files to manufacture those claims.

### `docs(jsr): reduce package README reference sprawl`

Own only:

- `code/sys.driver/driver-pi/README.md`
- `code/sys.driver/driver-vite/README.md`
- `code/sys.ui/ui-react/README.md`
- `code/sys.ui/ui-css/README.md`

Remove duplication, speculative narrative, generic upstream teaching, and low-signal operational
reference material. Preserve security, lifecycle, failure, compatibility, and sandbox limits.

The four-package preflight at `989805c39` retained all four
`REDUCE` assignments; incidental corrections stayed in the owned READMEs, not a source-work slice.
Live scores were 18/18 for each package. Existing Pi, Vite, and React TypeScript fences passed;
CSS failed with seven diagnostics. Focused tests passed: six tests / 77 steps, plus Pi CLI help
and four help-only DSL routes. These baseline failures are historical; subsequent verification is
summarized below.

- Pi: preserve the human-authored **Conceptual Primitives** and **References** sections verbatim,
  including their links, diagram, quotation, list, spacing, and placement. The human explicitly
  protected both sections; this overrides earlier reduction guidance. Do not remove or rewrite
  them without an explicit request naming that change. Reduce repeated aliases and the import-only
  library catalog instead. Root and `/cli` launch profiles; `/cli/raw` is the explicit upstream
  boundary; `Pi` in `/core` is currently empty. Keep launcher `deno run -A` authority distinct from
  trailing child `--allow-all`; profile ownership of prompt/context/skill/extension arguments; and
  live tool registration versus next-launch policy. Keep help-only DSL root/profile/OCR/ZIP routes.
  Preserve
  the existing ZIP, Upstream, Runtime policy, and Development contracts rather than treating them
  as generic operational sprawl. In particular retain non-confinement, reporting limitations,
  cooperative extraction and separate cleanup outcomes, dependency-update partial failure, and
  GUI evidence/reset prerequisites. Preserving these boundaries does not recertify host extraction
  or GUI release behavior.
- Vite: retain the local `/main` task shim and one complete `Vite.Config.define`/`paths`/`app`
  configuration, with real HTML/project prerequisites. `/main` executes immediately; do not run its
  import-only fence as a harmless example. Bare imports require configured resolution, and `-P=dev`
  requires a consumer-defined preset; it is not inherited from an imported package. Remove the
  copied help, second overlapping config, debug-level catalog, and internal test inventory.
  Preserve policy-versus-transport, ESM output, caller-plugin composition, and parent/child authority
  distinctions. Correct build writes to output/cache roots, not blanket project-root writes; child
  read/env remain broad and native FFI/run grants do not establish process confinement. Keep the
  local-versus-published smoke distinction without claiming either from a fence check.
- React: `WebFont` is a valid root re-export through `use/mod.ts`; the initial missing-export lead
  was false. Reduce its oversized font sample and speculative server-rendering narrative on landing
  value, not a fabricated API defect. Group component/hook, signal/effect/async, and testing entries.
  Prefer one TSX counter using `/signal`, `useSignal`, and explicit `useRedrawEffect` dependency
  reads; require a React/JSR-resolving toolchain. Preserve cleanup-on-rerun/unmount when describing
  effects. Mocked hook tests are not browser proof; their existing `act(...)` warnings remain visible.
- CSS: use root `css` with `type t` and `t.Style.Input`, not the nonexistent named `CssInput`.
  Keep one complete TSX composition example; later inputs override earlier properties. Retain
  no-special-CSS-build-plugin and DOM/CSSOM requirements, and link advanced rules/container APIs.
  Remove hash dumps, repeated selector examples, and social references. `Style.transformer` takes
  `{ sheet }`, not `{ prefix }`; stylesheets may be acquired at transform time, while `.class`
  registers the rule. Do not preserve the false first-`.class` stylesheet-creation claim or infer
  browser/hydration guarantees from caching or mock tests.

Verification combined Markdown and focused tests with every package's full `check`, `test`, and
`dry` tasks. Pi's baseline Markdown command was
`deno task test:unit --doc --no-run --frozen-lockfile --ignore=src,-scripts README.md`; it checked
the README fence and eight script test files, not an exclusively Markdown graph. The final Pi page
uses shell examples supported by help/source evidence. Its `test:unit` task hard-codes source/script
paths: a filter narrows execution, not type-check scope.
Do not execute launch, GUI binding/reset, OCR install, Vite build/serve, or published smoke commands
merely because they appear in a README. Final shell commands need help/source evidence and explicit
unexecuted-boundary reporting; new browser or published-artifact proof requires its own declared lane.

### `docs(jsr): polish package README residue`

Own only:

- `code/sys.driver/driver-process/README.md`
- `code/sys.driver/driver-stripe/README.md`
- `code/-tmpl/README.md`
- `code/sys/types/README.md`
- `code/sys/std/README.md`
- `code/sys/server/README.md`
- `code/sys/tmpl-engine/README.md`
- `code/sys.dev/README.md`

Apply only the evidence-backed corrections listed below. `@sys/server` remains detailed because
its integrity and lifecycle contracts are safety-bearing; polish is not permission to flatten
those boundaries.

At the eight-package preflight at `f4d9b8143`, live scores were
18/18 for every target, but baseline Markdown checks exposed defects in Process, Std, Server, and
TmplEngine. All eight retained their `POLISH` assignment; example corrections stayed in the owned
READMEs. Focused contracts and Tmpl help routes passed. Replacement-example and full-task evidence
is recorded separately from that preflight.

- Process: replace nonexistent `Ffmpeg.Ffprobe.duration` with `Ffmpeg.duration`, narrow its `ok`
  result, and close the Git fence. Describe native binary/permission prerequisites; do not imply
  a general transcoding API or assert that Git status excludes untracked files by default.
- Stripe: show `PaymentElement.UI` with runtime-provided props. The host obtains the session;
  the component does not fetch it. Preserve server-secret versus browser-client-secret roles,
  the ban on baked secrets and `VITE_STRIPE_CLIENT_SECRET`, and the local fixture boundary.
  Rendering the element is not a complete payment workflow or proof of a real payment.
- Tmpl: use a positional template, explicit directory, `--non-interactive`, and canonical
  `--dry-run`. Direct agents to the DSL root and matching chapter first. `repo` is not a published
  import subpath; default invocation is interactive, and applying a template writes files.
- Types: correct the typo and qualify the type-vocabulary boundary; root also exports metadata
  values. Prefer an explicit `jsr:` type-only import, not an invented runtime implementation.
- Std: replace the duplicate import catalog with a compact leaf map and standalone examples.
  `/t` exports types directly, not a named `t`. Preserve synchronous versus asynchronous disposal,
  terminal settlement, observation versus disposal authority, and `omitDispose` protocol behavior.
- Server: retain trusted-pin versus local-observation, explicit finite policy, caller authority,
  and lifecycle boundaries. Repair the browser-policy object as a standalone typed declaration.
  Generation opening is discriminated; successful ownership must be released independently of
  opening cancellation. Polish duplicated navigation/markup, not the safety contracts.
- TmplEngine: replace missing adjacent-file/bundle assumptions with complete examples and explicit
  filesystem prerequisites. Guard optional validated `fileMap`. `FileMap` is shared with `@sys/fs`;
  keep bundling distinct from materialization. Dry-run still invokes processors; modified existing
  files can be written without `force`, so neither option is a general side-effect/no-overwrite guard.
- Dev: state the published metadata-only root plainly; do not invent runtime APIs for its empty
  type barrel. A metadata import check does not prove the local development application.

The Markdown route used `test:unit` for Stripe/Server and `test` for the other six, with
`--doc --no-run --frozen-lockfile README.md`. Shell-only pages use help/source evidence, not a
fictitious TypeScript check. Focused contract tests preceded every changed package's full `check`,
`test`, and `dry`. Stripe's full `test` includes a configured build; its browser/dist
lane is separate. Server's full `test` includes a process lane. Do not widen Process's test preset
to execute native binaries, or launch live payment, browser, hosting, or template application flows
merely because they appear in a README. Final snippets still require revision-specific validation.

Pi's protected Conceptual Primitives/References and Immutable's diagram were outside this slice
and unchanged by it.

All thirteen TS/TSX fences passed; Std and Dev examples also executed. All eight owning `check`,
`test`, and `dry` routes passed, with 313 tests / 2,921 passing steps across the full test tasks.
The verification record below retains exclusions, focused proof, task-generated outputs, and
revision-specific limits.
`LifecycleView` imports come from `@sys/types/t`, not Std's type barrel. The approved same-session
prose follow-up preserved example bodies and safety contracts; it received formatting, whitespace,
and scope checks rather than another full test run. It was not an independent blind review.

## Verification record and limits

The session recorded the following implementation evidence. Closeout reconciled history and scope;
it did not rerun package tasks or consult live JSR again.

| Slice | Recorded evidence |
| --- | --- |
| Foundational | Seven Markdown fences checked; independent review preceded the final prose and diagram restoration. |
| Adapter/application | Corrected examples and independent review; Automerge filesystem doc execution exposed existing timer leaks, retained as a limitation. |
| Platform | Eight TS examples checked and executed, Tools help, and owning full tasks; refreshed Tools, Workspace, and CLI runs were recorded separately. |
| UI/model | Three fences checked, Model example executed, full tasks reported 142 tests / 897 steps; independent review and targeted prose follow-up. |
| Reference reduction | Four TS/TSX examples checked, Pi help routes, full tasks reported 182 tests / 1,241 steps; final prose and protected-section restoration received formatting/diff checks. |
| Residue | Thirteen fences checked, Std/Dev examples executed, full tasks reported 313 tests / 2,921 steps; final prose received formatting/whitespace checks. |

These are revision-specific records, not a campaign-wide passing-test total or proof that every
example was executed. The initial Vite candidate timeout remains part of the evidence; isolated
and full reruns passed without changing timeouts or suppressing sanitizers. Existing Automerge
timer leaks and test warnings were not repaired by this documentation campaign.

Live JSR scores/docs were preflight observations. Local checks resolve through the workspace;
matching versions do not prove published-artifact equivalence. Browser, native-tool, live-payment,
and other provider boundaries remain unproved unless explicitly exercised in the recorded lane.
No package publication or new external proof is claimed by closeout.

### Retained registry and source evidence

These are historical observations, not fresh requests or claims about today's published state:

- Archive was added to the inventory after inspection of its
  [published `0.0.2` config](https://jsr.io/@sys/archive/0.0.2/deno.json). Its ZIP boundary justified
  `KEEP`; active package identity, not its name, determined scope.
- Foundational score pages reported full credit despite broken examples. Inspected published configs
  were [Immutable `0.0.170`](https://jsr.io/@sys/immutable/0.0.170/deno.json),
  [Schema `0.0.246`](https://jsr.io/@sys/schema/0.0.246/deno.json),
  [HTTP `0.0.331`](https://jsr.io/@sys/http/0.0.331/deno.json), and
  [Event `0.0.180`](https://jsr.io/@sys/event/0.0.180/deno.json). They still exposed `/types` alongside
  `/t`; local commit `204fca7d9` removed `/types` without changing those version labels. This was
  concrete local/published drift, not grounds to restore the retired alias or assume byte equality.
- At the platform preflight, eight detailed score responses gave full credit.
  [CLI's score response](https://api.jsr.io/scopes/sys/packages/cli/score) gave **17/18** for
  `0.0.318`, despite aggregate metadata reporting 100%. Missing `/keyboard` entrypoint documentation
  was a source-doc issue, not an unfinished README correction.
- UI/model, reference-reduction, and residue preflights each returned **18/18** for every target.
  Generated-doc inspection was bounded and sometimes truncated; it was not an exhaustive symbol
  audit. [Vite's config docs](https://jsr.io/@sys/driver-vite/doc/config) exposed an undocumented
  `Log.Workspace` despite full score credit. Symbol-coverage work remained excluded.
- UI-DOM's source exposed a separate `LocalStorage.clear()` prefixing defect and stale callable
  examples. The README did not promise reliable namespace cleanup; no source repair was included.
  Evidence owner: `code/sys.ui/ui-dom/src/m.LocalStorage/m.LocalStorage.ts`.

The preflight commits named in each slice retain its local `deno.json`, exports, implementation, and
focused tests. They recover local evidence, not a snapshot of every external response. Repeated
reconnaissance, rejected leads, and transient concurrency inventories were omitted from consolidation;
the original investigation log is not reproduced or claimed to be archived elsewhere.

### Residue proof detail

The thirteen checked fences comprise Process 2, Stripe 1, Types 1, Std 1, Server 5, TmplEngine 2,
and Dev 1. Tmpl is shell-only. Std and Dev doc executions printed `true true` and `@sys/dev`;
other fences were not claimed as exact runtime executions.

All eight owning `check`, `test`, and `dry` task chains passed before the final prose follow-up:

| Package | Full test result | Proof boundary |
| --- | --- | --- |
| Process | 16 tests / 57 steps | No native README invocation; the test preset was unchanged. |
| Stripe | 6 tests / 14 steps | Check/unit/build passed; browser execution is separately gated. |
| Tmpl | 24 tests / 94 steps | Temporary-workspace composition, not live-worktree application. |
| Types | 21 tests / 79 steps | Seven existing ignored BDD steps are excluded from passing counts. |
| Std | 196 tests / 2,273 steps | Full owning test task. |
| Server | 42 unit tests / 335 steps; 4 process tests / 10 steps | Filesystem, loopback, and declared process lanes; not a browser. |
| TmplEngine | 4 tests / 59 steps | Existing task also checked accumulated `.tmp` examples; no cleanup/task change. |
| Dev | 0 tests | Declared `--permit-no-files`; the separate metadata doc test passed. |

The total, 313 tests / 2,921 passing steps, excludes focused repeats, Markdown execution, and ignored
steps. Stripe's build wrote its configured local `dist/`; Tmpl exercised its existing bundle
production route. Neither left a tracked generated-artifact delta. This is not a claim that tests
produced no temporary files or build output.

Focused runs used the owning task and frozen lockfile. Process duration/Git checks stubbed native
invocation; Stripe fixtures mocked requests; Tmpl used isolated scaffold fixtures; Types checked
Immutable contracts. Std lifecycle/omitDispose/until follow-up passed 5 tests / 38 steps. Server's
generation, browser-policy, WebSocket command-example, DSL, and root-help checks passed 5 tests /
34 steps. TmplEngine's `src/m.tmpl/-test/-README.test.ts` checks bundling behavior, not Markdown
fences. These proof categories must not be substituted for one another.

Tmpl help ran through `deno task cli --help`, `deno task cli dsl`, and `deno task cli dsl repo`.
Pi's recorded help routes were `deno task cli --help`, `deno task cli dsl`, and the `profile`,
`tools zip`, and `tools ocr-pdf` DSL chapters. Neither help sequence launched the documented
application workflow or established published-artifact execution.

Long residue task outputs were captured at these temporary paths. The paths are recovery aids,
not durable dependencies or a promise that logs remain available; their essential results are above:

- Std: `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-4750fb2bbc2b0c3d.log`
- Server: `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-06ff9ca9de098224.log`
- Tmpl: `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-033dfd79072801c5.log`
- TmplEngine: `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-bash-b1fec1d0ba5fc47d.log`

### Verification method retained for reproducibility

The routes and constraints below describe campaign verification, not pending implementation work.
For each changed package, from its owning directory:

```sh
deno task check
deno task test
deno task dry
```

Read the owning tasks and permission presets before running them. Use narrower declared tests first
when a documented example maps to a specific tested surface. Do not substitute raw commands when
package tasks define authority. Record any package-specific browser, external, or policy-bound proof
required by the documented claim; a denial is a stop, not permission to widen authority.

Package checks, tests, and dry publication do not by themselves validate Markdown fences. For every
retained or changed example, record its exact import/type-check evidence, focused behavioral proof,
and any unexecuted boundary. Treat each fence as standalone unless its continuation is explicit;
account for required inputs, permissions, scheduling, and cleanup. Do not inherit test-helper defaults
that the public caller does not receive. If no declared proof surface can validate the exact snippet,
request a bounded temporary check rather than adding persistent source, tests, or dependencies to
this README-only slice. Until then, report the example as source-inspected, not executed.

The foundational preflight established an existing exact-fence type/import check, without temporary
files or new permissions. From Immutable, Schema, and Event respectively:

```sh
deno task test --doc --no-run --frozen-lockfile README.md
```

From HTTP, use its declared unit wrapper so arguments reach Deno rather than its composite task:

```sh
deno task test:unit --doc --no-run --frozen-lockfile README.md
```

All four original READMEs failed these baseline checks; the replacement fences were checked during
implementation. Baseline failures were not hidden with ignored fences, suppressed checking, or
missing setup. Deno checks each fence independently, so prefer complete examples over cross-fence
bindings. These commands resolve JSR imports through the local workspace and provide no runtime or
published-artifact execution proof.
Focused behavioral tests and full package tasks remain separate evidence from these import checks.

Before each commit:

- reopen every changed README and its `deno.json`;
- record the live score/docs observations and resolve local-versus-published differences;
- confirm every documented entry point exists in the export map;
- confirm examples use only imported or declared symbols and avoid duplicate declarations;
- scan changed prose for stale names, future APIs, filler, repeated sections, and broken links;
- inspect the relevant local entrypoint docs, types, implementation, and focused tests again for drift;
- run the package-local declared proof and report exact snippet proof separately;
- inspect the final diff for unrelated or concurrently owned changes.

Do not change this plan's opening checkboxes for review, preparation, or passing tests; they record
landed commits only.

## Non-goals

- no README style template imposed mechanically across all packages;
- no requirement to document every export;
- no source or API redesign to make an example convenient;
- no speculative APIs or roadmap prose;
- no JSDoc coverage campaign;
- no live JSR score optimization unrelated to source-controlled documentation;
- no persistent implementation edits outside package-root READMEs under the established JSR scope;
- no dependency, source, fixture, sample, release, or R2-plan changes to make documentation proof pass.
