@sys.ui-components
bullet-list-interaction.plan.md
- [x] ffb2f0330 fix(ui-components)!: normalize BulletList activation and selection contracts
- [x] 04e8a7a55 feat(ui-components): add named BulletList sizes and resilient columns

## Closure — ready for human archive

The two-item foundation arc is complete. No implementation item remains owned by this plan, and
this thread can close. Archive preparation was reconciled at `74d3a96ce`: both opening commits and
separate cleanup `ba54dc846` remain reachable from HEAD. No source changes or new behavioral tests
were needed for this reconciliation; the evidence below retains its original scope and dates in
history, rather than asserting a fresh verification run.

- **Delivered:** activation/selection contracts, direct-consumer migration, named sizes, and
  resilient columns, with the recorded automated proof below.
- **Withdrawn, not delivered:** the specimen-only Markdown experiment and obsolete third arc item.
  Its rollback is complete; do not restore it or mark it completed.
- **Transferred:** Dev.List, neutral command markers, subsequent consumer work, and reusable rich
  labels belong to [dev-list-controls.plan.md](./dev-list-controls.plan.md). Consult that plan's
  live arc and source evidence for their current status; this archive does not track their progress.
- **Proof limits retained:** browser/AT, zoom, touch, and rendered focus-clearance acceptance were
  not completed here. The follow-on plan retains browser acceptance obligations. Conditional Button
  touch-focus reentrancy remains a deferred owner-level concern, not a pending foundation item or
  an assertion that it is fixed. Archiving is scope closure, not universal accessibility acceptance.

Leave the file in place for the human to archive. When moving it, preserve this historical receipt
and update inbound links in live plans to the chosen archive location. No archive destination or
move is authorized by this preparation.

## Purpose and design boundary

The opening arc records the two landed BulletList foundation changes. The human explicitly removed
its obsolete third item. This is the tidy-first foundation record, not the Dev implementation plan.
The next work is owned by [dev-list-controls.plan.md](./dev-list-controls.plan.md): reusable Dev list
authoring, a neutral command-marker follow-up, initial consumers, and the retained rich-label goal.
Implementation and Git mutations require separate instruction.

Repository: `/Users/phil/code/org.sys/sys`. Owner: `code/sys.ui/ui-components`. Reconciliation source
baseline: `ba54dc846`; all three relevant commits were verified reachable from HEAD. The original
foundation design below describes observations at `e36890af1ce4bf21cfcea7bd61ac19f51eed4d0f`, followed
by its implementation evidence. It is not a new instruction to repeat those migrations.

### Reconciliation

- Keep the two foundation items in the opening arc: activation/selection contracts and size/layout.
- The original third objective, `refactor(ui-components): compose Markdown labels and preset actions
  with BulletList`, was withdrawn, not completed. Its specimen-only experiment was rolled back.
- The separate five-file cleanup landed as `ba54dc846`, with subject
  `refactor(ui-components): compose Anchor presets with BulletList`. Inspection confirms Anchor
  preset adoption/tests, BulletList specimen Root extraction, and harness grouping only. Preserve
  this historical record, but remove it from this plan's arc as requested. It does not deliver the
  withdrawn Markdown objective or the proposed Dev list surface.
- Do not replace the removed item with another silently redefined objective. Dev work has its own
  governing [dev-list-controls.plan.md](./dev-list-controls.plan.md); this foundation arc remains
  unchanged. Keep plan artifacts separate from source commits.

### Historical rollback boundary

The rollback restored `src/ui.react/ui/BulletList/` to `04e8a7a55`, removing the experimental Markdown
sample, action-mode/activation-observation additions, and composition tests. It preserved the landed
foundation and separate Anchor work. The later cleanup extracted the baseline specimen Root again,
without restoring the withdrawn Markdown behavior. Do not delete that landed Root or undo Anchor
adoption as part of this reconciliation.

## Historical design record — not an active execution checklist

The design, imperative wording, consumer inventory, and verification commands from this heading
through “Verification and acceptance” are retained as the original implementation brief. They do
not authorize rerunning the arc, reopening completed work, or adding Markdown to this closed plan.
The implementation/rollback/cleanup receipts below establish what was actually delivered and the
limits of that evidence. Current source and the live follow-on plan govern subsequent work.

## Foundation evidence and ownership (pre-implementation baseline)

- `src/ui.react/ui/BulletList/t.ts`, `ui.tsx`, `u.toggle.ts`: items already carry React-node labels;
  selection is already caller-owned. The UI listens only to Button `MouseDown`, so Button's
  Enter/Space and assistive-click path does not reach `onSelect`. Touch begins selection before
  cancellation, and BulletList does not filter secondary mouse presses. Its current UI test proves
  only enabled/disabled mouse-down behavior. These are source-derived observations, not a fresh
  browser reproduction.
- `src/ui.react/ui/Button/{t.ts,ui.tsx,u.events.ts}`: canonical activation is `onClick`, emitted on
  eligible primary mouse/touch release or keyboard/assistive click. Button owns cancellation,
  descendant input, disabled/inactive behavior, focus, and press lifetime. Preserve that ownership.
- BulletList currently paints selection but supplies no accessible selected-state attribute. Button
  currently has no public `aria-pressed` prop. Do not pretend an undeclared prop is forwarded.
- BulletList already uses equal-width CSS Grid columns and a marker box of `1lh`. Keep those useful
  ideas. Its inner `auto 1fr` label track and lack of inter-column separation deserve scrutiny with
  narrow, wrapped, and long-token labels.
- `Chip.Size` and `KeyValue.Size` both use `xs | sm | md`. Chip uses relative font scales
  `0.78 / 0.875 / 1`; KeyValue uses absolute `10 / 11 / 13px`. Shared vocabulary does not establish
  a universal shared metric table. BulletList currently inherits font size and uses line-height 1.6,
  an 8px bullet, and an 8px marker gap.
- Real selection consumers include Http.Origin, font family/weight controls, TreeHost spinner
  controls, and deployment mount/card/descriptor selectors. Anchor's Samples are instead actions
  that apply partial state patches; their last activation is not necessarily their current state.

Production rendering belongs in `@sys/ui-components/react/bullet-list`; types stay in the existing
`t.BulletList` namespace and package type pool. Dev-only composition belongs at `/react/dev` only if
a real consumer proves an additional reusable policy. No `Dev.BulletList` alias or new package
export is needed for this first pass. Harness routing/chassis, signals, callbacks, persistence,
requests, and async operation status remain outside BulletList.

The neighboring `dev-composition-primitives.plan.md` and `button-grammar.plan.md` are context, not
prerequisites. Preserve their arcs. This work does not require Buttons.Action, width groups, or Dev
KeyValue controls. A narrow Button accessibility forwarding change below does not reopen its event
engine or focus design.

## 1. Public API and activation

Recommended contract change for implementation review:

- Replace the misleading callback name `onSelect` with `onActivate`. Activation requests work; it
  does not assert a state transition. Use one callback, not parallel click/select/change channels.
- Model its cohesive type family as `BulletList.Activate.Handler<Id>` and
  `BulletList.Activate.Args<Id>`. Preserve the useful payload facts: `id`, actual modifier flags,
  and derived `is.command` / `is.modified`. Do not report an invented next selection.
- Carry one `Id extends string` parameter, defaulting to string, through `Props`, `Item`, actionable
  items, `Selected`, the callable UI surface, activation args/handlers, and `toggle`. Preserve the
  round trip `Item<Id>` → `Activate.Args<Id>` → `toggle` → `readonly Id[]` → `Selected<Id>` without
  widening IDs to string. Content-row keys remain independent strings, not actionable IDs. Remove
  `OnSelectHandler<any>` rather than replacing it with unchecked casts. Prove literal-ID inference,
  typed helper output, and handler compatibility with the existing card-kind wrappers before
  committing to the exact generic callable declaration.
- Use a canonical `declare namespace BulletList` with `Lib` first. Keep `Item` as the row union;
  factor its actionable/content shapes beneath that semantic owner if this improves the spine. Do
  not leave selection-specific names on rows that can be ordinary commands.
- Continue accepting mutable caller arrays; allow readonly item/selection arrays without copying
  them just for typing. Output/event contracts and `toggle` results are readonly. `toggle` remains
  an explicit, pure, non-mutating caller helper, never something UI invokes automatically.
- Preserve item IDs, optional label-to-ID fallback, enabled behavior, and inert content rows.
  Require unique stable keys across the list. IDs remain strings, including the empty string; an
  empty ID needs an explicit non-empty accessible label. Non-empty accessible labels remain
  caller-owned; ReactNode alone cannot prove them. `toggle` distinguishes undefined from an empty
  string: `toggle('', '')` removes that ID, and `toggle('', 'other')` preserves it while adding
  `other`. Do not introduce a new ID-validation policy or use truthiness to detect selection.

Delegate each actionable row to Button's `onClick`, translating its event once into the typed list
payload. Never duplicate mouse, touch, keyboard, cancellation, or focus handlers in BulletList.
Pointer modifiers describe the activation event, not a remembered mouse-down snapshot. Button's
existing modified-key suppression remains authoritative; do not promise command-key keyboard
multi-selection when Button intentionally suppresses that combination. Its Enter/Space path invokes
`.click()`, which does not preserve the originating key's modifier flags, including Shift. Report
only flags on the delivered activation event; do not reconstruct them in BulletList or broaden
Button's keyboard contract here. The multi-selection specimen must also offer an ordinary
Enter/Space path that toggles membership without a modifier.

This is an intentional breaking change: callback/type spelling, press-to-activation timing, readonly
helper output, and defined-versus-omitted accessible selection semantics. Migrate direct consumers
atomically and record those consequences in the landing message. Do not retain two aliases
indefinitely or silently preserve unsafe mouse-down behavior. The deployment references below make
this more than a package-local rename; reconfirm the full direct-consumer inventory before executing
the first item.

### Consumer event ownership and inherited limits

Item one includes a narrow ActionProbe correction: its root keydown handler must honor
`e.defaultPrevented` before interpreting an activation shortcut. Button consumes Enter before
calling `.click()`, but the original keydown still bubbles. In the two deployment data-card panels,
reference selection also changes ActionProbe's `runRequest`. Without the guard, one Enter press can
both select B and start an ancestor run with the preceding environment A. `useProbeRun` captures the
render's environment; the run-request effect records a changed token even when the running guard
prevents another invocation. This is a source-established event-ownership defect; the exact stale-A
execution and restoration sequence still requires the integration regression below. Fix the owner,
not BulletList: no extra keyboard handler or propagation suppression in the list.

Here a running probe means ActionProbe's own async action, not another process or workstream.
Preventing a child-consumed key from starting an unintended ancestor action is the complete scope of
this correction. Preserve existing shortcut policy for unconsumed events. Do not add or promise
request queuing, replay, cancellation, or latest-selection guarantees when an independently started
probe is already running.

Defer the conditional touch-focus reentrancy concern to Button ownership. `Mobile.end` focuses its
root before invoking the render-captured callback; an ancestor focus handler that synchronously
removes/disables the row or replaces its callback could invalidate that snapshot. No inspected
consumer establishes this sequence, and no reproduction has been executed in this authoring pass. It
is not a blocker or an authorized Button redesign in this arc. If a concrete consumer requires that
lifecycle, establish owner-level reproduction and live post-focus eligibility/callback semantics
before promising support; rechecking the same captured props or compensating in BulletList is not a
solution. Follow with browser touch proof for any future Button correction.

## 2. Pure selection and non-selecting actions

No internal selected state, automatic toggle, remembered last-click, or `selectable` mode flag.

- `selected` omitted/undefined: ordinary action list; decorative markers; emit once without changing
  selection.
- Defined single ID: caller-controlled active choice; emit once; caller may replace or retain it.
- Defined ID array, including `[]`: caller-controlled active set; emit once; caller may toggle or
  retain it.
- `kind: 'content'`: non-action content in one grid cell; no row callback or row focus target.
- Disabled actionable item: retain any selected-state display; suppress activation.

Defined selection with no active item uses `[]`; undefined means no selection semantics. Keep that
choice stable for each consumer rather than acquiring pressed-button semantics only after its first
selection. The existing choice consumers below pass their optional selected ID as `selected ?? []`;
TreeHost passes `spinnerSelection(v.spinner) ?? []` when its configuration matches no preset. This
only adapts BulletList props; do not change domain state types or infer a default choice. A state
update may be refused or asynchronous: paint changes only when new props arrive. Do not synthesize
state or optimistic success inside the component.

Recommended accessible contract: a semantic list of buttons, not a listbox, radio group, menu, or
ARIA grid. Preserve ordinary Tab order. For defined selection, each row button exposes controlled
`aria-pressed={isSelected}`; for actions omit it entirely. A single ID is a caller-enforced
exclusive active button, not a claim of native radio semantics or arrow-key navigation. Hide the
bullet glyph from AT; the button carries state and the label carries its name.

The smallest lower-level addition is typed `aria-pressed?: boolean` forwarding on Button, with
owner-level true/false/omitted tests and no automatic state or visual pressed coupling. Do not
attempt to set it on a wrapper around the actual button. Keep Button's disabled state independent.
If implementation review finds this semantics unsuitable for a concrete consumer, settle that
consumer's contract before widening the widget; do not add unsupported roles by appearance alone.

Recommended DOM: a reset `ul` with direct `li` grid cells containing Button or content. Remove list
padding/margins/native markers in the component. Keep content rows out of button wrappers; richer
help or links can live there. Action labels are non-interactive rich content. This constraint is
important even though the underlying Button defensively preserves child-owned input.

## 3. Columns and flow

Retain `columns?: number`, default 1, as an explicit equal-width column count. Do not introduce a
layout object, responsive breakpoint API, masonry, CSS newspaper columns, or DOM reordering.

- Use row-major source order for paint, reading, and Tab order. Two columns mean A/B, then C/D. The
  next row starts below the tallest cell in the preceding row; this is intentional, not masonry.
- Normalize finite values by flooring and clamping to at least 1. Non-finite input falls back to 1.
  Bound the effective count by the number of rendered cells, with 1 for an empty list, so a mistaken
  count cannot create unbounded empty tracks. Document the fewer-items-than-columns behavior.
- Retain `repeat(n, minmax(0, 1fr))`. Set cells to align at the start rather than stretching a short
  button's hit area to its taller neighbor. Use `auto minmax(0, 1fr)` inside each actionable row.
- Put `minWidth: 0` at the actual cell/label shrinking seams. Let labels wrap; do not truncate,
  clamp height, force nowrap, or hide focus outlines. Use an explicit safe long-token wrap policy
  for labels; independently styled rich children remain caller responsibility.
- Give columns a deliberate logical gap, initially 1em. Separate within-item line-height (1.25)
  from between-row spacing (`max(0.375em, 6px)`). The minimum gap clears Button's default 2px
  outline plus 2px offset; preserve its focus treatment rather than clipping or shrinking it.
  Verify rendered clearance instead of adding arbitrary per-label margin corrections.
- A constrained host may still choose one column. Do not promise automatic collapse. Verify 1/2/3
  columns, odd counts, content cells, empty lists, long labels/tokens, and RTL source ordering.

## 4. Markdown: withdrawn approach and deferred design

The specimen-only composition approach was withdrawn. It demonstrated existing React-node labels
but did not deliver the requested reusable production capability. Plain code styling and separate
link rows also missed the intended item presentation. Do not resume those sample patches.

Requirement to carry into the next design discussion:

- Real reusable item/label rendering, not capability implemented only in a specimen.
- Backtick code uses the existing `Chip.UI`; emphasis, strong text, breaks, and other supported
  Markdown share consistent formatting. Samples only demonstrate the production behavior.
- Links are secondary to rich text. Where supported, they belong within the item's text, not in
  extra rows added as a workaround. Settle interaction and accessibility semantics before claiming
  support; Button's child-input guards alone do not establish browser/AT correctness.
- Reuse existing owners rather than copying parsers, renderer callbacks, chip CSS, or link behavior.

Inspected reusable owners: `@sys/markdown` parses source; `Prose.Markdown.UI` renders source/MDAST
with neutral defaults and renderer overrides; `Chip.UI` and `Anchor.UI` own their presentation.
`Dev.Help.Markdown.UI` is a thin composition of those owners, with 12px/1.45 help typography. It is
not another Markdown engine. Reuse decisions must preserve the host's sizing and feedback colours.

The rich-label production owner and public input contract remain undecided. In particular, no
decision has been made to interpret existing plain-string labels as Markdown automatically. The
rollback is complete. The rich-label requirement and its remaining design decisions now belong to
[dev-list-controls.plan.md](./dev-list-controls.plan.md), with an explicit future implementation item.
The historical requirements above explain the withdrawal; they are not a second live design.

## 5. Named sizes

Adopt `BulletList.Size = 'xs' | 'sm' | 'md'`, with `md` the default. This matches existing component
vocabulary without pretending KeyValue's absolute metrics and Chip's relative metrics are one shared
design-token system. Considered `lg`: defer it until a real larger presentation is useful; do not
add a fourth option for symmetry alone.

Initial recipe to verify in the specimen, not browser-proven geometry:

| Size | Font scale relative to host       |
| ---- | --------------------------------- |
| `xs` | 0.78em                            |
| `sm` | 0.875em                           |
| `md` | 1em (current inherited text size) |

Use line-height 1.25 and a separate row gap after the human's visual review exposed weak multiline
item grouping at 1.6 with no row gap. Marker diameter and marker-label gap follow the resolved text
size (0.5em each), and column gap follows that size too. At a 16px host, medium reproduces
8px marker/gap; existing 12px/13px hosts currently keep an 8px marker, so relative marker sizing is
an intentional visual change to assess, not byte-for-byte appearance compatibility. Use Bullet's
existing style seam for relative geometry rather than widening its numeric size API incidentally.

Defaults/metrics live once in local `D`/recipe definitions; specs, controls, and tests consume them.
Caller root style composes last. Do not scale the whole DOM with transforms or independently shrink
focus strokes/offsets. Very small text is an opt-in dense presentation, not evidence of adequate
pointer target size or accessibility conformance. Exercise font overrides and 200-400% zoom.

## 6. Marker and multiline alignment

The marker belongs beside the first line, not vertically centered beside the entire wrapped body.
Preserve the useful `1lh` marker cell with the glyph centered inside it, and top-align both grid
tracks. Continuation lines align with label text, not underneath the marker. Use logical layout, not
label-specific translateY/margin offsets. No fixed row height or `height: '100%'` ancestry.

Prove the relationship for plain text, inline code, emphasized text, two-line labels, explicit
breaks, differing neighboring heights, and all admitted sizes/themes. Markdown block margins or a
caller child overriding its own line-height can violate a first-line assumption: keep label
composition explicit, test the supported cases, and do not claim arbitrary React trees align
perfectly. A static screenshot cannot establish behavior after font loading or reflow.

## Foundation commit boundaries and direct consumers

1. **Activation/API:** owner types/runtime/tests, the narrow Button ARIA forwarding seam, and direct
   consumer adaptations required by the breaking activation/type and selection-semantics contracts.
   Include typed selection/helper round trips, empty-ID handling, optional-selection normalization,
   controlled selection semantics, and accessible markup proof. Include ActionProbe's consumed-key
   guard and a real nested-selection/request regression; preserve its existing request scheduling
   policy. No size/layout or Markdown overhaul here.
2. **Size/layout:** local recipes, finite columns, grid containment, marker geometry, named sizes,
   and real harness specimens/tests. Preserve the established activation contract.

Expected source areas, relative to `code/sys.ui/ui-components`:

- `src/ui.react/ui/BulletList/`: public spine/runtime, existing helpers, scoped tests and specimens.
- `src/ui.react/ui/Button/t.ts`, `ui.tsx`, and `-test/-ui.accessibility.test.tsx`: only controlled
  `aria-pressed` forwarding and its proof; no interaction/focus redesign.
- `src/ui.react/ui/ActionProbe/ui.Probe.tsx` and scoped `-test/` coverage: consumed-key guard and
  nested BulletList/request integration proof only; no request-scheduling redesign.
- `src/ui.react/ui/Http.Origin/ui.Selector.tsx`.
- `src/m.webfonts/-spec/-ui.FontFamily.tsx`, `-ui.FontStyle.tsx`.
- `src/ui.react/ui/Layout.TreeHost/-spec/-ui.prop.spinner.tsx`.
- Existing local common/type barrels only where required. Keep root export policy unchanged.

Additional inspected direct consumers, relative to repository root:

- `deploy/@tdb.data/src/ui/ui.Mounts/ui.tsx`.
- `deploy/@tdb.data/src/ui/-dev/ui.HttpDataCards/-spec.cards/-u.treeRefSelector.tsx`.
- `deploy/@tdb.data/src/ui/-dev/ui.HttpDataCards/ui/ui.CardKindsList.tsx`.
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Http.DataCards/-spec.cards/-u.treeRefSelector.tsx`.
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Http.DataCards/-spec.cards/-ui.descriptor.card.tsx`.
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Http.DataCards/ui/ui.CardKindsList.tsx`.

Consumer selection classification for item one:

- Http.Origin and font family/weight controls remain controlled choices with defined selected IDs.
- TreeHost spinner controls remain choices even when the current configuration matches no preset;
  pass the resolved ID or `[]`, never omit selection to represent an unmatched configuration.
- Mounts, both tree-reference selectors, and both card-kind wrappers remain choice lists; normalize
  optional selection to `[]` at the BulletList boundary. The descriptor selector keeps its defined
  selected ID. No consumer gains optimistic state, a new fallback choice, or altered loading policy.
- Anchor Samples are separate action-only adoption: omit `selected` before and after every
  activation, including after later knob edits. This migration does not establish Markdown support.

The card-kind wrappers reference the generic event type directly; preserve that typed boundary.
Outer domain callbacks such as Mounts.onSelect and onKindSelect keep their names and meaning; only
adapt their BulletList boundary. Preserve requests, data loading, selection models, and environment
policy. Any additional consumer found during re-entry must be attributed before expanding edits. No
deployment actions, dependency upgrades, generated-output edits, or unrelated sample cleanup.

## Verification and acceptance

Before editing, reopen the owning `deno.json` tasks/permission presets and inspect the current diff,
index, and untracked files. Freeze the exact implementation-unit path list. Use narrow red → green
regressions; do not overwrite another session's changes. This design pass ran no behavioral tests.

Required automated proof:

- Mouse down alone emits nothing; eligible release emits once; secondary buttons, leave/cancel,
  canceled input, disabled rows, touch cancellation, and compatibility events do not activate.
- Enter, Space, and assistive click reach the same callback once without manufacturing mouse
  callbacks. Modifier flags follow Button's actual delivered event; modified-key policy is not
  broadened. Cover allowed Shift-key activation without claiming that the generated click preserves
  Shift, and pointer modifier changes between press and release. Use Button's existing test fixtures
  instead of another synthetic event framework.
- With an initially idle real ActionProbe containing a controlled BulletList, use a deferred,
  in-memory run to prove Enter on B selects B once and starts only the intended B request, with no
  obsolete A run or restoration. Cover Space equivalence, root-focused Enter, and repeated/consumed
  child keydowns without ancestor shortcuts. Prove the guard regression red → green; do not replace
  the Button/BulletList chain with a mock callback. This proves event ownership, not queuing or
  cancellation for selections during an independently active run.
- With unchanged props, activation never changes visual or accessible selection. Caller rerender
  updates both. Omitted versus empty selection, disabled-but-selected, single/multi state, content
  rows, and action-only behavior are distinct. No extra focus target on markers or labels. At
  affected optional-selection consumer boundaries, cover no selection → selected → cleared,
  retaining `aria-pressed='false'` on unselected choice buttons throughout; include unmatched
  spinner presets.
- Compile-time proof covers readonly literal items, inferred activation IDs, narrowed handlers,
  `Selected<Id>`, and `toggle` output assigned back to readonly literal-union state without `any`,
  casts, or widening to string. Reject an incompatible handler. Content-row keys do not broaden the
  actionable ID union. Public leaf/type identity and updated direct consumer checks pass.
- Toggle preserves mutable and readonly inputs without mutation. Cover empty-string IDs as single
  selection and array members, including removal and preservation when another ID is added. UI
  selection and helper results agree for an empty ID with an explicit accessible label.
- Inspect emitted CSS for size recipes, columns, min-width seams, line-height marker geometry,
  wrapping, and caller overrides; do not rely solely on intermediate objects/class equality.
- Defer new Markdown acceptance cases until the production design is agreed. Then test its actual
  public behavior rather than specimen copy or harness click transcripts. Keep parser/renderer
  coverage with the existing owners; do not claim an inline sanitizer.
- Anchor adoption preserves every existing sample state transition and persistence obligation;
  editing a knob after applying a sample never leaves a false selected marker.

From `/Users/phil/code/org.sys/sys/code/sys.ui/ui-components`, use the declared tasks:

```sh
deno task test --trace-leaks ./src/ui.react/ui/BulletList/-test/ ./src/ui.react/ui/Button/-test/
deno task test --trace-leaks ./src/ui.react/ui/ActionProbe/-test/
deno task test --trace-leaks ./src/ui.react/ui/Prose.Markdown/-test/ ./src/ui.react/ui/Anchor/-test/
deno task check
deno task test --trace-leaks --reporter=dot
```

Read deployment module task definitions before running their declared checks for the first unit's
consumer migration. Do not assume a root package check covers them, or claim isolation from a mixed
worktree. Format/lint only exact confirmed changed filenames; check worktree/index whitespace and
scope stability before reporting.

Real-browser acceptance: Light/Dark; xs/sm/md; one/two/three columns; narrow and long-token labels;
first-line marker alignment with wrapped Markdown; 200-400% zoom; focus arrival/rest/preferences;
primary/secondary pointer, touch cancellation, Enter/Space; and AT announcement of action versus
pressed state. Verify list exposure after native-marker resets in the browser/AT combinations
actually exercised; DOM tags or emitted CSS alone do not establish the accessibility-tree result.
Compare ordinary medium at the existing harness host and inspect smaller inherited font consumers.
Emitted CSS proves declarations, not wrapping, first-line geometry, focus clearance, or target size;
those need rendered evidence. Report absent browser/AT evidence separately from observed defects.

## Item-one implementation evidence

Item-one proof covers activation/types, controlled selection markup, Button ARIA forwarding,
direct-consumer migration, and the ActionProbe consumed-key guard. Earlier source observations
above describe the pre-implementation baseline; the opening arc records landing identity.

- ActionProbe integration reproduced an obsolete `A` run before the guard; with the guard, Enter
  and Space select/run only `B`, completion retains `B`, consumed repeats do not run the ancestor,
  and root Enter still runs. This does not establish queuing or cancellation guarantees.
- Scoped ui-components tests covering BulletList, Button, ActionProbe, Http.Origin, and the spinner
  specimen passed with leak tracing: 19 tests, 150 steps. Both deployment choice regressions passed:
  data 2 tests/3 steps (including Mounts), edu-slug 1 test/2 steps. Prose.Markdown and Anchor
  regression suites also passed unchanged: 23 tests, 135 steps.
- `deno task check` passed in ui-components and both deployment modules. The data module now has
  `test:choices` for its narrow consumer regressions; no permission preset was widened.
- Scoped Git whitespace checks passed. Exact-file formatter checks still flag import ordering and
  legacy layout; no broad formatting cleanup was applied.
- Browser/AT acceptance remains unexecuted. Named sizes, resilient columns, Markdown composition,
  and Anchor adoption remain outside this implementation. Button touch-focus reentrancy remains
  deferred as described above.

## Item-two implementation evidence

- Size/layout proof covers the public `xs | sm | md` contract, the shared local recipe, finite
  columns bounded by cell count, shrinking cells/labels, long-token wrapping, relative marker
  dimensions, and caller root overrides. Activation and selection ownership remain unchanged.
- The column/alignment regression failed against the prior implementation (`repeat(NaN, ...)` and
  missing start alignment), then passed after the correction. Size/type assertions were added after
  the implementation. CSS tests inspect actual insertion receipts where the DOM mock cannot resolve
  `lh` or inherited relative geometry; they do not claim rendered pixel measurements.
- The existing harness now exercises named sizes, 1/2/3 columns, 180/360/640px hosts, 12/13/16/20px
  inherited text, RTL, standard/stress/empty samples, explicit breaks, odd mixed cells, and disabled
  wrapping labels. Markdown composition and Anchor adoption were outside item two; see the
  reconciliation above rather than treating them as a remaining third item.
- From `code/sys.ui/ui-components`, `deno task check` and the full
  `deno task test --trace-leaks --reporter=dot` passed: 117 tests / 827 steps. An exact-file
  `deno fmt --check` pass and scoped Git whitespace checks were recorded during item-two work.
  The final landing contains nine files; the historical formatter note does not establish exact
  per-file coverage of that landing. No dependency, generated-output, Button, or deployment edits
  were needed.
- Human-supplied browser snapshots show single-column wrapping, RTL placement, and relative sizes.
  They also exposed weak multiline grouping and focus outlines crowding adjacent rows. A dedicated
  regression reproduced the old 1.6 line-height, then passed with 1.25 plus a separate row gap;
  default Button outline tokens, focus ownership, and caller overrides remain intact. The scoped
  BulletList/Button suites passed: 13 tests / 101 steps.
- Both custom content specimens use centered plain labels on the same ruby-backed block. Samples
  have explicit buttons in their own section; host controls live under Debug, with its debug toggle
  first. The control regression proves sample actions preserve the other knobs.
- Snapshot evidence is not full browser/AT acceptance. Recheck the revised rhythm and focus
  clearance, multi-column layout, touch behavior, and 200-400% zoom before claiming that acceptance.

## Rollback evidence

- The human requested a clean BulletList baseline before deciding what to do next. The withdrawn
  Markdown experiment changed specimens/tests, not production BulletList rendering. Earlier passing
  composition tests did not establish the requested production feature and are not its acceptance.
- Restored the four tracked BulletList specimen/control-test files to `04e8a7a55`; removed the
  experimental `-spec/-ui.Root.tsx` and `-test/-ui.markdown.test.tsx`. The earlier
  `-test/-spec.composition.test.tsx` had already been replaced and is also absent.
- `git diff --exit-code HEAD -- code/sys.ui/ui-components/src/ui.react/ui/BulletList` passed and
  scoped Git status was empty. HEAD was `04e8a7a55`. This establishes the BulletList baseline, not
  a globally clean worktree.
- After rollback, scoped BulletList/Anchor tests passed with leak tracing: 16 tests / 109 steps.
  Module `deno task check --quiet`, exact-file formatting for the four restored files, and Git
  whitespace checks passed. No new behavior was added; a red-first regression was not applicable.
- The two Anchor migration files and unrelated work were left untouched. Anchor's eleven presets
  still use an action-only BulletList with the original patch/defaulting and persistence behavior.
  Their retention is independent of any future Markdown design.
- Browser storage is not modified by this rollback. If the browser remembers the removed Markdown
  sample, select `sample: standard` or use the existing reset control.

## Separate cleanup evidence (ba54dc846)

This is historical evidence for the separately landed cleanup, not a remaining foundation objective.

- The human requested the remaining three-file tree be reviewed for landing and the BulletList
  specimen Root extracted for separation of rendering from harness registration.
- Five source paths form this bounded unit: `src/-test/entry.tsx`, Anchor's
  `-spec/-ui.Samples.tsx` and `-test/-spec.samples.test.tsx`, and BulletList's `-spec/-SPEC.tsx` and
  `-spec/-ui.Root.tsx`. All are relative to `code/sys.ui/ui-components`; plan artifacts stay separate.
- Root extraction retains the baseline samples, host controls, and caller selection policy.
  Root styling is collected in `styles.base`; registration, signal subscriptions, and redraws remain
  in `-SPEC.tsx`. No new state, callback framework, Markdown dependency, or specimen transcript test.
- Review found no blocking issue in this bounded scope: the eleven Anchor preset patches preserve
  their previous defaults/clears, omitted truncation/width values, persistence, and examples reset.
  Selection is omitted, so later knob edits do not imply an active preset. The harness index change
  groups Bullet/BulletList without changing spec registration.
- After extraction, scoped BulletList/Anchor tests passed: 16 tests / 109 steps. The full module
  suite passed with leak tracing: 117 tests / 828 steps. Module typecheck, exact five-file format
  checks, and Git whitespace checks passed. Extraction adds no behavior, so no red-first test was
  introduced. This is source/DOM/CSS proof, not new browser/AT acceptance.

## Follow-on owner

This plan has no remaining execution work. Continue in
[dev-list-controls.plan.md](./dev-list-controls.plan.md). It owns the Dev.List API,
selection versus methods, neutral action markers, BulletList/Anchor/Passkey adoption, and shared rich
labels. Its [Anchor reference and migration checklist](./dev-list-controls.plan.md#anchor-reference-and-migration-checklist)
links the concrete command-list layout, source, regressions, and cleanup from direct BulletList
composition to Dev.List. Use that reference without copying the whole DEBUG panel.

The exploratory Dev section formerly here was consolidated there to avoid parallel plans. This file
remains the landed foundation and historical proof record; do not resume its withdrawn specimen-only
Markdown approach or treat general BulletList cleanup as the next deliverable.
