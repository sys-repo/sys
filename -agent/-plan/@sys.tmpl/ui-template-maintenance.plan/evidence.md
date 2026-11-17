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
