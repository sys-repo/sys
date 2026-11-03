@sys.ui-components
shared-focus-style.plan.md
- [x] 721b9016c feat(ui-components): expose shared focus styling
- [x] 55a576e75 feat(ui-components): add Switch focus arrival

## Intent

Give Switch the same focus-arrival rhythm as Button: immediate emphasis → short hold → animated
settle into its resting focus appearance. Both adapters call one shared implementation of that
policy; preserving Switch's themed halo does not mean preserving static focus. Keep paint ownership
local and make the shared policy explicitly reusable by custom child-owned indicators.

The human explicitly selected the module boundary below and the extraction-before-adoption order.
They strongly rejected a new styling framework: `m.style` is a home for small presentation policies,
not CSS infrastructure. `@sys/ui-css` remains the styling mechanism.

This is a new follow-up. Leave
[button-input-and-focus.plan.md](./button-input-and-focus.plan.md) and its completed arc unchanged.
That plan is historical context for the landed Button contract, not a new implementation task or
an instruction to repeat its migration. Inspect live source before relying on its proof receipts.
Planning source baseline: `31d493c54`; subsequent work must establish its own current baseline.

## Ownership and module shape

Package: `code/sys.ui/ui-components`.
All source paths below are relative to that package unless explicitly stated otherwise.

```text
src/
  m.style/
    m.FocusStyle/                  shared focus-presentation CSS policy
  ui.react/ui/
    Button/u.focus.ts              Button appearance and override composition
    Buttons.Switch/u.focus.ts      Switch appearance and override composition
```

- Preserve the package's lowercase top-level grouping: `m.style`, alongside `m.webfonts` and
  `ui.react`. `m.FocusStyle` is the nested semantic module, not a new top-level React component.
- `m.style` initially contains only this earned capability. No themes framework, variant system,
  style registry, generic animation engine, provider, hook family or speculative sibling policies.
- Use the existing module grammar: explicit `mod.ts`/`t.ts` surface, local `common.ts` imports and
  small `.ts` implementation helpers. Do not create empty layers or files for symmetry.
- `@sys/ui-css` owns CSS composition, serialization, class generation and stylesheet mechanics.
  Reuse `css(...)` and `Style.Dom.stylesheet()`; do not reproduce those mechanisms in this package.
- The shared module owns focus-arrival policy and its reusable CSS generation. It must not branch
  on Button versus Switch or import either widget. Adapters provide component appearance and bind
  the generated policy to their existing styling surfaces.
- Keep `ui.tsx` readable: one call to the local focus helper and use of its result. Put animation,
  palette conversion, preference declarations and composition work in the adjacent `.ts` modules.
- Do not introduce another runtime object named `Style`; that name already belongs to `@sys/ui-css`.

## Shared contract

Expose one small, typed `FocusStyle` API around a single policy generator. Shape its concrete input
and result against the three real uses: Button root, independently painted child, and Switch halo.
Before runtime implementation, demonstrate the type contract with one compact call site for each;
these must earn every public input and result member. Treat API sketches as proposals until those
uses establish their shape. Private helpers are allowed; duplicated policy is not.

The contract must distinguish:

1. Appearance: arrival paint, settled paint and a static forced-colour treatment.
2. Activation: the element matching native `:focus-visible` versus the element painting the indicator.
3. CSS identity: stable rule/keyframe ownership, isolated across recipes and instances.

These are CSS presentation inputs, not React component props or interaction state. Do not add public
timing/easing controls, arbitrary animation sequencing or per-widget copies of the default timing.
No mandatory broad CSS schema or callback-based rendering framework is earned by these uses.

### Default policy

- Immediate accent on entering the active focus presentation.
- Hold for 70ms, then settle once over 220ms with `ease-out`.
- Preserve Button's backwards-filled delay: the initial emphasis is immediate, not delayed by 70ms.
- Settled paint is the ordinary declaration, not an appearance held only by forwards fill. A
  from-only keyframe can settle to that declaration; missing/disabled motion must not hide focus.
- Animate only indicator paint. No geometry, whole-control opacity, scaling, pressed movement or
  layout changes. Switch track/thumb transitions remain a different concern.
- Leaving the active condition removes the arrival animation; a later entry can start it again.
  Do not add JavaScript focus state, timers, effects, RAF, observers, forced reflow or remount keys.
- Reduced motion uses the settled treatment immediately, without the accent phase.
- Forced colours uses a static, usable system-colour indicator. The shared module owns preference
  policy and scoping; the adapter supplies the appropriate paint. Do not rely on shadow alone or
  use `forced-color-adjust: none`.
- Reuse the existing stylesheet owner and lifecycle. No new global initialization flag, appended
  style-element manager or DOM work at module import. Do not promise new SSR/iframe support.

### CSS identity and override safety

- Different recipes must not register conflicting definitions under the same keyframe name.
  Names must remain stable across ordinary rerenders and palette-value changes; avoid fresh names
  per render. Separate stable paint structure from per-instance colour values where needed.
- Repeated equivalent use must deduplicate through the existing stylesheet owner. Multiple
  instances and nested controls must not leak palette, activation or preference state.
- Accept all target styling before registration and return a final class for direct application, not
  a recomposable `Style.Transform.Result`. Register scoped preference rules against that final
  class/indicator target after its ordinary declarations. Recomposition through `css(...)` carries
  transformed `.style`, not attached rules: see `transform`/`wrangle.input` in
  `../ui-css/src/m.Style/u.transform.ts`. Recomposition must not silently detach preference policy.
  Make this terminal-composition contract explicit in public types and examples; no new registration
  API, stylesheet-parser machinery or changes to `@sys/ui-css` are needed.
- Preserve the animation-name-last shorthand ordering that keeps preference-mode `none`
  unambiguous. Do not concatenate or parse arbitrary caller animations.
- Preserve original caller style input through final composition. Early normalization can erase
  explicit `undefined` clears in templates/nested input; existing Button regressions pin this.
- Complete caller focus replacement means no default focus variables, animation or scoped media
  policy leaking onto that target. Custom indication must not be silently opted back into defaults.
- Caller-owned root animation, including longhand/timing-only declarations, keeps default focus
  static instead of being overwritten. A separately painted child may own its own animation.
- Share identical mechanical support where warranted; do not copy the same animation/cascade
  machinery into both adapters. Component-specific appearance and public override semantics remain
  at their owners.

### Public surface and dependency boundary

Custom child compositions are an intended consumer, so the reusable API needs an intentional public
leaf, not imports into Button internals. Planned leaf: `@sys/ui-components/style/focus`, exporting
`FocusStyle` from `src/m.style/m.FocusStyle/mod.ts`, with its public types on the existing type spine.
Do not add redundant root, React-root or convenience aliases for this new API.

The package and React runtime roots currently export package identity only. Preserve that contract
and extend `src/-test/-exports.leaf.test.ts` for the new leaf rather than reopening the roots.

Keep the styling module React-independent in both API and runtime dependency graph. Inspection of
`src/common/libs.ts` found React-facing helpers and Motion, so re-exporting that entire runtime barrel
would not establish this boundary. Give the `m.style` module a narrow local dependency lane using
existing system helpers; do not perform a package-wide common-barrel refactor. Follow canonical type
and helper imports, including `Is` for guards. No new package dependency is required.

## 1. Expose shared focus styling

Commit: `feat(ui-components): expose shared focus styling`.

Deliver a complete, useful extraction before changing Switch:

- Implement the shared module, public types/export, focused documentation and proof.
- Refactor `src/ui.react/ui/Button/u.focus.ts` to consume it. Keep Button-specific defaults, tokens
  and appearance local, without leaving a second implementation of timing/keyframe/preference logic.
- Preserve Button's public props, DOM, event behavior, labels, availability, pressed feedback,
  focus geometry and settled appearance. Dev.Button and adopted debug panels are not migration targets.
- Preserve the four public `--sys-button-focus-*` palette/geometry tokens and their documented
  override behavior. Default 1px radius, 2px outline, 2px offset, blue accent and 20%-alpha blue rest
  remain unchanged. No claim of 3:1 resting contrast follows from this extraction.
- Preserve complete `:focus-visible` replacement for plain, array and transformed inputs, explicit
  clears, custom-root ownership and caller-animation fallback.
- Keep Switch source and behavior unchanged in this commit. Its inspected requirements inform the
  shared contract, but its adoption belongs exclusively to item 2.

### Child-owned reuse is part of extraction proof

The existing Button specimen uses a parent custom property to reveal a static child indicator.
That is not already an animated shared-policy consumer. Merely moving Button's helper and retaining
that static demonstration is insufficient.

Provide one explicit example of a child-owned indicator consuming the shared policy:

- The composition site connects the parent's native focus-visible condition to the child's animation
  activation through CSS. State the connection in the API/example; do not depend on animation
  inheritance or the child's own `:focus-visible` matching. Any returned ancestor binding contains
  only documented, composable CSS declarations; class-bound preference rules remain at the final
  indicator target. Do not require callers to reconstruct private binding structure.
- Activation must select/remove the child's animation, not only reveal it with opacity. Document
  the inactive appearance, active settled appearance and preference fallbacks.
- The child owns its markup and paint and receives ordinary presentation inputs. It must remain
  independently renderable without Button and work through a neutral wrapper.
- No child cloning/recognition, private selectors, context, event forwarding or new Button render API.
  A portal outside the CSS ancestry is not part of the inheritance contract.
- The root replacement still opts out of Button's entire default policy. The custom composition's
  reuse is explicit, not a default policy reinserted behind the caller's override.
- Preserve the static/custom-root examples and default bare specimen. Add or extend only the
  example needed to prove reusable arrival; no new gallery framework or persistent timing knobs.

### Extraction proof

- Add focused shared-owner tests for generated declarations, stable identity, collision isolation,
  repeated registration, independent instances and reduced-motion/forced-colour rules.
- Pin terminal composition with one owner regression: supply caller overrides through the public
  entry point and assert preference selectors target the returned final class in the correct order.
- Reuse the existing Button focus suite, especially template/explicit-clear regressions and
  caller-animation tests. Do not replace integration assertions with helper-only snapshots.
- Prove the child connection, generated activation/cancellation declarations, neutral-wrapper
  composition and retained child DOM identity. These are not browser animation/replay observations.
- Verify the public leaf/runtime identity, type contract, package-only roots and narrow runtime
  import graph. Use the canonical non-UI module template when scaffolding the new module.
- Run Button/KeyValue and Dev regressions as well as the package checks below. Switch's existing
  tests should remain green without source changes.
- Residue pass: remove superseded implementation, avoid redundant exports/defaults and keep the
  root renderer uncluttered. Tests/docs/cleanup belong in this commit, not a third cleanup item.

## 2. Add Switch focus arrival

Commit: `feat(ui-components): add Switch focus arrival`.

After item 1 has landed separately, consume its established API:

- Add `src/ui.react/ui/Buttons.Switch/u.focus.ts` and move Switch focus-specific declarations and
  colour conversion out of `ui.tsx`. Do not move unrelated rendering or interaction code merely to
  make the diff larger or more symmetrical with Button.
- Use the same shared arrival policy. Do not copy timing, keyframe or preference-registration code.
- Preserve the native `button`, `type=button`, switch role, checked/label semantics, disabled
  behavior, callbacks, controlled value and primary-activation ordering.
- Preserve track/thumb sizes, colours, movement and `transitionSpeed`; that prop does not become a
  focus-animation setting. Do not change the existing theme API or silently widen `style` from its
  current `CssValue` contract merely to match Button.
- Preserve full caller focus replacement and caller-animation ownership. Document the resulting
  styling contract at the Switch owner; do not add generic focus props to both widgets.

### Switch appearance boundary

The human selected shared animation with local paint: Switch keeps its rounded, theme-derived 3px
halo and gains immediate stronger emphasis, the shared 70ms hold and 220ms settle to its existing
resting treatment. Its adapter supplies paint and calls `FocusStyle`; it does not implement a second
animation path. Reduced-motion, forced-colour and caller-ownership fallbacks still apply.

For string theme colours the current rest uses 28% alpha; numeric theme colours pass through
`Color.toGrayAlpha` and must not be treated as strings or silently given different resting semantics.
Use existing colour helpers and cover both input forms.

Palette/geometry unification with Button is not part of this work. Do not switch Switch to Button's
blue/20% palette or copy its outline geometry. Any later visual unification requires a separately
agreed appearance change; the full shared arrival animation is required here.

Provide a real outline fallback in forced colours, scoped to focused presentation. Preserve normal
UA colour adjustment. Keep this fallback and its geometry at the Switch adapter, not as a
Button-specific assumption inside the shared generator.

### Switch specimen and proof

- The current `-spec/-SPEC.tsx` specimen toggles state on `onMouseDown`. For a keyboard-capable
  demonstration, use the existing `onToggle` payload in that specimen only; do not alter production
  event semantics or introduce synthetic keyboard-to-mouse behavior.
- Test default focus declarations, theme/numeric colour handling, stable animation identity,
  preference fallbacks, custom-focus replacement, caller-animation preservation and unchanged
  native semantics. Keep existing toggle/theme/spec regressions.
- Inspect focus appearance alongside track/thumb transitions; activating a focused switch must not
  intentionally restart arrival or animate the whole widget. Prove stable declarations in automated
  tests and distinguish those assertions from browser replay behavior.
- Re-run the shared policy, Button/KeyValue and Dev tests after Switch integration. A passing first
  extraction does not replace final integration proof.

## Verification and evidence discipline

Read the live owning `deno.json` tasks and permission presets before execution. Current declared
surfaces, from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks ./src/ui.react/ui/Button/-test/ ./src/ui.react/ui/KeyValue/-test/ ./src/ui.react/dev/-test/ ./src/ui.react/ui/Buttons.Switch/-test/
deno task check --quiet
deno task dry --quiet
deno task test --trace-leaks --reporter=dot
```

For item 1, additionally run the new shared-owner tests and the public leaf export test. Run
formatting/lint against exact changed files, including new files, and inspect the complete diff.
Attribute existing diagnostics to inspected baseline source; do not suppress lint, insert dummy
awaits, change Promise contracts or clean unrelated code to manufacture a green report.

New shared behavior should have focused failure evidence before implementation. Behavior-preserving
Button extraction is proven by retained owner/integration contracts, not a claim that helper tests
alone establish equivalence. Do not duplicate the complete interaction matrix for every consumer.

Human browser comparison should cover arrival/settle, focus retention while toggling, child-owned
indication, Light/Dark and named palettes, disabled state, reduced motion and forced colours.
Report actual observations and untested cases separately. No animation simulator, computed-style
sampling framework or new browser harness is part of this plan. Source and DOM-mock tests do not
prove native focus heuristics, painted contrast, layout, clipping or animation replay.

The earlier plan's browser deferral is historical; it supplies no passing evidence for this work.
Keep code/test delivery and any human visual acceptance distinct. Do not invent an approval gate,
claim visual acceptance or silently expand this plan into exhaustive browser certification.

## Commit and handoff discipline

- Exactly two implementation commits are intended. First establish and prove the reusable policy;
  then adopt it in Switch. Add a third only for a concrete new boundary explicitly agreed with the
  human, not for routine tests, documentation, review or cleanup.
- No dependency upgrades, generated output, deployment migrations, framework changes, global
  styling changes or unrelated UI fixes. The new leaf declaration is an intentional export change,
  not authority to run workspace dependency preparation.
- Preserve unrelated work and the completed Button plan. This plan and any supporting records are
  workflow artifacts, separate from the implementation commits.
- The new thread must read applicable canon, inspect current source and establish the current arc
  item before implementation. Writing this plan is not implementation or Git-mutation authority.
- Human-owned landing remains explicit. Verify actual reachable hashes before checking either row.
  Record proof at its real source/dependency snapshot and adjudicate material review findings against
  source. Review is not a separate arc item or automatic extra gate.

## Item 1 implementation evidence

Source/dependency baseline: `fbe4e0a539e36f38bf1ed74879b9c5cb7b9274e1`, plus this item's
source changes. No dependency files, Switch source or `@sys/ui-css` source changed.

- Scaffolded `src/m.style/m.FocusStyle` through the canonical non-UI `m.mod` template.
  Demonstrated the typed Button, independent-child and halo calls before runtime implementation.
- `FocusStyle.compose` returns a terminal class; optional `via` adds a composable native-host
  activation binding. Paint stays at the component/child owner. One implementation owns timing,
  stable paint-structure keyframes, preference scoping and caller-animation fallback.
- Button now supplies its existing four public tokens and outline recipe. Its renderer and
  interaction code are unchanged. The static child example remains; the added animated child
  uses the public leaf, applies the final class directly and works through a neutral wrapper.
- Shared-owner tests first failed with eight failing steps, then passed after implementation.
  Coverage includes final-class preference ordering through the public leaf, recipe/palette
  isolation, preference-only recipe identity, registration reuse, original-input clears,
  caller animation ownership and child activation/cancellation declarations.
- Source import audit: the new value-import chain ends at `m.style/common.ts`, whose only runtime
  exports are `@sys/std/is`, `@sys/std/obj` and `@sys/ui-css`. The broad package type spine is an
  `export type` edge, not a runtime dependency. The inspected CSS dependency barrels contain
  CSS/colour/std helpers, not component, Motion or devharness imports. `deno info` included type
  branches and was not treated as runtime-only graph proof.

Review adjudication retained both activation forms and component-owned paint: Button, the independent
child and the existing Switch halo requirements earn that distinction. No material defect in the
supplied source/test review required a behavior or API correction. The style follow-up moved paint and
declaration fixtures into test-local owners, named test cases and factored crowded expressions.
Expected CSS remains independent of production helpers; missing required declarations still fail.

Validation from `code/sys.ui/ui-components`, rerun after the style cleanup:

- FocusStyle + Button + KeyValue + Dev + unchanged Switch + public-leaf tests, with trace-leaks:
  **31 passed, 277 steps, zero failures**.
- `deno task test --trace-leaks --reporter=dot`: **97 passed, 670 steps, zero failures**.
- `deno task test --doc ./src/m.style/m.FocusStyle/mod.ts`: **1 passed, zero failures**.
- `deno task check --quiet`: passed.
- `deno task dry --quiet`: passed with three dynamic-import warnings in the existing export-test
  helpers. Their unchanged import expressions were verified against baseline `HEAD`.
- Exact-file `deno fmt --check`: 19 changed/new package files passed; `deno lint`: 17 TypeScript
  files passed. Cleanup used surgical edits and new fixture files, not a formatter write.
- `git diff --check`: passed. Switch and `@sys/ui-css` diffs are empty.

These are code, generated-declaration and DOM-mock proofs, not browser observations. Native focus
heuristics, painted contrast/clipping, actual arrival/replay and preference rendering have not been
visually tested. Human visual acceptance is not claimed. Switch adoption remains item 2 only.

## Item 2 implementation evidence

Source/dependency baseline: `721b9016c7bd00bdeee73057242413086db0ffbe`, plus this item's
source changes. Button, the shared FocusStyle owner, track/thumb renderers, dependency files and
`@sys/ui-css` are unchanged.

- Switch's local `u.focus.ts` supplies a 3px halo recipe to `FocusStyle.compose`; the renderer
  applies the terminal class directly. No timing, keyframe or preference machinery is duplicated.
- Arrival uses the theme colour at full opacity. Rest preserves string colour at 28% alpha and
  numeric colour through `Color.toGrayAlpha`, including transparent zero. Forced colours uses a
  static 3px `Highlight` outline at zero offset and removes shadow, without disabling UA adjustment.
- Caller focus replacement and explicit clears omit the default policy. Caller root animation,
  including longhands and timing-only declarations, retains ownership and makes default focus static.
  The public `CssValue` style contract remains unchanged; the Switch type docs state these boundaries.
- Native control semantics and production activation handlers are preserved. The specimen now consumes
  `onToggle.next`, rather than toggling on mouse-down. Existing toggle/theme/spec tests remain;
  added click-routing regressions cover zero-detail primary clicks and rejection of non-primary clicks.
- New focus tests had twelve failing steps before the adapter was added. Passing assertions cover
  Light/Dark named palettes, numeric paint, final-class preference ordering, replacement/clear behavior,
  caller animation ownership, stable keyframe identity, palette isolation and deduplication.
- A controlled-toggle regression retains the focused native root, child identity and focus declarations
  while verifying the existing track/thumb movement and `transitionSpeed` declarations. This does not
  prove browser focus heuristics, keyboard click synthesis, animation replay or painted transitions.

Validation from `code/sys.ui/ui-components`:

- Switch owner tests with trace-leaks: **4 passed, 26 steps, zero failures**.
- FocusStyle + Button + KeyValue + Dev + Switch + public-leaf tests with trace-leaks:
  **32 passed, 297 steps, zero failures**.
- `deno task test --trace-leaks --reporter=dot`: **98 passed, 690 steps, zero failures**.
- `deno task check --quiet`: passed.
- `deno task dry --quiet`: passed with the three existing dynamic-import warnings in the unchanged
  export-test helpers.
- Exact-file `deno fmt --check` and `deno lint`: all eight changed/new TypeScript files passed.
  Changes used surgical edits and new helper/test files, not formatter writes.
- `git diff --check`: passed.

Browser appearance, painted contrast/clipping, native focus/keyboard heuristics, actual replay and
preference rendering remain unverified. No browser acceptance is claimed.

Pre-review readability pass inspected all eight item 2 package files and changed only the focus test:
expected paint, declaration snapshots, media rules and palette comparisons now have local names;
setup and assertions are separated without introducing another helper abstraction. Assertions and
literal policy expectations are preserved. After cleanup, the focused integration run again passed
**32 suites / 297 steps**; exact-file formatting and lint passed for all eight files, and
`git diff --check` passed. The full-package, check and dry-run receipts above precede this test-only
cleanup; they were not rerun for it.

### Item 2 review correction

Accepted the supplied blind review's numeric-colour finding against the same source/dependency
baseline: reparsing `Color.toGrayAlpha(±1e-7)` through `Color.alpha` rejects exponent notation and
throws during Switch rendering. Permanent render regressions reproduced that exact TypeError for
both signs before the correction; the other eighteen focus steps passed.

The Switch adapter now selects an opaque signed-gray endpoint before colour normalization. It does
not reparse fractional resting alpha, and zero retains black RGB. Resting conversion, shared policy,
colour helpers and interactions are unchanged. All five numeric cases use literal expected paint,
including ordinary positive/negative values, zero and the two tiny values.

After correction: Switch **4 suites / 28 steps**, focused integration **32 suites / 299 steps**, and
full package **98 suites / 692 steps** passed with trace-leaks and zero failures. Package check and
publish dry-run passed; the same three pre-existing export-test dynamic-import warnings remain.
Exact-file formatting and lint passed for all eight item 2 files. The supplied review reported no
other material findings; the correction has local red-to-green proof, not a second blind approval.
