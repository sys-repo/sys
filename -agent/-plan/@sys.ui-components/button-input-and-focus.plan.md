@sys.ui-components
button-input-and-focus.plan.md
- [x] 857d419c3 fix(ui-components): make Button keyboard-accessible
- [x] 7823ae3c2 feat(std): add DomMock touch event fixtures
- [x] 4b5364696 fix(ui-components): refine Button focus styling and spec controls
- [x] 175089b3d fix(ui-components): soften Button focus arrival
- [x] GATE human-approved debug-control spacing reference
- [x] 7c6d6cb59 fix(ui-components): refine debug control spacing
- [x] 405b170a4 feat(ui): standardize Dev exports and spec templates
- [x] b8f787bf4 refactor(ui): standardize @sys debug actions on Dev.Button
- [x] 28630db9d refactor(apps): standardize debug actions on Dev.Button

## Completion decision

The human explicitly deferred the remaining browser/input and visual checks to their own later work
and requested closure of this plan. Those checks are outside this plan's final completion boundary,
not passed or waived as evidence of browser correctness. This decision supersedes earlier prose
making that acceptance a prerequisite to plan completion; the detailed browser criteria below remain
a reference for the deferred human work.

This plan is complete for its implementation, automated verification, source-review and reporting
scope. The opening arc remains the sole landing ledger. No in-scope implementation or correction
remains; browser/accessibility conformance is not claimed. The final evidence limits and deferral are
recorded under Whole-plan closure boundary.

## Intent

Make the shared Button a reliable keyboard, mouse, and touch primitive. KeyValue.ActionButton
must inherit the behavior from Button, not implement a competing interaction layer.

Keep the work bounded to the primitive, its tests, the earned DOM testing capability, the focus
treatment, and Button debug-reset controls in one human-selected commit, followed by the explicitly
requested focus-arrival refinement. The next follow-up addresses debug-control spacing at its
actual spec-composition/harness boundary while preserving the accepted bare Button treatment.
A foundation commit establishes the shared Dev exports, spec-only barrel convention and both UI
templates. After that foundation, adoption lands in two commits: finish and verify `@sys` packages
under `code/` first, then finish and verify application consumers under `deploy/`. Preserve the
application edits already authored for the second commit. No passkey work, unrelated cleanup, or
production native-button migration.

## 1. Keyboard accessibility and test cleanup

Owner: `code/sys.ui/ui-components/src/ui.react/ui/Button/`.
Integration: `code/sys.ui/ui-components/src/ui.react/ui/KeyValue/-test/`.

Preserve:

- The rich-content div root, caller layout, public props, and physical hover semantics.
- Enter activation on keydown; Space activation on keyup; repeat and stray-release suppression.
- Keyboard-held pressed feedback without pointer hover or fabricated mouse callbacks.
- Independent keyboard/pointer feedback, with cancellation on blur and unavailability.
- Mouse/touch release-time activation and compatibility-click deduplication.
- Interactive descendants owning their input.
- The current focus outline exactly until item 3. No keyboard opt-out prop in this item.

Complete these small test refinements before landing:

1. Assert each KeyValue keyboard gesture's action count independently; a combined total must not
   conceal two Enter actions and zero Space actions.
2. Give the touch-outside test explicit element bounds rather than depending on DomMock's
   zero-sized geometry. Keep any test override contained to that rendered element.
3. Move the target-local KeyValue `keyup` helper beside `keydown` in
   `KeyValue/-test/u.fixture.keyboard.ts`, with matching options and event return semantics.

Descendant-boundary regression requirements:

- A mouse release over an interactive child must end the outer mouse press without outer release
  callbacks or activation, even when the child stops propagation. Capture owns this cleanup only;
  ordinary bubbling handlers retain activation. Preserve child callbacks/defaults, independent
  keyboard feedback, and fresh-gesture recovery.
- A bubbling child blur whose destination is the root must preserve the root's newly armed press.
  Root focus loss (including root-to-child transfer) and descendant focus leaving the component
  must still cancel presses; returning focus must not replay them.

Keep domain-specific Button selectors and content-transform inspection local. Preserve readable
setup → action → assertion sequences and explicit cleanup; do not introduce a generic test runner
merely to remove repetition. Prefer compact formatter-stable expressions and meaningful locals
rather than wrapped assertion chains or formatter-ignore directives.

Keep cleanup behavior-preserving: remove the constant blur flag and dead branches, use `Is.func`
for callback labels, and describe the primitive's default styling accurately. Preserve the emitted
CSS values, including the zero-strength filter's containing-block behavior, and public callbacks.

Source/test boundary:

- `Button/t.ts`
- `Button/ui.tsx`
- `Button/u.events.ts`
- `Button/-test/u.fixture.ts`
- `Button/-test/-ui.accessibility.test.tsx`
- `Button/-test/-ui.events.test.tsx`
- `Button/-test/-ui.pressed.test.tsx`
- `KeyValue/-test/-ui.action-button.test.tsx`
- `KeyValue/-test/u.fixture.keyboard.ts`

Paths above are relative to `code/sys.ui/ui-components/src/ui.react/ui/`.

## 2. Earned touch-event testing primitive

Owner: `code/sys/std/src/m.Testing.DomMock/`.
Consumer: Button's local touch fixture in `@sys/ui-components`.

Inspect the current DomMock type/export surface and Mouse/Keyboard implementations before shaping
`DomMock.Touch`. Separate browser event construction from React dispatch:

- DomMock owns framework-neutral touch-point and event construction.
- React `act` remains in the consumer testing adapter, not in std.
- Adopt the shared primitive immediately in Button's fixture; remove the superseded local builder.
- Preserve the existing Mouse/Keyboard APIs and import behavior.

The current fixture demonstrates single-contact start, move, end, cancellation, identifiers, and
coordinates. Define an honest event contract for `touches`, `targetTouches`, and `changedTouches`;
do not promote the current one-contact shortcut as a general gesture simulator. Explicit caller
lists are preferable to inventing hidden contact tracking or browser default actions.

Prove event fields, cancellation/bubbling, construction in the intended DOM realm, and lifecycle
behavior at the std owner. Test multiple-contact lists if the API admits them. Then rerun Button's
behavioral tests against the adopted primitive.

Compatibility-mouse construction is a candidate, not an automatic additional API. Inspect its
existing owner before deciding whether the local `sourceCapabilities` fixture warrants promotion.
Do not broaden this item to a general input automation framework.

Touch contract decisions:

- `DomMock.Touch.point(TouchInit)` returns plain touch data, not a native Touch instance. Identifier
  and target are explicit; omitted numeric fields are zero, with no coordinate inference.
- `DomMock.Touch.event(target, type, TouchEventInit)` constructs in the element's owning window;
  the target selects the realm, not list membership or dispatch. Missing windows fail explicitly.
- Events default to bubbling and cancelable; native init overrides remain available. Each contact
  list is independent and defaults to empty, including end/cancel. There is no gesture state.
- Button retains its single-contact list policy and `act` dispatch, preserving its prior fields.
  Compatibility-mouse construction remains local: it exercises Button's touch-origin handling and
  does not require another shared API or changes to Mouse/Keyboard.

## 3. Button focus styling and spec controls

Owner: shared Button styles, local tests, and existing specimens. Actual KeyValue.ActionButton and
one spec-local independent child are acceptance examples, not competing production owners.

### Contract and boundaries

Use native `:focus-visible` for both default and child-owned presentation. The human selected the
CSS-only composition: browser-selective indication, not an actual-focus boolean. Keep Button's
public props, children/label contracts, flags, callbacks, and exports unchanged.

Preserve the rich-content div, content wrapper, layout, physical hover, pressed feedback, activation
timing, and interactive-descendant ownership. No focus-state lifecycle work, render-function API,
new hook, context, child cloning, private selectors, or child recognition. No polling, animation-frame
sampling, bespoke observer, prototype patching, or new input-modality framework. No native-button
migration, keyboard opt-out, or generic CSS serializer change.

### Default and custom-root appearance

Use the existing `style` prop. Keep all default decoration inside the replaceable `:focus-visible`
block. Existing `css(...)` composition replaces that entire block rather than merging declarations;
examples must supply complete outline declarations, not imply partial overrides retain defaults.

Item 3 introduced an opaque `Color.BLUE` 2px outline and `outlineOffset: '2px'`.
Item 4 refines its colour and arrival timing without changing this geometry.
Explicit units are required: `m.Css.Dom/const.pixelProps.ts` omits `outlineOffset`, so the previous
numeric offset serialized without `px`. Keep the correction local to Button and its examples;
verify emitted CSS rather than only the input object.

Do not add layout borders or padding, change caller corner geometry, overwrite caller shadows, or
paint an assumed background gap. Text theme does not establish surrounding contrast: actual
KeyValue.ActionButton uses Dark content styling on a blue control even on a light surrounding surface.
Keep a real outline/border with normal forced-colors adjustment, not shadow-only feedback.

The original acceptance criteria called for settling final color, shape, and spacing with the human
in the rendered spec before completion. Remaining visual checks are now deferred under Completion
decision; they are not an additional arc item or a prerequisite to this plan's closure.
Changing the outline color alone does not establish visual quality. Include bare-text controls and
full-width block debug rows on the light inspector panel, not just isolated padded examples; inspect
stroke weight, separation, clipping, and overlap with adjacent rows.

Before judging the candidate, confirm that the running harness loads the current worktree and
selected view. A single Button is the intended default, not evidence of stale source; select
`view: variants` for the four examples. Do not infer a cache, server, or import-resolution fault
from appearance alone. The earlier built-preview mismatch is recorded below.

Keep default-policy cleanup within this item if it earns clearer ownership: a named internal
style/default object may be appropriate, but the existing `style` composition remains the single
override path. Do not introduce a second override API or split out a mechanics/refactor commit
merely to defer the visual outcome. Production interaction mechanics remain unchanged.

### Specimen selection

Preserve the single bare Hello Button as the default specimen: no gallery labels, wrapper DOM, or
added layout/padding. The four focus examples are opt-in through a debug-section `view` control:
`single` ↔ `variants`. Keep this typed signal with the other spec controls, persist it, and default
older snapshots without the field to `single`. The variants frame has no outer padding, so the
cropmarks mark the example-content bounds; individual example-content padding is intentional.
Lowercase metadata and quiet, theme-derived rules belong only to the variants layout. Short rule
overhangs make the trace-line crossings intentional without dominating the examples; consistent
title insets keep each section aligned. Rules remain outside the Buttons, aria-hidden, and
pointer-transparent. The rounded example uses a compact trailing SVG through `Icon.renderer`,
with an aria-hidden wrapper rather than a font arrow or emoji. Source and tests own exact dimensions.

The implementation follows inspected signal/cycle/persistence patterns in `Dist` and `Http.Origin`,
signal-driven subject selection in `Prose.Markdown`, and the spec-local `Root` boundary in `KeyValue`.
These examples live under `code/sys.ui/ui-components/src/ui.react/ui/`, in their `-spec/` directories.
`Root` selects the primitive or variants without adding DOM to the single view. Selection is a harness
concern, not a new Button prop or production behavior.

### Independent child composition

The composition site owns an inherited custom property and explicitly passes its CSS value through
an ordinary child presentation prop:

```tsx
<Button
  style={{
    '--run-focus': 0,
    ':focus-visible': {
      outline: 'none',
      '--run-focus': 1,
    },
  }}
>
  <RunLabel indicatorOpacity='var(--run-focus, 0)' />
</Button>
```

`RunLabel` is spec-local, knows nothing about Button, and owns its indicator markup and styling.
Its optional `indicatorOpacity` prop accepts `Style.Props['opacity']` and defaults to zero. Apply it
to a decorative, `aria-hidden`, pointer-transparent indicator, not to the whole label. Use explicit
CSS units for nonzero lengths that the serializer does not normalize.

Button owns no variable name or new public styling protocol. The connection follows ordinary DOM
inheritance through neutral wrappers, not direct-child structure; it does not cross a portal outside
that ancestry. Suppressing the root outline changes decoration only: the caller owns an accessible
replacement. The child indicator remains inside the pressed-content transform and root/ancestor
opacity and clipping; do not promise stationary placement or immunity to those constraints.

### Implementation and completion proof

Keep this one arc item: refine the default, add default/custom-root/independent-child specimens,
then complete automated and rendered proof. No JavaScript focus-state tests or standalone probe.

- Assert emitted `outline-offset: 2px` and complete pseudo-block replacement for plain, array, and
  transformed style inputs. Preserve unrelated styles, layout, children/labels, and activation.
- Verify custom-property declarations and child presentation wiring without pretending a DOM mock
  proves native selector heuristics or CSS inheritance in a real browser. Retain Button/KeyValue
  interaction regressions, including descendant ownership and unavailable transitions.
- In a real browser, compare root `:focus-visible` with the child indicator for keyboard, pointer,
  touch, programmatic focus, retained-focus modality changes, and root/descendant transfers. Verify
  inheritance through a neutral wrapper and that ordinary rerenders preserve child content/state.
- Obtain visual approval for default, custom-root, and child-owned examples: bare text, rounded/icon
  and rich content, actual KeyValue static/reorder layouts, light/dark surfaces, pressed state,
  opacity, zoom, clipping, and forced colors. Apply WCAG AA focus/contrast requirements; use
  2.4.13 Focus Appearance as an AAA quality target, not an AA requirement.
- Use the package checks below. For the deferred browser/visual checks, use a configured browser
  surface or human-owned harness run and record tested browsers, observations and limitations.
  Absence of an agent browser tool is not evidence of a pass; these remaining checks are outside
  this plan's final completion boundary under Completion decision.

### Blind implementation review disposition

The returned review of item 3 against `251378c41` plus the attributable worktree found no material
code defect. Its P2 evidence finding was accepted: browser/visual acceptance was not established.
The human later removed the remaining browser work from this plan's closure boundary under Completion
decision; that scope decision does not turn the missing evidence into a pass. Serialized-rule and mocked-DOM assertions cannot establish
native selector decisions, inherited painted indication, contrast, clipping, or forced-colors
behavior. Leave the implementation unchanged unless rendered verification exposes a failure;
another broad code review would not close this gap.

The human subsequently selected one combined focus/spec-controls commit. Include the complete
Button deltas and package README, including reset and persistence coverage. No partial-file split
or isolated focus-only snapshot is required; verify the combined change. This supersedes the
review's earlier two-commit boundary, not its browser-evidence limits.

The package README and `Button/mod.ts` documentation corrections completed while review was pending
also belong to the focus delta; do not imply the returned review covered those additions. They
clarify the existing keyboard/form contract and module description without changing runtime behavior.
Plans and unrelated work remain outside the implementation commit.

## Verification and evidence limits

Use each owning package's declared tasks. Run the narrowest tests during iteration, then package
check, publish dry-run, and full tests before each implementation handoff. Check formatting and
lint against exact changed filenames only. No broad formatter writes.

UI package commands, from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks ./src/ui.react/ui/Button/-test/ ./src/ui.react/ui/KeyValue/-test/
deno task check --quiet
deno task dry --quiet
deno task test --reporter=dot
```

For item 2, inspect `code/sys/std/deno.json` and use its declared scoped/full verification tasks;
verify the ui-components consumer as well.

### Latest implementation verification

After removing the redundant rendered reset-control test, Button/KeyValue passed 24 suites /
224 steps with leak tracing; the full UI package passed 94 suites / 636 steps. Package check,
publish dry-run, twelve-file formatting and eleven-file lint passed. Dry-run retains three existing
dynamic-import warnings in `src/-test/-exports.leaf.test.ts`.

Those full checks preceded the final label-opacity refinement. At 35% opacity, the view suite passed
one suite / five steps with leak tracing, and the changed file passed formatting/lint. The human then
selected 25%, which is present in the committed source; no subsequent test run was recorded. This
changes specimen metadata only, not Button content or behavior.

The committed reset suite contains the three state/persistence cases, without the removed rendered
keyboard case. The commit contains exactly the twelve implementation/documentation files selected
for the combined change, excluding plans and unrelated work.

Documentation-rendering caveat: the committed `Button/mod.ts` puts `@module` before its description,
unlike the description-before-tag form verified earlier with `deno doc`. The wording is corrected,
but that earlier parser result does not establish rendering of the committed comment structure.

The human approved the supplied single/variants layout screenshots. They show no visible focus
indicator and do not establish the remaining focused-browser or forced-colors acceptance.

The records below preserve earlier correction evidence at their stated revisions; their test totals
are historical, not additional verification of the committed source.

Item-1 correction proof, against the worktree based on `5f6ecc80d`:

- Child-targeted mouse release, release while Space is held, and child-to-root focus transfer before
  release were proven red → green. Both stopped-propagation release variants were also proven red →
  green before moving descendant cleanup to capture.
- Controls prove child callbacks/defaults remain untouched, root-to-child focus transfer cancels
  held Space without replay, and subsequent gestures recover. Noninteractive rich content retains
  normal release-time activation and propagation.
- Callback labels and the preserved cursor, content opacity, filter, and transition values pass
  assertions before and after removing the dead blur branches.
- Button/KeyValue passed 21 suites / 207 steps; the full UI package passed 90 suites / 618 steps.
- All nine source/test files passed exact-file formatting and lint checks. Package check and publish
  dry-run passed with the existing dynamic-import warnings.
- Mouse/touch release timing is retained, not every prior pointer behavior: stray/secondary release,
  cancellation ordering, touch cancellation, compatibility suppression, and touch focus are deliberate
  corrections. Keyboard activation uses click events without fabricating mouse callbacks.
- BulletList's mouse-down-only selection wiring is outside this item. Its keyboard activation needs
  a consumer-owned follow-up, not fabricated Button mouse callbacks.

Item-2 proof, against the worktree based on `857d419c3`:

- New owner tests first failed type-checking because `DomMock.Touch` did not exist, then passed
  after implementation. The DomMock scope passed six suites / 34 steps, including 13 touch cases.
- Owner coverage proves point defaults/overrides, independent multiple-contact lists, end/cancel,
  bubbling/cancellation, native init overrides, target-realm construction, lifecycle replacement,
  missing-window failure, and import without global installation.
- HappyDOM shares TouchEvent constructors across windows. Realm/lifecycle tests assign a distinct
  constructor identity to one window and restore it in `finally`; ordinary instance checks alone
  cannot prove realm selection on this substrate.
- Button/KeyValue passed 21 suites / 207 steps after shared-fixture adoption. Full package runs passed
  std: 209 suites / 2827 steps (one ignored step); ui-components: 90 suites / 618 steps.
- Both packages passed declared check and publish dry-run tasks. Exact six-file formatting/lint and
  tracked/staged diff checks passed. UI dry-run retains the three existing dynamic-import warnings.
- The DomMock type namespace is explicitly ambient (`declare`), preserving its type-only contract
  without lint suppression. No production Button behavior or focus styling changed in this item.

Item-3 automated proof, against the worktree based on `251378c41`:

- The emitted-offset assertion failed with the previous numeric offset in both Light and Dark,
  then passed with `'2px'`. Tests inspect the stylesheet owner's serialized rules, not mock
  focus-visible heuristics or painted appearance.
- Nine focus-style cases cover accent/offset declarations, complete pseudo-block replacement through
  plain/array/transformed inputs, retained layout/shadows/labels and keyboard activation, complete
  custom-root styling, and the independent child with default/explicit CSS opacity values.
- The actual spec composition emits the root custom property and child's `var(...)` declaration
  through a neutral wrapper. Keyboard press/release rerenders preserve the indicator's DOM identity.
  This proves wiring and reconciliation, not browser inheritance or focus-visibility decisions.
- The Button spec provides bare-text, rounded/icon, custom-root, and child-owned rich-content
  examples under the existing theme/availability/opacity controls. Button's production change is
  confined to outline color and units; event handling, DOM structure, and public signatures remain
  unchanged. The style prop documentation explains complete replacement and explicit units.
- No real-browser session or human visual approval was obtained in this pass. Verify the examples
  and actual KeyValue static/reorder layouts, including forced colors, before claiming acceptance.

Item-3 runtime mismatch diagnosis, observed against `251378c41` plus the focus worktree:

- Port 8080 was owned by the ui-components process running
  `deno run -P=dev ./-scripts/task.main.ts --cmd=serve`. Its working directory was the UI package;
  no listener was found on the configured live-dev port 1235.
- `driver-vite/src/-entry/u.command/u.serve.ts` selects the built `dist` directory by default.
  The inspected built `dist/pkg/m.-a6LUVHK.js` still renders the single Hello Button example;
  `dist/pkg/m.pDdyAvPY.js` still uses the theme-colored outline and numeric offset. These artifacts
  explain the screenshot/source mismatch without assuming a browser-cache fault.
- Use the package's declared `deno task dev` on port 1235 for the worktree visual comparison,
  opening `/?dev` and selecting `sys.ui.component: Button`. The later specimen correction restores
  the single default; select `view: variants` to see the four labelled examples.
  Keep the existing preview server untouched; do not alter verification or browser security policy.
- This was process/source/artifact evidence, not a browser render observation. No agent browser-control
  tool was registered in that pass. Human-owned keyboard-focus checks belong to the deferred browser
  work under Completion decision.

Real-browser input acceptance remains unproven. Before claiming browser acceptance, exercise Tab
and Shift+Tab, held/repeated Enter and Space, blur while held, disabled/inactive transitions,
mouse/touch single activation, and actual KeyValue static/reorder layouts. Item 3 additionally
requires visual focus review. Use a configured browser surface or human-owned manual verification;
DOM mocks do not prove browser default actions, touch compatibility behavior, or visual quality.
Report missing runtime evidence explicitly rather than converting it into a passing test claim.

## Button debug reset (within item 3)

Reset and persistence corrections belong to the same commit as focus styling and specimen selection,
as explicitly selected by the human. They restore template-aligned harness behavior without adding
production Button API.

Owner: `code/sys.ui/ui-components/src/ui.react/ui/Button/-spec/-SPEC.Debug.tsx`, with focused harness
regression tests. Reset behavior is independent of focus appearance and its visual acceptance.

Template/reference inspection:

- Root: `code/-tmpl/README.md`, `code/-tmpl/deno.json`, and `code/-tmpl/-templates/tmpl.m.mod.ui/.tmpl.ts`.
- Forms: `code/-tmpl/-templates/tmpl.m.mod.ui/-spec/-SPEC.Debug.tsx` and the corresponding
  `tmpl.m.mod.ui.controller/-spec/-SPEC.Debug.tsx`.
- Five component examples under `code/sys.ui/ui-components/src/ui.react/ui/`, each at
  `-spec/-SPEC.Debug.tsx`: `Anchor`, `Chip`, `Text.Input`, `Layout.CenterColumn`, and `KeyValue`.

Use the shared shape, not incidental differences in older specimens:

- One typed spec-defaults object, seeded storage snapshot, and stable signal instances.
- A named `reset()` exposed alongside `props` and `listen`; restore values with
  `Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)))`.
- A block `(reset)` Button using `onClick={debug.reset}`, near the debug toggle and ObjectView.
- Preserve Button's existing spec defaults rather than copying another component's values. Restore
  all six controls: theme, debug, enabled, active, opacity, and view, including callback-mode controls.
- Keep persistence in the harness effect. Correct the existing enabled/opacity branches that retain
  old stored values instead of persisting current non-function values; functions remain transient
  and require explicit serializable fallbacks. Reset must survive recreation/reload.
- Prove default restoration, stable signal identity, repeated reset, callback-mode reset, and
  persisted snapshot recreation. Keep keyboard activation coverage at the Button owner rather than
  duplicating it for the reset control. Do not introduce a generic reset framework, an unnecessary
  async factory, production Button changes, or template-wide cleanup.

### Specimen-selection and reset implementation proof

- The view suite proves legacy-snapshot fallback, a single unwrapped primitive, actual debug-control
  cycling both ways with subject rerenders, stored selection/recreation, absent outer padding, and
  shared variant availability controls.
- The reset suite proves current non-function persistence (including false/zero), restoration of all
  six defaults, stable signal identity, repeated reset, transient callbacks with serializable
  fallbacks, and stored snapshot/recreation. The redundant rendered reset-control test was removed
  with human approval; these three state/persistence cases retain the harness-specific coverage.
- UI fixtures flush `Signal.useRedrawEffect`'s microtask redraw inside React `act`; they do not use
  sleeps or alter production timing.
- The earlier gallery screenshot motivated the padding correction. The human subsequently approved
  the single/variants layout; focused-browser acceptance remains distinct and unverified.

Variants presentation refinement:

- Inspected theme-aware line treatments in `Layout.Tabs/ui.TabStrip.tsx`, `Layout.TreeHost/ui.tsx`,
  the playback-driver dev harness, and `KeyValue/ui/ui.Hr.tsx`, plus CenterColumn's harness tracelines.
  Kept presentation local to `Button/-spec/-ui.FocusExamples.tsx`; no primitive or harness-state changes.
- Both Light and Dark tests verify the three between-section rules, theme-derived alpha color,
  emitted dimensions/margins, decorative semantics, and exact lowercase metadata. The later spacing
  pass additionally proves the 10px overhang, consistent 2px title margin without an outer-grid gap,
  and a decorative 14px SVG following Open. The latest scoped and full checks include that pass.
- Latest verification and the limits of the human's layout approval are recorded above.

## 4. Soften Button focus arrival

The human requested a new follow-up after inspecting the focused bare Button: an immediate accent
hit, then one quick, smooth settle. This is a pure-widget focus-presentation refinement, not another
spec-label-opacity change. The Switch screenshots are a visual reference, not an implementation or
accessibility standard: Switch currently uses a 3px, 28%-alpha shadow halo, not Button's real outline.

### Design contract

- On entry into native `:focus-visible`, show opaque `Color.BLUE` immediately, hold for 70ms, then
  settle once over `220ms ease-out` to the resting outline. CSS backwards fill applies the initial
  keyframe during the 70ms pre-fade delay: the hit itself is not delayed. The final value adjustment
  lengthens the previous 40ms hold to let the accent register more clearly. No loop, pulse, bounce,
  scaling, or exit animation. Leaving the selector cancels the effect; a fresh entry may replay it.
- Keep a real outline with default width and offset of `'2px'` each; expose these independently
  through the focus width/offset tokens below. The default paints 4px outside the root without
  reserving layout space. Animate only `outline-color`, never root or content opacity, geometry,
  shadows, pressed transforms, or layout. No extra indicator DOM.
- Default the root to a minimal 1px border radius; the human selected this after finding the
  2px candidate's visible outline too rounded. Keep the default on `D` and preserve
  `style.borderRadius` overrides, including `0`; add no border or clipping.
- Use the same `Color.BLUE` in Light and Dark: opaque on entry, then `Color.alpha(Color.BLUE, 0.2)`
  at rest. The human requested a further fade from the previous 28%-alpha candidate; Switch remains
  a visual reference, not a shared implementation. The consistent blue hue remains unchanged.
  This supersedes the opaque-resting-colour proposal; do not claim that the low-alpha ring meets
  non-text contrast requirements. Check the result with the human, not by inventing a different hue.
- Reduced motion uses the settled appearance immediately, without the accent hit. Forced colours
  disables the animation and retains a solid system-colour outline with normal UA adjustment.
  Never use `forced-color-adjust: none` or replace the real outline with shadow-only feedback.

### Ownership and implementation boundary

Owner: `code/sys.ui/ui-components/src/ui.react/ui/Button/`, principally `ui.tsx` and the existing
`-test/-ui.focus-style.test.tsx`. A small internal `u.focus.ts` may own declarations and stylesheet
registration if it keeps the component clear; it is not a public API or generic animation utility.
Change existing specimens only when needed to exercise the treatment. Preserve the single default,
variants selection, 25% metadata opacity, reset, persistence, and independent `RunLabel` contract.

- Use one stable, Button-owned CSS keyframe name. Put the settled colour in the ordinary default
  focus declaration; a `from` keyframe supplies the opaque accent and the implicit endpoint uses
  that underlying value. No forwards fill is needed: after completion the static declaration owns
  the appearance. An unavailable animation must leave the declared resting outline. Keep the
  animation-name variable last in the shorthand so preference-mode `none` cannot be parsed as
  fill mode and leave `backwards` as an unrelated animation name.
- Use the existing `Style.Dom.stylesheet().rule(selector, style, { context })` surface. Inspection of
  `m.Css.Dom/u.rules.ts` confirms ordinary context wrapping and exact-rule deduplication. A single
  `from` rule under `@keyframes` avoids incorrectly registering separate same-name keyframe blocks.
  Assert registered CSS values and scoping through this owner. The human explicitly requested lean
  declaration checks, not an additional CSSOM inspection layer or browser-animation proof mechanism.
- Resolve caller styles through the existing CSS composition. Preserve original input in final
  base/default/caller composition: template normalization can remove explicit undefined clears.
  Do not restore layout values or default focus policy after such a clear. Scope media rules to
  the final root class, not an intermediate class lost during composition or parsed engine internals.
- Expose four documented root CSS tokens through the existing `style` surface:
  `--sys-button-focus-accent`, `--sys-button-focus-rest`, `--sys-button-focus-width` and
  `--sys-button-focus-offset`. Width is the outline stroke, not the Button's layout width; offset
  maps directly to `outline-offset`. Both default independently to `'2px'`; require CSS lengths,
  keep width positive, and allow zero or negative offset. Do not couple them to the 1px root radius.
  They customize the default treatment without duplicating timing, registration or preference
  handling. Each Button using the default treatment initializes its own palette and geometry.
  Reduced motion skips the accent and forced colours overrides the resting palette; both retain
  the caller's width and offset.
  Margin, padding, sizing and radius remain on their existing surfaces. Keyframe identity and the
  animation-policy variable remain private. No public timing knobs, exported stylesheet helper
  or generic animation abstraction.
- Preserve complete `style[':focus-visible']` replacement for plain, array, and transformed inputs.
  Return normal base/caller composition before registering any default focus policy for replacements.
  Custom-root and child-owned replacements receive no injected focus variables or scoped media rules;
  the caller owns their indicator and preference handling. No default animation or restored outline.
- Preserve explicit caller-owned root animation configuration. If resolved caller styles already
  own animation, keep the default focus treatment static rather than replacing their animation.
  Document this fallback, including longhand settings, alongside the public style contract.
  Do not parse or concatenate arbitrary animation strings or add a public opt-out prop.
- Register through the existing stylesheet lifecycle lazily, not by querying the DOM at module import,
  mounting repeated style elements, or adding a global initialized flag. Repeated renders/instances
  must not append duplicate rules. Do not expand the CSS engine or promise new SSR/iframe support.
- Ordinary hover, press, and parent rerenders while focus is retained must not replay the arrival.
  Keep the name/timing stable. Native selector or media-condition changes and remounts remain CSS
  lifecycle events; do not introduce JavaScript bookkeeping to turn them into a new modality policy.
- No React focus state, timers, effects, RAF, observers, forced reflow, remount keys, Motion dependency,
  computed-style polling, public props, or event changes. Switch, shared colour/CSS libraries,
  KeyValue arrival machinery, and the earlier module-documentation caveat are outside this item.

### DMIND / TMIND disposition and proof

The in-thread planning review supports CSS-only arrival emphasis followed by a quiet resting state.
The human subsequently selected the same blue and low-alpha rest in both themes, with the contrast
limitation stated above. Reject repeated flashing and shared machinery introduced merely to match
Switch. No additional blind pre-implementation design pass is needed. A focused implementation review
can inspect cascade isolation, caller-animation preservation, stylesheet registration and test
validity; visual judgement belongs to the human.

Extend the existing focus suite rather than adding another harness-testing framework:

- Prove emitted duration/easing, hold/backwards fill, stable keyframe identity, static fallback,
  real outline units, valid keyframe/media insertion and registration deduplication. Cover caller-root
  animation shorthand/longhand preservation and plain/array/transformed focus-block replacement.
- Prove default-only media policy and absence of default motion on the actual custom-root and
  child-owned examples. Keep activation, layout and descendant-ownership regressions unchanged.
- The human will eyeball the pop and settle in the existing specimens and consumers. Assert our CSS
  values, insertion and composition; do not build a browser harness, animation simulator,
  sampling/recording machinery, or timing tests to re-test the browser's animation implementation.
  Remove the retained-focus replay exercise: stable declarations are not an animation replay test.
  No new dev controls or automated visual acceptance machinery are required.
- Keep browser paint and preference behaviour distinct from declaration assertions. Reduced
  motion, forced colours, actual surfaces and ancestor opacity remain relevant to the human check;
  passing declaration tests does not establish visual or accessibility conformance.
- Run scoped Button/KeyValue tests, package check, publish dry-run, full tests and exact-file
  formatting/lint as specified above.

### Current implementation evidence

The current default is an immediate opaque-blue hit, 70ms backwards-filled hold, then one 220ms
fade to 20%-alpha blue, on a 1px-radius root. The existing `style` surface documents two palette and
two geometry tokens, complete-replacement ownership and caller-animation fallback. README and type
docs distinguish outline paint from layout and preserve component-owned timing. Button-local
`u.focus.ts` remains internal; no new props, runtime exports, event, specimen or shared-library changes.

The returned blind review, run by the human on gpt-6-astra at max, identified two bounded defects.
Both were accepted after inspecting the Button helper and CSS composition/template owners:

- Shorthand ambiguity: the animation-name variable now comes last, keeping preference-mode `none`
  unambiguously in the animation-name slot. The existing declaration assertion pins the ordering;
  media-rule assertions retain both preference fallbacks. No animation parser or timing harness.
- Premature normalization: final composition now uses original caller input rather than its
  separately transformed style. A post-composition check also skips all default policy when template
  expansion erases an explicit undefined focus block. No CSS-engine changes or new input normalizer.

Three narrow composition regressions reproduced failures before the correction: template-plus-layout
clears with default focus, the same with replacement focus, and a focus clear in nested caller input.
They passed after the correction, alongside the updated animation declaration assertions.

The geometry-token refinement extends existing focus cases without adding test steps or machinery.
Updated assertions failed before the tokens were implemented, then passed. They pin independent
`'2px'` defaults, custom stroke width, zero/negative offsets, per-Button initialization, unchanged
preference declarations and complete-replacement bypass. README and type docs list all four public
tokens and distinguish ring paint from layout; radius and timing stay on their existing surfaces.

Verification after the review corrections and geometry refinement, before the final 1px-radius change:

- Focus suite with leak tracing: **1 suite / 20 steps passed**.
- Button/KeyValue with leak tracing: **24 suites / 235 steps passed**.
- Full ui-components suite: **94 suites / 647 steps passed**.
- Package check, publish dry-run, exact six-file formatting, five-file lint and `git diff --check`
  passed. Dry-run retains the three existing dynamic-import warnings in `-exports.leaf.test.ts`.
- Residue inspection covered the helper, root/default wiring, README, public style docs and focus
  suite. The geometry refinement adds no files, props, exports, shared CSS, events, specimens or timing
  controls. Default appearance and the two review corrections remain intact.

After the final root-radius change from 2px to 1px, the focus suite passed all 20 steps with leak
tracing, following a failing assertion against the preceding default. Exact four-file formatting,
three-file lint and `git diff --check` passed. The broader package checks above were not rerun for
this value-only adjustment. Outline width and offset remain `'2px'` each.

These corrections and checks are local adjudication, not a new independent review verdict.
Rendered timing and appearance remain human judgement; declaration tests do not establish contrast
conformance. The disclosed low-alpha resting-colour trade-off remains unchanged.

## 5. Debug-control spacing in DevHarness

Active layer: ui-components-owned dev composition and its adoption by the Button debug panel.
The human selected a neutral layout frame around the real Button, not a different focus treatment.
Leave production Button source/defaults and generic ui-dev harness layout unchanged.

### Verified ownership and dependency boundary

- The pictured `theme: Light` control is authored in
  `code/sys.ui/ui-components/src/ui.react/ui/Button/-spec/-SPEC.Debug.tsx`. Its `Dev.Button`
  composition imports the actual production Button, not a harness copy or injected substitute.
  The control uses the same `ui.tsx` and `u.focus.ts` as the accepted bare specimen.
- `Button/-spec/-SPEC.tsx` supplies `<Debug debug={debug} />` to `ctx.debug.row(...)`. Its harness
  import resolves through `src/ui.react/-test.ui.ts` to `@sys/ui-dev/react/devharness`.
- The owning package is `@sys/ui-dev`; `ui.react.devharness` is its implementation subtree.
  `u/m.Ctx/Ctx.Props.Debug.ts` stores the supplied renderer; `ui/Harness.Panel.Debug/Panel.Body.tsx`
  and `Panel.Body.Row.tsx` render it. A harness row here contains the entire Debug component, not
  one row per Button. Adding a gap between harness renderers would not separate these controls.
- Inspected ui-dev source has no direct `@sys/ui-components` import. Its common runtime lane uses
  lower-level ui-css, ui-dom, ui-react, std and testing surfaces. Keep the direction intact: specs
  may supply components to the host without the host importing the component package.
- ui-dev's `-test/sample.DevTools/ui.Button.tsx` is a separate demo, and ModuleList's CacheButton
  uses a native `<button>`. Neither owns the pictured control. Do not merge or migrate them merely
  because they also have Button in their names. No dependency refactor is earned by this trace.

Paths for harness internals above are relative to `code/sys.ui/ui-dev/src/ui.react.devharness/`.

### Spacing model and human-owned design input

Before framing, the Debug component stacked block Buttons without explicit control padding or
margins. The harness supplies inherited `lineHeight: 1.6` in `Panel.Body.Row.tsx` and default body padding of
15px per side in `common/c.DEFAULTS.ts`; `ctx.debug.padding(...)` can override the latter. Block
layout fills the available row width. The default 2px outline plus 2px offset paints 4px outside
its box without reserving inter-control space. Panel overflow/scroll boundaries also matter.
These are source facts, not measurements of the screenshot's computed layout.

The human supplied the [annotated spacing reference](./button-debug-control-spacing.reference.png)
and selected container-only composition after reviewing the alternative of an inset focus offset.
The top `theme: Light` outline shows the existing treatment; the drawn `view: single` outline is
intent, not a second live focus indicator. The pink guides mark the panel's content alignment.

Design contract:

- Preserve label/divider alignment and readable row rhythm. Keep a full-row control, with the
  indicated small horizontal outline overhang and a shallower vertical frame around the label.
- A neutral layout container owns alignment, typography, inter-control spacing and clearance for
  Button's existing 4px outward outline paint. It draws no border or replacement focus indicator.
- Leave Button's 1px root radius, 2px outline width, 2px offset, palette, timing, preference rules
  and interaction implementation unchanged. Do not introduce per-instance focus-token or
  `:focus-visible` overrides to implement this treatment. The clean API remains available for
  other consumers, but is not required for this problem.
- Containment alone does not shorten the outline. Size the inner content box through the frame's
  layout/typographic context instead of inheriting the harness's generous line box unchanged.
  Reserve the remaining space outside the Button; do not hide overflow or use a fixed height that
  clips wrapped labels. Keep the small set of layout defaults together in the composition owner.
- The actual Button remains the hit target. Frame padding is not clickable; do not add click/key
  forwarding, a second tab stop, button semantics or focus state to the frame. Verify that the
  resulting target is comfortable. If the drawn proportions and a usable target conflict, bring
  that trade-off back to the human rather than silently changing Button policy.
- Resolve exact CSS dimensions through a focused browser comparison with the supplied reference.
  Do not equate image pixels with CSS pixels. This is bounded visual tuning, not another design
  review gate or a claim that rendered acceptance has already occurred.

### Bounded implementation and commit shape

Expect one `fix(ui-components): refine debug control spacing` unit:

1. Add a thin `Dev.Button` composition under the existing `@sys/ui-components/react/dev` surface.
   It renders one neutral frame containing the actual Button. Reuse Button props and forward the
   caller's original style input to Button without premature normalization; keep frame styles
   separate. Callers continue to own labels, callbacks, state, signals and persistence.
2. Expose it through the existing Dev runtime/type owners; no new package dependency or export lane.
   Import the production Button directly at the composition owner. ui-dev remains a content host
   and must not import ui-components back.
3. Adopt it for the Button spec's debug controls. Do not alter the bare subject, gallery, controls'
   actions, reset or persistence. Demonstrate the actual panel, not a duplicate specimen.
4. Add focused composition/forwarding tests and keep ownership documentation on the public Dev
   type surface, not in a new package README section. Preserve the existing Button tests as proof
   that its own contract has not changed.

Expected files, relative to `code/sys.ui/ui-components/`:

- `src/ui.react/dev/ui.Button.tsx` — new, small framed composition.
- `src/ui.react/dev/mod.ts` and `src/ui.react/dev/t.ts` — existing runtime/type surface.
- `src/ui.react/dev/-test/-ui.Button.test.tsx` — narrow owner-level tests.
- `src/ui.react/ui/Button/-spec/-SPEC.Debug.tsx` — actual debug-control adoption.
- `src/ui.react/ui/Button/-test/-spec.view.test.tsx` — integration coverage where needed.

The [dev composition plan](./dev-composition-primitives.plan.md) establishes this package boundary.
Its separate proposed KeyValue controls helper is not a prerequisite and is not part of this item.
Button and Switch debug controls plus the UI template demonstrate the repeated block-control need;
this item composes one action, not an entire panel or a stateful control framework. Template adoption
belongs to the foundation in section 6; wider spec migration belongs to section 7, not this commit.

No shared ui-dev layout change, harness-wide `[role="button"]` selector, new event/focus machinery,
native harness-control migration or production Button change belongs in this commit.

### TMIND / S-tier acceptance

- Match the reference using the real controls. Check first/last rows, adjacent controls, dividers,
  long labels and narrow/scrolled panels for cramped or clipped focus and horizontal overflow.
- Verify one actual Button per frame, no extra focus stop or activation handler, no focus-only
  layout shift, usable hit areas, and no accidental label drift from the content guides.
- Prove public Dev export identity, prop/style forwarding including explicit clears, frame layout
  declarations and retained Button focus defaults. Keep tests proportional; do not repeat the
  entire Button interaction matrix for a layout wrapper.
- Preserve Enter/Space activation, reset and stored controls through existing spec view/reset
  coverage plus the narrow composition cases. Keep single/variants selection and gallery unchanged.
- Confirm Light/Dark and preference-policy declarations remain intact. Human browser comparison
  owns appearance acceptance; no animation simulator, new browser harness or conformance claim.
- Run the new composition suite and affected Button spec tests first, then Button/KeyValue regression
  coverage, package check, publish dry-run, full package tests and exact-file formatting/lint.
  The accepted bare specimen is the unchanged regression reference. The existing low-alpha
  contrast caveat remains independent of spacing quality.

### Composition and verification evidence

- `Dev.Button` uses one neutral `div` with `lineHeight: 1.2`, `padding: 4` and
  `margin: '0 -4px'`, with left padding/margin overridden to `6`/`-6`. Its Button defaults to
  margin `[0, 0, 0, -2]` and padding `[0, 0, 0, 2]`: the left edge extends 2px while the label and
  right edge stay aligned. Caller margin/padding replace these defaults; original style passes
  through unchanged. This is ordinary box geometry, not a per-side focus token. Font size is
  inherited; there is no fixed height, clipping, indicator, event forwarding or frame tab stop.
- All seven Button debug actions use this composition. The production Button, bare specimen,
  gallery and ui-dev source have no spacing-item changes. Original Button props/style pass straight
  through; frame styles never participate in Button's style normalization.
- Red evidence: the new contract initially failed on the missing composition/export. The existing
  view integration test then failed against the unframed panel (`10` children instead of `1`).
  After adoption it passed, including Enter keydown and Space keyup cycling with persistence.
- Wrapper proof is limited to four tests: export identity, original prop forwarding, frame
  declarations/default Button delegation, and one nested explicit-clear regression. Button's own
  tests retain the theme, preference and normalization matrices. The spec integration proves a
  framed control still cycles and persists its view through Enter/Space; it does not repeat frame CSS.
- After test consolidation: composition plus spec view/reset with leak tracing, 3 suites / 12 steps;
  full package, 95 suites / 651 steps. Package check, exact six-file format/lint and diff checks
  passed. Earlier Dev + Button + KeyValue leak tracing passed 27 suites / 246 steps before removing
  three redundant wrapper cases. Publish dry-run passed before this test-only consolidation, with
  three pre-existing dynamic-import warnings in the leaf export test.
- The subsequent human-requested 2px left extension passed red → green in the existing geometry
  test. Composition plus spec view/reset passed 3 suites / 12 steps with leak tracing; package check
  and exact three-file format/lint passed. The full-package and publish results above predate this
  geometry adjustment. Production Button and its outline defaults remain unchanged.
- Evidence limit: declarations/composition tests do not establish a browser match to the drawing
  or a comfortable actual hit area. The Button target is the compact inner box, not the frame's
  padding. Human comparison must assess first/last rows, adjacent controls/dividers, wrapped labels
  and narrow/scrolled panels. No browser appearance or hit-target acceptance is claimed here.

### Browser-discovered spec opacity correction

The planned `fix(ui-components): expose automatic Button opacity in spec` scope was absorbed into
`7c6d6cb59 fix(ui-components): refine debug control spacing`. That commit contains both the spacing
composition and the spec-only opacity correction with their tests; no separate opacity commit remains.

- The reported bright disabled specimen came from the spec's explicit `opacity: 1`, which
  overrides Button's automatic disabled opacity. History before `251378c41` already contains this
  default; production opacity precedence also predates the keyboard/focus arc. This is not caused
  by Dev.Button spacing. `active: false` remains an interaction gate, not a dimming policy.
- Default/reset now use undefined opacity (labelled `auto`); the existing control cycles through
  auto, numeric overrides and the transient callback. Numeric labels identify the override.
  Preserve existing saved numeric values, including zero; use Reset to clear a saved override.
- Changes belong to Button's `-SPEC.Debug.tsx`, `-spec.view.test.tsx` and `-spec.reset.test.tsx`.
  The opacity correction does not change production Button, Dev.Button geometry, the harness or
  the gallery implementation.
- Actual debug-control regressions cover both views: reset, disabled dimming, explicit overrides,
  return to auto, reload and unchanged inactive semantics. Red: reset returned 1 instead of undefined.
  Green: 3 suites / 14 steps with leak tracing; full package 95 suites / 653 steps. Full tests preceded
  a test-helper-only lint correction; scoped tests, check and exact three-file format/lint passed
  afterward. No browser rendering claim or new blind review is implied.

## 6. Standardize Dev exports and spec templates

Commit: `feat(ui): standardize Dev exports and spec templates`.

This foundation is a separate commit before the workspace-wide migration. Current `/sys` source is
the implementation and verification target; publication follows through the normal release workflow,
not as a prerequisite. No blind plan review is required before this bounded implementation.

### Shared Dev API and import ownership

- Extend the existing `@sys/ui-components/react/dev` namespace with `Dev.ObjectView` as a direct
  alias of the existing ObjectView component. Preserve runtime identity, props, defaults and the
  production export. Add `Dev.ObjectView.Props` as a type alias of `t.ObjectViewProps`; no wrapper,
  new behavior, copied implementation or namespace merge. Keep Dev.Button and Dev.Help unchanged.
- Export this Dev from each template's `-spec/common.ts`, alongside its existing re-exports.
  Debug components import Dev through `./common.ts` and use `Dev.Button` and `Dev.ObjectView`.
  Do not repeat the package leaf import in renderers or add Dev to production common barrels.
- Import ownership is explicit: external consumers and generic templates export Dev from
  `@sys/ui-components/react/dev`; specs inside `@sys/ui-components` export it through a relative
  path to the local `src/ui.react/dev/mod.ts`, with depth appropriate to the barrel. KeyValue's
  `../../../dev/mod.ts` is the existing example. Do not introduce package self-imports during
  migration. Renderers consume the applicable spec-only common barrel in either case.
- Keep existing bare Button/ObjectView production exports for production consumers and specimens.
  This item does not migrate existing workspace panels or redesign their imports globally.
- The human explicitly excluded ActionProbe from this foundation and the wide migration: it has
  not earned shared Dev membership. Preserve its existing API and domain aliases; do not add it
  opportunistically. No additional Dev member is required for the planned Button/ObjectView adoption.

### Existing Dev identities and collision policy

- The shared UI Dev already owns Button and Help. KeyValue's `-spec/common.ts` already re-exports
  that same identity; reuse it rather than introducing a second Dev binding.
- Automerge's `src/ui/-dev/m.Dev.ts` owns a different Dev with a CRDT-specific ObjectView,
  fieldFromPath and expandPaths, also exposed as `Crdt.UI.Dev`. Preserve those exports and semantics.
  Never replace a CRDT inspector merely because it is named ObjectView.
- PlaybackDriver's `-dev/m.Dev.ts` owns Dev.InfoPanel. Its `-dev/-harness/common.ts` exports that
  identity and `ui.InfoPanel.tsx` consumes it. Preserve that binding and the public driver export.
- `deploy/@tdb.edu.slug/src/ui/-dev/mod.ts` owns another Dev with SlugOrigin and ActionProbe.
  Its live exports were inspected after the review identified it. Preserve that domain namespace;
  shared UI controls use UiDev at collision sites, with consumer runtime/type checks during migration.
- At any spec-only barrel where another Dev is already bound or inherited, export the shared UI
  namespace explicitly as `UiDev` and consume `UiDev.Button` / `UiDev.ObjectView`. Otherwise use
  `Dev`. Do not shadow an existing Dev, merge objects, rename public domain APIs or rely on ambiguous
  star exports. Check both runtime and type bindings before changing a consumer.
- These are inspected collision sites, not a substitute for the migration's full inventory.

### Template wiring and proof

- Add the existing `@sys/ui-components/react/dev` subpath to
  `code/-tmpl/-templates/tmpl.repo/-deps.yaml` and project the corresponding import mapping while
  preserving unrelated aliases and versions. Update both `tmpl.m.mod.ui` and
  `tmpl.m.mod.ui.controller`, including their spec-only common barrels.
- Version maintenance remains owned by `code/-tmpl/-scripts/task.prep.ts`: its
  `syncTemplateDeps` / `syncTemplateImports` helpers update this subpath with the other
  ui-components entries using the selected version authority. The import-map value is not an
  independent version pin. `prep:bundle` refreshes embedded content only; it does not sync versions.
- Refresh `code/-tmpl/src/m.tmpl/-bundle.json` through the owning `prep:bundle` task after the final
  source changes. The materializer reads this embedded bundle, not the authored template files.
  The human ran this task after the first template edits; later barrel/ObjectView edits require a
  fresh bundle. Do not hand-edit encoded template content.
- The subpath declaration, its projected import mapping and the embedded template bundle are the
  bounded exceptions to the dependency/generated-output exclusion. No new packages, version changes,
  unrelated generated output or production barrel changes belong here.
- Prove public Dev.ObjectView export identity and prop-type compatibility without duplicating
  ObjectView's rendering tests. Retain the existing Dev.Button and Dev.Help regression coverage.
- Verify both materialized templates import Dev from their spec-only common barrel and render the
  intended Dev controls. Assert the generated repository mapping contains the dev subpath before
  local-authority rewriting, so that rewriting cannot conceal a missing template mapping.
- Type-check the generated debug modules against current `/sys` using explicit local package
  resolution. Exercise materialization and existing signal/reset coverage; source-string assertions
  or ambient workspace resolution alone do not establish generated import correctness. No published
  Dev version is required. Run scoped owner checks/tests and exact-file format/lint checks.
- Inspect the foundation diff for unintended bundle changes and namespace collisions. Land this
  foundation separately before starting the broad migration; normal human-owned Git authority applies.

### Foundation verification evidence

- Dev.ObjectView is the same runtime component as the production leaf export; its public Props alias
  matches ObjectViewProps. Dev.Button geometry and Dev.Help are unchanged. No existing domain Dev
  binding or production barrel was changed.
- Both generated debug modules passed `deno check` with explicit current-workspace authorities.
  Their repository dev mapping is asserted before localization; renderers import Dev only through
  the spec common barrel. The bundle was refreshed after the final template changes.
- Generated checking exposed an existing broken `../../common.t.ts` reference in both spec type
  barrels. Pointing them to the existing `../../t.ts` barrel made the generated modules type-check.
  No signal, persistence, callback or reset implementation changed.
- After integration-test refinement, scoped template tests passed 3 suites / 7 steps with leak
  tracing, including both generated module checks; the refined test's exact-file format and lint
  checks passed. Prep tests passed 1 suite / 25 steps, including current template-file parity.
  Dev tests with leak tracing passed 4 suites /
  9 steps; existing Button spec view/reset regressions passed 2 suites / 10 steps. Both owner package
  checks passed. Exact 11-file TS/JSON formatting and Git diff whitespace checks passed.
- Exact 10-file lint reports only the two existing `require-await` findings on the templates'
  unchanged async createDebugSignals factories, confirmed in the HEAD sources. Their Promise API
  was preserved; no dummy await or lint suppression was introduced. Lint is not claimed green.
  No full-workspace tests or browser appearance proof is claimed.

### Foundation blind-review disposition

- The human-returned independent review found no landing-blocking defect and no additional Dev
  member required before migration. Its scope was the current-workspace foundation, not publication
  or the wide rollout. This is review evidence, not Git authorization or work-state closure.
- Accepted the ownership findings: preserve domain Dev identities and use UiDev for shared controls
  where they collide. The newly identified SlugOrigin namespace is recorded above; the full
  migration inventory remains required. Do not move general reactive/persistence helpers or
  production configuration controls under Dev merely because debug panels use them.
- ActionProbe remains excluded by the human's explicit decision above, not queued as an obligation.
- Accepted and normalized the new Dev.ObjectView namespace heading to multiline public JSDoc;
  no API or behavior changed. Existing template require-await findings remain unchanged with their
  Promise contracts preserved.
- Reviewer-reported verification: Dev and Button spec regressions 6 suites / 19 steps; generated
  templates, controller and prep tests 4 suites / 32 steps; both owner checks, exact-file formatting
  and diff whitespace checks passed. Lint reported only the two existing require-await findings.
  These are the returned review's results, distinct from this thread's runs above. The reviewer did
  not verify full-workspace tests, publication compatibility or browser appearance.

## 7. Standardize @sys debug actions on Dev.Button

Commit: `refactor(ui): standardize @sys debug actions on Dev.Button`.

Dev.Button is the standard for spec debug-panel action buttons, not an optional visual treatment.
Apply the landed foundation consistently without reopening its design or mixing rollout into it.
The human selected the package/application split: this unit owns `@sys` adoption under `code/`;
section 8 owns application adoption under `deploy/` and follows this unit's separate landing.

- Inventory authored spec debug actions in `@sys` packages under `code/`, including drivers,
  development samples and spec-local helpers. Migrate action Buttons to Dev.Button, using the
  spec-only barrel and collision policy above. Route ordinary debug ObjectView inspectors through
  the same namespace; preserve domain-specific inspectors such as Automerge's Dev.ObjectView.
- Include all target-attributed source and new spec/dev-only common barrels for this package unit.
  Do not include `deploy/`, plan artifacts, dependency/lockfile changes or unrelated work in its
  source commit. Preserve the already authored deployment deltas for section 8; do not reset, stash
  or otherwise rearrange Git state to impose the split.
- Centralize shared Dev exports in the applicable spec/dev-only common barrel: use the public
  package leaf outside ui-components and a relative local-module path inside ui-components, as
  specified in section 6. Do not repeat these imports beside common imports in individual
  renderers. Reuse existing exports of the same identity and retain the Dev/UiDev collision policy.
- No dependency changes, generated output or unrelated production barrel changes belong in this
  migration; the preceding foundation owns template wiring and its generated bundle.
- Preserve labels, callbacks, props, signals, reset, storage keys, persistence and control order.
  Keep production Button specimens/gallery examples as Button, including examples inside specs.
  Switches, links and other control kinds are not Button migration targets.
- Reuse the settled composition unchanged: no copied spacing, per-site focus tokens, new knobs,
  control schemas, generic harness selectors or reverse ui-dev dependency. This is an adoption
  migration, not a series of local design exercises.
- Classify by control ownership, not filename or a blind replacement of every Button identifier.
  If an existing wrapper, specialized layout or dependency boundary prevents a mechanical adoption,
  report the concrete site and conflict; do not invent an adaptation or silently omit the site.
- Review the inventory and final diff for missed debug actions and accidental specimen changes.
  Run affected owners' scoped checks/tests and template verification; reuse composition and
  existing integration coverage rather than adding one repetitive test per migrated control.
  Record any unresolved site explicitly before claiming migration completeness.

### Package-unit completion requirements

- Audit helper actions, including
  `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.Samples.tsx`: its sample selectors
  mutate debug signals and are ordinary debug actions, not Anchor specimens. Preserve their labels
  and mutations while adopting the existing spec-only Dev barrel.
- Inspect/classify the remaining dev helper actions, including Media.Recorder's RecorderHookView
  and table-cell selectors/clipboard actions. Migrate eligible panel actions; retain specialized
  embedded controls only with concrete ownership/layout rationale. The accepted video-overlay
  exclusion is not permission to exclude every helper or every non-block Button.
- Complete the generic-inspector audit and distinguish inspectors from actual ObjectView specimens
  and domain-specific inspectors. Include shared/re-exported helpers and both runtime/type bindings;
  filename searches alone are not completion evidence.
- Run final affected-package checks and scoped regression tests, exact-file formatting/lint, and
  the full `code/` unit diff/residue audit, including untracked barrels. Attribute retained baseline
  lint findings explicitly; no blanket suppression, dummy await or unrelated cleanup. Earlier proof
  is a source/dependency snapshot, not a substitute for final verification after further changes.
- Produce a code-only path inventory and report any unresolved package site. No publication, app
  completion or new approval gate is required to finish this package unit. Implementation delivery,
  readiness, independent review and human-owned Git landing remain separate.

### Adoption evidence and inventory limits

These receipts span the pre-split adoption pass. Attribute package evidence to section 7 and
application evidence to section 8; combined counts do not establish either unit's completeness.

- Inspected adoption coverage at foundation baseline `405b170a4`:
  - ui-components spec panels: Anchor, BulletList, Chip, KeyValue, KeyValue.Switches,
    Prose.Manuscript, Prose.Markdown, Prose.Measure, Splash and Text.Ellipsize. Includes KeyValue's
    cursor/layout/sample selectors and Markdown's sample selector, not their production specimens.
  - PlaybackDriver spec panel and harness InfoPanel inspectors/copy action. The harness keeps
    domain Dev.InfoPanel.UI and imports shared controls as UiDev; its spec barrel uses Dev.
  - Automerge Binary, Card, Document, DocumentId, Layout, Repo and Repo worker spec panels,
    including Card's value-editor actions and, in that initial pass, Layout's error-trigger helper.
    The hardening pass below restores that subject fixture's bare Button. Their inspected barrel
    chains do not bind runtime Dev, so shared controls use Dev. Crdt.UI.Dev.ObjectView and domain
    runtime/type exports are unchanged.
  - ProseMirror TextPanel and TextEditor spec panels, including the editor's sample actions.
  This initial coverage is a bounded source-inspection record, not a complete workspace inventory.
  The continuation coverage and remaining evidence limits are recorded below.
- The initial 47-file adoption delta changes spec/dev-only exports, renderer imports and component selection,
  plus formatter-required layout. No callbacks, labels, props, storage keys, signals or reset logic
  changed. No production barrel, shared Dev implementation or template was changed.
- Scoped verification: Dev/Button specs 6 suites / 19 steps; KeyValue, KeyValue.Switches and Markdown
  37 suites / 251 steps; Automerge UI/domain Dev tests 5 suites / 45 steps; generated UI templates
  3 suites / 7 steps, including both compiler checks. All passed with leak tracing. ui-components,
  Automerge and ProseMirror owner checks and exact 47-file formatting passed.
- Exact-file lint is not green: 57 findings in ui-components, 22 in Automerge and 6 in ProseMirror.
  Findings concern retained React import forms, JSX literal braces/boolean spelling, unused locals,
  getter returns and existing async-without-await factories. Inspected source/diffs retain those
  constructs; no separate baseline lint execution or blanket cleanup was performed in that initial
  pass. The expanded package-unit baseline comparison is recorded below. Preserve the Promise APIs;
  do not add dummy awaits or suppressions. Whitespace checking passed.
- No new primitive behavior or public contract was introduced, so no deliberate red/mutation run
  was performed for this mechanical adoption.
  Existing integration coverage was reused rather than duplicating a test per control. No browser
  layout, hit-target, clipping or visual-acceptance proof, full-workspace run or adoption blind review
  is claimed. These passing checks do not establish workspace migration completeness.

### Continuation coverage and proof

- The ordinary-panel continuation also covers ui-components Button, Buttons.Icons, Buttons.Switch,
  Text.Input, Ownership, PathView, TreeView.Index/Item, Layout.TreeHost/Tabs/CenterColumn/RectGrid/
  SplitPane, Cropmarks and its configuration helpers, Slider and its sample actions, Dist and its
  browser spec, Sheet, Http.Origin, the Player video/decks/controls/YouTube panels, Media.Config's
  three specs, Media.Devices, Media.Video, Media.AudioWaveform and Media.Recorder. It also covers
  the colocated FadeElement, Spinners.Bar, Preload, IFrame, Bullet, Image.Svg, ObjectView and
  VimeoBackground panels, webfont controls, Dev.Help.Markdown controls and development samples.
  Colocated specs get a dedicated `-spec/common.ts`; production common barrels remain unchanged.
- External spec-only barrels cover Monaco's sample, Notes, Prompt, MonacoEditor/language selector,
  YAML editor/footer and CRDT controls; Stripe PaymentElement; Files InfoPanel/Config; Draft Shell;
  Data Mounts/HttpOrigin/HttpDataCards; and SLC Standard Canvas layout/logo, wordmark and background
  video controls. CRDT/YAML-specific inspectors, existing switches, and ActionProbe APIs remain
  unchanged. Caller labels, handlers, state/storage keys and reset/persistence logic are preserved.
- The inspected adoption/formatting surface totals 186 source files: ui-components 129, Automerge
  15, ProseMirror 4, Monaco 15, Stripe 2, ui 4, Draft Shell 2, Data 6 and SLC Standard 9. This is
  pre-split source coverage: 169 package paths belong to section 7 and 17 application paths belong
  to section 8. These counts are proof context, not final path inventories or completion assertions.
- Continuation verification: full ui-components tests passed 96 suites / 654 steps with leak tracing;
  scoped Monaco tests passed 7 suites / 67 steps, Stripe PaymentElement 1 suite / 1 step, Files UI
  7 suites / 72 steps, and SLC Standard UI 1 suite / 2 steps. Owner checks passed for ui-components,
  Monaco, Stripe, ui, Draft Shell, Data and SLC Standard. Exact-file formatting passed across those
  source deltas. The earlier Automerge/ProseMirror/template evidence remains separate above.
- The package helper/inspector audit and final package-unit lint/diff verification belong to section 7.
  Remaining ordinary panels in `deploy/@tdb.slc` and `deploy/@tdb.edu.slug`, and the application
  helper/inspector audit, belong to section 8. Candidate discovery is not classification. Final
  unit-specific lint, diff/residue audit, affected-owner proof and completeness reporting are
  required for each unit. Initial lint findings above do not establish expanded-delta lint results.
  No full-workspace run, browser proof or independent adoption review is claimed.

### Specialized overlay boundary

`code/sys.ui/ui-components/src/ui.react/ui/Media.Timecode.PlaybackDriver/-dev/-harness/ui.Video.tsx`
contains a copy-status Button positioned with `styles.label.top` (`Absolute: [-20, null, null, 0]`).
It is an overlay above a video, not a panel row. Shared Dev.Button forwards that absolute style to
its inner Button while adding an in-flow padded frame, introducing a box into the video layout.
The human's follow-up and continuation instruction confirmed ordinary debug-panel action adoption,
not every Button in development code. This specialized overlay stays a bare Button: do not invent
frame positioning, copied spacing or another Dev knob. It is spec-harness-only, not the production
video component. This classification does not block ordinary-panel adoption or require another gate.

The production `Player.Video.Element/ui.Debug.tsx` overlay likewise retains its production-owned
Button, custom text/copy-icon children and hover behavior; it is outside this spec-panel migration.
The follow-up inspected the table-cell selectors/clipboard actions separately from those overlays.
`KeyValue/ui/ui.Cell.tsx` renders ReactNode content in a div, and `ui.row/ui.Row.Table.tsx` imposes
no fixed cell height. The sample-video selectors, TreeHost SelectedPath selectors and playback's
InfoPanel clipboard action have no absolute-button style or frame-positioning requirement. They
therefore adopt the settled Dev.Button without a local adaptation. RecorderHookView's start/pause/
resume/stop/reset controls likewise remain ordinary actions in its existing auto-sized grid; retain
all state guards, handlers, theme props and grid styles. These are source-based classifications,
not browser layout or clipping proof.

### Package completion/hardening receipts

Source/proof snapshot at HEAD `9dbd44c77`, after the human's explicit continuation GO:

- Added the missed Anchor selectors, ActionProbe spec-panel actions/inspector, RecorderHookView
  controls, SelectedPath/sample-video table actions, playback dev InfoPanel clipboard action,
  TreeHost/TreeView leaf inspectors, Schedule/SizeObserver sample inspectors, Automerge DocumentId
  debug overlay inspector, Stripe's standalone sample sidebar and Stripe/ProseMirror splash
  inspectors. The ObjectView alias remains identical; no wrapper defaults or inspector props change.
- ActionProbe's panel now consumes shared controls, but ActionProbe itself does not become a shared
  Dev member. Domain ActionProbe APIs and sample cards remain unchanged. Playback keeps domain
  Dev.InfoPanel and gets shared UiDev through its existing dev-only common barrel; the harness
  reuses that export rather than declaring it again.
- The ownership audit removed the earlier Automerge Layout `-spec/-ui.Foo.tsx` adoption: its
  throw-error control is part of the subject's error fixture, like ErrorBoundary's
  `-spec/-ui.Sample.tsx`, not a panel row. Both retain bare Button. Monaco's centered CRDT LoadSplash
  activation remains stage/loading UI, not a debug-panel action row.
- Other retained bare controls: TreeHost/TreeView back-navigation overlays; Monaco sample-factory
  IFrame source-label and section back-navigation overlays; the playback/video overlays above;
  actual Button/ObjectView specimens and primitive tests; production component controls;
  Automerge's CRDT inspector and Monaco's YamlObjectView internals. ui-dev's DevTools ButtonSample
  remains its own pointer/harness specimen, avoiding a reverse dependency. The passkey sample
  remains explicitly outside this arc.
- Repository-wide Button/ObjectView candidate searches included qualified JSX, aliases and direct
  createElement forms, followed by ownership reads and bounded final diff review. No further
  ordinary action/inspector omission was identified in the package unit. Specialized controls are
  classified above, not silently omitted. This is source-audit evidence, not a browser acceptance
  or formal exhaustiveness claim.
- Exact source inventory: [button-input-and-focus.code.paths.txt](./button-input-and-focus.code.paths.txt).
  It contains 186 package paths: 133 tracked changes plus 53 new spec/dev-only barrels; ui-components
  141, Automerge 15, Monaco 15, ProseMirror 6, Stripe 5 and ui 4. This package-only count is distinct
  from the earlier combined package/application count of 186. All new barrels were inspected;
  external ones export the public leaf and internal ones export the relative local Dev module.
- Source diff review preserves labels, callbacks, props, state/reset/storage/persistence and order.
  No shared Dev/Button implementation, production common barrel, template, dependency manifest or
  generated bundle is part of this source delta. Existing deployment edits and the already-dirty
  lockfile were not adopted into this unit. No staging or Git mutation was performed.

Verification in this thread against the current package delta:

| Owner / scope | Result |
| --- | --- |
| ui-components | Owner check; full tests: 96 suites / 654 steps |
| Dev/Button/Recorder dev, earlier narrow run | 11 suites / 80 steps |
| Automerge UI, including domain Dev | Owner check; 6 suites / 46 steps |
| Monaco editor/CRDT/Prompt/dev/sample factory | Owner check; 8 suites / 68 steps |
| ProseMirror | Owner check; full tests: 2 suites / 2 steps |
| Stripe PaymentElement | Owner check; scoped tests: 3 suites / 4 steps |
| Files UI | Owner check; 7 suites / 72 steps |
| Generated UI templates / compiler checks | 3 suites / 7 steps |
| Formatting / whitespace | Exact-file checks across all 186 source paths; git diff --check |

All listed tests used leak tracing and passed. Monaco's sample-factory test is a placeholder, not
interaction/layout coverage. Stripe's browser-runtime test returned at its opt-in environment
condition: no browser was launched. Its safety assertions checked authored spec source and the
existing dist, not a rebuilt artifact from this delta. These implementing-thread receipts do not
establish browser layout, clipping, hit-target, visual acceptance or a full-workspace run. The
subsequent independent package review is recorded below.

Expanded exact-file lint is non-green, with baseline attribution rather than suppression:

| Owner | HEAD-blob findings | Current findings |
| --- | ---: | ---: |
| ui-components | 240 | 239 |
| Automerge | 23 | 23 |
| Monaco | 33 | 33 |
| ProseMirror | 9 | 9 |
| Stripe | 10 | 10 |
| ui | 9 | 9 |

Every tracked changed file's HEAD blob was linted through stdin with its original ts/tsx extension
under its owning configuration; no checkout, baseline worktree or Git mutation was used. The current
runs include all 53 new barrels, which have no findings. The baseline/source comparison attributes
retained diagnostics to existing React/type-only import forms, JSX literal/boolean spelling,
unused/empty locals and patterns, getter returns, browser window usage and async-without-await
factories. One type-only import diagnostic disappears when cursor-debug's type import joins the
runtime Dev import. No introduced lint site was identified. This is not a clean-lint claim: retain
the Promise APIs and do not add dummy awaits, exclusions or suppressions to make it green.

### Package blind-review disposition

The human returned an independent GO for the complete 186-path package source unit, with no material
findings. The review independently enumerated the tracked deltas and all 53 new barrels and examined
coverage, control ownership, behavior preservation and retained bare-control exclusions. Its owner
checks, exact-file formatting, whitespace checks and scoped tests passed. No introduced lint site
was identified by source/diff comparison; the reviewer did not separately execute baseline lint.
That review is distinct from the implementing-thread baseline runs above and establishes no browser
layout acceptance. No correction was required by the returned findings.

## 8. Standardize application debug actions on Dev.Button

Commit: `refactor(apps): standardize debug actions on Dev.Button`.

After the package unit in section 7 lands separately, complete application adoption under `deploy/`.
Apply section 7's control-ownership rules, behavior-preservation constraints and evidence standards,
with section 6's external public-leaf/spec-barrel and Dev/UiDev collision policy.

- This unit owns all target-attributed application source deltas, including those already authored
  in `deploy/@draft.shell`, `deploy/@tdb.data` and `deploy/@tdb.slc.std`; preserve them for this
  commit. Finish the remaining `deploy/@tdb.slc` and `deploy/@tdb.edu.slug` panels and inventory
  other application consumers/helpers rather than assuming those two directories exhaust scope.
- Preserve SlugOrigin, ActionProbe and other domain Dev identities. Use UiDev at actual binding
  collisions; retain domain-specific inspectors, production specimens, switches and specialized
  overlays. Do not extend shared Dev membership, change dependencies or adapt the wrapper locally.
- Verify affected applications through their owning task surfaces, audit final actions/inspectors
  and barrel ownership, run exact-file format/lint checks, and distinguish retained baseline findings
  from introduced regressions. Reuse the shared primitive/integration tests rather than adding
  repetitive per-control tests. Report unresolved concrete sites before claiming completion.
- Produce the application-only path inventory. Exclude `code/`, plan artifacts, dependency/lockfile
  changes and unrelated work from this source commit. Earlier application edits and test receipts
  do not authorize its landing or waive its remaining coverage and verification obligations.

### Application adoption proof

Source baseline: `b8f787bf4f07719d277e49c266b35e8b807fa78a`. The
[application-only inventory](./button-input-and-focus.plan/apps.paths.txt) records 96 source paths:
67 tracked deltas and 29 new spec barrels (Draft Shell 2, Data 6, Slug 34, SLC Standard 11, SLC 43).
It includes the 17 application paths preserved from the earlier package split. Plan artifacts,
`code/`, dependency/lockfile deltas and unrelated work are excluded.

The application-wide source audit covered ordinary panel actions, extracted helpers, sample-loading
controls, generic inspectors, qualified JSX, aliases and barrel exports. Shared Dev enters through
spec/dev/test-only common barrels; UiDev preserves the domain Dev binding in Slug TreeHost,
Driver.TreeContent, Driver.Tree.Tmpl and Http.DataCards. SlugOrigin and ActionProbe remain unchanged.
Callbacks, labels, signal/reset/storage contracts and control order were retained; no primitive,
wrapper API, production barrel or dependency changes were needed.

Retained bare-control ownership:

- SLC Canvas.Project's clickable canvas and debug-gated inspector, MenuList buttons, Entry controls,
  ConceptPlayer back control, Playlist items and Programme's debug-gated inspectors are production
  component content, not harness-panel rows.
- SLC ConceptPlayer `-SPEC.ui.tsx` renders module-selection controls inside the subject's SampleBody;
  retain that embedded subject fixture rather than restyling it as a debug panel.
- Slug TreeHost `-spec/-ui.BackButton.tsx` is subject navigation, positioned by `-SPEC.tsx` at
  `Absolute: [-35, null, null, -35]`; retain its icon, mouse-down and disabled-opacity behavior.
  This exclusion does not extend to TreeHost's selected-path, slot-selection or LoadSample helpers,
  which use shared debug actions.

Verification through owning task surfaces:

| Scope | Evidence |
| --- | --- |
| All five application owners | `deno task check` passed |
| SLC UI and UI content | 11 suites / 32 steps passed |
| Slug UI | 25 suites / 140 steps passed |
| SLC Standard UI | 1 suite / 2 steps passed |
| Draft Shell UI | 1 suite / 1 step passed |
| Data full configured test task | 22 suites / 52 steps passed |
| Shared Dev / Button regression tests | 8 suites / 75 steps passed |
| Source formatting / whitespace | Exact-file formatting checks and `git diff --check` passed |

Tests used `--trace-leaks`. Exact-file lint remains non-green. Changed tracked files' HEAD blobs
were linted through stdin under the same owning configurations, preserving ts/tsx extensions, and
compared with current findings. Retained sites include type-only React imports, JSX brace spelling,
unused bindings and async-without-await factories; no introduced diagnostic was identified. SLC's
62 and Slug's 69 baseline findings remain unchanged. New barrels are clean. No Promise API changes,
dummy awaits, exclusions or lint suppressions were used.

These implementing-thread receipts do not establish browser layout, clipping, wrapping, focus
clearance, hit-target comfort or full-workspace verification. Shared primitive tests are regression
evidence, not per-application visual acceptance. The independent application review is recorded below.

### Application blind-review disposition and landing attribution

The human returned an independent GO with no migration-blocking defect or required correction.
The reviewer independently inspected all 96 paths, including all 29 new barrels, and searched other
deployment owners, aliases, qualified controls and helpers. The review confirmed the spec-only
import boundary, four UiDev collision sites, retained domain identities and unchanged behavioral
contracts. Its retained-control rationale agrees with the source ownership recorded above; no
correction was required.

Reviewer-reported proof, separate from the implementing-thread runs:

- All five application owners passed `deno task check --quiet`.
- Tests with leak tracing passed: Draft Shell 1 suite / 1 step; Data 22 / 52; Slug 25 / 140;
  SLC Standard 1 / 2; SLC UI/content 11 / 32; shared Dev, Button and KeyValue 26 / 242.
- Exact-file formatting passed for all 96 files; `git diff --check HEAD -- deploy/` passed.
- Lint remained non-green: Draft Shell 3, Data 6, Slug 69, SLC Standard 22, SLC 62 diagnostics.
  The reviewer attributed retained constructs by baseline source/diff comparison under unchanged
  owner configurations, not a separately executed baseline lint run. New barrels were clean.
- No browser was exercised; no wrapping, clipping, focus-clearance or hit-target acceptance follows
  from this verdict.

Reconciliation inspected commit `28630db9dc00ef71ecdb27d0255406cdf18dae0b`: exactly the 96 inventoried
application paths, with 67 modified files and 29 added barrels, 422 insertions and 386 deletions.
It contains no `code/`, plan, dependency or lockfile delta. At reconciliation HEAD `31d493c54`, all
recorded implementation commits were reachable, the deployment tree was unchanged since this
landing, and no deployment worktree/index delta remained. The inventories remain historical
source-unit snapshots, not current dirty-file manifests. No tests were rerun during reconciliation;
intervening lockfile/template commits do not acquire verification claims from the earlier receipts.

## Whole-plan closure boundary

Completion is established for the human-selected final scope: implemented and landed code,
automated verification at the recorded snapshots, adjudicated source reviews, inventories and
truthful reporting. The human's final instruction explicitly defers the remaining browser/input and
visual checks to their own work over time, outside this plan. No further code change, review pass or
browser automation is promised by this plan.

Deferred evidence remains unverified: native focus/input behavior, preference modes, actual KeyValue
layouts, and compact debug-control wrapping, clipping and hit-target comfort. Earlier layout
screenshots and the approved spacing reference do not establish that full matrix. The low-alpha
contrast caveat remains; no browser or accessibility-conformance claim is made. Retained baseline
lint findings are disclosed, not described as green. The later lockfile/template changes were not
retested as part of this reconciliation.

This is the completed plan snapshot under the explicit scope decision, not a claim that every
original browser criterion passed. Preserve the plan and its supporting inventories as the final
historical record before any separately authorized retirement. Preparing this snapshot does not
stage, commit or archive it, and grants no Git-mutation authority.

## Landing discipline

Mark commit items landed only after verifying their hashes.
This plan's creation commit is separate from its implementation arc. Preserve unrelated plans and
open work. Reviews and acknowledgements do not authorize Git mutations; obtain explicit authority
for each implementation landing. Never bypass signing or other provenance checks.
