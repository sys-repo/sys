@sys.tmpl
ui-template-maintenance.plan.md
- [x] 1d532c559 fix(std): close signal listener registration on disposal
- [x] 19dc218dd fix(ui-dev): retire specimen attachments before reset publication
- [x] e608035ff fix(ui-dev): close specimen admission during retirement
- [x] fa683998e feat(ui-dev): own specimen attachment lifetimes
- [x] 519b15ea8 fix(tmpl): correct UI scaffold lifecycle ownership
- [x] 41db307d7 feat(ui-react): register stylesheet rules from React
- [x] 917bd0922 fix(tmpl): preserve scoped-style appearance across themes
- [x] 55d4cea12 fix(ui-components): isolate matching scoped styles without changing paint
- [ ] fix(ui-components): adopt verified specimen lifecycle ownership
- [ ] fix(ui-components): migrate remaining specimen lifecycle call-sites

## Specimen lifecycle migration inventory

Shallow scan at `ce341a391` found **62 specimen/debug pairs**: 54 UI specimens, one development
helper, one webfont specimen, and six samples. All 62 are registered by `src/-test/-specs.ts`;
filename discovery and the package-wide `Spec.describe` search found the same entrypoint set. Each
entrypoint was opened; debug factories were inspected selectively for obvious differences. No
`Spec.attachments` reference was found in the package source search. This establishes candidate
extent, not behavioral equivalence or a complete effect/resource audit. Recheck after source
changes.

These checkboxes track consumer disposition, not commit landing. An unchecked entry awaits
assessment or migration; check it only for verified adoption or a justified, source-reviewed
no-change outcome. Deferred work remains unchecked with its reason. Flags below are inspection
notes, not approved policy changes; absence of a flag does not establish equivalence.

Each directory below contains both `-SPEC.tsx` and `-SPEC.Debug.tsx`. The UI paths are relative to
`code/sys.ui/ui-components/src/ui.react/ui/`; the other paths have their own stated base.

### First pilot

- [ ] Text.Label — `Text.Label/-spec/`; retain controls, samples, fallback hydration, and traceline.
- [ ] Prose.Manuscript — `Prose.Manuscript/-spec/`; retain Light default and fill/grid layout.

### Remaining UI specimens

- [ ] ActionProbe — `ActionProbe/-spec/`; direct action persistence and reactive size-mode behavior.
- [ ] Anchor — `Anchor/-spec/`; host footer renderer and standard-link behavior.
- [ ] Bullet — `Bullet/`.
- [ ] BulletList — `BulletList/-spec/`; reactive subject width and real control coverage.
- [ ] Button — `Button/-spec/`; view/reset controls and event callbacks.
- [ ] Buttons.Icons — `Buttons.Icons/-spec/`.
- [ ] Buttons.Switch — `Buttons.Switch/-spec/`; derived switch palette; no factory persistence.
- [ ] Chip — `Chip/-spec/`; examples branch, overflow controls, and traceline.
- [ ] Cropmarks — `Cropmarks/-spec/`.
- [ ] Dist — `Dist/-spec/`; additional factory effect replaces sample dist data.
- [ ] Dist.Browser — `Dist/-spec.browser/`; sample-data effect and React browser controller.
- [ ] ErrorBoundary — `ErrorBoundary/-spec/`; error/reset callbacks.
- [ ] FadeElement — `FadeElement/`; reactive subject size; no factory persistence.
- [ ] Http.Origin — `Http.Origin/-spec/`; controller, controlled branches, and reactive width.
- [ ] Icon — `Icon/-spec/`; legacy `e.state` renderer and stub Debug; no signal factory.
- [ ] Icon.Swatches — `Icon.Swatches/-spec/`.
- [ ] IFrame — `IFrame/`; host-image effect and module-level `location`; no persistence.
- [ ] Image.Svg — `Image.Svg/`; reactive size and static/async imports; no persistence.
- [ ] KeyValue — `KeyValue/-spec/`; repeated size/update setup; existing action tests.
- [ ] KeyValue.Switches — `KeyValue.Switches/-spec/`; keyboard/cursor hooks and reorder callbacks.
- [ ] Layout.CenterColumn — `Layout.CenterColumn/-spec/`; column-sync effect and traceline.
- [ ] Layout.RectGrid — `Layout.RectGrid/-spec/`.
- [ ] Layout.SplitPane — `Layout.SplitPane/-spec/`.
- [ ] Layout.Tabs — `Layout.Tabs/-spec/`.
- [ ] Layout.TreeHost — `Layout.TreeHost/-spec/`; path-observer effect and nested slots.
- [ ] Media.AudioWaveform — `Media.AudioWaveform/-spec/`.
- [ ] Media.Config.Filters — `Media.Config/-spec.filters/`; direct debounced storage write.
- [ ] Media.Config.Slider — `Media.Config/-spec.slider/`; no factory persistence.
- [ ] Media.Config.Zoom — `Media.Config/-spec.zoom/`; debounced callback writes storage directly.
- [ ] Media.Devices — `Media.Devices/-spec/`; React selection-storage hook and narrow sizing.
- [ ] Media.Recorder — `Media.Recorder/-spec/`; direct writes, recorder/device hooks, stream.
- [ ] Media.Timecode.PlaybackDriver — `Media.Timecode.PlaybackDriver/-spec/`; factory starts a saved
      document load; separate loader/controller/deck lifetimes need inspection.
- [ ] Media.Video — `Media.Video/-spec/`; direct config writes, device selection, sizing.
- [ ] ObjectView — `ObjectView/`; optional factory-init callback; no factory persistence.
- [ ] Ownership — `Ownership/-spec/`.
- [ ] PathView — `PathView/-spec/`.
- [ ] Player.Video.Controls — `Player.Video.Controls/-spec/`; video signals and reactive width.
- [ ] Player.Video.Decks — `Player.Video.Decks/-spec/`; deck creation and separate URL-sync effect.
- [ ] Player.Video.Element — `Player.Video.Element/-spec/`; player signals, controlled/uncontrolled
      branches, and an additional factory synchronization effect.
- [ ] Player.YouTube — `Player.YouTube/-spec/`.
- [ ] Preload — `Preload/`; no subject renderer; explicit portal action; no factory persistence.
- [ ] Prose.Markdown — `Prose.Markdown/-spec/`; reactive viewport size and sample renderers.
- [ ] Prose.Measure — `Prose.Measure/-spec/`.
- [ ] Sheet — `Sheet/-spec/`; preserve showing/animation interaction; inspect snapshot mutation.
- [ ] Slider — `Slider/-spec/`.
- [ ] Spinners.Bar — `Spinners.Bar/`.
- [ ] Splash — `Splash/-spec/`.
- [ ] Text.Ellipsize — `Text.Ellipsize/-spec/`; reactive width; no existing harness-theme effect.
- [ ] Text.Input — `Text.Input/-spec/`; host background write is mixed into broad redraw effect.
- [ ] TreeView.Index — `TreeView.Index/-spec/`; extra path-observer effect and YAML-derived tree.
- [ ] TreeView.Index.Item — `TreeView.Index.Item/-spec/`.
- [ ] VimeoBackground — `VimeoBackground/`; ready callback retains player API.

### Other package-owned specimens

Paths here are relative to `code/sys.ui/ui-components/src/`. Registry label `SpecsExternal` does not
put these package-owned call-sites outside the agreed scope.

- [ ] Dev.Help.Markdown — `ui.react/dev/m.Help.Markdown/-spec/`.
- [ ] WebFonts — `m.webfonts/-spec/`; uses a separate specimen Root.
- [ ] CSS.Container — `-sample/-css-container/`; redraw effect has no signal reads; no persistence.
- [ ] CSS.Scroll — `-sample/-css-Scroll/-spec/`.
- [ ] React.useWebFont — `-sample/-css-useWebFont/`.
- [ ] React.usePointer — `-sample/-dom-usePointer/`; debug footer sample; no factory persistence.
- [ ] React.useSizeObserver — `-sample/-dom-useSizeObserver/`; bare rect; no persistence/theme.
- [ ] Std.Schedule — `-sample/-std-Schedule/`; factory schedules an async run before attachment.

The first unchecked commit is the Text.Label + Prose.Manuscript pilot. The following commit item
reserves the remaining inventory; refine its cohorts and landing units before later implementation.
It is not bulk-migration authority. Pilot acceptance does not complete the inventory or that later
item; these disposition checkboxes do not replace the opening commit ledger.

## Purpose and boundaries

Repair specimen lifecycle ownership and scoped-style interference independently, then migrate only
behaviorally equivalent consumers. Preserve Text.Label's subsequent behavior; do not restore its old
scaffold or intentionally removed unused stylesheet.

Repository: `/Users/phil/code/org.sys/sys`. The opening arc records landing, not blanket acceptance.
[Evidence and recovery](./ui-template-maintenance.plan/evidence.md) records bounded proof, accepted
limits, and source provenance. Planning, readiness, and review grant no implementation or
Git-mutation authority.

Owners stay separate:

- `@sys/std`: signal listener registration and closure.
- `@sys/ui-dev`: admission, retirement, and `Spec.attachments` composition.
- Debug factories: signal identity, defaults, storage projection, and persistence policy.
- `@sys/ui-react`: React timing adapter; `@sys/ui-css`: serialization, pooled sheets, and
  deduplication.
- `@sys/ui-components`: inventoried consumer adaptations, not a workspace-wide mechanical migration.

[template-dependency-parity.plan.md](./template-dependency-parity.plan.md) owns dependency
projections. Coordinate bundle writers, but do not mix dependency refreshes, controller redesign,
storage durability, global CSS/JSON engine changes, or visual standardization into this arc.

## Lifecycle contract

Authority: `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Spec/`, especially `t.ts`,
`u.attachments.ts`, and `-u.attachments.test.ts`. Use that owner rather than copying its machinery.

- `Spec.attachments({ shared? })` creates an inert factory-local owner. `attach(ctx, args)` returns
  a lifecycle and replaces only this owner's attachment to that context. Other contexts/factories
  stay independent. Closed admission acquires nothing and preserves an incumbent.
- The harness owns admission checks, retirement, shared-effect generations, reentrancy, and setup
  cleanup. Retirement precedes reset publication; successful load replacement retires the old
  specimen, while failed imports and normal completion retain it. Running callbacks are not
  cancelled, and completed writes are not rolled back.
- First attachment starts one shared effect; last detach releases it. Signals and the shared store
  reference survive detach. Debug factories supply storage projection, not registries or bus wiring.
- Each specimen uses one `debug.attach(ctx, { subject, effects })`. Keep theme synchronization and
  redraw separate: theme reads only `p.theme.value` and calls `Harness.Theme.background`; redraw
  calls `debug.listen()` and `ctx.redraw()`. Unrelated knobs must not overwrite custom host paint.
- Preserve subject sizing, margins, layout, renderer contracts, controls, callbacks, signal
  identity, storage keys/defaults, and controlled/uncontrolled branches. General types belong in
  shared barrels, not specimen-local `-t.ts` files.
- Persistence is attachment-scoped and best effort: hydrate once at creation, project retained
  values on first attach, avoid duplicate projection for additional hosts, and keep disconnected
  changes in memory until reconnect. Retained values win for specimen fields; reset preserves signal
  objects. Failed serialization may leave the cache ahead of bytes; unchanged reconnect guarantees
  neither retry nor durability.

### Lifecycle artifact evidence

`519b15ea8` retained an older bundle; `84dc7dd7b` later refreshed the six specimen/debug/type
entries and two dependency entries. Do not repeat the old stale-bundle claim or infer generated
entrypoint compatibility from parity alone.

The
[step-2 receipt](./ui-template-maintenance.plan/evidence.md#lifecycle-pilot-preparation-evidence)
now establishes the previously missing bounded artifact proof at `ce341a391`:

1. Authored/embedded parity passed for both UI templates, their specimen type barrels, and
   `tmpl.pkg/src/common/t.ts`, along with the existing style/barrel parity targets.
2. Named materialized `LifecyclePlain` and `LifecycleController` specimen/debug entrypoints and type
   barrels passed the generated package's declared check task against workspace-local owner APIs.
   The generated package configuration was unchanged; dependency localization used the existing
   `TmplTesting.LocalRepoAuthorities` seam.
3. No discrepancy required a template, bundle, or dependency change. The one-off probe was retired;
   published dependencies, browser paint, and generated controller replay safety remain unproven.

Historical lifecycle tests prove real-controller/dual-host behavior, rendering, fresh-worker
hydration, reset, and storage-failure handling. They do not prove browser paint, controller Strict
Mode replay safety, or storage durability. See the evidence record for retained substrate limits.

## Scoped-style contract

Authority: `code/-tmpl/-templates/tmpl.m.mod.ui/ui.tsx`, `use.Styles.ts`, and the registration hook
under `code/sys.ui/ui-react/src/use/use.StylesheetRule/`.

The original shared selector accumulated competing theme literals; pooled-rule deduplication meant
Light → Dark → Light could retain Dark's winning rule. Preserve isolated paint, not the defective
mixed-theme baseline.

- `D.displayName` is the template's sole component identity. Resolve the theme once in the root;
  pass `{ component, theme }` into `useScopedStyles`, and use the same identity on `data-component`.
  The helper returns `t.Style.Props`; public props remain `theme?: t.CommonTheme`.
- Keep theme-independent descendant declarations and theme-dependent root bindings separate. Compose
  `css(styles.base, scoped, props.style)` into the actual root, caller last. Every nested root
  redeclares its own values. This merges declarations, not existing class names. Arbitrary
  overlapping selectors from different component owners are not a promised isolation boundary.
- Each unconditional rule block owns its selector, private names, registration, and returned values.
  Derive names from `Obj.hash([component, selector])`, using lowercase `--scoped-${key}-*` keys for
  both definitions and `var(...)` references. Theme is not a key input. No dynamic hook loops.
- The fresh local `Object.assign` accumulator supports independently composable/removable blocks;
  deleting all blocks leaves an empty result. Source `satisfies t.Style.Props` checks compatibility,
  not dynamic key spelling, uniqueness, color validity, or definition/reference correspondence.
- Deleting optional styling removes its file, import, call, and composition argument without
  changing root identity or ordinary styling. No per-instance selector IDs, public tokens, global
  theme switches, extra registry, or pooled-sheet disposal.
- Canonical generated names are the input domain, not arbitrary selector text. Preserve the quoted
  attribute selector and `code` specificity **0,1,1**. `Pkg.toString` and camel-to-kebab conversion
  are not escaping utilities. The hash is transient and collision-possible, not a persistent
  identity.
- Preserve the template's isolated recipe: alpha **0.8 / 0.03 / 0.15** for
  foreground/background/border; monospace **600**, **0.85em**, line-height **1**, padding **[2,
  4]**, radius **4**, solid **1px** border. `Color.alpha` sets alpha; inheritance/currentColor or
  multiplying an existing alpha changes paint. Consumer-specific recipes must retain their own
  values.

### Registration versus isolation

`useStylesheetRule` delegates to `Style.Dom.stylesheet().rule` in a dependency-less
`useInsertionEffect` on each committed render. It accepts substrate values/arrays/options, discards
the receipt, and returns no cleanup. No render-time registration, local cache, subscription, theme
policy, arbitrary stylesheet text, or caller dependency array belongs in the hook.

Registration is additive/deduplicated, not replacement, rollback, cleanup, or A → B → A cascade
restoration. Inputs must remain stable through render/commit; mutations without a render are not
observed. Preserve substrate errors. Registration occurs before layout setup and not on abandoned
renders or SSR; this is not CSS extraction or a styled-server-paint guarantee. React 19.3.1
insertion effects are distinct from layout/passive Strict Mode replay; prove real remounts
separately.

Changing only the hook does not fix theme interference. Consumer adoption also needs root bindings
and composition, while preserving its identity, font loading, and original rule organization.

## Scoped-style acceptance

The final independent review and adjudication found no production blocker, required consolidation,
or blocking residue. Retain the ten-file test split: authored integration, named materialization,
initial-registration timing, isolated browser paint, report ownership, runner controls, and byte
parity have distinct failure boundaries. The final bounded proof passed **5 suites / 14 steps**,
generated runtime/check/build, and Chrome **56 complete comparisons**. Counts are historical
receipts, not fresh verification of later changes.

The human accepted the supplied Chrome/Firefox/Safari evidence and closed routine manual collection.
Additional repaired Chrome manual captures were not supplied; acceptance does not manufacture them.
The [evidence record](./ui-template-maintenance.plan/evidence.md#human-browser-acceptance) preserves
versions, report provenance, visual observations, and archival limits without committed PNGs.

One fixture limitation is accepted and deferred: receipt fetch in
`code/-tmpl/src/-test/styles.browser/ui.tsx` lacks timeout and active-run unmount cancellation; a
stalled receiver can leave controls busy. Optional correction belongs there and in
`-m.mod.ui.styles.runner.test.tsx`, with abort-aware timeout/unmount tests, not a new runner
abstraction. It does not invalidate completed comparisons or affect production styling.

Localized workspace dependencies, generated-only React deduplication, computed styles, human visual
acceptance, untouched generated configuration, and published compatibility remain separate claims.
No additional routine screenshot collection or blind pass is required absent a new concrete risk.

## Consumer migration: re-entry boundary

Before source edits, record the exact cohort: path, owner, existing behavior, proposed delta,
consumer-specific verification, and adopt/defer disposition. Text matches and landed template proof
do not establish equivalence. Keep lifecycle and style commits separate; obtain scope for divergent
policies. Empty cohorts may be removed only with human agreement.

Paths below are relative to `code/sys.ui/ui-components/src/ui.react/ui/`.

### Scoped-style cohort: ActionProbe and Prose.Manuscript only

Run the bounded style migration before the wider specimen-lifecycle migration. Its prerequisites are
`41db307d7` and `917bd0922`, not consumer attachment adoption or lifecycle artifact acceptance. The
`code/` filename inventory contains only the repaired template and these two `use.Styles.ts`
consumers; each consumer has one production hook caller. This is a two-owner boundary, not a
workspace-wide stylesheet migration.

- **Adopt ActionProbe styles:** `ActionProbe/use.Styles.ts` and `ActionProbe/ui.Probe.tsx`. Replace
  passive registration and ineffective stylesheet cleanup with insertion-phase registration and
  root-owned theme bindings. Preserve `${pkg.name}:ActionProbe`, code line-height **1.9**, all other
  isolated declarations, handlers, content, layout, and caller-last composition. Descendants such as
  `ActionProbe/-spec.samples/Foo.tsx` are behavior evidence, not a specimen-refactor target.
- **Adopt Prose.Manuscript styles:** `Prose.Manuscript/use.Styles.ts`, `Prose.Manuscript/ui.tsx`,
  and `Prose.Manuscript/u.styles/{mod.ts,u.init.ts,u.rule.code.ts,u.rule.headings.ts}` as needed.
  Apply the same registration/binding change while preserving `D.componentAttr`,
  `useFontBundle(ETBook)`, and separate heading/code declarations. Preserve code line-height **1**
  and h1's ETBook/Georgia/serif family, weight **400**, size **3em**, and line-height **1.1**.
- Allow necessary local/common import plumbing and focused consumer tests/fixtures. Keep hook calls
  unconditional in the React hook; declaration helpers must not hide hooks in arbitrary callbacks.
  Identity belongs to the component root independently of removable optional styling. No new shared
  styling framework, per-instance IDs, registry, or public styling API is needed.
- Exclude all specimen-lifecycle/persistence changes, Text.Label, other consumers, dependency
  refreshes, template/bundle regeneration, and unrelated cleanup. Remove obsolete style-only
  lifecycle machinery only within the two adopted consumers; do not change substrate ownership.

Consumer verification obligations:

1. Preserve independent pre-change isolated Light/Dark recipes as paint oracles. Compare actual
   consumer roots and code descendants, plus Manuscript headings; do not derive expectations from
   the new helper or use the template's line-height for ActionProbe.
2. Exercise both mount orders, Light → Dark → Light updates, real remounts, and nested same-owner
   roots in test fixtures. Prove complete relevant computed declarations and caller precedence, not
   merely rule registration, class names, or PASS counts. Do not add production test-only props.
3. Verify insertion-phase integration before child layout observation, unchanged root identities,
   Manuscript font loading, and independent rule-block removal/composition. Preserve existing
   ActionProbe activation tests and Manuscript API coverage; do not weaken assertions to pass.
4. Use focused `@sys/ui-components` tests and `deno task check`; use the established browser
   build/verified-Dist proof route for computed paint, with actual workspace consumer imports and
   explicit dependency authority. No bespoke server, permission widening, or infrastructure
   redesign. Record commands, results, and evidence limits; existing template receipts are not
   consumer proof. No routine new manual screenshot matrix is required.

The human accepted the completed 140-comparison consumer browser run as one-off migration evidence
and explicitly rejected retaining its multi-minute harness. Keep the fast consumer regressions;
remove the temporary generated-package browser harness and its dedicated task/permission preset. The
[consumer receipt](./ui-template-maintenance.plan/evidence.md#consumer-scoped-style-verification)
records the observed result, provenance, limits, and local recovery copies. This migration does not
add a permanent browser-build CI workload or require a repeat run merely to retire that harness.

### Lifecycle decisions: scope, persistence, and proof

The human agreed D1–D3 below. This is cleanup of ownership, not a return to the original template or
permission to remove a specimen's later behavior. Plan approval does not authorize implementation.

#### D1 — package inventory, then a two-consumer pilot

- Inventory devharness specimens throughout `code/sys.ui/ui-components` only. Start with a shallow
  scan for module names, exact specimen/debug paths, existing attachment use, and obvious
  exceptions. Do not solve every migration during discovery or claim filename/text matches prove
  equivalence.
- Migrate **Text.Label + Prose.Manuscript first** after preparation and implementation
  authorization. ActionProbe belongs to the remaining cohort, not this pilot and not a silently
  dropped exception.
- Inspect each candidate before changing it. Shared template ancestry is a starting point, not proof
  that current effects, storage, callbacks, or layout are equivalent. Bring policy differences to
  the human rather than mechanically replacing code.
- Learn a short repeatable workbook from the pilot, then apply it individually to later consumers.
  Keep it in this plan; no migration framework, automatic rewrite, or separate planning hierarchy.

Known surfaces and behavior to preserve:

- **Text.Label:** `Text.Label/-spec/-SPEC.tsx`, `Text.Label/-spec/-SPEC.Debug.tsx`, and
  `Text.Label/-test/-spec.test.tsx`. Retain controls, sample content/composition, selection,
  activation, storage key/defaults, legacy-field fallback, signal identity, grid layout, and host
  traceline. Adapt the existing persistence test to a live attachment without weakening its
  assertions. Do not reintroduce the removed stylesheet.
- **Prose.Manuscript:** `Prose.Manuscript/-spec/-SPEC.tsx` and
  `Prose.Manuscript/-spec/-SPEC.Debug.tsx`, plus focused consumer test coverage as needed. Retain
  the Light specimen default, fill/grid layout, controls, renderer, storage fields, and signal
  identity. Its existing API test is not lifecycle integration proof; production styles/font loading
  stay out of this change.
- **ActionProbe, later:** `ActionProbe/-spec/-SPEC.tsx`, `ActionProbe/-spec/-SPEC.Debug.tsx`,
  `ActionProbe/m.Signals.ts`, and `ActionProbe/m.Signals.persist.ts` are inspection surfaces, not
  pilot edit targets. `resultVisible()` and `reset()` write storage directly; the specimen also owns
  reactive size-mode behavior. Moving only its debug effect cannot establish disconnected storage
  silence. Resolve its policy before adoption without changing the public signal API by inference.

#### D2 — retain state, bound side effects

The pilot follows the existing lifecycle contract:

- Hydrate signals once when the debug factory is created, retaining current keys, defaults, fields,
  and fallback behavior. Create an inert attachment owner, not a long-lived persistence effect.
  Existing `LocalStorage.immutable` initialization may seed missing storage and reuse a cached ref;
  inert ownership does not mean zero construction-time storage IO or a fresh-registry guarantee.
- First attachment starts the shared preference projection; additional hosts share it. Last detach
  stops it. While disconnected, signal changes remain in memory without reactive preference writes.
- Reattachment projects the retained specimen values rather than reloading storage over them.
  Preserve unrelated stored fields. Persistence remains best effort, not retry or durability.
- Preserve signal objects across reset and detach/reattach; reset still restores the consumer's
  intended defaults. Retain controls, content, callbacks, layout, and attached redraw/theme
  behavior.
- Scope redraw and theme synchronization to their attachment and keep them separate. Unrelated knobs
  must not overwrite custom host paint. Detached silence covers attachment-owned effects; it does
  not cancel running callbacks or change React-owned hooks and direct actions automatically.

#### D3 — minimal, durable proof

The coverage below is an acceptance contract, not a repeated test matrix for every consumer:

- Keep lifecycle-mechanism coverage at its owner (`m.Spec/-u.attachments.test.ts` and the admission/
  retirement tests). Reuse the existing template lifecycle proof for shared template policy; do not
  copy its full dual-host, reentrancy, failure, or hydration matrix into each consumer.
- Prove actual consumer wiring through real specimen initialization and retirement, not only a
  manually attached debug factory. Use the smallest integration coverage that detects missing or
  escaped redraw/theme/persistence ownership and preserves each consumer's distinctive behavior.
- Cover the pilot's creation/hydration, first attach, shared-host continuity, last-detach silence,
  reconnect, repeat init/replacement, and harness reset/disposal across the appropriate owner and
  consumer layers. Explicitly distinguish harness reset from the debug reset control. Existing owner
  proof does not by itself establish that a particular consumer wires the owner correctly.
- Prefer extending existing tests. Retain strong control, default/fallback, serialized-preference,
  and signal-identity assertions. Observe actual storage bytes where persistence is the contract;
  when testing duplicate effects, count projection attempts rather than trusting deduplicated
  writes.
- Every added permanent assertion must pin a current behavior or wiring regression. Use narrow
  red/green or sensitivity evidence when practical; do not retain checks for obsolete code shape,
  copy-pasted mechanism suites, or a generic migration-test framework.
- Temporary migration probes may be removed with their unused setup after preserving necessary
  durable regressions and recording bounded evidence. Rerun affected tests after removal. A passing
  assertion is not itself a reason to delete it; retain the narrowest regression for a discovered
  bug.
- Use focused consumer tests and the owner check. Keep generated authored/embedded parity and named
  generated `-SPEC.tsx`/debug-factory type checks as separate artifact evidence, with dependency
  authority named. The step-2 receipt closes that artifact gap for its recorded baseline; it is not
  consumer implementation proof and need not be repeated if its inputs remain unchanged.
- No browser harness, permanent migration CI workload, dependency refresh, or bundle rewrite merely
  to establish this cleanup. Finish with a residue pass over touched files, tests, and fixtures.

#### Pilot file and proof boundary

Landing unit: `fix(ui-components): adopt verified specimen lifecycle ownership` covers Text.Label
and Prose.Manuscript only, plus the short learned workbook. The next arc item retains the other 60
candidate pairs; discovery flags are not authorization to redesign or mechanically migrate them.
Plan/evidence records stay separate from the source-code commit.

Planned source/test unit: seven paths under `code/sys.ui/ui-components/src/`:

- `ui.react/ui/Text.Label/-spec/-SPEC.tsx`
- `ui.react/ui/Text.Label/-spec/-SPEC.Debug.tsx`
- `ui.react/ui/Prose.Manuscript/-spec/-SPEC.tsx`
- `ui.react/ui/Prose.Manuscript/-spec/-SPEC.Debug.tsx`
- `ui.react/ui/Text.Label/-test/-spec.test.tsx` — extend existing controls/storage coverage.
- `-test/-specimen-lifecycle.test.tsx` — new bounded integration coverage for the two actual suites.
- `-test/u.fixture.specimen-lifecycle.ts` — thin controller/storage setup shared by the integration
  tests and Label's attached control test; no migration registry, production seam, owner-internal
  import, or copied lifecycle engine. Seven paths are a boundary, not a quota: omit unused fixture
  generalization.

Implementation constraints:

- Import `Spec` through each debug factory's existing `../../-test.ui.ts` barrel and expose the
  factory-local `attach`. Move the existing storage projection into `shared()` without altering its
  fields. Keep the promise-returning factory API, `props`, `listen`, and `reset` contracts.
- Replace unmanaged specimen effects with one attachment per init. Theme reads only `p.theme.value`;
  redraw listens to the same knobs as before. Do not add a second initial `update()` path.
- Text.Label's subject specifies `display: 'grid'` and its existing Samples renderer, with no size
  property. Preserve its initial `ctx.host.tracelineColor(0.03)` after theme setup and subsequent
  theme behavior. Later theme changes use `Harness.Theme.background` without reapplying the initial
  traceline override. The existing `Theme.signalEffect` lives in `u/m.Theme/mod.ts` under the
  devharness owner. Do not import the template's fixed size or clear an inherited size implicitly.
- Manuscript retains `size: 'fill'`, grid display, and its renderer. Omit margin to retain the
  existing harness default of **50** from `CtxPropsSubject.size`; do not substitute the template's
  centered size or other explicit margins.
- No changes to component UI/styles/fonts, Samples, storage keys, defaults/fallbacks, type barrels,
  package configuration, ActionProbe, the attachment owner, or templates/bundle are planned. If
  inspection reveals another necessary production delta or a behavior mismatch, report it first.

Minimal proof allocation:

- Keep all three existing Text.Label specimen tests and their assertions. Give the persistence/
  control case a live attachment; keep hydration and real composition coverage rather than replacing
  them with generic lifecycle checks. Explicitly install isolated storage before any store/factory
  access: `DomMock.init` does not replace global `localStorage`. Restore the global descriptor and
  monitored store methods during teardown; never touch ambient HOME-backed storage or manipulate the
  private registry.
- In the new integration file, exercise each actual imported suite through real controller init, not
  a handwritten imitation. One compact lifecycle journey per consumer should pin its subject
  configuration/rendering, attached redraw/theme/persistence, repeat-init ownership, retirement,
  detached silence, and reconnect with retained signal identity. Preserve unrelated stored fields.
- Exercise two-host sharing once with Text.Label, counting projection attempts before immutable
  deduplication, then retire the hosts independently. Do not repeat that machinery matrix for
  Manuscript. Check that unrelated knobs preserve custom host paint and retired signals cannot
  repaint a successor. Cover harness reset, replacement, and disposal across the small pilot suite,
  not every transition for every consumer.
- Add Manuscript's default/theme/debug-reset assertions within its integration journey; do not
  create another control suite. Keep its existing `-test/-.test.ts` API test unchanged and run it as
  a smoke check. Label's existing control/composition assertions remain its distinctive behavior
  oracle.
- Existing `m.Spec/-u.attachments.test.ts`, admission/retirement tests, and template lifecycle tests
  own reentrancy, closed admission, exception paths, general sharing, and storage-failure policy. Do
  not copy those tests or add fresh-worker hydration/browser proof for unchanged consumer policy.
- Demonstrate sensitivity to a missing shared persistence projection and an escaped specimen effect
  using the smallest restored negative controls. No permanent test should assert a particular call
  count or source spelling unless it is itself the observable contract.

Verification after authorized implementation, from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks src/-test/-specimen-lifecycle.test.tsx src/ui.react/ui/Text.Label/-test/-spec.test.tsx src/ui.react/ui/Prose.Manuscript/-test/-.test.ts
deno task check --quiet
```

Use exact-file fmt/lint for the seven touched files and `git diff --check`. The residue review must
exclude duplicate owner tests, redundant migration setup, weakening of old assertions, changed
component behavior, and inclusion of the one-off artifact probe. Record proof limits and update only
the two pilot inventory dispositions; the remaining 60 stay independently assessed.

#### Pilot workbook and review reconciliation

The pilot should leave only a short, evidence-backed workbook:

1. Inspect the specimen/debug pair and its helpers; identify effects, direct writes, and existing
   behavior assertions.
2. Assign each effect to the shared factory, one attachment, or its existing independent owner; stop
   for an unresolved policy difference.
3. Use `Spec.attachments` while retaining the consumer's additions; do not copy owner machinery or
   restore template boilerplate.
4. Prove consumer wiring and preserved behavior, then remove redundant migration-only setup and
   record the disposition in the inventory.

The inventory and file/proof boundary above prepare a two-consumer pilot, not a bulk migration.
Step-2 artifact evidence and the unchanged consumer-test baseline are recorded in the evidence file.
The supplied bounded review reported GO for preparation with no material blockers; reconciliation
retained the design and clarified storage isolation, margin/traceline preservation, and fixture
restraint. See the
[review receipt](./ui-template-maintenance.plan/evidence.md#pilot-preparation-review-and-reconciliation)
for provenance and limits. Review acceptance is not consumer adoption or a readiness verdict. A
readiness check and explicit implementation authorization remain separate; no consumer migration or
Git-mutation authority follows from this reconciliation.

## Execution discipline

- Reopen owning tasks and source before authorized work; preserve unrelated dirty files and recovery
  bytes. Use focused regressions and owner checks, not broad prep or dependency refreshes.
- Template bundle changes use inspected `code/-tmpl/-scripts/task.bundle.ts` through
  `deno task prep:bundle` from `code/-tmpl`. Preserve pre-write bytes and inspect exact entry
  deltas. `src/m.tmpl/-test/-u.makeBundle.test.ts` also rewrites the real bundle; do not run it
  casually.
- Keep generated setup, raw byte parity, emitted CSS, attached CSSOM, computed paint, and published
  compatibility as separate proof layers. Use the normal generated entry/build/verified-Dist route;
  do not revive the failed ui-dev `/@fs/` route, standalone app, broad preset, or Deno shim.
- Preserve the plan's identity header and exact-file formatting. Plan artifacts stay separate from
  source-code commits. No staging, commit, profile change, or temporary-root deletion is implicit.
- Review the retained-fixture profile grant separately at closeout; its path and recovery anchors
  are in the evidence record. This cleanup remains independent of scoped-style acceptance.
