@sys.tmpl
ui-template-maintenance.plan.md
- [ ] fix(tmpl): correct UI scaffold lifecycle ownership
- [ ] fix(tmpl): preserve scoped-style appearance across themes
- [ ] fix(ui-components): adopt verified specimen lifecycle ownership
- [ ] fix(ui-components): isolate matching scoped styles without changing paint

## Purpose and separation

Design and prove two independent repairs to the UI templates, then migrate only equivalent copied
usages without changing specimen meaning or isolated appearance. The human separated this work from
`chore(ui-components): scaffold Text.Label primitive`; neither template repair nor consumer
migration is a prerequisite for that behavior-free scaffold. Baseline restoration is a separate
recovery step, not implementation of these repairs. Known baseline defects remain explicitly
deferred.

Repository: `/Users/phil/code/org.sys/sys`. Template owner: `code/-tmpl` (`@sys/tmpl` 0.0.489).
Inspected reference baseline: `97118f747383a7e4c4b786e9cb3b2dd00e196ce5`. Reopen live source and
history before execution; the experimental patch is not an accepted standard or a recoverable
baseline merely because its paths appear here. Planning grants no source-edit, generator, migration,
or Git authority.

The recovery thread owns removing only the attributable experiment and restoring Text.Label's
baseline specimen lifecycle while retaining justified scaffold adaptations. This thread owns only
this maintenance plan, not recovery, source, tests, the bundle, or `inline-label.plan.md`. The
experimental tests' later disappearance is intentional, not permission to recreate them. Before
implementation, obtain the recovery handoff through the human and revalidate the resulting source,
diffs, and ownership boundaries. No prep or full template tests during design refinement.

The first two items each include contract design, regression proof, and generated-source parity. The
proposals below select designs for review; they are not implemented or proven contracts. Consumer
items follow accepted template contracts, not experimental code. Their initial owner is
`@sys/ui-components`; inventory before editing, then refine bounded cohorts and commit decomposition
with the human. Do not invent edits to satisfy an arc row or silently absorb additional owners.

[template-dependency-parity.plan.md](./template-dependency-parity.plan.md) owns dependency
projection refresh, not these behavioral repairs. Both can affect the embedded bundle: coordinate
writers and attribute entries. Do not run broad prep or change dependency selection as part of this
work.

## Source and recovery anchors

Template source, relative to `code/-tmpl/-templates/`:

- `tmpl.m.mod.ui/-spec/-SPEC.tsx`
- `tmpl.m.mod.ui/-spec/-SPEC.Debug.tsx`
- `tmpl.m.mod.ui/ui.tsx`
- `tmpl.m.mod.ui/use.Styles.ts`
- `tmpl.m.mod.ui.controller/-spec/-SPEC.tsx`
- `tmpl.m.mod.ui.controller/-spec/-SPEC.Debug.tsx`

The six baseline files are recoverable from the reference commit above. The experimental patch
changed those files and their six entries in `code/-tmpl/src/m.tmpl/-bundle.json`.

Experimental test anchors, not instructions to preserve rejected assertions:

- `code/-tmpl/src/-tests/-m.mod.ui.lifecycle.test.tsx`
- `code/-tmpl/src/-tests/-m.mod.ui.styles.test.tsx`
- The added embedded/source parity case in `code/-tmpl/src/-tests/-m.mod.ui.test.ts`
- `code/sys.ui/ui-components/src/ui.react/ui/Text.Label/-test/-spec.lifecycle.test.tsx`

Text.Label adopted the candidate `connect` pattern in its `-spec/-SPEC.tsx` and
`-spec/-SPEC.Debug.tsx`. Restoring only the template would leave that adoption inconsistent. Its
optional stylesheet was removed because it had no consumer; do not restore it to pursue parity. The
evidence and reconstruction sequences below preserve the useful discoveries independently of those
experimental tests. No blind-review prompt or report is a plan artifact.

Substrate anchors:

- `code/sys/testing/src/m.client/m.Spec/TestSuite/TestSuiteModel.ts`: suite handler initialization
  occurs once; registered test handlers can run repeatedly on the same suite.
- `code/sys/std/src/m.Signal/u.effect.ts`, `u.listen.ts`, and `t.ts`: effect disposers, listener
  collections, dependency reads, and the existing `t.SignalListeners` contract.
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Theme/mod.ts`: theme-only helper and context
  paint.
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Ctx/Context.ts`, `Ctx.Props.ts`,
  `Ctx.Props.Host.ts`, and `Ctx.Props.Subject.ts`: real context state, redraw, and property writes.
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Bus/Bus.Controller.ts`: end-of-run flush and
  debounced pending-property flush; a redraw request is not itself a property flush.
- `code/sys.ui/ui-dom/src/m.LocalStorage/u.immutable.ts`: serialized persistence and the global,
  key-indexed immutable-ref registry; a new factory can reuse an existing cached ref.
- `code/sys/immutable/src/m.rfc6902/m.Immutable.cloner.ts` and `m.Events.ts`: unchanged projections
  emit no change event and therefore do not force serialized storage writes.
- `code/sys.ui/ui-css/src/m.Css.Dom/u.stylesheet.ts` and `u.rules.ts`: pooled sheets and
  complete-rule string deduplication, not instance-owned style removal.
- `code/sys/color/src/m.Rgb/u/u.format.ts`: `Color.alpha` sets alpha through `setAlpha`.

## Repair 1: specimen lifecycle and connection

### Baseline failure and useful candidate

The baseline `init` handler calls `Signal.effect(update)` without retaining its disposer. Repeating
init on one suite accumulates redraw listeners. `Harness.Theme.signalEffect` does bind its effect to
context disposal, but repeated init before disposal can still accumulate theme listeners. The debug
factory's persistence effect has no explicit disposer owner. It is created once per suite factory
invocation, not on every React remount; do not describe it as a per-remount persistence leak.

### Proposed ownership and persistence contract

Select connected-run ownership for these two template specimens. The suite owns retained signals;
the current run owns their persistence, theme, and harness-redraw effects. This intentionally ends
unowned background persistence, without discarding in-memory edits when a context is replaced. It is
a template-local policy, not a universal debug-storage contract.

- `listen()` reads signal values to establish dependencies in the surrounding effect. It does not
  subscribe independently, create an owner, or dispose anything.
- `connect(until: t.UntilInput): t.SignalListeners` creates a fresh listener collection, attaches
  the signal-to-store effect, and returns it for the specimen's other effects. It does not own or
  dispose the shared `LocalStorage.immutable` registry entry.
- The specimen is the single connection owner. Keep `life: t.SignalListeners | undefined` through
  the local type lane, dispose it before every replacement, and bind each new collection to that
  run's live `ctx.dispose$`. Do not infer the type with `ReturnType` or add a lifecycle abstraction.
- Late disposal of an old context must affect only its old collection, never a mutable reference to
  the replacement. Do not reuse a disposed collection or reconnect to an already retired context.

Persistence transitions:

- Creation: seed signals once from `store.current`; do not attach a signal persistence effect yet.
  Opening an absent storage key can still serialize defaults through `LocalStorage.immutable`.
- Connected: persist the existing stored fields from current signals. Preserve keys, defaults, and
  the controller's `controlled` field; do not reset or replace signal objects.
- Disconnected: mutations and reset change retained signals only. This specimen makes no storage
  writes, theme writes, or harness-redraw requests until connected again.
- Reconnection: project the retained signal snapshot into the existing immutable store; do not
  rehydrate over those signals. Retained values win for this specimen's fields if another writer in
  the same runtime changed that shared ref while disconnected. An unchanged projection may perform
  no serialized write: `Immutable.clonerRef` emits only for changed patches. Do not promise to
  repair raw-storage changes behind the cached ref. Cross-tab synchronization/conflict resolution is
  outside this repair.
- Reset: retain the current default values and signal identities. While connected, persist reset
  values; while disconnected, publish them on the next connection. Do not promise an atomic
  multi-field reset or one redraw for several assignments without separately proving that behavior.

A new debug factory in the same runtime is not independent hydration evidence:
`LocalStorage.immutable` returns the cached ref for an existing key before reading serialized data.
Prove serialization directly, then hydrate in a fresh runtime/registry with the same stored bytes.
Do not modify the production registry or add a public cache-reset API solely for this test.

### Rejected coupling

The experiment put `debug.listen()`, `Harness.Theme.background(...)`, and `ctx.redraw()` in one
effect. That broadens theme synchronization from theme changes to every debug signal, including
`controlled` in the controller template. `Theme.background` writes host foreground, background,
traceline, and the configured subject background; unrelated knob changes can therefore reset custom
paint.

Reproduction: initialize the specimen, set custom host/subject backgrounds through the real context,
then toggle `debug` or `controlled` without changing theme. Those backgrounds must remain unchanged.
Changing theme should perform the intended synchronization. Real context setters mark pending
changes; a fake host-call counter cannot establish the complete behavior.

Proposed init order: dispose the old connection, connect persistence, configure the subject, attach
one theme-only effect, then attach one all-signal redraw effect. Effects run initially; do not also
call an imperative `update()` before registering them.

- The theme effect reads only `p.theme.value` and calls `Harness.Theme.background(ctx, theme, 1)`.
  It does not call `debug.listen()` or `ctx.redraw()`.
- The redraw effect calls `debug.listen()` and requests `ctx.redraw()`. It does not write theme
  properties. Do not also install `Harness.Theme.signalEffect`, which owns a separate redraw.
- One changed knob assignment should produce one specimen-owned redraw request. This is not a claim
  about total React renders, controller-internal effects, or harness property-flush notifications.

Registration order establishes initial theme setup before the first redraw, not proof of every later
notification order. `Context.redraw()` dispatches a redraw event; it does not flush pending
properties. `Bus.Controller` flushes at run completion and debounces pending property changes. Prove
subsequent theme propagation through that real path, including the eventual rendered result; a
manually flushed context or a redraw counter alone cannot establish it. If correctness requires an
unproved subscriber order, resolve that dependency before accepting the design rather than adding an
ad-hoc scheduler or recombining the effects.

### Required proof

Reconstruct and strengthen the experimental sequence for both plain and controller specimens:

1. Seed serialized `debug: true` and `theme: 'Light'` before first opening the storage key; include
   `controlled: true` for the controller. Create one suite and initialize context A twice. A debug
   change should reach one current redraw owner and update serialized storage.
2. Assert the unrelated-knob background-preservation case above using real context properties. Prove
   initial theme setup and later theme propagation through the real controller/flush path after
   repeated init, with one specimen-owned redraw request per single changed knob.
3. Dispose A; mutate retained signals and reset them. Assert retired-context silence and unchanged
   serialized storage. Opening storage at creation is distinct from these prohibited later writes.
4. Reconnect with context B. Assert the same signal objects and retained values, and serialization
   when their projection changes the store. Include a conflicting snapshot written through the same
   immutable store while disconnected so retained-signal authority is exercised, not inferred. Also
   cover an unchanged reconnect without requiring a redundant physical storage write.
5. Replace B with context C before disposing B. Dispose B late, then mutate signals: C stays active
   and B stays silent. Repeated disposal is harmless; independent suites do not dispose each other's
   connections. Same-key storage conflict arbitration remains outside the contract.
6. Exercise connected reset and subsequent hydration in a fresh runtime/registry populated with the
   serialized reset bytes. Verify persisted keys/defaults, including `controlled`; a new debug
   factory sharing the cached ref is insufficient.
7. Render the controller specimen's controlled and uncontrolled paths, change the selector, and
   verify reset, signal identity, and propagation through the actual controlled adapter. Merely
   looping a plain-shaped fake context over two imported specimens is not controller-rendering
   proof. Do not silently expand this repair into controller-runtime changes if that proof exposes a
   separate defect.

The earlier tests used real suite models but fake context operations: redraw/host-background
counters, a captured Debug element, and a no-op subject renderer. They covered repeat init, stored
values, disposal silence, reconnect, reset, and late disposal of a replaced context. They did not
prove real background preservation, controller rendering, or serialized-storage hydration. Retain
useful seam assertions, but do not promote that evidence beyond its boundary.

## Repair 2: scoped styles without paint redesign

### Baseline failure and appearance contract

The plain template registers the same component-wide descendant selector with different theme
values. The shared sheet caches whole rule strings. Light then Dark leaves the newly inserted Dark
rule last; returning to Light does not reinsert an identical cached rule. Simultaneous instances can
therefore interfere. Identical remounts do not imply unlimited duplicate rules.

Preserve the intended appearance of a correctly isolated baseline instance, not a mixed instance
already contaminated by this defect. The baseline code rule is:

- background: `Color.alpha(theme.fg, 0.03)`;
- foreground: `Color.alpha(theme.fg, 0.8)`;
- border: `solid 1px ${Color.alpha(theme.fg, 0.15)}`;
- monospace, weight 600, size `0.85em`, line-height 1, padding `[2, 4]`, radius 4.

The candidate replaced foreground with `inherit` and background/border with currentColor mixes. That
changes both isolated foreground alpha and color authority. `Color.alpha` sets alpha, whereas mixing
an already-translucent color with transparent scales its existing alpha. Chip's currentColor recipe
is not evidence that this template has the same contract. Reject this visual redesign.

### Proposed style ownership

Select root-owned CSS custom properties as the design to falsify. `Style.Props` already supports
custom properties in `code/sys.ui/ui-css/src/m.Style/t.ts`; no shared CSS-engine extension is
needed.

- Resolve `Color.theme(props.theme)` once in `ui.tsx`. Put three component-specific internal custom
  properties on its existing root through render-local `css(...)`: the exact `Color.alpha` results
  for foreground, background, and border color. Compose caller style last as before.
- Keep the exact `[data-component="${D.displayName}"] code` selector and its specificity. The shared
  declaration reads those variables; retain the literal border width/style and every existing
  typography/spacing value. Do not introduce currentColor, color-mix, or inherited foreground.
- Each root supplies all three values, even when nested. Descendants resolve variables from the
  nearest root of that component; ordinary root/intermediate `color` overrides must not change the
  code palette. A direct code override follows the same cascade as the isolated baseline, without
  changing the theme authority for its other properties.
- Treat the variable names as internal plumbing, not a new public customization API. Do not add
  per-instance IDs, unique descendant selectors, a global theme switch, or a new style registry.
- `useScopedStyles()` registers invariant declarations after mount without theme dependencies.
  `initStyles()` needs neither theme input nor a fake lifecycle return. The sheet owns the cached
  rules; the component root owns the theme values. Keep this API change local to the template and
  its caller; copied consumers need separately reviewed adaptations.

### Design constraints

- Prove nested instances resolve their own values, including nested opposite themes and intermediate
  color overrides. Variables do not by themselves isolate overlapping selectors from different
  component owners; do not claim that broader behavior is repaired.
- The existing returned lifecycle does not remove stylesheet rules. Remove that misleading ownership
  as part of this repair; do not invent `sheet.dispose()` or remove a pooled shared sheet.
- Empty effect dependencies do not mean exactly-once registration. Remount and Strict Mode must be
  safe. An effect must not return the stylesheet object as React cleanup.
- Preserve typography, spacing, border, foreground authority, and existing override behavior. A
  broader visual standardization requires a separate human-approved proposal, outside this arc.
- HMR can retain cached rules. Use fresh baseline and candidate pages for comparisons; do not
  mistake contaminated runtime state for either implementation's isolated appearance.

### Required proof

Use actual `<code>` descendants, not the template's placeholder-only renderer. Compare baseline and
candidate in fresh browser contexts, recording computed styles and rendered appearance:

- isolated Light and Dark instances;
- simultaneous opposite themes in both mount orders and Light → Dark → Light transitions;
- root, intermediate, and direct code foreground overrides, including translucent colors;
- nested instances of the same component with opposite themes;
- remounts, Strict Mode, and the supported browser engines.

For mixed/nested/transition cases, compare each instance with a fresh isolated baseline of its own
theme, not the defective mixed baseline. Record computed foreground/background/border colors and
alpha, border geometry, typography, padding, and radius, alongside rendered comparisons. Exercise
winning direct overrides and inherited ancestor overrides separately.

Use a test-only descendant fixture that exercises the real root bindings and stylesheet; the public
placeholder component need not gain a `children` prop to make a test convenient. Keep a render test
of the production root's bindings as well. Bound shared descendant-rule growth independently from
render-local generated classes; do not assert that all CSS rule counts remain unchanged.

Before paint acceptance, identify the supported engine/version matrix and an authorized browser
execution surface with the human. Neither is established by this refinement; no browser result is
claimed. If that evidence is unavailable, leave this repair unaccepted rather than substituting a
DOM mock or broadening tool permissions.

Separate cache/declaration assertions from browser paint evidence. The experimental style test used
`strict: false`, rendered no code descendant, and asserted one cached `inherit`/currentColor rule
plus remount deduplication. Those assertions pin the rejected recipe; they are not a visual
acceptance test. Unavailable browser proof remains an explicit evidence gap, not a reason to relax
appearance.

## Bounded maintenance across copied usages

Inventory template-shaped specimens and scoped-style hooks before changing consumers. For each
candidate, record the exact path, actual subscription/style owner, baseline behavior, proposed
delta, verification, and adopt/defer disposition. Search results locate candidates; inspect their
full relevant implementation before classifying them. No bulk replacement based on matching text.

Known starting points in `code/sys.ui/ui-components/src/ui.react/ui/`:

- `Text.Label/-spec/-SPEC.tsx` and `Text.Label/-spec/-SPEC.Debug.tsx`: re-open after scaffold
  recovery; eligible for later lifecycle adoption only against the accepted pattern.
- `ActionProbe/use.Styles.ts` and `ui.Probe.tsx`: the locally copied hook returns `componentAttr` to
  its root. Its code line-height is **1.9**, not the template's 1. Preserve that local paint and the
  root's existing behavior; candidate only, not yet approved for adoption.
- `Prose.Manuscript/use.Styles.ts`, `ui.tsx`, `u.styles/u.init.ts`, `u.styles/u.rule.code.ts`, and
  `u.styles/u.rule.headings.ts`: code colors match the template recipe, but the hook also loads
  ETBook and the initializer registers heading rules. Preserve those owners, rules, and module
  boundaries. Defer mechanical adoption until their consumers and actual paint are verified.

These observations are a starting inventory, not a completed migration classification. In
particular, a specimen that intentionally persists while disconnected is not equivalent to the
proposed connected-run policy. Defer it or agree a separately owned persistence design; do not
silently change that behavior to make it fit the template.

Template edits do not automatically migrate those copies or break their local hook APIs. Preserve
specimen content, signal shapes and identity, defaults, storage keys, controls, callbacks,
selection, layout, and appearance. Only the explicitly specified faulty lifecycle or interference
behavior should change. Do not flatten meaningful module/specimen boundaries or standardize
unrelated code.

Adoption becomes mechanical only after the owning contract is proven. If a copy has diverged enough
that preservation cannot be established, stop that migration and record it as deferred. Back out
only attributable attempted migration changes if necessary; never restore a dirty consumer wholesale
from HEAD. New owners or non-mechanical redesign need separately agreed scope.

## Verification and artifact discipline

Historical experiment evidence, carried forward from the inline-label planning record:

- Duplicate-redraw regressions failed before the ownership candidate; a registry regression failed
  on competing theme rules before the stylesheet candidate.
- Both owner typechecks and exact authored-source format checks passed for the experimental patch.
  Full template tests passed with 27 tests / 100 steps. After strengthening late teardown, scoped
  template verification passed with 3 tests / 5 steps and UI-components with 122 tests / 857 steps.
- The added parity case materialized both raw UI templates and compared their four specimen files
  plus the plain template's `ui.tsx` and `use.Styles.ts` with source. `prep:bundle` refreshed 104
  assets; the observed bundle diff contained six changed entries.

These are historical results for the experiment, not acceptance of its contracts, proof of the
future repairs, or fresh checks during plan extraction. No browser paint equivalence was
established.

For each later implementation unit:

1. After the recovery handoff and explicit implementation instruction, reopen owning task
   definitions, source, relevant tests, and target-attributed diffs. Record the recovered baseline
   and preserve unrelated scaffold/dependency work. Establish current baseline failures; retain
   source reasoning and runtime observations as distinct evidence. Missing experimental tests are
   expected; reconstruct only the proof required by the reviewed design.
2. Design and prove one repair at a time. Use focused real-substrate tests before full owner checks.
   Consumer proof must exercise that consumer's actual behavior, not only the template fixture.
3. Refresh embedded assets from accepted source using `deno task prep:bundle` in `code/-tmpl`, after
   inspecting its live script and output footprint. Do not hand-edit encoded JSON or run broad prep.
   Keep the lifecycle and stylesheet entries attributable to their separate source commits.
4. Capture the generated candidate before full template tests. The test in
   `src/m.tmpl/-test/-u.makeBundle.test.ts` invokes `makeBundle()` against the module path even from
   a temporary cwd; a passing suite can otherwise conceal an omitted refresh. Inspect any later
   bundle change rather than treating test-driven repair as proof of initial parity.
5. Run owning checks/tests and exact-file formatting; review source, tests, and generated residue.
   Preserve the generator-owned bundle layout and canonical two-line plan identity headers.
6. Review independent lifecycle and appearance outcomes. Record missing proof and deferred
   consumers; do not turn partial coverage into a workspace-wide migration claim. Land only the
   explicitly authorized unit, with no unrelated template, dependency, or specimen work.

## Non-goals

No Text.Label parsing/Chip/overflow work, Text aggregate wiring, BulletList label adoption, or
Anchor sample changes. No harness/controller framework, shared debug abstraction, global CSS engine
redesign, visual standardization, dependency refresh, or speculative migration of divergent
specimens.
