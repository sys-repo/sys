@sys.ui-components
dev-list-controls.plan.md
- [x] [bullet-list-interaction.plan.md](./bullet-list-interaction.plan.md)
- [x] 2826fbbba feat(ui-components): add BulletList item padding and neutral action markers
- [x] 76acf12ed feat(ui-components): add Anchor standards reference footer
- [x] eba6f07ee feat(ui-components): add opt-in monospace anchors
- [x] e2c36ae37 feat(ui-components): expand Anchor reference specimen controls
- [x] 5b224be0a feat(ui-components): add Dev.List for controlled choices and commands
- [x] e0b160c32 refactor(ui-components): adopt Dev.List in BulletList and Anchor specimens
- [x] aed4552ca refactor(ui-components): colocate Dev primitive implementations and contracts
- [x] e0cee8f82 refactor(ui): adopt Dev.List for passkey fixture selection
- [x] 9128e5fbf style(ui-components): arrange Anchor sample states in two columns

## Purpose and planning owner

Deliver the reusable Dev authoring surface that motivated the BulletList tidy-first work: express a
list of choices or methods without rebuilding row markup, selection decoration, or ID dispatch in
every specimen. BulletList cleanup is the foundation, not the end-user outcome.

This file is the single governing design/implementation plan for Dev.List, its neutral action-marker
prerequisite, the three initial consumer adoptions, and Anchor's two-column sidebar follow-up.
Public source types and runtime remain API truth. Planning and review do not authorize implementation or Git mutation. The arc records the
ordered implementation history and actual landing identities.
Labels remain non-interactive: strings are literal, and rich rendering is explicit React-node
composition. Shared Markdown label presentation and a shared Dev composition specimen are deferred,
outside this plan's delivery boundary. No label interaction redesign belongs in this work, and the
completed foundation and its marker, padding, and Anchor follow-ons remain unchanged.

Repository: `/Users/phil/code/org.sys/sys`. Reconciliation baseline: `66a661989`. Primary
implementation owner: `code/sys.ui/ui-components/src/ui.react/dev/`. Public surface:
`@sys/ui-components/react/dev`, exposed as `<Dev.List />`. Public contracts: `t.Dev.List.Props`
and `t.Dev.List.Item` through the existing Dev type spine and package type pool.

### Relationship to existing plans

- [bullet-list-interaction.plan.md](./bullet-list-interaction.plan.md) is the archived foundation
  record. Its final completed snapshot is recoverable at `4c7aa8041` at the linked repository path;
  `0d9792046` subsequently removed it. Both foundation commits remain reachable. Preserve the
  checked reference and its stable relative path for historical recovery, not live navigation.
  Preserve its proof limits; no general BulletList redesign is needed. Its former Dev proposal is
  superseded by this plan, not a parallel live design.
- [dev-composition-primitives.plan.md](./dev-composition-primitives.plan.md) establishes the
  existing Dev/Harness boundary and shared Markdown composition. Its pending KeyValue controls work
  is a different concept, not a prerequisite, alias, or substitute for this list.
- [button-grammar.plan.md](./button-grammar.plan.md) concerns filled action-button presentation and
  width groups. Neither is required here; a solid list marker is not a filled action button.
- [passkey-panel.plan.md](../@sys.ui/passkey-panel.plan.md) owns Passkey sections, integration, and
  authentication. This plan owns only its fixture-selector presentation migration. Do not duplicate
  that plan's arc or change its runtime, fixture data, navigation, or persistence policy.
- The earlier Markdown-backed help plan established rendering and reuse, not this interactive list.
  Do not resurrect it or start another controls-framework plan.

The foundation's baseline follows the system's typed public surfaces, caller-controlled state,
Button-owned activation, semantic lists, and ordinary Tab navigation. This is not an assertion of
complete W3C/WCAG conformance or browser/AT acceptance. No new standards audit was performed here.

## Historical landing reconciliation

At `66a661989`, inspected reachable commits, their source/test diffs, current public surfaces, and
consumer composition establish these mappings from the original planned subjects:

- `fix(ui-components): render neutral filled markers for BulletList actions` maps to the marker
  runtime, contract, and selection regressions in `2826fbbba`.
- `feat(ui-components): expose BulletList item padding` maps to the public Button-padding seam and
  layout regressions in that same commit. Its Anchor reference application and composition
  regressions are in `e2c36ae37`. The opening arc records the combined primitive landing once and
  the reference adoption separately, in actual landing order.
- `feat(ui-components): add opt-in monospace anchors` maps to the API/native rendering and
  Anchor.UI/Anchor.Link regressions in `eba6f07ee`. The originally grouped standards footer is a
  separate landing, `76acf12ed`; shared specimen controls, persisted mono/reset, prefix-free labels,
  and compact reference composition are in `e2c36ae37`. These were not one commit.

Adjacent `74d3a96ce` changes Dev.Link from an alias to a wrapper defaulting `resource='web'`;
explicit `resource={undefined}` still opts out. Its forwarding regression includes `mono`, and the
Anchor reference exercises the actual wrapper. This is existing context to preserve, not a
Dev.List landing or a reason to alter the remaining migration boundaries.

The archived foundation's final snapshot and removal were inspected without restoring it. No
subsequent relevant source history through this baseline contradicts the mapped landings. Existing
regression source establishes coverage intent, not fresh passing execution: no behavioral tests,
typechecks, browser probes, or AT checks were run for this reconciliation. Historical proof limits
remain in force; the subsequent human label-scope decision is recorded below.

## Concrete consumers and scope

Paths below are relative to repository root.

### A. BulletList's own Samples selector: controlled choice

`code/sys.ui/ui-components/src/ui.react/ui/BulletList/-spec/-SPEC.Debug.tsx`

The standard/stress/empty rows write `p.sample.value`. Render selection from `v.sample`, not
`v.selected`: the latter belongs to the specimen's subject list. Keep existing persistence, reset,
redraw ownership, and unrelated size/columns/host/selection controls unchanged. The subject
continues to render production BulletList; only the debug Samples group adopts Dev.List. Use
`Sample States` (no colon), matching Anchor, with prefix-free `standard`, `stress`, and `empty` labels.

### B. Anchor Sample States: commands

`code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.Samples.tsx`

Presets apply explicit partial patches. Omit selection before and after activation. Labels omit the
redundant `sample:` prefix beneath the Sample States heading. Preserve destinations, defaults and
clears, retained truncation/width values, persisted knobs, and `examples: 'none'`. Do not infer a
selected preset or replace the local patch policy with a shared patch engine. The direct BulletList
consumer established `size='sm'` and `itemPadding={[0, 8, 0, 5]}` as the reference; Dev.List supplies
both defaults after migration. Direct BulletList adoption is baseline evidence, not the Dev authoring capability itself.

The subsequent human scope check-in requests a fixed two-column Sample States list in Anchor's
DEBUG panel. Set `columns={2}` on this consumer only; retain item/DOM order, partial patches,
unselected command semantics, compact insets, and the Light panel theme. Do not add a knob,
persistence field, responsive policy, or a Dev.List/BulletList default change. Adapt the existing
presentation regression using a two-item, two-column production reference; verify the emitted track
count under both subject themes and retain all preset behavior assertions. Browser inspection is
needed to judge compactness, wrapping, and focus clearance at the actual sidebar width.

#### Anchor reference and migration checklist

Anchor's Sample States is the concrete command-list reference for Dev.List: a real consumer built
from production BulletList, not a separate list implementation. Preserve its compact presentation
and behavior while moving reusable row authoring into Dev. Do not extract the whole DEBUG panel.
Human screenshot feedback supports this reference appearance; it does not establish Dev.List
implementation or complete browser/AT acceptance.

Keep the reference's 5px left / 8px right row insets at rest and during focus; do not shift content
only when focused. Apply it inside Button through BulletList's explicit `itemPadding` seam, not private
selectors or larger outline offsets. Vertical padding stays zero to retain the compact rhythm.
Button keeps its focus colour, stroke, offset, motion, and preference handling; the mockup's brighter
outline is not a new focus recipe. Other production lists retain their existing padding defaults.

Source and proof anchors:

- [Samples](../../../code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.Samples.tsx):
  prefix-free labels, stable IDs, explicit preset patches, and the compact Dev.List composition.
- [Debug](../../../code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-SPEC.Debug.tsx):
  canonical `D.name` heading, persisted knobs/reset, section titles, and spacing above the Debug HR.
- [Root](../../../code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.Root.tsx):
  actual Anchor.UI/Anchor.Link/Dev.Link specimens and shared mono/truncation forwarding. These are
  the subject, not the sidebar's list implementation.
- [Registration](../../../code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-SPEC.tsx) and
  [standards footer](../../../code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.StandardLink.tsx):
  harness wiring and inherited-font `HTMLAnchorElement · WHATWG` reference stay outside Dev.List.
- [Sample regressions](../../../code/sys.ui/ui-components/src/ui.react/ui/Anchor/-test/-spec.samples.test.tsx)
  and [examples regressions](../../../code/sys.ui/ui-components/src/ui.react/ui/Anchor/-test/-spec.examples.test.tsx):
  preserve patch/default/clear behavior, persistence/reset, mode exits, mono/width controls,
  prefix-free labels, compact composition, and absence of remembered selection.
- [BulletList](../../../code/sys.ui/ui-components/src/ui.react/ui/BulletList/ui.tsx) and
  [Bullet](../../../code/sys.ui/ui-components/src/ui.react/ui/Bullet/ui.tsx): layout and subtle filled
  command markers remain production-owned. Do not copy colour, alpha, geometry, or event recipes.
  [Layout regressions](../../../code/sys.ui/ui-components/src/ui.react/ui/BulletList/-test/-ui.layout.test.tsx)
  prove item-padding forwarding, omitted/zero values, unchanged content cells, and focus-stable
  declarations against the public Button. Browser geometry still needs visual confirmation.

Migration cleanup:

1. Use the existing [Dev types](../../../code/sys.ui/ui-components/src/ui.react/dev/t.ts) and
   [aggregate](../../../code/sys.ui/ui-components/src/ui.react/dev/mod.ts), preserving the
   [non-interactive label contract](#label-contract).
2. Bind each Anchor preset's explicit patch to its row's `onActivate`. Remove the direct BulletList
   import and parallel ID lookup from Samples; retain the local preset data and caller-owned state.
3. Remove the consumer's explicit `size='sm'` and `itemPadding={[0, 8, 0, 5]}` when Dev.List supplies
   those tested defaults. Keep production BulletList's defaults, caller overrides, prefix-free labels,
   and omitted selection.
4. Adapt the linked regressions to exercise the real Dev.List composition, not a lookalike. Keep
   primitive rendering/event proof with BulletList/Button rather than duplicating it downstream.
5. Migrate the BulletList Samples choice group alongside Anchor under the first-consumer arc item.
   Leave headings, HR spacing, controls, Root, registration, and footer with their existing owners.
   Remove only superseded adapter/dispatch code; preserve unrelated work and historical proof.

### C. Passkey Property States: controlled fixture choice

`code/sys.ui/ui/-sample/passkey/ui/-spec/-SPEC.Debug.tsx`

Render selection from `v.fixture.id`; invoke the existing `debug.select(fixture)`. That method both
updates the fixture and clears captured intent. Reselecting the current fixture must still invoke
that method; do not optimize away a same-ID activation. Replace the tree-emoji selection suffix with
the shared marker and pressed state. Keep the fixture labels and `(simulated)` disclosure.

Theme/debug persist; fixtures, callback availability, and captured intent are intentionally
EPHEMERAL. Dev.List must not change that split. Preserve reset to `Fixtures[0]`, captured-intent
behavior, subscription disposal, navigation, and the separate integration specimen. This is not
WebAuthn, authentication, or real-operation work.

### First migration boundary

Adopt A and B together after the Dev contract is implemented and proven; then C demonstrates reuse
across packages. The supplied screenshots are presentation evidence, not new runtime/AT proof. The
debug panels are light even when their subjects are dark: use the panel's resolved theme, not
`v.theme` merely because that is the subject's theme knob.

A wider scan/migration follows only after these consumers prove the API. Prose.Markdown Samples and
TreeHost spinner controls are known candidates, not automatic additions. Do not create a blanket
rule that every Dev.Button belongs in a list; navigation, independent toggles, and isolated reset
controls may retain their current owners.

## Design decisions

### Ownership

- SPEC/debug signals own state, subscriptions, persistence, reset, and domain methods.
- Dev.List owns convenient row authoring and translation into the production list contract.
- BulletList owns list layout, marker presentation, and controlled accessible state.
- Button owns pointer/keyboard/assistive activation, disabled behavior, cancellation, and focus.
- Existing Markdown parsing and rendering stay with their owners; no shared renderer work is
  included in this plan.

No whole-debug-store prop, internal selection, last-click memory, automatic signal mutation,
LocalStorage access, or domain subscription inside Dev.List. A method may write state; that does not
make its row a selected choice. Selection describes current caller state, not successful work.

### Label contract

The human chose this boundary after the independent review:

- Ordinary strings are literal; Dev.List never interprets them as Markdown automatically.
- Explicit React-node composition opts into non-interactive rich presentation. No new label-data
  grammar, mode flag, or implicit renderer is needed.
- Labels follow BulletList's existing non-interactive action-label contract. Callers provide a
  non-empty accessible name, including when the stable ID is an explicitly labelled empty string;
  ReactNode typing alone cannot establish that obligation.
- Active inline links and any associated production-row interaction redesign are outside this
  plan, not an undelivered requirement or a prerequisite. Any future addition is separate work;
  reserve no speculative API or machinery for it here.

This is a resolved scope decision, not a new gate. Shared non-interactive Markdown presentation,
wrapping, and alignment are deferred outside this plan; the existing label contract remains unchanged.

### One authoring surface, two uses

Use `<Dev.List />`, consistent with the existing directly callable Dev.Button/Divider surfaces.
Rows carry a stable unique `id`, a label, optional `enabled`, and a required `onActivate` method.
Associate the method with its row; do not require callers to maintain a parallel ID dispatcher.
Forward the existing typed BulletList activation args rather than defining another event vocabulary.

Only row methods dispatch. Do not also expose a competing list-level activation callback. Each
eligible activation invokes exactly one current row method; never invoke on render, cache a stale
closure, or infer selection from the method's return value. Callers own async work, error handling,
and any externally supplied disabled/busy state; this is not a task runner.

Preserve readonly inputs, stable IDs including explicitly labelled empty IDs, and literal-ID
inference. Selection and handlers must not widen the inferred item ID domain. Current BulletList
props place `NoInfer` on the activation handler, not on `selected`; simply inheriting those props
does not prove this stronger adapter requirement. Existing consumer IDs typed as `string` cannot
recover a finite literal union; prove the stronger inference separately with dedicated literal
inputs. Prove rejection of out-of-domain selected IDs and incompatible handlers, with readonly
selections and explicitly labelled empty IDs. Keep public contracts explicit in `dev/t.ts`, reusing
BulletList's semantic types rather than mirroring their fields.

Examples below illustrate the public contract; consumer migration remains a separate arc item.

Selection, using the ordinary SPEC signals and redraw subscription:

```tsx
<Dev.List
  theme={theme.name}
  selected={v.sample}
  items={(['standard', 'stress', 'empty'] as const).map((sample) => ({
    id: sample,
    label: `sample: ${sample}`,
    onActivate() {
      p.sample.value = sample;
    },
  }))}
/>;
```

Methods, with no selection state:

```tsx
<Dev.List
  theme={theme.name}
  items={[
    { id: 'reset', label: 'Reset', onActivate: debug.reset },
  ]}
/>;
```

The command example illustrates the API; it is not an instruction to move every reset control.
Anchor's real methods remain its explicit preset patches. Direct BulletList remains an economical
escape hatch for central dispatch, especially simple choice setters. Dev.List earns its adapter cost
by binding actual objects/patches to row methods in Anchor and Passkey, not by claiming every
selection list becomes shorter. Do not force unrelated direct consumers through it.

- Omitted/undefined `selected`: commands, no pressed-state semantics.
- Defined ID: caller-controlled choice.
- Defined array, including `[]`: caller-controlled active set, possibly empty.
- No automatic toggle. Multi-selection callers may use the existing `BulletList.toggle` helper.
- A refused or delayed caller update leaves selection unchanged until new props arrive.

The three current groups do not require interleaved choices and commands. Start with homogeneous
lists and compose separate groups where needed. A command inside a defined-selection list would
currently receive pressed semantics; do not claim mixed-row support. A demonstrated mixed-row need
requires a deliberate contract extension, not a permanently-unselected-command workaround.

Forward only earned presentation seams: theme, style, named size, item padding, and explicit columns.
Dev.List defaults to `size='sm'` and `itemPadding={[0, 8, 0, 5]}`, with caller overrides. Production
BulletList keeps its `md` size and omitted padding defaults. Reuse BulletList's size mapping and
Button's padding API, inherit the host font family, and keep section titles/dividers outside the list.
Do not invent responsive collapse, a heading/schema language, or a second spacing/focus recipe.

### Neutral command markers: small prerequisite, no new component

Use Bullet's existing `filled` state for commands. BulletList owns the state projection, not a
second marker-colour recipe:

| Resting meaning            | Marker                     | Accessible state     |
| -------------------------- | -------------------------- | -------------------- |
| Command: selection omitted | Bullet's subtle filled dot | No `aria-pressed`    |
| Unselected choice          | Bullet's hollow marker     | `aria-pressed=false` |
| Selected choice            | Bullet's selected marker   | `aria-pressed=true`  |

Use the existing omitted-versus-defined selection distinction. Neutral filling must never require
`selected=true`. No public BulletItem component, new per-item `filled` flag, marker renderer
callback, or private-descendant CSS is needed for these consumers. Pass
`filled={selected === undefined}` and leave `filledColor` unset: Bullet owns the subtle default.
This replaces the rejected full-foreground fill. Compare against the public Bullet rendering in both
themes; do not copy its colour/alpha recipe into BulletList or its tests.

The marker never latches blue after a command. Preserve Button's hover, press, focus and disabled
feedback; blue interaction feedback elsewhere is not prohibited. Disabled choices retain controlled
selection, and disabled commands remain non-selecting. Keep markers hidden from AT and preserve the
list/buttons, ordinary Tab order, and current activation timing. This is not a radio group, listbox,
menu, ARIA grid, or promise of arrow-key navigation. The marker change deliberately affects direct
BulletList action consumers as well as Dev.List; defined selections, including `[]`, retain choice
paint. It does not fix or establish acceptance for Button's separate resting-focus contrast limits.

### Existing adjacent contract: Anchor typography and standards reference

The historical mapping above accounts for the separate typography, footer, and specimen landings.
Preserve these contracts during Dev.List work; they do not decide label-rendering policy.

- `mono?: boolean` on `Anchor.Props` is inherited by Anchor.Link and Dev.Link, matching Chip's
  spelling. Omitted/false leaves the surrounding font inherited; true selects monospace. Caller
  style wins in both enabled and disabled states. Missing href still returns children only.
- Keep the Anchor host footer sans by leaving mono unset. Label it `HTMLAnchorElement · WHATWG`,
  link to `https://html.spec.whatwg.org/multipage/text-level-semantics.html#htmlanchorelement`, and
  name the DOM interface in the title. Preserve its globe, new-tab cue, host theme, and padding.
- Preserve the existing font default/override, link forwarding, and exact footer label/destination
  regressions. Use the existing harness for visual inspection; do not add another font API, force
  sans globally, or change opening/security behavior. Regression source is not browser font proof.

## Deferred follow-ups: outside this plan

The human removed shared Markdown label presentation and the shared Dev composition specimen from
the active arc during the post-adoption scope check-in. Neither was implemented or accepted as
complete. The notes below preserve design constraints for possible later work, not delivery
obligations or prerequisites for this plan. Resuming either requires separate scope and authorization.

### Shared Markdown label presentation

The deferred proposal covers reusable Markdown labels with backtick code rendered by Chip.UI,
strong/emphasis, breaks, and a supported formatting subset.

Reuse `@sys/markdown`, `Prose.Markdown.UI`, and Chip. Factor shared non-interactive Dev Markdown
presentation policy instead of duplicating code renderers across consumers. Do not use
Dev.Help.Markdown unchanged: it imposes 12px/1.45 typography, Prose.Markdown's root sets `theme.fg`
rather than inheriting Button feedback colour, and Chip defaults to `whiteSpace: 'nowrap'`. Font
overrides alone do not solve feedback inheritance or long-code wrapping. Standalone help rendering
and its existing navigation behavior remain unchanged.

Any future Markdown work must preserve the literal-input, explicit-composition, non-interactive
label contract above. It may settle the smallest shared renderer-policy owner, supported
non-interactive Markdown flow, paragraph spacing, colour inheritance, long Chip wrapping, and
first-line alignment. Document
the supported subset rather than claiming arbitrary document or React-tree support. Try existing
style/renderer seams before adding primitive APIs; an internal shared helper does not automatically
require another public component.

Rich-label rendering is not a deliverable of this plan. No production interaction redesign belongs
in the deferred renderer proposal.

### Shared Dev composition specimen

The deferred proposal is one shared `dev/-spec/` harness for the small Dev composition primitives,
registered as `sys.ui.component: Dev` using the existing package naming convention. Render Dev.Button,
Dev.Divider, Dev.Link, and Dev.List as the subject, not merely as controls in the debug sidebar.
Demonstrate commands, controlled choices, disabled rows, and wrapping, including explicit
non-interactive rich-label composition using the shared renderer described above. Keep example state and callbacks local to
the specimen; add no production behavior or new public API.

Retain the dedicated Dev.Help.Markdown specimen and its deeper rendering coverage. A shared specimen
does not require reorganising implementation folders: folder moves, new module boundaries, and
broader Dev API changes require separate justification and scope. Follow the applicable template
policy when creating the harness.

This would be a later discoverability and visual-exploration increment, not a prerequisite for the
adapter or its consumers. If resumed with rich-label examples, settle their shared presentation
first. Verify registration, actual public Dev composition, caller-owned selection/reset, callback
feedback, and disposal with narrow tests. Use browser inspection for
Light/Dark presentation, narrow-width wrapping, keyboard activation, and focus clearance; report
unavailable browser/AT evidence separately from automated checks.

## Implementation shape and proof

1. **Marker owner contract:** existing BulletList runtime/docs and selection regressions distinguish
   command fill from unselected choice using public Bullet output in both themes. Preserve their
   ARIA, controlled-state, activation, and disabled-state assertions; do not recreate the old
   action-paint-equals-unselected-paint expectation.
2. **Anchor owner contract:** preserve public mono behavior, inherited link props, standards footer,
   and the reference specimen's controls/persistence. Retain their focused regressions rather than
   repeating these landings inside Dev.List work.
3. **Row inset owner contract:** existing BulletList `itemPadding` forwards unchanged to actionable
   Buttons, leaving production defaults and content cells unchanged. The Anchor reference uses
   `[0, 8, 0, 5]`. Preserve the declaration/composition regressions and Button's focus recipe;
   rendered geometry and focus clearance still require browser evidence.
4. **Dev.List:** the approved extraction places the adapter in `dev/m.List/ui.tsx`, contracts
   in `dev/m.List/t.ts`, runtime wiring in `dev/m.List/mod.ts`, and behavioral regressions in
   `dev/m.List/-test/-ui.test.tsx`. The root `dev/t.ts` projects the same public namespace and
   `dev/mod.ts` assembles the aggregate. This is not a new package or harness module. Apply the
   resolved label contract above; the bounded template exception is recorded below. Prove
   readonly/literal-ID contracts, callback dispatch exactly once to the matching row, current
   callback replacement, disabled rows, no
   dispatch during render, and caller-controlled selection. Exercise two enabled rows with distinct
   methods in B → A order, replace B's callback through a committed rerender, and assert exact method
   identity/order and event IDs without render-time or obsolete calls. Using Button fixtures, cover
   callback replacement between mouse/touch press and release and between Space down/up across
   ordinary committed rerenders.
   Enter activates on keydown; replacing its callback afterward must not replay activation.
   This does not cover the deferred touch-focus reentrancy case in `Mobile.end`, which focuses
   before invoking its render-captured callback. Do not add interaction machinery to claim a
   stronger guarantee.
5. **First two consumers:** change only A/B's list composition and affected regressions. Keep their
   existing signal/storage policy. Narrowly adapt tests coupled to old row wrappers; do not add long
   transcripts or pin every specimen string/heading. The Dev implementation is not accepted as a
   useful abstraction until these two consumers exercise both modes.
6. **Passkey consumer:** change only fixture-selector composition and its relevant tests. Verify
   selected state, `debug.select` intent clearing, external selection/reset, light-panel theme,
   unchanged persistence and disposal. Replace tree-emoji assertions with actual controlled pressed
   state assertions. Do not touch pure Passkey UI or `-spec.integration/`.

For all steps: use narrow red → green regressions where behavior changes; run owning-module checks;
format only exact changed paths. Preserve unrelated work and keep plan artifacts outside source
commits. No automatic broad migrations or Git operations. Preserve current lifecycle boundaries:
Passkey has explicit context disposal; BulletList/Anchor currently create suite-scoped debug state
and do not retain their persistence-effect disposers. This migration neither repairs that difference
nor claims uniform lifecycle guarantees.

From `code/sys.ui/ui-components`, after inspecting its live task definitions:

```sh
deno task test --trace-leaks ./src/ui.react/ui/BulletList/-test/
deno task test --trace-leaks ./src/ui.react/dev/ ./src/ui.react/ui/Anchor/-test/
deno task check
deno task test --trace-leaks --reporter=dot
```

From `code/sys.ui/ui`, for the Passkey migration:

```sh
deno task test --trace-leaks ./-sample/passkey/ui/-test/
deno task check
```

Browser acceptance: actual light sidebar/dark subject separation; neutral filled versus hollow
markers; selected/disabled states; long labels and wrapping; pointer and Enter/Space activation;
focus clearance and ordinary Tab order; AT announcement where available. DOM/CSS tests establish
contracts/declarations, not browser geometry or universal conformance. The original plan-authoring
pass ran no behavioral tests; subsequent verification is recorded below.

## Review adjudication and re-entry

The earlier human-supplied independent review at `ba54dc846` supported the small adapter and
identified that label interaction/input semantics needed a decision before fixing the API. Its
reported baseline checks were 42 ui-components tests / 255 steps, 5 Passkey tests / 46 steps, and
both module typechecks; those were not locally rerun evidence.

A subsequent human-supplied blind BMIND/TMIND/DMIND review at `66a661989` independently supported
the bounded adapter and confirmed the landing mappings. Adjudication:

- **Accept:** a small row-method adapter earns a Dev authoring boundary, not a controls framework.
  Direct BulletList remains a valid simpler choice for central ID setters.
- **Resolve by human scope decision:** active inline links are removed from this plan's
  deliverables, including its Markdown presentation item. Literal strings plus explicit non-interactive
  React-node composition settle the input contract. No BulletList/Button interaction change,
  compound-row design, or related acceptance proof is required by this work.
- **Accept for the Markdown renderer item:** Help.Markdown is not a drop-in action-label renderer.
  Preserve feedback-colour inheritance, long Chip wrapping, and first-line alignment requirements;
  prefer existing style/renderer seams and keep standalone help behavior unchanged.
- **Accept proof refinements:** infer IDs from items without selection/handler widening; use
  dedicated literal-input tests. Prove ordinary committed-rerender callback replacement at actual
  Button timing, including Enter keydown rather than replay on release. Preserve same-fixture
  intent clearing, caller-owned persistence, panel themes, and existing lifecycle/focus limits.

The later reviewer reported 44 tests / 273 steps across Dev, BulletList, Button, Anchor, and
Prose.Markdown; 3 tests / 14 steps across Passkey spec, lifecycle, and navigation regressions; and
both owning-module typechecks passing. These establish reviewer-reported baseline behavior, not
the absent adapter, and were not rerun for this adjudication. The reviewer had no browser/AT tools;
no geometry, touch-browser, or accessibility acceptance was established. That adjudication changed
only planning scope and proof obligations; it ran no behavioral tests and performed no Git mutation.

### Adapter review and dispatch proof

The human-supplied blind implementation review against `66a661989` found no blocking defects and
identified one P3 coverage gap: first-row-only dispatch could pass the original runtime assertions.
Accept that finding as a test-owner correction, not a reason to change production interaction.

The `multiple enabled rows` regression, now in `dev/m.List/-test/-ui.test.tsx`, activates B → A
through rendered Buttons, replaces B's callback through a committed rerender, and repeats B → A.
Exact method names
and event IDs distinguish wrong-row dispatch from stale callbacks; assertions before activation and
after rerender reject render-time calls. A locally executed negative control temporarily replaced
the dispatcher with `items[0]?.onActivate(e)`: this regression failed with method A receiving ID B,
while the original nine steps passed. Restoring the matching-ID dispatcher passed all ten steps.
No runtime change was retained.

After this test-only correction, local owning-module `deno task check` and
`deno task test --trace-leaks --reporter=dot` passed: 120 tests / 856 steps, zero failures.
These are automated contract proofs, not browser geometry, touch-browser, or AT acceptance. The
Button `Mobile.end` focus-reentrancy limitation remains deferred. Consumer migrations and shared
Markdown remain separate scope; no Git mutation was performed.

### First-consumer composition proof

Against source baseline `5b224be0a`, the A/B migration changes only the two list compositions and
focused consumer regressions. BulletList's Samples group binds pressed state to `v.sample`, with
row methods writing only that signal. Anchor binds the existing preset patches to row methods,
omits selection, and relies on Dev.List's compact defaults; its ID lookup and direct import are gone.
Signal/storage, subject rendering, reset, registration, and lifecycle ownership remain unchanged.

The expanded BulletList control regression failed before migration on the missing semantic list,
then passed through the real Dev.List composition. It covers Enter/Space/click, reselection,
external sample changes independent of subject selection, persisted re-entry, and reset. Existing
Anchor regressions retain every preset patch/default/clear and mode-exit assertion; the presentation
check now compares both subject themes with the public compact Light BulletList reference, including
focus-stable classes and omitted pressed state.

Local verification from `code/sys.ui/ui-components`: the two changed test files passed (2 tests /
13 steps); scoped Dev/BulletList/Anchor coverage passed (25 tests / 155 steps); `deno task check`
and the full `deno task test --trace-leaks --reporter=dot` passed (120 tests / 856 steps).
Exact four-source-file formatting checks and Git whitespace checks passed. The follow-up copy/type
refinement derives Anchor preset row fields from `t.Dev.List.Item`, explicitly types the mapped
items with that public contract, and makes BulletList's heading/labels match the rule in A. Its
focused rerun passed (2 tests / 13 steps), as did module typecheck, exact-file formatting, and Git
whitespace checks; the full-suite result above precedes that refinement. Browser/AT tools were
unavailable: rendered spacing/markers, Tab/focus clearance, browser Enter/Space, and preset effects
in both specimens still require human inspection. Automated DOM/CSS results do not satisfy that
acceptance. No Git mutation was performed; plan artifacts stay outside the source commit boundary.

### Approved primitive extraction boundary

Before continuing the remaining consumer arc, the human separately scoped the behavior-preserving
extraction of Button, Divider, Link, and List into `dev/m.<Name>/`. Explicit approval of the
minimal-extraction template exception and GO were given for these four existing primitives only.
The reviewed structure is `mod.ts`, `ui.tsx`, `t.ts`, and `-test/`, using `../common.ts` without
placeholder common/spec/controller/style files. This does not change canonical template policy.

Leaf contracts derive from the production owners, not from their own root aliases. The root Dev
namespace projects those contracts while keeping the existing callable API, List generics,
readonly inputs, and `NoInfer` constraints. Aggregate export/type identity checks remain in
`dev/-test/`; behavioral tests live with each primitive. Help, Help.Markdown and its specimen,
ObjectView's alias, package exports, caller state, and interaction policy stay unchanged.

Extraction verification from `code/sys.ui/ui-components`: the Dev baseline passed (7 tests /
31 steps), then the colocated tests and consolidated export checks passed (8 tests / 31 steps).
This move changes no behavior, so no new red-first behavioral regression was introduced. Module
`deno task check --quiet` and the full `deno task test --trace-leaks --reporter=dot` passed
(121 tests / 856 steps). Exact-file formatting checks passed for all 19 resulting source files.
This is import/type/automated behavior proof, not new browser/AT acceptance. The earlier consumer
browser obligations remain unchanged; no Git mutation was performed.

### Passkey fixture-selector composition proof

Against source baseline `aed4552ca`, the C migration replaces only the fixture-button loop with
Dev.List. Selection reads `v.fixture.id`; each row delegates to the existing `debug.select(fixture)`,
including reselection. Labels remain literal and prefix-free; Property States and `(simulated)`
remain outside the list. The resolved Light panel theme is independent of the subject theme.
Fixture data, signal/storage policy, reset, context disposal, navigation, pure Passkey UI, and the
integration specimen are unchanged.

The expanded specimen regressions failed before migration on the missing semantic list, then passed
through Dev.List. They verify fixture labels/order, controlled pressed states, tab-index declarations,
Enter/Space/click activation, same-fixture intent clearing, external fixture changes without
render-time intent clearing, callback availability, persistence/re-entry, and reset. The theme test
compares list/row classes with the public Light Dev.List reference under both subject themes;
focus-stable class assertions are not browser geometry or focus-clearance proof.

Local verification from `code/sys.ui/ui`: the focused specimen passed (1 test / 5 steps), all
Passkey UI tests passed (6 tests / 48 steps), `deno task check` passed, and the full
`deno task test --trace-leaks --reporter=dot` passed (15 tests / 123 steps). Exact two-source-file
formatting/lint and Git whitespace checks passed. Browser/AT tools were unavailable; actual wrapping,
markers, focus clearance, ordinary Tab navigation, browser activation, and announcements still need
human inspection. No Git mutation was performed; plan artifacts remain outside the source commit.

### Anchor two-column follow-up proof

Against `e0cee8f82`, only Anchor's Sample States consumer gains `columns={2}`. The existing
presentation regression compares against a two-item, two-column production reference and checks
`repeat(2, minmax(0, 1fr))` under both subject themes. Before the consumer change it failed with
`repeat(1, minmax(0, 1fr))`; afterward the focused suite passed (1 test / 12 steps). Module typecheck,
exact two-source-file formatting, and the full module suite passed (121 tests / 856 steps).
Exact-file lint reports three pre-existing test patterns: one block-scoped function declaration and
two async act callbacks without await. Those callbacks and the helper are unchanged by this layout
follow-up. Subsequent human browser feedback approved the compact two-column appearance at the
shown sidebar width. The supplied screenshot shows all labels and a visible focus outline on
Dev.Link (default); this is bounded visual evidence, not acceptance across widths or AT.
The human reports Tab traversing left → right across each row, matching the source-order grid.
The alternative down-column traversal is a design discussion, not an authorized behavior change.
Other widths, complete focus clearance, and AT announcements remain unverified.

## Final state and human-owned retirement

At `9128e5fbf`, all implementation items in the opening arc are landed. The delivered boundary is
Dev.List, its production prerequisites, Button/Divider/Link/List colocation, the BulletList/Anchor/
Passkey consumer adoptions, and Anchor's fixed two-column Sample States layout. No source changes
remain open in the affected packages at this closeout inspection. Verification results above are
historical execution evidence; no tests were rerun for this retirement preparation.

Retain Anchor's row-first Tab traversal: left → right, then the next row. It follows the item/DOM
order and the visible horizontal comparisons. No custom tab indices, keyboard interception,
column-first flow, or further layout change is planned here.

The human requested final-state recording and will handle retirement. This snapshot records
implementation completion, not complete browser/AT acceptance. The earlier notes that browser
checks remain necessary are evidence limits, not claims that those checks passed:

- Anchor's compact two-column appearance is human-approved at the supplied sidebar width; the
  human observed row-first Tab traversal.
- Complete cross-consumer browser activation/reset checks, narrow-width wrapping, full focus
  clearance, and AT announcements remain unverified. Automated DOM/CSS tests do not replace them.
- Three pre-existing Anchor test lint findings remain recorded above; typecheck, formatting, and
  the full module suite passed.
- Shared Markdown label presentation and the shared Dev composition specimen remain deferred
  outside this plan's delivery boundary. Their design notes are recovery context, not completed work.

Preserve these qualifications in the final historical snapshot. Any later verification or renderer/
showcase work requires its own explicit scope; retirement must not be cited as proof of unobserved
accessibility or browser behavior.

The plan is untracked at preparation time. The human owns preserving this final snapshot in Git
before removing it from the live worktree. Use `plan(done): dev-list-controls.plan.md` only after
accepting the stated completion boundary and disposition of the remaining evidence limits; subsequent
removal uses `plan(archived): dev-list-controls.plan.md`. This preparation performs no staging,
commit, deletion, or other Git mutation.
