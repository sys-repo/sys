@sys.driver-vite
workspace-chunking-and-ui-components-bundle.plan.md
- [x] 34857daf5 fix(driver-vite): restore workspace module chunk resolution
- [x] dcc61ca38 perf(ui-components): isolate entry metadata from runtime barrel
- [x] 416877674 perf(ui-components): tune bundle composition and loading boundaries

## Purpose and sequence

Restore resolution of declared workspace module/export targets in `ViteConfig.app`, without
introducing whole-package capture. Then diagnose and tune `@sys/ui-components` against the verified
driver behavior. The upstream repair is independent of whether it explains the size warning.

Item 2 isolates entry metadata and verifies consumer behavior against item 1's driver repair;
it does not claim comparative performance improvement. Item 3 owns measurement-led dependency and
loading-boundary tuning beyond those bounded changes. Keep driver, metadata isolation, and further
consumer tuning separately attributable. Arc order expresses the dependency sequence, not commit
timestamp order.

The final bounded outcome is exact workspace export resolution, direct entry metadata, and Markdown
runtime ownership at the Prose.Markdown edge. Consumer acceptance is measured loading-byte reduction
with preserved behavior, not elapsed-time or request-count improvement. The one-off comparative
machinery was removed; established driver regressions and consumer behavior checks remain.

The original A/B/C diagnostic artifacts were incomplete and were deleted at the human's request.
They cannot close the measurement requirement. Reconstructed baselines must be identified as
reconstructions, not original captures. Use `Fs.makeTempDir` and owned cleanup for all fixtures
and diagnostic output; do not create repository-local temporary evidence.

## Evidence and adjudicated contract

- Before this repair, `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.ts` matched an exact
  normalized ID or `/node_modules/<target>/` containment without connecting workspace export
  specifiers to resolved source IDs. The first attempted repair also incorrectly required request
  spelling equality and lacked symlink identity and checked transport admission.
- Commit `540fe8904` replaced Rollup object-form `manualChunks` with this callback and added only
  node_modules callback coverage. Historical module resolution does not prove whole-package capture.
- `code/sys.driver/driver-vite/src/m.vite.config/t.app.ts` documents placing a named module in a
  bundle. `code/sys/std/deno.json` maps the root to `src/-exports/mod.ts`, which exports only `pkg`
  at runtime. Independent leaves such as `@sys/std/rx` are not dependencies of that root.
- `code/sys.driver/driver-vite/src/m.vite.config.workspace/u.aliases.ts` supplies export targets and
  filters export aliases. Different exports can share a directory without sharing identity.
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve/u.loaderAdapter.ts` can represent
  local modules using Deno virtual identities. Raw path matching alone is insufficient.
- Earlier inspection used Rolldown 1.2.8. The repair proof uses Vite 8.3.2 / Rolldown 1.2.12;
  the latter was checked through Vite's installed `node_modules/rolldown/package.json` and build
  execution paths. Manual chunk grouping can include dependencies recursively and merge modules
  across entries. Callback matches, emitted membership, downloaded bytes, and evaluation timing
  are separate facts.
- `code/sys.driver/driver-vite/src/m.vite.plugins/m.DisposeProtocolCompat/m.DisposeProtocolCompatPlugin.ts`
  injects the disposal bootstrap dependency. Include its ordering in runtime proof.
- `code/sys.ui/ui-components/vite.config.ts` declares React, React DOM, `@sys/std`, and
  `@sys/ui-css` chunks. The reported entry was 526.15 kB, with 164.31 kB gzip; the latter remains a
  reported value, not independently verified compression evidence. Vite's 500 kB limit is per chunk,
  not per startup.
- The entry immediately imports either Splash or DevHarness dynamically. Those bytes count toward
  route startup. `Splash/common.ts` intentionally imports DevHarness keyboard hooks.
- The historical `code/sys.ui/ui-components/dist/stats.html` report embedded its data on a 1.8 MB
  line, beyond the read tool's 50 kB limit; its module-size attribution was not acceptance evidence.
  The later isolated diagnostic captured readable emitted-module membership/edges and final asset
  sizes instead.

The blind-review findings are accepted as constraints on matching scope, emitted-output proof,
resolved identity, and measurement attribution. Whole-package grouping is excluded from this repair.
Reported runtime failure scenarios are hypotheses to test, not observed failures.

## Item 1: driver resolution repair

Preserve `chunks(e)` and document its workspace behavior in the existing public type surface:

- A workspace package root selects its resolved root export module, not every module in the package.
- An export subpath selects that export's resolved module. Never infer its scope from the target
  directory; `@sys/std/is` and `@sys/std/path` share `src/-exports` but are different targets.
- Additional matching is limited to declared targets present in the resolved build graph. A chunk
  declaration is not a new application import and must not force otherwise absent modules into it.
  This repairs workspace target resolution, not every historical object-form side effect.
- Dependencies are placed by the backend. Do not recursively label dependencies in the driver or
  promise package-exclusive emitted chunks. An independent export is not selected by a root rule.
- Derive targets through the active workspace export-resolution authority. Respect filtered aliases
  and disabled workspace mode; do not recover filtered targets by scanning member directories. Alias
  filtering is not an import-access security boundary.
- Compare resolved identities using existing resolver/transport semantics. Support physical/logical
  paths and local Deno virtual IDs without matching arbitrary embedded strings. Remote and unrelated
  virtual modules must not acquire a workspace match. Preserve query distinctions unless the actual
  resolver establishes equivalence; do not globally strip queries from legacy exact-ID matching.
- Retain current npm/Deno node_modules and exact-ID behavior unchanged. Preserve first-match object
  enumeration order, integer-like alias ordering, repeated-alias replacement, and no-rules behavior.
  Integrate workspace matches into that same precedence, not a separate overriding pass.

Inspect the owning resolver contracts before choosing the implementation seam. Do not hard-code
repository paths, introduce a package-ownership framework, or reconstruct a second resolver. If
those contracts cannot establish target identity, report the precise missing seam rather than
falling back to directory capture. Do not change global backend splitting/execution-order settings
as a shortcut. The driver translates caller policy; consumer chunk policy remains in ui-components.

## Driver proof

1. Add failing regressions through `ViteConfig.app` for symlink/realpath export identity,
   transport-produced local IDs with bare/relative/absolute requests, and malformed wrappers.
   Keep source correctness proof independent of the lost consumer baseline.
2. Distinguish root metadata, private dependencies, independent exports, and lazy-only modules.
   Prove only declared resolved targets receive the added callback matches; dependency placement
   belongs in emitted-output assertions. Include two exports sharing a directory.
3. Cover nested members/dependencies, sibling prefixes, filtered exports, disabled workspace mode,
   symlinks, separators, supported local Deno identities, queries, and unrelated virtual/remote IDs.
   These are identity/non-capture cases, not package-ownership rules.
4. Characterize retained npm matching, exact IDs, alias replacement, enumeration precedence, and
   absent/unmatched declarations. No declarations must still produce `undefined` manualChunks.
5. Build focused fixtures with the installed Vite/Rolldown backend. Inspect `chunk.modules`, static
   imports, and dynamic imports. Execute emitted output to test shared dependencies, a
   representative cycle, lazy side effects, and disposal bootstrap ordering. Cover
   main/service-worker output and the module-worker path that receives the shared output
   configuration.
6. Keep a lazy-only independent export outside the root rule; verify its loading/evaluation
   behavior. Do not promise separate downloads for modules the caller explicitly groups together or
   for a selected target's dependencies. Explain measured backend effects instead of masking them.
7. Run narrow proof first from `code/sys.driver/driver-vite`:
   `deno task test:unit --trace-leaks ./src/m.vite.config/-test/-app.test.ts`. Add focused
   emitted-output/runtime proof through the owning task, then run the owning declared broader
   checks. Callback tests alone cannot close the item.

## Item 2: entry metadata isolation

Import the same frozen `pkg` object directly from `../pkg.ts` instead of through `../common.ts` in
`code/sys.ui/ui-components/src/-test/entry.tsx`. Keep production chunk declarations and warning
thresholds unchanged. This unit includes the explicitly invoked browser proof at
`code/sys.driver/driver-vite/src/m.vite/-test.external/-ui-components.startup.chromium.ts`.

Acceptance is preservation of Splash and DevHarness metadata/title, synthetic keyboard handling,
Button and Prose.Markdown selection, and separately observed service-worker lifecycle/cache behavior.
The proof consumes an existing consumer `dist`; a fresh declared build is its prerequisite. It is
behavior proof, not an A→B or B→C performance comparison. Broader barrel/import changes, exact
compression comparisons, and reduction of the remaining shared chunk belong to item 3.

## Baselines and consumer proof

The investigation distinguished four separately attributable states with constant instrumentation:

- A: pre-repair driver and the consumer's barrel-based metadata import.
- B: corrected and verified driver, with the same consumer source/configuration as A.
- C: corrected driver and direct metadata import; the baseline for further consumer tuning.
- D: corrected driver, direct metadata import, and the additional item 3 tuning.

Historical A/B/C comparisons are reconstructed evidence. A driver-only B is not the intermediate
commit between the two bounded changes: metadata isolation preceded the driver repair in reachable
history. Retain exact source identities rather than assigning experimental states from commit order.

The deleted captures do not establish reproducible A/B/C proof. Earlier reported byte totals and
rounded gzip sums are withdrawn as acceptance evidence, including the claims framed as startup
closures. Do not reconstruct measurements from conversational summaries. A replacement proof must
retain source/configuration identity, dependency/backend versions, complete outputs, readable module
membership and import edges, and exact per-asset gzip/Brotli measurements through permitted tools.
Use isolated temporary directories with owned cleanup; record only durable results and evidence
limits here. Existing generated output without sufficient provenance is exploratory evidence, not
a reproducible baseline. Never bypass a read limit with shell parsing.

Measure A→B, B→C, and C→D independently. Never credit item 3 with savings from the metadata import.
Record entry/chunk and aggregate startup raw/compressed bytes,
request counts, and behavior under equivalent build and serving conditions. Include the HTML/static
closure and immediate dynamic imports through observable Splash or DevHarness readiness. Distinguish
later spec selection and service-worker traffic. Use cold-cache measurements and account explicitly
for the service worker's cache-first behavior; warm caches must not manufacture an improvement.

Run the consumer's declared build task from `code/sys.ui/ui-components` for each authorized build.
Runtime-check both startup routes and representative later spec selection. Smaller individual chunks
or disappearance of orange output do not establish reduced startup cost.

## Item 3: consumer bundle tuning

This bounded unit used source/output identities and route reachability to select a package-local
change after the driver and metadata work. The shared initialized Markdown export retained
parsing/frontmatter dependencies on unrelated startup routes; moving it to Prose.Markdown's local
barrel was the smallest justified boundary correction.

Investigate unnecessary Splash/index dependency reachability through `Splash/common.ts`,
`KeyValue/common.ts`, and the package runtime barrel. The reported 435,680-byte shared chunk is
reached by Splash; its emitted size alone neither proves unnecessary startup cost nor prescribes a
split. Narrow imports or lazy boundaries only where emitted graph and runtime evidence support them.
Do not add arbitrary vendor splits, force eager evaluation, or redesign driver chunk policy. If a
necessary change crosses into ui-dev hook ownership, stop and agree that separate scope first.

Consumer tuning was separately scoped from the repair and metadata units. Plan reconciliation and
readiness alone never authorize implementation or Git mutations.

Preserve splash and DevHarness behavior, compare both individual chunks and aggregate route-load
bytes, and keep the warning threshold unchanged. Cold-browser proof must cover `/` Splash and
keyboard behavior, `/?dev` index/metadata/keyboard, Button and Prose.Markdown selection, and separate
service-worker lifecycle/cache effects. Account for `useDist()` fetching `dist.json` as well as JS.
A fixture's JavaScript execution does not substitute for this consumer-browser proof.

The selected import relocation and observed comparisons are recorded below. Exact future chunk
membership, historical source rewrites, and fixed byte snapshots are not permanent package contracts.

## Non-goals and completion

No generic bundle-budget framework, dependency upgrades, unrelated refactors, global vendor chunk,
or edits to generated dist artifacts. Preserve unrelated open work. Planning and verification do not
authorize Git mutations.

Completion requires proven declared workspace target resolution, emitted/runtime proof, and the
separately measured consumer outcome. Consumer tuning cannot substitute for upstream proof, and
upstream correctness does not imply a bundle-size improvement. Keep any unresolved diagnosis or
baseline limitation explicit rather than reporting a completed performance fix.

Retirement preserves this final plan snapshot with
`plan(done): workspace-chunking-and-ui-components-bundle.plan.md` before removing the live plan with
`plan(archived): workspace-chunking-and-ui-components-bundle.plan.md`. A reusable driver warning check
is separate potential work, not a prerequisite for this bounded outcome or an added arc item.

## Repair and metadata proof record

The initial repair evidence used source base `4bc6fbea2d9fac855b7acab4434f16e3256e658f` plus the
repair and unrelated concurrent work. The independent review inspected
`a0a0c00219b7e19044cf040139ac0cf054e1fad5` plus the attributable 12-file change set. Neither is an
immutable A/B/C experimental packet. The opening arc alone records landing identity.

### Implementation and driver proof

- Active, declared workspace aliases supply exact logical and realpath export identities. Missing
  unimported exports do not force imports. Existing npm/exact-ID matching and declaration precedence
  remain intact.
- The transport-owned `localPathFromDenoSpecifier` admits only complete, supported local wrappers,
  then compares the resolved path independently of bare/relative/absolute/file-URL request spelling.
  Malformed, remote, queried and unrelated identities receive no added workspace match.
- Config regressions include adapter-produced identities and symlinked exports. The intended
  identity/admission failures were observed before the repair and pass after it.
- `m.vite/-test/-build.workspace-chunks.ts`, imported by the existing workspace-composition build
  lane, captures emitted module membership, static imports and dynamic imports. Its isolated
  symlinked workspace covers two declared exports, shared dependency, a cycle, absent export,
  lazy-only side effects, main/SW entries and the independently built module worker.
- Written ESM executes in fresh Deno worker realms with missing disposal symbols. Assertions cover
  bootstrap descriptors, disposal order, shared evaluation once per realm, deferred lazy evaluation,
  and the actual Vite-rewritten Worker URL. This is runtime ESM proof, not browser SW lifecycle proof.
  The fixture disables DOM module-preload injection for this Deno execution only; production policy
  is unchanged. All new filesystem fixtures use `Fs.makeTempDir` and explicit cleanup.
- Existing build proof exposed an HTML-evidence regex that missed preloads when SRI appeared between
  attributes. A failing unit regression now passes with `@sys/html` parsing in the test helper.
  No production HTML/integrity behavior changed.
- Public chunk types now state exact-export/non-capture semantics and backend placement, download,
  evaluation, app/SW/module-worker caveats.

### Item 2 consumer browser proof

At the metadata-isolation proof boundary, direct `../pkg.ts` was the only consumer source change.
Its declared build was rerun without visualizer instrumentation or warning-threshold changes.
That output digest:
`sha256-740e2b56800a1f9739d478f4e6e61374445d73b9bc6eb0ce57b9540aa6b39616`;
entry: `pkg/-entry.O7VXl36H.js`. This identifies the tested output, not a recovered historical baseline.

Reproduce after `deno task build` in `code/sys.ui/ui-components`, then from
`code/sys.driver/driver-vite`:

```sh
deno task test:run --trace-leaks ./src/m.vite/-test.external/-ui-components.startup.chromium.ts
```

This explicit external proof passed using `@sys/testing/server`'s Chrome surfaces. It serves unchanged
built JS/preload/SRI bytes with an injected HTML observer and uncompressed, `no-store` responses.
Each route/selection run owns a fresh Chrome profile, cleaned by the helper.

- `/`: Splash metadata and title rendered; synthetic CMD+S reached the real keyboard handler.
- `/?dev`: index metadata/title rendered, keyboard handler consumed CMD+S, and `/dist.json` was fetched.
- Button and Prose.Markdown: the probe clicked their actual index links, then verified each selected
  component's rendered marker and keyboard handling. These are later-selection checks, not cold
  direct-spec startup benchmarks.
- No browser load errors were reported. These bounded rendered-readiness checks are not exhaustive
  visual, trusted-keyboard-input, accessibility or interaction coverage.

Resource Timing body-byte observations through the probe's rendered-readiness point:

| Current route | JS body bytes | JS resources | Additional observed data |
| --- | ---: | ---: | --- |
| `/` | 1,184,656 | 15 | No `dist.json` in this report |
| `/?dev` | 758,653 | 11 | `dist.json`: 15,405 bytes; JS + manifest: 774,058 bytes |

These totals were independently summed from the new browser resource rows, not copied from the
withdrawn artifacts. They exclude HTML, favicon, observer traffic and separate SW network activity.
Responses are uncompressed: encoded and decoded body sizes agree. They are neither gzip/Brotli
measurements nor complete network transfer totals. Timings include probe polling/settling and are
not presented as performance results. There is still no measured A→B or B→C speedup.

A separate fresh-profile SW scenario verifies registration, activation/control, and cache behavior.
An initial expectation of control after the helper's reload failed; inspection showed that reload
uses `Page.reload({ ignoreCache: true })`. The corrected proof explicitly distinguishes hard reload
(uncontrolled) from subsequent normal navigation (controlled). Normal navigation populated the
package asset cache with 15 JS requests reaching the server; the following controlled navigation
reached the server for HTML but made zero `/pkg/` server requests. HTTP responses remained `no-store`.
This demonstrates the separate SW cache effect; it is not counted as a chunking improvement.

### Verification and remaining limits

Passed from the owning modules:

- Driver: targeted formatting check, `deno task check`, `deno task test:unit` (66 tests / 535 steps),
  `deno task test:build` (7 tests / 17 steps), and the explicit Chrome proof (1 test / 1 step).
- Consumer: `deno task check`, `deno task test` (86 tests / 575 steps), and `deno task build`.
- `git diff --check`.

The proof backend is Vite 8.3.2 / Rolldown 1.2.12 / Deno 2.9.7. A fresh independent review returned
GO for the driver repair and bounded GO for the metadata import and browser proof, with no required
pre-commit corrections. Its optional wording correction distinguishes shared emitted app/SW modules
from independent module instances in each realm; the module worker has its own emitted graph.

After the readability cleanup, all 12 files passed formatting checks; driver type checking, targeted
unit tests (2 tests / 31 steps), the build suite (7 tests / 17 steps), the explicit Chrome proof
(1 test / 1 step), and `git diff --check` passed again. The Chrome run consumed the existing tested
consumer output; it did not create a new comparative baseline.

At the bounded item 2 handoff, reproducible A/B/C packets and exact compression comparisons were
absent. Original captures stay withdrawn. The following investigation receipt records later
reconstructed measurements, not recovered artifacts or an elapsed-time improvement.

## Item 3: consumer-local boundary and investigation receipt

Move the runtime `Markdown` export from `src/common/libs.ts` to
`src/ui.react/ui/Prose.Markdown/common.ts`. The shared initialized export retained parsing/frontmatter
in Splash's startup graph; runtime consumers belong to the Markdown adapter. Public identity exports,
Markdown types, parsing/rendering behavior, ui-dev ownership, driver chunk policy, production
configuration, dependencies, and warning thresholds remain unchanged.

The human directed removal of the one-off comparative harness and restoration of the already-landed
standalone Chromium test. Historical source-string rewrites, copied chunk declarations, and exact
emitted graphs are investigation machinery, not lasting package contracts. A reusable driver warning
check is possible separate work, not part of this unit. Inline TMIND/DMIND/S-tier review is appropriate
for the narrow import relocation; no new blind-review gate or permanent bundle-budget framework.

### Observed evidence, not a retained comparative suite

Source base: `e060a8dd3f4083d2c3384b84f5efcdb4959e0311` plus the two barrel changes and temporary
diagnostics. Unchanged lockfile blob: `517be65d4deb9f46cbba09e6b8304422d60914b2`; production
configuration blob: `ad95ab91e10659f8487f7ce7d9ee471bccf92afb`. Backend: Deno 2.9.7 / Vite 8.3.2 /
Vite-owned Rolldown 1.2.12, macOS arm64.

The diagnostic reconstructed only the historical callback/metadata/Markdown seams, with current
remaining inputs and identical instrumentation. A/B transformed inputs were identical; B/C differed
only at entry metadata; C/D differed only at the two barrels. Complete outputs, readable graphs,
source hashes, and compression were captured in an owned `Fs.makeTempDir`, verified through Chrome,
then cleaned. The harness was deliberately removed after the experiment; rerunning that comparison
requires reconstructing the diagnostic. This receipt does not claim a live comparative regression test.

| State | Transformed-source identity | Output digest |
| --- | --- | --- |
| A | `sha256-31636a950f39c4ff76f1f1f45c07384fbe417f261f9b297c8c47bd82aac0781e` | `sha256-3f1e48511a69fd00f97b34fe2043883e4d9c0b8bb88249653fb0e8381e49525c` |
| B | `sha256-31636a950f39c4ff76f1f1f45c07384fbe417f261f9b297c8c47bd82aac0781e` | `sha256-97338f1be828407930fb1ecaed76540c9553638d988f88dd7f927da56974dc33` |
| C | `sha256-f08e99f4e884ea08461c4874eaab82dedf9685b66d2e13a1adbe8e1f21c45c14` | `sha256-740e2b56800a1f9739d478f4e6e61374445d73b9bc6eb0ce57b9540aa6b39616` |
| D | `sha256-8e8c64513bb7ad687ea97784e840f187ceec4063dea6f08e404c83eedc660090` | `sha256-921782684d1276a4e24c7f6f91ad689b2ea9a0b447610067559272a8b1c4e641` |

Source identities hash sorted transform-seen ID/source-hash lists from that experiment, not historical
Git snapshots. D's output matched the declared production build. The later comment-only residue edit
does not preserve its transformed-source hash; the receipt identifies the measured experiment.

Exact final JS bytes, summed per asset (gzip level 9 / Brotli quality 11):

| State | Route | Raw | gzip | Brotli | Requests |
| --- | --- | ---: | ---: | ---: | ---: |
| A | `/` | 1,184,235 | 365,330 | 318,717 | 13 |
| B | `/` | 1,184,280 | 365,939 | 320,077 | 14 |
| C | `/` | 1,184,656 | 366,385 | 320,502 | 15 |
| D | `/` | 907,339 | 282,361 | 248,032 | 15 |
| A | `/?dev` | 1,175,585 | 360,458 | 314,344 | 9 |
| B | `/?dev` | 1,175,784 | 361,048 | 315,660 | 10 |
| C | `/?dev` | 758,653 | 232,079 | 203,262 | 11 |
| D | `/?dev` | 758,727 | 232,114 | 203,288 | 11 |

A→B repairs identity without aggregate startup savings. B→C removes 417,131 index JS bytes but adds
376 Splash JS bytes; those metadata effects are not item 3 savings. C→D removes 277,317 Splash raw /
84,024 gzip / 72,470 Brotli bytes. Index JS adds 74 raw bytes and its manifest adds 226 (300 combined).
C/D product HTML is 1,612 raw bytes; index manifests are 15,405 / 15,631 raw bytes. Request counts do
not improve. Largest reported D JS chunk is 228,960 bytes; warning disappearance alone proves nothing.

Cold Chrome resource paths/body sums matched the entry/static/immediate-dynamic route closures.
Metadata/title, synthetic CMD+S, Button and Prose.Markdown selection, and separately observed SW
lifecycle/cache behavior passed. D's parser was absent from startup/Button and observed on Markdown
selection. Compression is computed, not negotiated; headers, observer, favicon, separate SW traffic,
and unfinished resources are excluded. No download/evaluation/paint/interactivity speedup is claimed.

Before diagnostic removal, both declared checks, consumer 86 tests / 575 steps, fresh production
build, comparative plus production Chrome proofs (2 tests / 2 steps), exact-file formatting, and
`git diff --check` passed. Ongoing behavior verification uses the existing consumer suite and the
standalone Chromium command recorded under item 2, not disposable historical reconstruction code.

After residue cleanup, both declared checks, consumer 86 tests / 575 steps, fresh production build,
restored standalone Chrome proof (1 test / 1 step), formatting, and `git diff --check` passed again.
The production digest still matches D. The final source unit contains exactly two consumer files
(two added lines, one removed); the driver/browser test matches its prior landed bytes and the new
diagnostics are absent. Inline TMIND/DMIND/S-tier review found no required corrections to the boundary.
