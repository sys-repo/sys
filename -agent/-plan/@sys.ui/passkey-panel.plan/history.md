# Passkey implementation history

Supporting historical evidence for [passkey-panel.plan.md](../passkey-panel.plan.md), not a second
landing ledger or an alternative implementation contract. The governing plan's opening arc records
landing; live source and module contracts define behavior. Superseded designs below must not be
reintroduced merely because their tests once passed.

## Receipt provenance and limits

These notes consolidate records from the pre-reconciliation plan. Unless explicitly stated, their
exact dirty-worktree snapshots and full command arguments were not retained. A landing hash locates
the resulting implementation; it does **not** identify an isolated checkout used for the reported
checks. Do not promote those historical totals into fresh verification or reconstruct missing
invocations from current tasks.

The account increment has a separately bounded [execution receipt](./proof.accounts.md), including
its source baseline, attributable delta, exact commands, red/green outcomes, and limitations. No
runtime tests, browser checks, or external-source retrieval were performed by this documentation
reconciliation.

## Diagnostic baseline and presentation decisions

- The private scaffold is recoverable at `5f6ecc80d`; the diagnostic baseline landed at `08ccc7e82`.
  Its original execution record names baseline `a5af8f47e` plus the sample changes. Twenty-one panel
  cases first failed for missing rows/actions/status; subsequent scoped checks passed 2 suites / 23
  steps and module checks passed 11 suites / 98 steps. Those are historical worktree results, not
  authentication proof.
- A review led to an always-visible simulation qualifier. Human visual inspection subsequently
  removed that wrapper and selected sidebar-only `(simulated)` labeling, despite the sidebar being
  hidden below the harness's 950px breakpoint. The final baseline record reports 2 scoped suites /
  32 steps and 11 module suites / 107 steps after warning reuse. The earlier qualifier tests are
  superseded, not a requirement to restore disclosure in the subject.
- Operation's spinner retains DOM identity but collapses its layout space while idle. Pending
  reserves 24×3px before animation loading. Stable DOM identity never meant a permanent idle track.
- `1e48de614` refined debug labels and intent spacing; its historical record explicitly claims no
  new test execution. This is not a missing authentication increment.
- Shared Button keyboard/focus anchors are `857d419c3` and `721b9016c`. Source/DOM inspection did
  not establish actual panel focus visibility, measured contrast, keyboard-generated behavior, or AT
  announcements. Shared defects remain owner-level work, not panel-local shims.

## Scaffold, navigation, and context ownership

The scaffold landing `429560650` included the Hello-world integration specimen, lazy secondary
routing, reciprocal links, host reference, context-owned debug effects, and tests. Hello world was
that stage's boundary, not the required subject after integration composition.

- Initial routing checks ran red before secondary destinations were resolved. A worktree based on
  `1e48de614` then passed 2 suites / 7 routing/integration steps; its module run also exposed two
  stale fixture-label assertions. That intermediate module failure was not a clean final result.
- Reciprocal-link cleanup passed 4 scoped suites / 41 steps and 13 module suites / 116 steps.
- The context-lifetime regression failed five cases before correction. Both specimens had retained
  debug state beyond the context that disposed its persistence. Context-owned state/effects then
  passed 5 scoped suites / 46 steps and 14 module suites / 121 steps. The record names
  `deno task test --trace-leaks ./-sample/passkey/ui/-test/` and `deno task test`, from
  `code/sys.ui/ui`, plus module check and publication dry-run. The exact final dirty snapshot was
  not captured independently of the landing.
- Those cases exercised cached-suite identity, re-entry, concurrent contexts, persistence cessation,
  live-context reload, theme restoration, fresh fixture/intent state, and registered subject/footer
  rendering. They did not prove browser reload/Back behavior or authentication lifecycle.

### Template observation is historical, not a current defect verdict

At `429560650`, these template files discarded effect disposers:

- `code/-tmpl/-templates/tmpl.m.mod.ui/-spec/-SPEC.tsx`: redraw/theme effects.
- `code/-tmpl/-templates/tmpl.m.mod.ui/-spec/-SPEC.Debug.tsx`: appearance-persistence effect.

Read-only historical inspection confirmed that source shape during documentation adjudication. At
HEAD `c7e4d6686`, the **uncommitted worktree versions** instead contained `debug.connect(life)`,
attachment-owned effects, reset retirement, and first-attachment/last-detachment persistence
ownership. Suite-owned debug state itself still existed; the source change is not blanket proof of
correct lifecycle behavior.

[ui-template-maintenance.plan.md](../../@sys.tmpl/ui-template-maintenance.plan.md) owns the separate
repair and its harness prerequisites. No template tests were executed here and no candidate repair
was independently certified. Preserve passkey's existing context ownership; neither copy the
historical leak nor adopt the unverified candidate on the strength of this note.

## Shared links and original-item mappings

The prerequisite's completed snapshot is
`bc242cbd3:-agent/-plan/@sys.ui-components/link-grammar.plan.md`; `8e90efc8a` removed it. Its
closeout covered implementation and automated verification, not browser/AT acceptance. Do not copy
its internal arc into the passkey plan.

- The original local `refactor(ui-components): consolidate development link presentation` scope
  moved to that prerequisite.
- The original local `style(ui): refine passkey diagnostic labels` scope landed in
  `a19bbeb85 feat(ui): adopt shared Passkey links and refine specimen labels`. The labels became
  `(view:pure)`, `(simulated)`, and `Relying Party ID`; routing and state ownership remained local.
- `d59e35c31` synchronized fixture tests with explicit microtask waits, without production changes.
- `e0cee8f82` adopted Dev.List for fixture selection. This was presentation reuse, not account state
  or a new dependency of the remaining authentication work.

Historical W3C link/fragment inspections and supplied screenshots supported reference selection and
visible composition only. External publication metadata was not revalidated in this documentation
pass; it is not sample conformance or native navigation evidence.

## Composable sections and unconnected composition

`b3659c530` exposes the aggregate and independently renderable sections. The consequential choices
were narrow section inputs, stable surviving roots, one composition-owned progress location, and no
extra pending row in bare Actions. Human inspection rejected the earlier `Operation in progress`
caption because it duplicated Status and introduced height. Authored diagnostic captions use
sentence case; supplied values and action labels remain verbatim.

The section record includes behavioral reds for caption changes and title activity, plus an
empty-wrapper mutation that failed eight separator assertions. The final recorded section checks
passed 7 scoped suites / 76 steps and 16 module suites / 151 steps. Intermediate totals changed as
redundant or structurally coupled assertions were removed. They are not independent acceptance
claims for additional features. A supplied review against `d32c9930c` plus the section delta covered
an earlier lowercase snapshot, not all later copy/title refinements or browser behavior.

`5bb4c79dc` replaced the Hello-world integration subject with the existing `Passkey.UI`. Two
lifecycle tests failed against the scaffold before asserting the actual unconnected panel and
ordinary React rendering. The record reports 2 integration/lifecycle suites / 12 steps, 7 scoped
suites / 77 steps, and 16 module suites / 152 steps, plus check and publication dry-run. The
supplied Dark/debug-hidden screenshot supports displayed composition only. Unknown authentication,
idle operation, unavailable verifier, absent callbacks, and appearance-only reset are not a runtime
stub.

## Browser mechanism and contract-design consequences

`8ba1a4939` supplies invocation-local WebAuthn mechanisms, not a verifier or session owner. Its
initial red was a missing-export compile failure. The historical record reports 20 mechanism steps,
8 scoped suites / 97 steps, and 17 module suites / 172 steps, plus check/publication dry-run and a
scoped run with shuffle seed `3419`. Exact ambient descriptors were restored around deterministic
browser boundary doubles. No real ceremony or library interoperability was proved.

The later account increment established a UI-independent parent common/type lane and private wire
admission. Its [receipt](./proof.accounts.md) supersedes older account test totals. Review
consequences retained in the module contract include inspection not being a transaction receipt,
commit-time credential-state rechecks, safe observations separate from bearer grants, and native
required-member fidelity. Types and structural fixtures do not establish authentication or
atomicity.

SimpleWebAuthn 14.1.0 was investigated, including authentication source at
`01d1a640d5ded4fced0b45a9d806fd0ff44ad244`. The reported source behavior motivated explicit
verification policy and counter/version proof; it was not adoption or an executed integration test.
The premature dependency addition was removed. Verifier adoption remains a reference-service task,
and neither that investigation nor the design reviews proved the roughly 200-line service budget.
