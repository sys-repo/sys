@sys.tmpl
ui-template-maintenance.plan.md
- [x] 1d532c559 fix(std): close signal listener registration on disposal
- [x] 19dc218dd fix(ui-dev): retire specimen attachments before reset publication
- [x] e608035ff fix(ui-dev): close specimen admission during retirement
- [x] fa683998e feat(ui-dev): own specimen attachment lifetimes
- [x] 519b15ea8 fix(tmpl): correct UI scaffold lifecycle ownership
- [x] 41db307d7 feat(ui-react): register stylesheet rules from React
- [x] 917bd0922 fix(tmpl): preserve scoped-style appearance across themes
- [ ] fix(ui-components): adopt verified specimen lifecycle ownership
- [ ] fix(ui-components): isolate matching scoped styles without changing paint

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

### Lifecycle artifact evidence still required

`519b15ea8` retained an older bundle; `84dc7dd7b` later refreshed the six specimen/debug/type
entries and two dependency entries. Later materialized parity passed. Do not repeat the old
stale-bundle claim or infer generated-entrypoint compatibility from parity alone.

Before lifecycle artifact acceptance:

1. Establish current authored/embedded parity for both UI templates, their specimen type barrels,
   and `tmpl.pkg/src/common/t.ts`, retaining exact artifact attribution.
2. Type-check named generated `-SPEC.tsx` entrypoints as well as debug factories against the owner
   API. Existing authored checks and localized debug-factory checks do not establish this result or
   published compatibility; name the dependency authority used.
3. Scope any remaining discrepancy separately rather than folding it into a consumer style change.

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

Starting paths below are relative to `code/sys.ui/ui-components/src/ui.react/ui/`:

- **Text.Label lifecycle:** `Text.Label/-spec/-SPEC.tsx`, `Text.Label/-spec/-SPEC.Debug.tsx`, and
  `Text.Label/-test/-spec.test.tsx`. Preserve real controls, sample content, keys/defaults, and
  signal identity. The existing test expects persistence without attachment: explicitly adapt the
  test to a live attachment and add retirement/disconnected-storage assertions rather than weaken
  coverage. Do not reintroduce the removed stylesheet.
- **Prose.Manuscript lifecycle:** both files under `Prose.Manuscript/-spec/` named `-SPEC.tsx` and
  `-SPEC.Debug.tsx`. Preserve its Light specimen default, fill layout, and controls; establish
  attachment/persistence regressions rather than infer them from its API smoke test.
- **ActionProbe lifecycle:** `ActionProbe/-spec/-SPEC.tsx`, `ActionProbe/-spec/-SPEC.Debug.tsx`,
  `ActionProbe/m.Signals.ts`, and `ActionProbe/m.Signals.persist.ts`. Defer mechanical adoption:
  `resultVisible()` and `reset()` write storage directly, and the specimen owns reactive size-mode
  behavior. Moving its debug effect alone does not establish disconnected storage silence.
- **ActionProbe styles:** `ActionProbe/use.Styles.ts`, `ActionProbe/ui.Probe.tsx`, and descendants
  in `ActionProbe/-spec.samples/Foo.tsx`. Preserve `componentAttr`, line-height **1.9**, handlers,
  and caller composition; prove mixed/nested themes and updates without changing isolated paint.
- **Prose.Manuscript styles:** `Prose.Manuscript/use.Styles.ts`, `Prose.Manuscript/ui.tsx`, and
  `Prose.Manuscript/u.styles/{u.init.ts,u.rule.code.ts,u.rule.headings.ts}`. Preserve ETBook
  loading, heading/code separation, identity, and typography. Require consumer-specific paint proof.

The re-entry work is cohort/proof-plan review, not automatic migration. Preserve callbacks,
selection, content, layout, and state; stop at non-equivalence rather than silently redesigning a
consumer. Template acceptance does not close lifecycle artifact evidence or authorize consumer
edits.

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
