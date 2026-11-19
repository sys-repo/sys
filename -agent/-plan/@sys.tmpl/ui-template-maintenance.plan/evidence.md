# UI template maintenance: evidence and recovery

Supporting record for [the governing plan](../ui-template-maintenance.plan.md). Counts below are
historical observations, not fresh verification or broader acceptance. The plan's opening arc is the
sole landing ledger. Future blind reviewers must not receive this adjudication narrative.

## Owner and lifecycle proof

Historical focused/owner results are tests or suites / steps, not combined totals:

| Boundary             | Source receipt                                                      | Focused                            | Owner                                |
| -------------------- | ------------------------------------------------------------------- | ---------------------------------- | ------------------------------------ |
| Signal closure       | `1d532c559`; `code/sys/std/src/m.Signal/-test/-u.listeners.test.ts` | 6 / 95                             | 210 / 2,847; one ignored             |
| Pre-reset retirement | `19dc218dd`; `m.Bus/-Bus.specimen-retirement.test.ts`               | 1 / 14                             | 20 / 178                             |
| Admission            | `e608035ff`; `m.Bus/-Bus.specimen-admission.test.ts`                | 1 / 26; combined retirement 2 / 40 | 21 / 204                             |
| Attachments          | `fa683998e`; `m.Spec/-u.attachments.test.ts`                        | 1 / 59                             | 22 / 263                             |
| Template lifecycle   | `519b15ea8`; `code/-tmpl/src/-tests/-m.mod.ui.lifecycle.test.tsx`   | 1 / 34                             | No later whole-owner receipt claimed |

The `m.Bus`/`m.Spec` paths are under `code/sys.ui/ui-dev/src/ui.react.devharness/u/`.

- Signal tests reproduced eight failing leaves plus exceptional-teardown cases distinguishing
  bounded second disposal from single-pass cleanup. Retirement/admission tests cover reset
  publication, overlapping replacements, response delivery, disposal, and the reset-to-load
  continuation gap.
- Attachment tests cover denied admission, per-setter retirement, shared generations, independent
  factories/contexts, reentrant setup/teardown, renderer/type fidelity, and first raw failure
  preservation, including `undefined`. Earlier combined **4 / 110** predates the final regression;
  no later combined 111-step result was established. Exact five-file fmt/lint and diff checks
  passed.
- Template lifecycle tests use real controllers and two hosts, independent factories, render
  propagation, theme-only synchronization, reconnect, reset, retained signal identity, and storage
  failures. Fresh workers prove serialized hydration separately from cached main-thread state.
  Forcing storage reads to `null` failed both hydration cases; restoration passed.
- Related fixtures: `code/-tmpl/src/-tests/u.fixture.ui-lifecycle.tsx` and
  `code/-tmpl/src/-tests/u.worker.ui-storage.ts`. Projection attempts are counted before immutable
  deduplication; there is no production cache-reset seam. Exact four-file fmt/lint passed.
- Pre-owner candidate results **2 / 30** and **27 / 126** do not prove final attachment adoption.
  Initial adoption **1 / 30** preceded the strengthened **1 / 34**. Both authored specimen
  entrypoints type-checked; two inherited `require-await` findings were retained to preserve the
  `createDebugSignals` promise API.

Historical lifecycle command, from `code/-tmpl`:

```sh
deno task test --trace-leaks src/-tests/-m.mod.ui.lifecycle.test.tsx
```

### Retained substrate limits

- Disposal bridges can precede normalized retirement; the external-bridge test characterizes
  admission `[true, false]`, not zero upstream acquisition. Bounded second disposal is not general
  exception safety. Signal failed-activation cleanup remains separately owned; later reactive
  failures do not implicitly retire attachments.
- Reset is not veto/rollback. FIFO covers resets through response emission, not whole async runs;
  transport throws and the cold-context post-await gap retain their existing limits. Admission is a
  fresh read, not a reservation; standalone contexts are closed and holds cannot reopen disposal.
- Same-owner unsettled acquisition throws
  `Cannot attach while this owner is acquiring its shared effect`; no queue/retry is promised.
  Subject registration does not execute/await renderers and preserves explicit-undefined setter
  semantics. Cleanup must be synchronous despite void typing.
- Storage caches may lead bytes after failure; unchanged reconnect need not retry, and fresh
  factories may reuse the key-indexed registry. These tests do not establish durability.
- `code/-tmpl/-templates/tmpl.m.mod.ui.controller/u.controller.ts` subscribes in `React.useMemo` and
  disposes later. Discarded-render/replay safety is separate; its `strict: false` tests do not
  establish leak-free activation or Strict Mode replay.

## Artifact provenance

- Original baseline: `97118f747383a7e4c4b786e9cb3b2dd00e196ce5`; recovery record:
  `c62909401:-agent/-plan/@sys.ui-components/inline-label.plan.md`; removal `8a7f937c5`. Both UI
  template directories matched that baseline at `657304109`; no restoration occurred. Early parity
  **1 / 2** and experiment counts **27 / 100**, **3 / 5**, **122 / 857** were not lifecycle or paint
  acceptance. Text.Label's `818703253` scaffold was superseded by its later behavior; its unused
  stylesheet must not be restored.
- `519b15ea8` retained the old bundle blob `ecab61352086ac2a38e1a72a8804497bf8f7006a`. Adoption-time
  parity failed the two UI specimen cases, not the package type case. `84dc7dd7b` subsequently
  refreshed six specimen/debug/type entries and `repo/-deps.yaml`/`repo/-package.json`. Later raw
  materialization parity passed; do not confuse this with named generated `-SPEC.tsx` typing or
  published compatibility. `-m.mod.ui.dev.test.ts` checks localized debug factories only.
- The scoped-style delta from `41db307d7` to `917bd0922` changes exactly three of 104 bundle
  entries: `m.mod.ui/ui.tsx`, `m.mod.ui/use.Styles.ts`, and `pkg/src/ui/common/libs.ts`. No
  lifecycle or dependency projection entry belongs to this delta. The package UI barrel was
  explicitly added to parity coverage; an earlier claim that it appeared without an agent edit was
  incorrect.
- Scoped `prep:bundle` refreshes repaired comment/declaration-order drift. The final accumulator
  refinement refresh changed only `m.mod.ui/use.Styles.ts` against its pre-run backup.
  Generator-owned newline layout is not formatter-owned. The bundle test itself writes the real
  artifact.

## Scoped-style implementation proof

The production repair supplies explicit identity and resolved theme, registers invariant descendant
rules, returns private root values, and composes caller style last. Public props are unchanged. The
ten proof files remain intentionally separate; paths below are relative to `code/-tmpl/src/`:

| File                                       | Distinct boundary                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-test/-m.mod.ui.styles.test.tsx`          | Actual authored root, emitted bindings, connected CSSOM, live themes/identity, alpha-setting semantics, child-layout initial registration                 |
| `-test/-m.mod.ui.styles.generated.test.ts` | Named Button/XMLPanel setup, acronym identity, two independent rule blocks, block/helper deletion, generated runtime/check/build and full browser receipt |
| `-test/-m.mod.ui.styles.report.test.ts`    | Lossless repeated values, independent snapshots, PASS/FAIL/partial ERROR, optional version metadata                                                       |
| `-test/-m.mod.ui.styles.runner.test.tsx`   | Button initiation, busy locking, malformed baselines, retry, one rejected receipt per run; DOM control flow, not paint                                    |
| `-test/styles.browser/common.ts`           | Browser-safe imports, constrained public component contract, independent generated-name expectation                                                       |
| `-test/styles.browser/u.baseline.tsx`      | Historical literal recipe in isolated single-palette documents                                                                                            |
| `-test/styles.browser/u.fixture.tsx`       | Portal into the real generated root without public test-only children; paint-only, not initial timing                                                     |
| `-test/styles.browser/u.report.ts`         | Value-owned capture for visible JSON and completion receipt                                                                                               |
| `-test/styles.browser/ui.tsx`              | Computed matrix, ancestry/override placement, update/remount identities, phase/generation waits, attached rule counts                                     |
| `-tests/-m.mod.ui.parity.test.ts`          | Raw authored/embedded byte parity, separate from named setup                                                                                              |

The DOM mock drops var-border shorthands; serialized input is not computed border proof. The
baseline shares Color/CSS substrate but not candidate private bindings: this is template proof, not
a library audit. `Schedule.frames(2)` is synchronization, not a paint guarantee. Strict Mode
wrapping does not prove insertion-effect replay.

### Final bounded verification

From `code/-tmpl`:

```sh
deno task test --trace-leaks src/-test/-m.mod.ui.styles.report.test.ts src/-test/-m.mod.ui.styles.runner.test.tsx src/-test/-m.mod.ui.styles.test.tsx src/-test/-m.mod.ui.styles.generated.test.ts src/-tests/-m.mod.ui.parity.test.ts -- --browser
deno task check
```

- The implementing closure and post-accumulator-refinement runs each passed **5 suites / 14 steps**,
  including four inner generated runtime cases, generated package check/build, and Chrome **56
  complete comparisons**. UA: `HeadlessChrome/157.0.0.0`. These are separate runs, not additive
  counts. Owner check, closure exact-fourteen-file fmt/lint, subsequent exact-helper fmt/lint, and
  diff checks passed. No whole-template/workspace suite was run.
- The supplied final independent review reported the same **5 / 14**, generated checks/build, Chrome
  56-record result, owner check, and scoped diff checks, with no edits or Git mutations.
  Adjudication rechecked live source, relevant diffs, and reachable history but did not rerun tests.
- Earlier **8 / 54**, later **3 / 9**, and authored **1 / 5** receipts predate the final
  report/runner closure; do not substitute them for the final candidate's proof.
- Browser success requires ten exact phase counts, 56 unique phase/sample identities, all 26 named
  non-empty actual/baseline properties, equal values, empty differences/failures, and a completed
  receipt. Navigation, PASS headers, or array length alone are insufficient.
- Ordinary owner tests remain network-free; browser execution is opt-in. The normal generated entry
  mounts `XMLPanel.UI` through `?styles`; standard build and loopback verified-Dist serving are
  used. `Testing.Http.server` owns only the completion receipt; listeners and browser are disposed.
  A 15-second post-load window is a receipt opportunity, not proof by elapsed time.
- Localized workspace authority is `TmplTesting.LocalRepoAuthorities`. Generated-only
  `resolve.dedupe: ['react', 'react-dom']` resolved duplicate React dispatchers. This does not prove
  untouched generated-config or published-consumer compatibility. Verified-Dist transport is not a
  separate invocation of the generated `serve` CLI.

### Sensitivity and failure recovery

All executed controls below were restored; none is a retained production mutation.

| Executed control                                          | Observed discrimination                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Old mixed-case private keys                               | Production-root test found a foreground reference without a root definition    |
| Reordered declarations                                    | Authored test still passed; assertions are order-independent                   |
| Candidate weight 500                                      | Four authored palette cases failed the 600-weight assertion                    |
| Generated XMLPanel → XmlPanel                             | Literal acronym identity assertion failed                                      |
| Flattened browser nesting                                 | Incorrect-parent-root error                                                    |
| Removed intermediate override from candidate and baseline | Incorrect-override-placement error despite shared damage                       |
| Removed automatic run/receipt                             | Navigation succeeded; missing completed proof failed                           |
| Browser-only weight 500                                   | Trusted pointer run produced 56 failures; removal restored 56 PASS comparisons |
| Shared Dark code color                                    | 24 Light color failures; direct overrides and Dark samples unaffected          |
| Shared report snapshots                                   | All three report regressions failed; independent value capture restored green  |
| Restored mandatory version gate                           | Both UI-control cases failed the initially enabled-button assertion            |

The trusted CDP pointer diagnostic used the existing port-1237 build, verified hit testing and
`isTrusted`, and passed **1 test / 0 failures / 1 filtered**, with leak tracing. It was not direct
`run()` invocation. Its temporary test import was removed; `.tmp/scoped-style-manual-click.test.ts`
is recovery evidence, not a permanent test. The only allowed browser resource error was favicon 404.

That diagnostic exposed `Json.stringify` replacing repeated noncyclic aliases with `[Circular]` (48
baseline and 56 comparison markers in a failure report). Comparison execution was real, but
serialization lost evidence. `u.report.ts` now clones each actual/baseline/difference value and each
failure separately; cloning the whole graph would preserve aliases. Three regressions prove lossless
round trips, mutation isolation, and outcome/version semantics. No `@sys/std` change was made.

The runner serializes once for visible output and POST, preserves partial ERROR evidence, and shows
receipt rejection without recursive retry. Two DOM tests cover empty-version clicks, busy recovery,
malformed baselines, repeat runs, and 503 delivery. They do not prove iframe paint or pointer trust.
Additional negative controls proposed by the final reviewer were not executed.

Do not revive rejected infrastructure: ui-dev `/@fs/` failed with `Deno is not defined`; direct
owner imports reached server dependencies. Standalone HTML/server files, the third-theme fixture
API, and `dev:styles`/broad permission presets were removed. `code/-tmpl/deno.json` was restored to
tracked bytes. The generated entry with browser-only fixture imports is the supported proof route.

## Human browser acceptance

The human accepted the available evidence and closed routine manual collection. This is bounded
acceptance, not cross-browser pixel equality or proof of missing artifacts.

| Browser | Recorded evidence                                                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Firefox | Exact **160.0 (aarch64)**; repaired report `2026-11-17T07:26:58.654Z`, UA `Firefox/160.0`; 56 complete comparisons / ten phases, no differences/failures/circular placeholders |
| Safari  | Exact **27.2 (22625.2.8.11.9)**; corrected report `2026-11-17T07:33:43.788Z`, UA `Version/27.2 Safari/605.1.15`; 56 complete comparisons / ten phases, no differences/failures |
| Chrome  | Exact **157.0.8103.79**; original nested Dark/Light screenshot with reduced UA `Chrome/157.0.0.0`; automated complete reports separately recorded above                        |
| Brave   | Supplementary nested Dark/Light visual receipt, not a replacement for a required browser                                                                                       |

Original screenshots showed completed PASS headers and empty failure arrays, not complete JSON.
Later Firefox/Safari sibling-order and nested Light/Dark views matched isolated references without
obvious leakage; direct overrides stayed pink and root/intermediate overrides preserved code
styling. The human confirmed unchanged remount appearance. Both repaired reports left optional
version input `null`; About receipts supplied exact versions. An earlier screenshot set labeled
Safari was actually Firefox and was superseded by correctly associated Safari captures. Do not reuse
Firefox `145.0.2`.

Additional repaired Chrome manual JSON/views were not supplied. The human's decision closes further
collection, not that evidence gap. The reviewer did not independently execute Firefox/Safari or
inspect visual paint.

**Archival limit:** observations and report provenance were inspected in the conversation. Full JSON
payloads and later replacement images are not archived here. At the human's cleanup request, the
four original repository PNGs were removed after exact recovery copies were retained under
`.tmp/scoped-style-notes-cleanup.manual-{brave,chrome,firefox,safari}-nested-dark-light.png`. This
plan commit intentionally contains written receipts, not replayable image evidence; local recovery
copies are outside the commit unit and are not durable Git evidence.

## Scoped-style acceptance and adjudication

The supplied final fresh-session review examined production, browser/report integration, and all ten
proof files. Adjudication accepted GO: no production blocker, required consolidation, or blocking
residue. Retain independent proof boundaries rather than merge oracles for line-count reduction.
Retain the fresh local accumulator for block composition/removal; `satisfies` is a compatibility
check, not proof of dynamic key spelling or binding correspondence. No further blind pass is
required without a new concrete risk. This does not close consumer migrations or lifecycle artifact
evidence.

**Accepted, non-blocking, deferred:** `code/-tmpl/src/-test/styles.browser/ui.tsx` awaits receipt
fetch without timeout or active-run unmount cancellation. A receiver that never responds can leave
controls busy after comparisons finish; cleanup cancels scheduled startup only. The automated
receiver responds immediately, and completed comparisons remain valid. Production styling is
unaffected. Optional correction belongs in this fixture and
`code/-tmpl/src/-test/-m.mod.ui.styles.runner.test.tsx`: abort-aware stalled-fetch tests should
prove one attempt, visible timeout error, recovered controls, and unmount cancellation. No new
runner abstraction is warranted. GO does not mean defect-free or universal compatibility.

## Consumer scoped-style verification

Scope: ActionProbe and Prose.Manuscript only, against source baseline `424278663`. The production
migration preserves component identities and the distinct code line-heights (1.9 and 1), retains
ETBook loading and separate Manuscript declaration modules, and composes root bindings caller-last.
No template source, embedded bundle, dependency projection, specimen lifetime, or persistence policy
was changed. Template generation in the browser orchestrator is temporary fixture setup, not a new
template implementation, regeneration of the embedded bundle, or release.

After restoring both executed source controls, the focused command below passed **6 suites / 45
steps**. This includes seven new scoped-style steps plus unchanged activation, signal, renderer, and
API coverage. Before retiring the one-off browser harness, `deno task check --quiet` from
`code/sys.ui/ui-components` passed with that fixture included. Exact-file lint and format checks
passed for the 14 then-extant source/test files; `git diff --check` passed. These are workspace
typing/DOM receipts, separate from the computed-paint receipt below.

```sh
cd code/sys.ui/ui-components
deno task check --quiet
deno task test --trace-leaks src/-test/-scoped-styles.test.tsx src/ui.react/ui/ActionProbe/-test/-ui.keyboard.test.tsx src/ui.react/ui/ActionProbe/-test/-m.Signals.test.ts src/ui.react/ui/ActionProbe/-test/-m.Renderer.test.ts src/ui.react/ui/ActionProbe/-test/-.test.ts src/ui.react/ui/Prose.Manuscript/-test/-.test.ts
```

Executed sensitivity controls failed the intended assertions, with five other scoped-style steps
still passing: omitting ActionProbe's root composition lost its foreground binding; omitting
Manuscript heading registration failed the initial child-layout observation. Both source changes
were restored before the green run. Recovery copies are
`.tmp/consumer-scoped-styles.before-root-control.tsx` and
`.tmp/consumer-scoped-styles.before-heading-control.ts`; exact-file pre-format copies use
`.tmp/consumer-scoped-styles.prefmt.*`.

### One-off browser acceptance: human-run PASS

The human supplied a completed terminal receipt from `deno task test:scoped-styles`, run in
`code/sys.ui/ui-components` after adding the explicitly reviewed subprocess preset. Ordinary test
permissions remained unchanged; the temporary generated build used `-P=dev`, not `-A`. This
successful run supersedes the earlier `NotCapable: Requires run access to "deno"` blocker. The
agent's separate attempt was aborted and is not a passing receipt.

- Generated package `check` and `build`: **passed**.
- Browser test: **1 passed / 0 failed, 16s**; **140 complete paint comparisons**, loaded ET Book,
  and restored line-height/color sensitivity controls.
- Outer integration test: **1 passed / 0 failed, 2m24s**, including generated workspace setup/build.
- Browser UA reported `HeadlessChrome/157.0.0.0` on macOS. This is a reduced UA, not an exact Chrome
  build-version receipt.

The receiver checked every expected phase/sample/target identity and all 28 computed properties:
actual consumer roots/code/headings, both themes and mount orders, transitions, remounts, nested
same-owner roots, and caller precedence. Baselines independently transcribed isolated recipes from
`424278663`; unchanged inner content/layout and Color/CSS substrate were shared. This is bounded
consumer computed-paint evidence, not a whole-component/substrate audit, a new manual browser
matrix, or published-consumer compatibility. Provenance is the human-supplied terminal transcript
plus the inspected receiver contract; full report JSON was not archived.

### Retained regression boundary

At the human's explicit request, the multi-minute integration harness was retired after this proof,
not retained as permanent CI or a further completion gate. Removed:

- `code/sys.ui/ui-components/src/-test/-scoped-styles.build.ts`;
- `code/sys.ui/ui-components/src/-test/scoped-styles/{-browser.ts,u.baseline.ts,ui.tsx}`;
- the dedicated `test:scoped-styles` task and `scoped-styles` permission preset.

The fast `src/-test/-scoped-styles.test.tsx` and existing consumer regressions remain. Production
source was not changed by this retirement. Exact recovery copies of the four proof files and the
pre-retirement module config use `.tmp/consumer-scoped-styles.retired.*`. These local copies are
outside test discovery and the commit unit, not durable or directly executable browser fixtures. No
further slow run was performed for cleanup.

After retirement, the owner check passed again; the retained focused command passed **6 suites / 45
steps / 0 failures in 2s**. The new scoped-style suite itself took **52ms**.

### Consumer review adjudication and final test hardening

The supplied blind review returned GO with no production blockers. Adjudication retained the
production design unchanged and accepted two optional findings: strengthen declaration/reference
coverage in the retained test, and exclude behavior-neutral `deno.json` churn from the source
commit. That was the review recommendation, not the eventual commit manifest: `55d4cea12` landed 12
paths, including `code/sys.ui/ui-components/deno.json`. The reconciliation preserves that actual
history; plan artifacts remain a separate commit concern.

`expectPalette` now checks `color` → foreground, `background-color` → background, and the complete
border declaration → border variable, in addition to distinct references and root-bound values.
Declaration-boundary matching prevents `color` from matching inside `background-color`.

A temporary test-side transformation swapped foreground/background references in the observed rule
text without changing root bindings or production source. The old assertions passed all seven steps;
the strengthened assertions failed all seven at the declaration mapping. The control was removed,
then the owner check and focused **6 suites / 45 steps / 0 failures** passed again in **2s**; the
scoped-style suite took **58ms**. Exact-file lint/format checks passed for all ten extant
source/test files, and `git diff --check` passed. No browser rerun, new suite, or permanent test
harness was added. The test's pre-change recovery copy is
`.tmp/consumer-scoped-styles.before-reference-mapping.test.tsx`.

## Lifecycle pilot preparation evidence

Step 2 prepares Text.Label + Prose.Manuscript; it does not implement either consumer. Baseline HEAD
was `ce341a391`. Relevant template, owner, and consumer source had no worktree delta. The
preparation kept ActionProbe and the remaining inventory outside the pilot and assigned a separate
future arc item to that remaining migration. No staging, commit, source migration, or dependency
refresh occurred.

### Authored/embedded parity and generated entrypoints

Personally executed from `code/-tmpl`:

```sh
deno task test --trace-leaks src/-tests/-m.mod.ui.parity.test.ts .tmp/-ui-lifecycle-entrypoints.test.ts
```

Observed **2 suites / 4 steps / 0 failures in 1m45s**: three parity steps and one generated check
step. The named probe path in that historical command was subsequently retired; it is not a current
runnable command. The existing parity test covered both UI templates' specimen/debug/type files,
plain UI/styles, `pkg/src/common/t.ts`, and the package UI library barrel.

Artifact attribution:

- `code/-tmpl/src/m.tmpl/-bundle.json` blob: `78471c59ca64f13434f00f4499c4e63673a3eafa`.
- Authored plain `-spec/-SPEC.tsx` blob: `6c087230f26a4fa4682a4818f94b9dbc7ca13aa4`.
- Authored controller `-spec/-SPEC.tsx` blob: `8384f2ee167d8d30407d7f8472dd43004a296f97`.
- `makeTmpl` materialized the embedded `repo`, `pkg`, `m.mod.ui`, and `m.mod.ui.controller`
  products. Existing package/component initializers named the package
  `@fixture/lifecycle-entrypoints` and components `LifecyclePlain` and `LifecycleController`.
- Generated package at execution:
  `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/workspace-16704b8aa56ed7c2/code/example`. Normal
  probe cleanup removed its temporary workspace after the check; it is not a retained app.

The generated package's existing `deno task check` ran with these explicit additional targets:

- `src/ui/LifecyclePlain/-spec/-SPEC.tsx`
- `src/ui/LifecyclePlain/-spec/-SPEC.Debug.tsx`
- `src/ui/LifecyclePlain/-spec/-t.ts`
- `src/ui/LifecycleController/-spec/-SPEC.tsx`
- `src/ui/LifecycleController/-spec/-SPEC.Debug.tsx`
- `src/ui/LifecycleController/-spec/-t.ts`
- `src/common/t.ts`

All were visibly checked with no type errors. The task also checked its normal generated source,
script, and Vite-config targets. The probe asserted byte-identical generated package `deno.json`
before and after the check. No template, bundle, generated source, or check-task correction was
needed.

Dependency authority was localized using the existing `TmplTesting.LocalRepoAuthorities.rewrite`
helper, with the current workspace import map, package authority, and exported source modules:

- `@sys/ui-dev/react/devharness` →
  `/Users/phil/code/org.sys/sys/code/sys.ui/ui-dev/src/ui.react.devharness/mod.ts`
- `@sys/ui-dev/react/devharness/t` →
  `/Users/phil/code/org.sys/sys/code/sys.ui/ui-dev/src/ui.react.devharness/types.ts`
- `@sys/ui-react` → `/Users/phil/code/org.sys/sys/code/sys.ui/ui-react/src/mod.ts`
- `@sys/ui-components/react/dev` →
  `/Users/phil/code/org.sys/sys/code/sys.ui/ui-components/src/ui.react/dev/mod.ts`

Harness and Dev-control mappings were asserted against `import.meta.resolve`; the receipt printed
all four mappings. This closes the named generated lifecycle-entrypoint evidence gap against these
workspace dependencies. It does not prove published dependency compatibility, controller Strict Mode
replay, consumer adoption, storage durability, or browser paint. No browser/build run was performed.

The one-off test was copied exactly to `.tmp/ui-lifecycle-entrypoints.step2.probe.ts`, then removed
from `code/-tmpl/.tmp/`. The recovery copy is outside discovery/commit scope and retains its
original relative imports; it is evidence, not a directly executable fixture at the new location. Do
not add this 1m45s materialization/check pass to permanent migration CI or repeat it absent changed
inputs. After retirement, the existing parity task alone passed **1 suite / 3 steps / 0 failures in
42ms**.

### Unchanged consumer baseline and proof allocation

Personally executed from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks src/ui.react/ui/Text.Label/-test/-spec.test.tsx src/ui.react/ui/Prose.Manuscript/-test/-.test.ts
```

Observed **2 suites / 4 steps / 0 failures in 658ms**. This is pre-migration behavior evidence:
Text.Label's three control/hydration/composition steps and Manuscript's one API step. It is not
attachment or detached-silence proof. It also does not establish storage isolation: the existing
Label test uses global `localStorage`, which `DomMock.init` does not replace. The historical PASS
stands, but must not be described as an isolated-storage run. Install explicit isolation before
future consumer runs; this reconciliation did not rerun that baseline.

Source inspection found two details that constrain the pilot:

- `LocalStorage.immutable` may seed missing serialized defaults at construction and uses a keyed
  registry. An inert attachment owner must prevent reactive persistence acquisition, not forbid this
  existing initialization write or promise a fresh read for every factory.
- Text.Label currently omits subject size and applies its initial traceline after theme setup;
  Manuscript uses `size('fill')` with the harness's default margin. Neither should inherit the
  template's `[360, null]` size. Theme-only synchronization and redraw must remain separate.

The plan's seven-path pilot boundary allocates permanent proof to the existing Text.Label tests, one
small integration file for the two actual suites, and one thin shared test fixture. Lifecycle
mechanism tests remain at the owner; one representative consumer sharing check is enough. The
planned consumer assertions and negative controls have not been implemented or run. No consumer
source or retained test was changed in this preparation pass.

### Pilot preparation review and reconciliation

The human supplied a bounded blind-review report with **GO for this preparation contract**, no
material blockers, and no implementation or Git authorization. The prompt recommended `gpt-6.1-sol`
at `high`; the supplied report does not independently identify its actual runtime model/effort. Its
final implementation recommendation is prospective, not reviewer provenance.

The reviewer reported source/history inspection at `ce341a391` and a passing `git diff --check`; no
tests, probes, browser runs, or materialization were executed in that review. Its failure sequences
were hypothetical wiring mistakes, not observed failures. The report supports the existing
owner/consumer proof split and leaves published compatibility, browser behavior, and consumer
adoption unproven.

Reconciliation retained the design and accepted these source-grounded clarifications:

- `code/sys/std/src/m.Testing.DomMock/u.polyfill.ts` installs DOM globals but not `localStorage`.
  Label's existing test accesses global storage. Explicit installation/restoration of isolated
  storage belongs in pilot test setup before store/factory access, not in the production owner.
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Ctx/Ctx.Props.Subject.ts::size` defaults fill
  margins to **50**. Preserve Manuscript's omitted margin rather than adding an explicit override.
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Theme/mod.ts::Theme.signalEffect` is the current
  navigation target, not `u.signalEffect.ts`. Label's initial traceline override must not be
  reapplied on later theme changes; retain `Theme.background` behavior.
- Keep the shared fixture limited to controller/storage setup actually reused by integration and
  Label's attached control test. The seven-path boundary is not a quota. Retain existing assertions
  and count projection attempts where storage deduplication could hide duplicate ownership.

These source surfaces were reopened during reconciliation. No production change or additional
runtime proof was needed for the documentation corrections. No further review was commissioned; a
readiness check and explicit implementation authorization remain separate.

## Consumer lifecycle pilot verification

Scope: Text.Label + Prose.Manuscript, source baseline `d9d5e9cf7`. The seven-path source/test unit
in the governing plan uses factory-local `Spec.attachments({ shared })` and one attachment per
specimen init. Shared persistence retains the existing field-by-field projection; host theme and
redraw are separate effects. Label's traceline override is an initial-only attachment effect, after
theme setup. No component UI/styles/fonts, Samples, owner implementation, package configuration,
template, bundle, dependency, or other specimen was changed.

### Executed proof

Initial implementation receipt, before fixture refinement and suppression removal. Personally
executed from `code/sys.ui/ui-components`, after restoring both negative controls and formatting:

```sh
deno task test --trace-leaks src/-test/-specimen-lifecycle.test.tsx src/ui.react/ui/Text.Label/-test/-spec.test.tsx src/ui.react/ui/Prose.Manuscript/-test/-.test.ts
deno task check --quiet
```

Observed **3 suites / 6 steps / 0 failures in 1s**. The new integration suite contains two consumer
journeys and took **138ms**. The three existing Label control/hydration/composition steps and the
unchanged Manuscript API step passed. The package check passed; exact-file lint and fmt checks
passed for all seven touched source/test files. `git diff --check` passed.

- The integration suite dynamically imports each actual specimen, initializes it, and loads/runs it
  through the public harness controller. Registered subjects are rendered with `TestReact`;
  component identity/content and context layout are checked without an owner-internal import or
  production test seam.
- Label pins inert reactive persistence acquisition, unspecified/inherited subject size, repeat-init
  redraw ownership, shared signal identity and one projection across two hosts, independent reset/
  disposal, detached redraw/storage/paint silence, and reconnect projection over stale preferences
  while preserving unrelated fields. Its initial traceline is **0.03**; later Dark theme changes use
  the harness's **0.08**, not the initial override.
- Manuscript pins Light/debug defaults, fill layout with margin **[50, 50, 50, 50]**, actual subject
  content, repeat-init ownership, custom paint across unrelated knobs, live debug-reset identity and
  serialized defaults, harness reset/reconnect, and isolation of a replacement specimen from retired
  signals. Shared-host machinery is not repeated for this consumer.
- The shared fixture installs an isolated HappyDOM `localStorage` before store/factory access and
  restores its previous global descriptor. Projection monitoring wraps/restores the public ref's
  `change` method, observing attempts before immutable deduplication. No private registry access or
  ambient HOME-backed storage is used. Label's original assertions remain intact; its control case
  acquires persistence through a real context whose disposal retires the attachment.

### Sensitivity and residue

After correcting test-fixture typing, the pre-migration runtime run failed both new consumer steps:
Label acquired persistence during factory creation (**1**, expected **0**), while Manuscript
acquired no projection at first attachment (**0**, expected **1**). The migrated focused command
then passed. A test assertion was corrected to distinguish an omitted size from an own property set
to undefined; production layout was not changed to satisfy it.

Two further source controls were executed independently against the migrated consumers:

1. Omit Manuscript's shared projection: its first-attachment attempt assertion failed (**0** versus
   **1**); Label still passed.
2. Move Label's theme effect outside attachment ownership, preserving initial traceline setup: its
   detached-host paint assertion failed; Manuscript still passed. Explicit paint observations keep a
   silent style leak from hiding behind successful redraw/storage counters.

Both controls were restored before the final green run. Recovery copies remain outside discovery/
commit scope at `.tmp/ui-components-lifecycle.manuscript.before-projection-control.tsx` and
`.tmp/ui-components-lifecycle.label.before-escape-control.tsx`; the seven pre-format copies use
`.tmp/ui-components-lifecycle.prefmt.*`. No temporary probe, extra task, permission preset, browser
harness, migration registry, or duplicated owner exception/reentrancy matrix was retained.

Exact-file lint found pre-existing specimen issues. The touched Manuscript files now use a type-only
React import, omit an unused type import, and use an equivalent literal JSX attribute. At this
intermediate stage, two local `require-await` suppressions preserved the async contract while making
targeted lint pass. Those directives were removed during final closure below; no fake await, factory
API change, or package-wide lint relaxation was introduced.

Proof limits: the React receipt renders registered subjects, not the entire Harness UI or browser
computed paint. Owner-mechanism evidence remains historical and unchanged. No browser, generated
artifact, published dependency, storage durability, or remaining-consumer proof is claimed. The
supplied earlier blind review covered preparation only; this initial receipt predates the supplied
post-implementation review below. No staging, commit, or other Git mutation was performed.

### Fixture refinement and async-boundary review

The later human-requested same-thread review removed the name-based/cache-busted loader, both
`Time.wait(35)` calls, and the `closeDom` wrapper. Tests use literal specimen imports after storage
setup, retain explicit suite initialization, and await `DomMock.unpolyfill()` directly. All behavior
assertions remain. Controller disposal cancels pending debounced prop flushes; raw transport
observation remains live until fixture disposal so late redraws cannot disappear behind a closed
controller observation.

The proposed transport narrowing to `DevEvent` failed type checking (`TS2345`): `EventBus.fire`
accepts general events. A temporary compile-time probe then confirmed that the original inferred
parameter was exactly the public base `Event`, not `any`. The retained `Rx.subject<Dev.Event>()` is
an explicit named-type simplification, not a new type-safety guarantee. The probe passed **1 suite /
1 step** after correcting its assertion-helper usage, then was removed; no diagnostic assertion or
type cast was retained.

Label's initial traceline callback was also grouped immediately after theme setup and before redraw,
removing its explanatory comment without adding a reactive dependency. Before suppression removal,
the focused command passed with leak checks: **3 suites / 6 steps / 0 failures in 1s**, integration
suite **64ms**. Package `deno task check --quiet`, exact-file lint/format for all seven source/test
paths, and `git diff --check` passed. No new browser, owner, or negative-control run is claimed
here.

The recommendation to make the factories synchronous was withdrawn after inspecting concrete setup
consumers: Automerge's `ui.Document/-spec/-SPEC.Debug.tsx` and
`ui.Repo/-spec.worker/-SPEC.Debug.tsx` await `spawnUiRepoWorker()` before returning `debug.repo`.
`src/ui/-test.ui.repo.ts` delegates to `Crdt.Worker.Client.spawn`; `src/m.worker/u.client.spawn.ts`
awaits worker readiness and the attach handshake. Both callers use `await createDebugSignals()`.
These paths are under `code/sys.driver/driver-automerge`; no worker was launched in this review and
its resource ownership was not audited. This evidence supports a stable promise-based setup
contract, not moving prerequisites into non-awaited attachment effects.

### Blind-review disposition and final verification

The human supplied a post-implementation blind review of the seven-file pilot and workbook. It
supported the ownership design and test sufficiency, and requested changes solely for the two added
suppressions, proposing a shared lint-policy exclusion. Actual reviewer model and effort were not
verified. Its reported checks are supplied evidence, separate from the executions here.

The comment-noise finding was accepted; requiring workspace policy expansion was rejected after
baseline inspection. Both factories were already async without await. The package check runs
`deno check`, and root `ci` does not include the separate `lint` task. Direct linting of untouched
ActionProbe reproduces `require-await`; this is not a new lifecycle failure. With human approval,
the two suppressions were removed while preserving async factories, caller awaits, and `Awaited`
types. No root configuration, template, bundle, or additional lifecycle machinery was changed.

A subsequent same-thread TMIND readability pass named DOM results, async results, and fresh
per-phase context observations before assertions. Positional counter tuples became named counts with
separate assertions. The setup hook is a formatter-stable, void-returning one-liner. Expected values
and behavioral coverage remain unchanged; render disposal scopes and teardown ordering are
preserved. No assertion framework or lifecycle helper was added. This refinement was not a second
blind review.

Final checks against the pilot worktree at HEAD `4e2a00783`, personally executed after suppression
removal and test-readability refinement:

- The focused command above passed with leak checks: **3 suites / 6 steps / 0 failures in 1s**;
  integration suite **61ms**. Package `deno task check --quiet` passed.
- Exact seven-file formatting passed. Exact seven-file lint exited **1** with **two** diagnostics:
  `require-await` on `createDebugSignals` in Label and Manuscript, with no other findings. These
  inherited diagnostics are explicitly accepted for this pilot; lint is not reported as green.
- `git diff --check` passed.
- No fresh browser, worker, generated-artifact, owner-suite, or sensitivity-control run is claimed.
  No Git mutation was performed. Plan records remain separate from the seven-file source unit.

The material review finding is resolved under this bounded disposition. Broader lint-policy work is
not a pilot prerequisite, and subsequent migrations must distinguish inherited diagnostics from new
regressions rather than add lint appeasement.

## ActionProbe attachment proof

Post-commit inspection of reachable `f2a31856b` confirmed the seven-file diff below, including the
short regression, shared fixture, UI test barrel, and both pilot import-only updates. The component
worktree matched that commit. This was Git/source review, not a new test run; the runtime results
below remain the executed pre-commit receipt. The opening arc records the landing identity.

Against source baseline `1035f21b7`, the seven-file proof unit is ActionProbe's specimen/debug pair
and local test, the shared specimen fixture, the UI test barrel, and import-only updates to Label's
specimen test and the shared pilot integration. The factory-local projection owns only
theme/debug/env/actOn/sizeMode. One attachment owns theme, size-mode, and redraw effects; explicit
`resultVisible()` / `reset()` persistence and React-owned work remain unchanged.

The initial broader migration test passed **6 suites / 40 steps** and exercised the rendered Result
click, defaults/layout, and seeded preference preservation. Its eager-factory and escaped-theme
negative controls failed as intended. That proof remains historical evidence; it is not a reason to
retain a permanent configuration catalogue.

The reduced local test is one short journey: automatic effects operate, retire, and reconnect;
detached commands persist without reactivating them. Retained signal identity and
stale-versus-current size preference distinguish reconnect from factory recreation. The existing
fixture gains setup and observation composition, not transplanted assertions: isolated storage
precedes literal suite loading, cleanup is awaited, size is cloned, and paint/counters are captured
by value. The loader supplies the real suite; the fixture never constructs its attachment wiring.
Existing pilot assertions and Signals tests remain unchanged. The new ActionProbe journey no longer
mounts the Result or repeats its DOM checks.

All three fixture consumers now import through `src/ui.react/-test.ts`; that barrel is the only
remaining direct import of the fixture file. The fixture still imports the lower package test
barrel, so the export adds no upward cycle and does not place UI harness helpers in the package-wide
toolkit. `DevCtx.redraw` was checked in `code/sys.ui/ui-dev/src/ui.react.devharness/t/t.ctx.ts` and
its context implementation: it returns `Promise<void>`. **Superseded callback-style guidance:** the
original pass retained block-bodied `void ctx.redraw()`. Workbook rule 8 now requires plain
`ctx.redraw()` inside a block; expression-bodied callbacks use `void` only when a returned value
must be discarded. Neither form handles promise rejection. The landed ActionProbe and authored UI
templates are ownership examples, not current callback-form exemplars; correcting those sources
requires separate authorization.

Personally executed after reduction:

- Omitted shared projection: failed at persisted size, **fill**, expected **auto**.
- Escaped theme effect: failed at the retired observation equality.
- Omitted `persist: store` from action construction: failed at the detached visibility command,
  **undefined**, expected **{ resultVisible: false }**.
- All three temporary controls were restored before final verification; source behavior is unchanged
  by this test refinement.
- After import-lane adoption, the nine-file command recorded below passed **9 suites / 45 steps / 0
  failures**, **3s**; the ActionProbe journey took **71ms**. This includes all ActionProbe tests,
  pilot integration, Label behavior, Manuscript API, and a separate UI toolkit consumer
  (`src/ui.react/dev/-test/-exports.test.ts`). Negative controls were not repeated for the
  import-only changes.
- `deno task check --quiet`, exact seven-source-file `deno fmt --check`, and `git diff --check`
  passed.
- Exact seven-file lint exited **1** with the same four inherited Debug findings:
  `verbatim-module-syntax`, `require-await`, and two `jsx-curly-braces`. No test/fixture/barrel
  findings, suppressions, dummy work, or lint-policy changes.

Executed command from `code/sys.ui/ui-components` (relocated from the plan during consolidation):

```sh
deno task test --trace-leaks src/ui.react/ui/ActionProbe/-test/-spec.test.tsx src/ui.react/ui/ActionProbe/-test/-m.Signals.test.ts src/ui.react/ui/ActionProbe/-test/-ui.keyboard.test.tsx src/ui.react/ui/ActionProbe/-test/-m.Renderer.test.ts src/ui.react/ui/ActionProbe/-test/-.test.ts src/-test/-specimen-lifecycle.test.tsx src/ui.react/ui/Text.Label/-test/-spec.test.tsx src/ui.react/ui/Prose.Manuscript/-test/-.test.ts src/ui.react/dev/-test/-exports.test.ts
deno task check --quiet
```

This is real-suite/controller proof plus the existing React tests, not fresh browser/computed-paint,
worker, template, generated-artifact, or owner-suite proof. No Git mutation was performed; plan
records stay separate from the seven-file source/test unit.

## Anchor attachment proof

Against `f2a31856b`, the pre-retirement five-source-file proof included Anchor's specimen/debug
pair, its existing examples/sample test setup, and one short real-suite lifecycle test. The
synchronous factory, signal identity, defaults, storage key/fields and legacy examples precedence
remain intact. Shared projection retains deletion of legacy flags. One attachment owns theme,
initial traceline/footer setup, and redraw; explicit undefined size preserves the prior size clear.
Footer rendering still reads the current theme as host chrome. Controls, Root, StandardLink, styles,
shared fixtures and public APIs are unchanged.

The initial migration retained existing examples/sample assertions; the later sample-suite pruning
is recorded below. Those suites install isolated storage before factory access and dispose
controller-owned hosts per test; the legacy-case loop also disposes each factory attachment before
seeding the next case. Reopened factories are hydration observations, not live persistence owners.
The actual-suite journey supplied migration-time ownership/wiring proof. Its subsequent retention
review below supersedes the initial judgment that its short length and fault sensitivity justified
keeping it. No fixture abstraction was added.

Pre-retirement execution from `code/sys.ui/ui-components`, after restoring all temporary controls:

```sh
deno task test --quiet --trace-leaks src/ui.react/ui/Anchor/-test
deno task check --quiet
```

- **12 suites / 98 steps / 0 failures**, approximately **6s**; the lifecycle journey took **23ms**.
- Exact five-source-file `deno fmt --check` and `git diff --check` passed.
- Exact-file lint exits **1** solely for three inherited sample-test findings:
  `no-inner-declarations` and two `require-await`. No suppressions or lint-policy changes.
- Omitting the shared projection failed the new journey: expected `Light`, received `Dark` storage.
- Moving the theme effect outside the attachment failed the retired observation equality.
- Omitting redraw tracking failed the attached redraw assertion: expected **2** to exceed **2**.
- All three controls were restored before that full test/type-check/format run.

### Retention decision and post-retirement proof

The human rejected permanent configuration-preservation assertions and authorized retirement of
`src/ui.react/ui/Anchor/-test/-spec.test.tsx`. The file was removed, not hidden in another test or
helper. No helper was exclusive to it: the unchanged `specimenFixture` still serves ActionProbe. The
retained four-file source unit is Anchor's specimen/debug pair and its existing examples/sample test
adaptations. Those existing assertions protect controls, persisted preferences, and legacy
normalization; no new permanent test was retained.

The playbook now defaults ordinary migrations to temporary actual-suite proof, justified permanent
coverage by exception, and proof recording/removal/reverification before the same-pass handoff. This
deliberately gives up ongoing per-Anchor lifecycle-wiring coverage; owner tests prove the mechanism,
not that consumer's wiring. The executed probe and negative controls above remain historical
migration evidence, not part of the retained test count.

After retirement, from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks src/ui.react/ui/Anchor/-test
deno task check --quiet
```

- **11 suites / 97 steps / 0 failures**, approximately **8s**, with leak checks.
- Package type-check, exact four-source-file formatting, and `git diff --check` passed.
- Exact four-file lint exits **1** only for the same three inherited sample-test findings.
- No new fixture, source suppression, package/configuration change, or orphaned probe import
  remains.

This is historical actual-suite proof plus fresh retained React regression checks, not fresh
browser/computed-paint, worker, generated-artifact or owner-suite proof. Same-thread review, not a
new blind review. No Git mutation was performed; the opening arc remains the landing ledger and plan
artifacts remain separate from the four-file source unit. Bullet and BulletList were not changed.

### Sample-suite retention review

The human then authorized a TMIND review and pruning of the existing
`Anchor/-test/-spec.samples.test.tsx`, not just retirement of the new lifecycle probe. Same-thread
review compared the sample assertions with `Anchor/-test/-ui.Link.test.tsx`, `-ui.mono.test.tsx`,
`-ui.truncate.test.tsx`, and `ui.react/dev/m.Link/-test/-ui.test.tsx` and
`ui.react/dev/m.List/-test/-ui.test.tsx`. This is not a blind review or a whole-package test audit.

The sample suite now has five cases rather than twelve:

- Native/semantic preset transitions clear incompatible persisted fields and switch real controls.
- Dev.Link resource choices preserve omitted defaults versus explicit opt-out through reopening. The
  Root-to-Dev.Link prop boundary earns an assertion because omission changes default behavior; this
  is not a cosmetic renderer-identity check.
- Exploration preferences survive preset changes and truncation toggles; reset restores the prior
  default preferences without copying a configuration catalogue into the test.
- Legacy hydration retains a non-default saved destination and supplies missing controls without
  inventing a width constraint.
- Single-sample typography controls do not alter either fixed comparison view.

Removed the complete preset table, exact separator spacing, two-column/class-name assertions,
repeated icon/CSS matrices, and duplicated list keyboard/selection exercises. Component and Dev
adapter tests retain their own behavior coverage. The sample suite no longer certifies every
preset's configuration; that is a deliberate retention choice. No assertion matrix was moved into a
helper. Existing TestReact disposal owns unmounting; tests use scoped disposal and the same shared
fixtures.

Three temporary controls failed independently in the reduced suite:

- Retaining `p.link` when a native preset is selected failed the persisted-link absence assertion.
- Clearing `p.maxWidth` when a preset omits it failed the preserved-width preference assertion.
- Treating resource `none` as omission failed the explicit resource-property assertion.

All controls were restored before final verification. Git diff inspection confirmed both
`Anchor/-spec/-ui.Samples.tsx` and `-ui.Root.tsx` unchanged. No component, shared fixture, package,
or lint-policy change remains from pruning.

Final execution from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks src/ui.react/ui/Anchor/-test src/ui.react/dev/m.Link/-test/-ui.test.tsx src/ui.react/dev/m.List/-test/-ui.test.tsx
deno task check --quiet
```

**13 suites / 105 steps / 0 failures**, approximately **7s**, with leak checks. The reduced sample
suite's five cases took **407ms** in that run. Package type-check, exact four-source-file
formatting, exact four-source-file lint, and `git diff --check` passed. The three inherited lint
findings in the sample suite disappeared with the removed code; no suppressions were introduced. The
earlier 11/97 result is an intermediate receipt, not the final retained-suite count.

### Test responsibility names

The human requested filename-only moves after pruning:

- `Anchor/-test/-spec.samples.test.tsx` → `Anchor/-test/-spec.subject-controls.test.tsx`
- `Anchor/-test/-spec.examples.test.tsx` → `Anchor/-test/-spec.view-mode.test.tsx`

The moved contents are unchanged from the pruning receipt. No additional test removal or production
terminology/storage change is included. Earlier filenames above identify the historical proof.

After both moves, `deno task test --trace-leaks src/ui.react/ui/Anchor/-test` passed **11 suites /
90 steps / 0 failures**, approximately **5s**. Package `deno task check --quiet`, exact
four-source-file formatting/lint, and `git diff --check` passed. The previous 13/105 run
additionally included the two unchanged Dev adapter suites; those were not rerun for filename-only
moves. Nothing was staged or committed.

The human then requested removal of redundant `void` from Anchor's block-bodied redraw callback;
`ctx.redraw()` remains non-awaited and the effect callback synchronous. The same Anchor test command
passed again at **11 suites / 90 steps / 0 failures**, approximately **5s**, followed by package
check and exact four-source-file formatting/lint. No additional refinement or Git mutation was
performed.

### Attachment factory shape

Anchor's factory now matches the authored UI template: destructure `attach` from a standalone
`Spec.attachments` declaration after `props`/`p`, keep local `listen`/`reset`, and return
`{ props, listen, reset, attach }`. The inline owner/API chaining and redundant `api` variable are
gone. Legacy flag deletion is unchanged from the source baseline: it removes `focusExamples` and
`linkExamples` after hydration normalizes them to `examples`. The view-mode legacy test retains
precedence and deletion assertions. The workbook records this factory shape and compatibility rule.

After the refactor, from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks src/ui.react/ui/Anchor/-test/-spec.subject-controls.test.tsx src/ui.react/ui/Anchor/-test/-spec.view-mode.test.tsx
deno task check --quiet
```

**2 suites / 9 steps / 0 failures**, with leak checks, followed by package check, exact
four-source-file formatting/lint, and diff checks. Earlier full Anchor 11/90 and expanded 13/105
receipts remain separately scoped. No Git mutation was performed.

## Bullet and BulletList attachment proof

Source baseline: `cf117701f`. The pair has separate ownership policies, not a shared implementation:

- Bullet keeps its synchronous ephemeral factory, existing signal defaults and reads, and no storage
  or reset API. `const { attach } = Spec.attachments()` owns only subject registration, theme and
  redraw. The subject still clears inherited size explicitly and uses grid.
- BulletList keeps its async factory, retained signals/store ref, storage key, fallback defaults,
  field-wise projection, and unrelated stored values. Its shared attachment generation owns
  automatic persistence. Subject registration, theme (including the existing light subject
  background), reactive width, and tracked redraw belong to one attachment per init with separate
  effect dependencies.
- Both use the standalone destructured `attach` shape. Component implementations and Root are
  unchanged. That pass retained existing BulletList control assertions while adapting setup to
  isolate storage and dispose host attachments. This records its scope, not a lasting justification
  for every retained assertion. The reopened factory is read-only/detached, not a second automatic
  writer.

### Temporary proof and controls

The temporary actual-suite file `src/-test/-bullet-attachments.migration.test.tsx` exercised both
factories through the real host/controller adapter. Bullet used host-only mechanics, without adding
storage to its factory. BulletList used the existing storage/projection/specimen fixtures unchanged.
The probes checked sync versus promise-returning setup, absence of detached automatic projection,
repeat-init replacement, size clearing/reactive width, tracked redraw, reset/disposal silence,
retained signal identity and state on reconnect, and retention of an unrelated stored field. This is
not a zero-storage-IO construction guarantee.

The first combined run exposed a probe error: a guessed literal key did not observe the package's
actual display-name-derived storage key. The probe was corrected to use `STORAGE_KEY.DEV`;
production behavior did not change. After correction and again after restoring all controls:

```sh
deno task test --trace-leaks src/-test/-bullet-attachments.migration.test.tsx src/ui.react/ui/Bullet/-test src/ui.react/ui/BulletList/-test
deno task check --quiet
```

From `code/sys.ui/ui-components`: **10 suites / 34 steps / 0 failures**, approximately **4s**, plus
package check and exact five-source-file formatting.

Four controls ran independently against the temporary proof and were restored through targeted
edits:

- Omit BulletList's theme projection: persisted theme remained `Dark` instead of `Light`.
- Nest an unmanaged Bullet theme effect without returning its cleanup: post-disposal
  host-observation equality failed.
- Omit BulletList redraw tracking: `expected 2 to deeply equal 3` after the font-size change.
- Omit BulletList's width effect: size remained width 180 after changing the width signal.

### Retention, final validation, and callback rule

The temporary file was removed in the same pass. No helper was added or changed, and no new
permanent per-specimen lifecycle test was retained. These ordinary migrations do not earn permanent
wiring matrices merely because their probes detect faults. The retained component/control suites
protect existing behavior, not every consumer's attachment wiring; the broader wiring proof is
historical.

The human clarified the arrow rule: expression bodies are allowed only when the entire arrow fits on
one formatted line; multiline expressions MUST use a block with explicit `return` when needed, even
for a single expression. Bullet's multiline JSX renderer now uses a block and explicit return.
BulletList's width effect remains `() => void ctx.subject.size([p.width.value, null])`; short test
hooks/callbacks retain expression bodies. Multi-statement tracking/redraw keeps a block without
redundant `void ctx.redraw()`. Workbook rule 8 explicitly prohibits multiline expression-bodied
arrows and requires checking the formatted diff. This supersedes the earlier, insufficient "blocks
only for two or more statements" rule. The storage-free `Spec.attachments()` shape remains.

Final retained validation from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks src/ui.react/ui/Bullet/-test src/ui.react/ui/BulletList/-test
deno task check --quiet
```

**9 suites / 32 steps / 0 failures**, approximately **3s**, with leak checks. Exact five-source-file
formatting and `git diff --check` pass. Exact-file lint reports six inherited diagnostics: Bullet's
React import (`verbatim-module-syntax`), BulletList's promise-returning factory (`require-await`),
and four async React act callbacks (`require-await`). No new suppression, dummy await, or policy
change. No fresh browser/computed-paint, owner-lifecycle, worker, template, or generated-artifact
run is claimed. The opening arc alone records landing. No Git mutation was performed; pause with the
human before expanding the cohort.

## Playbook review adjudication and renderer follow-up

The human supplied an independent DMIND review against `591948541`. Its report inspected source and
history but ran no tests or probes; reviewer runtime identity was not verified. Its three bounded
findings were accepted after source/document inspection:

- Older template/ActionProbe callbacks conflict with current form requirements. Workbook rule 8 is
  authoritative for new work; those sources are delimited as ownership examples, and the earlier
  block-bodied `void` discussion is explicitly superseded. No template or ActionProbe change is
  authorized by this correction.
- The pair's unchecked row and stale next-unit narrative obscured the stopping point. The opening
  arc now records its verified landing. At the human's subsequent request, one complete specimen
  checklist sits directly below the arc, followed by the re-entry boundary and workbook; the pilot
  and remaining-specimen group headings were removed without changing dispositions. Repeated
  completed-unit commands/results live here, with concise contract summaries in the plan. The
  remaining 56 candidates still require human selection before expansion.
- Historical assertion preservation is not retention authority. Workbook rule 4 remains unchanged.
  The cited BulletList separator/heading assertions and Anchor view-mode style/spacing assertions
  have not been adjudicated individually as lasting requirements or pruned. Their survival is not an
  S-tier attestation; any already-landed test cleanup requires separate consumer authorization.

The ownership model, temporary-proof default, fixture boundary, and exception stopping rule are
unchanged. This disposition does not claim independent reproduction of historical negative controls.

The human separately authorized one source follow-up: Bullet's multiline named object renderer uses
`render() { return (...); }`, not `render: () => { ... }`. Workbook rule 8 now distinguishes named
object methods from anonymous callbacks: short expression arrows stay on one line; multiline named
object callbacks use methods; anonymous multiline callbacks still use block-bodied arrows. Preserve
lexical `this`/`arguments` contracts rather than silently changing behavior during conversion. The
follow-up was initially proposed as
`refactor(ui-components): use method syntax for Bullet specimen renderer`. Subsequent Git
reconciliation established that the pair's reachable landing includes it; the plan preserves that
scope mapping rather than a fictitious pending commit. No other source or test changes were part of
the callback-form pass.

Follow-up validation from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks src/ui.react/ui/Bullet/-test
deno task check --quiet
```

**1 suite / 1 step** passed, along with package check, exact renderer-file formatting/lint, and diff
checks. The retained Bullet test is a component smoke test, not a fresh actual-suite lifecycle
probe. Source inspection confirms the one-line method-syntax change uses neither `this` nor
`arguments`. No tests were added or removed. Documentation checks preserve the canonical opening
block despite the formatter's conflicting identity-header output. No Git mutation was performed.

### BMIND pause reconciliation

At reachable HEAD `6d4d9c028`, the inspected five-file commit contains the Bullet/BulletList
attachment migration, disposable control-test setup, and Bullet's `render()` method correction. Its
exact subject remains
`fix(ui-components): bind Bullet and BulletList specimen effects to attachments`. The opening arc
was repaired from the earlier observed `591948541` identity; that earlier hash in the supplied
review above identifies its historical review baseline, not current landing authority. All other
checked arc identities match the inspected reachable history. The component worktree matches HEAD
and the index is empty. Plan/evidence edits remain uncommitted workflow records; unrelated
dirty/untracked work was left untouched.

The return point is human selection of a bounded unit from the 56 remaining candidates, then fresh
source/ownership assessment under the workbook. No next cohort is authorized. This reconciliation
ran no tests, changed no source, and performed no Git mutation; prior runtime receipts retain their
original scopes. The setup-and-learning milestone establishes a reusable process, not completion or
pre-approval of the remaining inventory or deferred template/test cleanup.

## Button family attachment proof

Bounded unit: `fix(ui-components): bind Button family specimen effects to attachments`, selected and
authorized by the human after its ready check. Baseline HEAD was `7538076c8`; inspected component
paths were clean before this pass. Scope is Button, Buttons.Icons, and Buttons.Switch only, plus
Button's affected reset/view tests. No component implementation, dependency, public API, template,
ActionProbe, or sibling-consumer test changed.

- All three factories remain synchronous. Button and Icons retain hydration/storage keys and
  field-wise projection, now in `Spec.attachments({ shared() { ... } })`. Button retains legacy view
  fallback, false/zero values, reset signal identity, and serializable fallback for transient
  enabled/opacity callbacks. Unrelated stored fields survive projection.
- Switch uses `Spec.attachments()` without persistence/reset. Its theme-name signal, independent
  color selection, derived palette getter, update method, and controlled toggle remain intact.
- Each actual suite attaches its existing explicit size clear, grid, renderer, theme background, and
  tracked redraw. Button/Icons retain subject-Light alpha 1; Switch leaves subject paint untouched.
  Theme and redraw dependencies remain separate. Named multiline renderers use methods; the short
  Icons click logger uses an expression arrow. Independent React redraw hooks are unchanged.

### Temporary proof and restored controls

The temporary `src/-test/-button-attachments.migration.test.tsx` imported the actual three suites
and used existing storage/projection/host fixtures, not reconstructed attachment wiring. It covered
inert construction (projection attempts, not a zero-storage-IO claim), synchronous setup, same-host
replacement, controller reset/load retirement, disposal, reconnect without rehydration, retained
signal refs/state, and detached paint/redraw/projection inertness. Button/Icons also exercised two
contexts sharing one automatic projection, last-detach behavior, and unrelated storage fields.
Consumer-specific observations included Button's callback normalization/view forwarding, selected
Icons renderer, and a mounted actual-suite Switch toggle plus palette changes. These are migration
receipts, not retained layout/renderer-identity contracts.

Initial probe development found nullable JSON result types and an incorrect white-Light-host
assumption. Source inspection confirmed the Light host restores the harness's faint tinted default;
the probe was corrected without changing production paint. The real toggle logger was temporarily
captured only around the probe click to avoid dumping the DOM event; it was restored in `finally`.

Each negative control was run independently, then restored before the next:

1. Button persisted `defaults.enabled` instead of its normalized live value: retained reset coverage
   failed the serializable false/zero snapshot equality.
2. Icons persisted `Close` instead of the selected icon: actual-suite probe failed
   `expected 'Close' to deeply equal 'Settings'`.
3. Switch redraw read only theme instead of `debug.listen()`: actual-suite probe failed
   `expected +0 to deeply equal 1` on an enabled change.
4. Button theme spawned an unmanaged nested effect: actual-suite probe failed detached context
   property equality after retirement. This detected paint activity even without a redraw event.

After restoration, combined proof with the final retention edits passed **12 suites / 107 steps**:

```sh
cd code/sys.ui/ui-components
deno task test --quiet --trace-leaks --reporter=dot src/-test/-button-attachments.migration.test.tsx src/ui.react/ui/Button/-test src/ui.react/ui/Buttons.Switch/-test
```

### Retention and verification boundary

Button reset tests retain three behavioral contracts: serializable false/zero persistence, repeated
reset without signal replacement, and transient callback normalization/reset. Button view tests
retain four: legacy single-view hydration, keyboard view cycling with persistence, and
control-driven opacity/availability in each view. They now use isolated storage and disposable real
host contexts; attachment calls remain visible in the tests. Removed the two theme-duplicated
cosmetic catalogue cases (labels, tag ordering, divider paint/geometry, trailing icon dimensions),
style-only checks, exact variant-count requirements, and a redundant direct availability case; its
ARIA observation lives in the existing control journey. No new helper or permanent lifecycle matrix
earns retention. Switch's existing palette/interaction tests remain unchanged.

Removed the temporary probe with the wrapper-owned remove tool. Final retained revalidation passed
**11 suites / 104 steps**, with leak checks enabled:

```sh
cd code/sys.ui/ui-components
deno task test --quiet --trace-leaks src/ui.react/ui/Button/-test src/ui.react/ui/Buttons.Switch/-test
deno task check --quiet
```

Package check, formatting of all eight changed source/test files, lint of the six files without
baseline findings, and `git diff --check` passed. Full scoped lint reproduced exactly the three
baseline findings: Icons' React type-only import and JSX attribute braces, and Switch's JSX child
braces. No suppressions or lint-policy edits were introduced. The plan's canonical identity header
is preserved despite conflicting formatter output; do not report full-plan formatting green.

Removing the probe trades ongoing per-consumer lifecycle wiring checks for the executed evidence
above; owner tests still do not prove these consumers' wiring. No fresh browser campaign or
independent review is claimed. The consumer inventory records nine verified adoptions and 53
remaining candidates; the opening arc still owns landing truth. No Git mutation was performed;
plan/evidence remain separate workflow artifacts, unrelated dirty/untracked work was left untouched,
and the other 53 consumers require human selection before expansion.

### Button renderer tidy-up

At the human's request, Button now follows the current UI template's suite-local `Root()` boundary:
attachment configuration uses `render: () => <Root />`; signal projection and event forwarding live
in that component. The existing single/variants Root is imported as `ButtonRoot`, unchanged. No new
test or helper was added. The removed migration probe remains absent; its package-root location was
too broad for consumer-specific proof, even temporarily. Future such probes belong beside the
selected consumer tests.

After extraction, Button's reset/view tests passed **2 suites / 7 steps** with leak checks; package
check and exact-source formatting/lint passed. This is a structural refactor, not a new behavior
contract, so no red test was introduced. These retained tests exercise the debug/view contracts, not
the actual-suite renderer boundary; earlier lifecycle receipts predate this extraction. No new
browser run or blind review is claimed.

### Blind-review adjudication: non-vacuous availability proof

The human supplied an independent review against `7538076c8` with one P2 finding: live-DOM-derived
expected lengths let disabled/inactive disappearance pass as empty-array equality and vacuous
`.every()` checks. Accepted after source inspection. The reviewer reported no production-wiring
blocker; reviewer runtime/model identity was not independently established.

Button's view test now captures a positive button count after selecting the view and uses that
stable count for later opacity expectations, without fixing the example catalogue at five. Two
separate temporary faults in `Button/-spec/-ui.Root.tsx` were executed: returning null when enabled
is false failed both views at the `0.3` expectation; returning null when active is false failed both
views at the `1` expectation. Both faults were restored; that source file has no residual diff. No
new test/helper or lifecycle matrix was added.

After restoration, the scoped Button/Switch tests passed **11 suites / 104 steps** with leak checks.
Package check, exact-eight-file formatting, corrected-test lint, and diff checks passed. The three
previously recorded inherited lint findings remain outside this correction. This closes the P2 with
executed sensitivity proof; it is not a second blind review or a fresh browser/lifecycle campaign.

### Family-wide Root consistency

The human subsequently requested the template's suite-local `Root()` pattern for every suite in this
change set. Icons and Switch now match Button: subject configuration uses `render: () => <Root />`,
with projection/selection and event handlers inside the stable local component. Effects, sizing, and
theme arguments are unchanged. No hooks, tests, or helpers were added. Package check and
formatting/lint of all three suite files passed; retained Button reset/view and Switch theme/toggle
checks passed **4 suites / 14 steps** with leak checks. These checks do not execute the actual-suite
Root boundaries; no fresh lifecycle probe or blind review is claimed.

## Dist and Dist.Browser attachment proof

Bounded unit: `fix(ui-components): bind Dist and Dist.Browser specimen effects to attachments`.
Implementation baseline HEAD was `06258c98c`; the component worktree was clean. The intervening
crypto commit was unrelated and untouched. Scope is the two specimen/debug pairs and one local
sample-behavior test. Component/controller code, synthetic data, dependencies, owner APIs, and other
consumers are unchanged.

Both async factories retain initial in-memory sample normalization before resolving, without
starting automatic projection or a permanent effect. `shared(e)` owns two independent effects
through `Signal.listeners(e.life)`: sample synchronization first, field-wise persistence second. The
shared callback itself does not read reactive values. Factory-local last-driver snapshots survive
shared generation teardown: unchanged-driver reconnect preserves explicit data, while pending driver
changes reconcile on acquisition unless a later explicit selection has acknowledged them. Dist
retains both files-mode and debug-view drivers; Browser retains files-mode alone. Theme/debug/direct
data changes do not regenerate samples. The shared storage key, unrelated and Dist-only fields,
signal identity, reset, and existing no-op `updateDist` member remain.

Both suites use stable local Root components. Browser's existing selection/filter controller stays
inside React; no second hook or attachment-owned React state was introduced. Explicit sizes, grid,
numeric Light subject paint argument 1, toolbar, previews, and callbacks remain. Theme and tracked
redraw are attachment-owned; the duplicate imperative initial redraw path is removed.

### Temporary actual-suite proof and controls

`Dist/-test/-attachments.migration.test.tsx` contained four temporary steps: one real-suite journey
per specimen, shared-key field preservation, and mounted actual Browser Root interaction. Existing
fixtures supplied storage/controller mechanics only. Proof covered inert construction/projection,
async return and normalization, same-host replacement, two-host continuity and last-detach,
reset/load/disposal retirement, retained refs/data without rehydration, changed-driver reconnect,
detached sample/projection/redraw/paint inertness, and reset. The mounted probe used the imported
subject renderer with a React redraw wrapper, exercised pointer selection and the filter input, and
checked state/DOM identity through a debug redraw. It captured/restored the logger in `finally`.

Probe development corrected three observation assumptions, not production behavior: context size is
a normalized object rather than the setter tuple; numeric Light subject paint remains 1 in context;
and the imported suite retains its factory across runs, so the mounted journey seeds in-memory data.

Four independent controls failed as intended, each restored before the next:

1. Removed Browser's unchanged-driver guard: retained sample test failed because reconnect replaced
   explicit undefined with a sample.
2. Removed Browser's persistence effect: actual-suite probe failed `expected +0 to deeply equal 1`
   for a debug-change projection attempt.
3. Removed Dist's `e.life` binding from nested listeners: actual-suite probe failed explicit data
   identity after detached driver mutation, detecting escaped synchronization.
4. Omitted Dist's debug-view comparison: retained sample test failed because a view change left
   explicit undefined instead of regenerating the selected inventory.

Restored combined proof passed **3 suites / 9 steps** with leak checks:

```sh
cd code/sys.ui/ui-components
deno task test --quiet --trace-leaks src/ui.react/ui/Dist/-test
```

Owner attachment/admission/retirement revalidation separately passed **3 suites / 99 steps** from
`code/sys.ui/ui-dev`, using its configured test task and the three existing owner suites. Owner
proof is not consumer wiring proof; no exception-safety expansion is claimed.

### Retention and final boundary

Retain only `Dist/-test/-spec.samples.test.ts`: initially two behavioral cases protected explicit
empty/custom sample selections versus automatic driver replacement, including unchanged-driver
reconnect; three review-closure cases were subsequently added below. These initial retention
judgments were narrowed by the final assertion-level reduction recorded below; sensitivity did not
justify every retained assertion. No layout catalogue, controller fixture, or retirement matrix was
introduced. The existing three-step sample-observation test remains unchanged and earned: empty
display data is not an admissible artifact; nonempty synthetic observations supply no trust or
payload verification evidence. No helper or package-root test was added.

Package check, five-file formatting, both suite files' lint, retained-test lint, and diff checks
passed before temporary-probe removal. Baseline scoped lint reported 13 findings; migration makes
Dist's previously unused debug-view read meaningful, leaving 12 inherited findings: two React
imports, two diagnostics on Browser's unused sample-mode import, two `require-await`, and six JSX
brace findings. No suppressions, dummy awaits, or lint-policy changes were added.

Removed the broad probe with the wrapper-owned remove tool, then reran
`deno task test --quiet
--trace-leaks src/ui.react/ui/Dist/-test`: **2 suites / 5 steps** passed.
Package check, exact-five-file formatting, lint of both suites and the retained test, and diff
checks passed after removal. Source inspection confirmed the restored lifetime bindings and driver
guards; no exclusive helper remains. The inventory records 11 verified adoptions and 51 remaining
candidates; the opening arc alone records landing. Plan body/evidence formatting preserves the
canonical identity header exception.

No browser-paint campaign, signing change, or Git mutation is claimed. Retired probes are historical
consumer-wiring evidence, not permanent coverage; owner tests do not replace that integration proof.
Other dirty/untracked work and recovery artifacts remain outside scope.

### Blind-review P2 closure

Accepted the human-supplied blind report's one material finding: a detached driver change followed
by an explicit selection was replayed on reconnect, incorrectly replacing that later selection. The
report's model/runtime identity is not established here; its supplied passing checks are not claimed
as this thread's reproduction. Its recommendation to preserve the ownership structure was retained;
no generic coordinator, owner API change, or second review pass was introduced.

Independent reproduction factored the existing button assignments through factory-local `selectDist`
commands without initially changing their behavior. Three added retained cases failed: both
factories' mode-change journeys and Dist's separate view-change journey replaced explicit undefined
on reconnect (`expected { …(4) } to equal undefined`).

`selectDist` now records current drivers before assigning data; both sample buttons use it, and
sample synchronization reuses it after the existing guard. Reset acknowledges its final restored
state through the same command. With only selection bookkeeping implemented, both mode journeys
passed all selection checks but failed reset object identity on reconnect. Adding reset
acknowledgement closed those failures. Retention reassessment identified the evidence limit: this
proved equivalent data was reconstructed, not that reset lost data or harmed a user. The final
reduction removes those identity/default-sample assertions rather than treating sensitivity as proof
of a lasting requirement.

The retained cases cover detached mode change → later undefined/Hello World/custom selection →
reconnect, persisted selection and mode, detached storage inactivity, subsequent regeneration, and
reset. Dist separately covers view changes with undefined/Hello World selections and persisted
view/data. No new helper or probe file was added. Both original consumer cases and all three
sample-observation steps remain.

Review-closure command, before final retention reduction, from `code/sys.ui/ui-components`:
`deno task test --quiet --trace-leaks src/ui.react/ui/Dist/-test` — **2 suites / 8 steps**, leak
checks passed. Package check, five-file formatting, suite/retained-test lint, and diff checks
passed. Inherited debug-file lint is unchanged. This closure executes factory commands with real
hosts; button forwarding was inspected in source, not freshly mounted. The previous
actual-suite/Browser receipts remain historical; no fresh rendering or broad owner-test reproduction
is claimed.

### Final assertion-level reduction

Applied workbook rules 4 and 6 to `Dist/-test/-spec.samples.test.ts`, not merely its line count:

- **Remove:** broad theme/debug/unchanged-driver preservation journeys, exact reset sample and
  sample-object identity checks, equivalent payload variants, detached-storage snapshot checks, and
  incidental seeded/projected fields. These do not earn a permanent specimen-shape or generic
  lifecycle suite. Their earlier executed proof remains historical.
- **Narrow and keep:** three command-order regressions—files-mode changes in both factories and
  Dist's separate view driver. A later explicit clear must survive reconnect and remove persisted
  data; a subsequent driver change must still load the selected sample. The factory-specific driver
  acknowledgement is not covered by generic attachment tests. This protects the debug command
  contract; it does not claim a freshly demonstrated detached UI interaction.

Each seed contains only the relevant driver and existing stored data. The latter makes a missing
clear projection observable rather than letting an already-empty store pass. Regeneration uses the
sample builder as the expected result of the selected operation, not a frozen inventory, default
appearance, reference identity, or independently verified artifact. No new helper was introduced.

Temporarily substituted the old direct `dist` assignment for `selectDist` in the test only. All
three steps failed on reconnect (`expected { …(4) } to deeply equal undefined`); restored the
command calls before final verification. Factories and suites were untouched in this reduction.

Final `deno task test --quiet --trace-leaks src/ui.react/ui/Dist/-test` from
`code/sys.ui/ui-components`: **2 suites / 6 steps** passed, including the unchanged three-step
sample-observation suite. Package check, retained-test formatting/lint, and diff checks passed. This
is implementing-thread retention adjudication and scoped proof, not another blind review or fresh
owner/rendering campaign. No temporary probe or control remains.

## Operational recovery

The retained example was:
`/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/workspace-1d744b7a51faa451/code/example`. Its
normal `deno task serve --port=1237` exposed `http://localhost:1237/?styles`. After the reporting
repair, its check/build and older completion/count smoke test passed, emitting
`dist/pkg/-entry.BJ_cc6xW.js`. That smoke test is weaker than the permanent full-record assertions;
the retained example was not refreshed for the later comment/type-only accumulator refinement.
Current temp-root existence and server state are not asserted by this historical receipt.

The copy tool initially denied the retained destination. After Pi-Driver DSL consultation, explicit
human approval, and restart, the active profile
`/Users/phil/code/org.sys/sys/-config/@sys.driver-pi/canon.yaml` granted shared sandbox write access
to that example's `src/-test/styles.browser` directory only. It was not a copy-only capability.
Review/remove this temporary grant separately with approval and reload; no profile change is part of
notes cleanup. Deletion of three superseded temporary roots was previously denied and human cleanup
was not confirmed; do not bypass the tool or delete the retained example by inference.

Recovery bytes remain outside commit scope:

- `.tmp/scoped-style-notes-cleanup.before-plan.md` and
  `.tmp/scoped-style-notes-cleanup.before-evidence.md`: full pre-compaction notes.
- `.tmp/scoped-style-adjudication.before-*` and `.tmp/scoped-style-final-assign.before-*`:
  adjudication and final helper/bundle baselines.
- `.tmp/scoped-style-closure.before-*`, `.tmp/scoped-style-closure.prefmt-*`,
  `.tmp/scoped-style-generated-route.before-*`, `.tmp/scoped-style-browser.before-*`,
  `.tmp/scoped-style-candidate.before-bounded-suite.json`, `.tmp/scoped-style-draft.*`, and
  `.tmp/scoped-style-prefmt.*`: earlier source, fixture, bundle, and formatting recovery.

Do not treat recovery artifacts as current tests or delete them as incidental cleanup. Reconstruct
runtime facts from source and fresh bounded checks when needed; this compaction ran no source tests,
builds, generators, or servers and performed no Git mutation.
