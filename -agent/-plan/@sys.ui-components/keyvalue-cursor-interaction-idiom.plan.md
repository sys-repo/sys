# KeyValue cursor interaction idiom

This is the root plan for the `<KeyValue>` cursor primitive in `@sys/ui-components`.

Status: COMPLETE / preparing for retirement. Keep this file as landed-history reference; do not add
new non-cursor work here.

It supersedes treating cursor work as an `InfoPanel.Config` or config-designer feature. The config
designer remains the first forcing consumer, but this plan owns the component-level interaction
idiom.

Successor non-cursor work moved to:

```text
-agent/-plan/@sys.ui-components/markdown-backed-dev-help-panel.plan.md
```

## Commit arc

- [x] 95991740e design(ui-components): define KeyValue focus interaction model
- [x] 24acd1b8d feat(ui-components): add KeyValue focus model
- [x] 531ac903d feat(ui-components): enter KeyValue focus mode from rows
- [x] eb081f24b feat(ui-components): navigate KeyValue focus scopes
- [x] 0fb026516 feat(ui-components): mark active KeyValue focus boundary
- [x] 4f4794196 feat(ui-components): render quiet KeyValue focus affordance
- [x] f835515f5 feat(ui): apply KeyValue focus to InfoPanel config designer
- [x] a8281bd5e fix(ui-components): ignore focus-modified KeyValue.Switches clicks
- [x] 5c93acb6f refactor(ui-components): rename KeyValue focus model to cursor
- [x] 8bbe23a54 feat(ui-components): navigate KeyValue key/value cursor lanes
- [x] 2296a73bd fix(ui-components): make KeyValue cursor keyboard entry and lane affordance
      observable
- [x] 137b2a6e4 refactor(ui-components): return KeyValue cursor handoff through explicit keyboard
      ownership
- [x] db7b0b806 refactor(ui-components): isolate KeyValue cursor handoff hook
- [x] f25ccd916 refactor(ui-components): clarify KeyValue cursor command reducer naming
- [x] 56aa956f6 refactor(ui-components): structure KeyValue cursor module internals
- [x] 2aeb04c02 feat(ui-components): toggle KeyValue.Switches with cursor Space
- [x] c44a2b94a refactor(ui-components): centralize KeyValue.Switches item guards
- [x] ff63cb5cd refactor(ui-components): structure KeyValue.Switches utilities
- [x] 50f8d4c18 feat(ui-components): add KeyValue cursor arrival cue
- [x] 803672e6e fix(ui-components): limit KeyValue cursor arrival cue to first adoption
- [x] c3a28604b refactor(ui-components): factor KeyValue cursor DEBUG fixture glue
- [x] a4173a28c feat(ui-components): add KeyValue cursor arrival flash mode
- [x] 13e44dbe8 fix(ui-components): require option modifier for KeyValue cursor lane navigation
- [x] cf8eb30a6 feat(ui-components): add Chip inline token component
- [x] 7cf88c6c1 refactor(ui-components): use Chip in KeyValue cursor DEBUG help
- [x] cd657f730 feat(ui-components): expose KeyValue cursor keyboard entry hook
- [x] b67853a9b fix(ui-components): export VimeoBackground types through package type surface
- [x] 853d0f0d0 feat(ui-components): add KeyValue cursor block-jump navigation
- [x] 10ce1d60d feat(ui-components): add KeyValue cursor whole-set top-bottom navigation
- [x] cfdbd090e feat(ui-components): distinguish focused and blurred KeyValue cursor affordance
- [x] 7cb237a5a fix(ui-components): retarget KeyValue cursor with plain click after entry
- [x] 1a3f38fcf feat(ui): add structural InfoPanel item config model
- [x] 7883b4db0 feat(ui): support cursor-based divider insertion in InfoPanel config designer
- [x] c86bd59b0 test(ui): wire InfoPanel Config spec through structural items
- [x] dc0f15bf1 fix(ui): wire InfoPanel Config cursor keyboard entry
- [x] ead64e216 refactor(ui-components): namespace KeyValue cursor keyboard hooks
- [x] 14c5ea049 refactor(ui-components): name KeyValue cursor test fixtures
- [x] c397a7f4e feat(ui-components): add KeyValue cursor item insertion helpers
- [x] b392ed57e test(ui-components): wire KeyValue spec cursor HR insertion
- [x] 90499871d fix(ui-components): collapse KeyValue cursor lanes on vertical movement
- [x] ed755a7b1 fix(ui-components): prevent repeated KeyValue HR insertion
- [x] 15284a00f fix(ui): prevent adjacent divider insertion in InfoPanel config designer
- [x] 82458b2d5 refactor(ui-dom): centralize interactive descendant selector

MIND review note: the prior unchecked order was arrival cue → Space → lanes → divider insertion,
then lanes → arrival cue → Space → divider insertion. Those remain historical signal, but the
current DMIND order prioritizes cursor bones before visual polish.

Checklist entries become `[x] <hash>` only after their commits land.

Current order/hash truth:

- Landed primitive cursor fix:
  `803672e6e fix(ui-components): limit KeyValue cursor arrival cue to
  first adoption`.
- Landed host coverage loopback, tracked in the config-designer plan rather than this primitive arc:
  `d84b67524 test(ui): cover InfoPanel Config nested title fields`.
- Landed DEBUG fixture reuse:
  `c3a28604b refactor(ui-components): factor KeyValue cursor DEBUG fixture glue`.
- Landed arrival flash mode as the public cue API:
  `a4173a28c feat(ui-components): add KeyValue cursor arrival flash mode`. The implementation was
  developed across the arrival feature/tidy commits immediately before this final test commit; the
  durable truth is `arrival?: false | 'flash'`, internal `first-adoption` / `target-change` cue
  kinds, and the hook module `KeyValue/m.Cursor/u/use.arrival.ts`.
- Landed lane-navigation grammar fix:
  `13e44dbe8 fix(ui-components): require option modifier for KeyValue cursor lane navigation`.
- Landed shared inline token primitive:
  `cf8eb30a6 feat(ui-components): add Chip inline token component`.
- Landed KeyValue DEBUG help adoption:
  `7cf88c6c1 refactor(ui-components): use Chip in KeyValue cursor DEBUG help`.
- Landed host-owned cursor keyboard entry hook:
  `cd657f730 feat(ui-components): expose KeyValue cursor keyboard entry hook`.
- Landed broad package typecheck repair exposed after the hook feature:
  `b67853a9b fix(ui-components): export VimeoBackground types through package type surface`. Actual
  commit subject is `Update types.ts`; durable intent is the type-surface export repair.
- After `b67853a9b`, `deno task check` passes for `code/sys.ui/ui-components`.
- Landed block-jump navigation:
  `853d0f0d0 feat(ui-components): add KeyValue cursor block-jump navigation`.
- Landed whole-set top/bottom navigation:
  `10ce1d60d feat(ui-components): add KeyValue cursor whole-set top-bottom navigation`. Durable
  truth: `cursor:first` / `cursor:last` remain data-only cursor commands; focused-root keyboard
  navigation maps Home/End plus platform Command/Ctrl + ArrowUp/ArrowDown to those commands;
  command-arrow platform detection uses `Keyboard.Is.command(...)`; movement stays within the
  current direct sibling scope. `90499871d` later made all vertical movement collapse row lanes when
  moving to a different target.
- Landed focused/blurred cursor affordance:
  `cfdbd090e feat(ui-components): distinguish focused and blurred KeyValue cursor affordance`.
  Durable truth: cursor focus is derived from the actual KeyValue cursor root element identity, not
  generated class names or focused descendants; focus/blur fill updates are state-free and factored
  through private `KeyValue/m.Cursor/u/u.affordance.ts`; `DataAttr.cellCurrent` centralizes the lane
  cell marker; static and reorder render paths have parity; arrival cues remain independent; no
  cursor model/API/command/activation semantics changed.
- Landed cursor retargeting grammar repair:
  `7cb237a5a fix(ui-components): retarget KeyValue cursor with plain click after entry`. Durable
  truth: `Option+click` remains the explicit entry gesture from inert/no-current cursor state; plain
  primary click with no current cursor remains inert; once `model.current` exists, plain primary
  click on another cursor-addressable boundary retargets through the existing data-only `cursor:set`
  / `cursor:entry` change shape with `entry: 'click'`; same-target plain click focuses the cursor
  root without emitting a no-op change; protected interactive descendants and nested boundary guards
  remain in force; static and reorder paths have parity; no cursor model/API/command/activation
  semantics changed.
- Landed structural InfoPanel item config model:
  `1a3f38fcf feat(ui): add structural InfoPanel item config model`. Durable truth:
  `Files.InfoPanel.Config.Item` is the minimal stable union
  `Field | { kind: 'divider'; id: string }`; no `{ kind: 'field' }` object branch and no divider
  string sentinels exist. `items` / `onItemsChange` is the structural source/mutation channel;
  `fields` / `onFieldsChange` remains the simple field-only channel; cross-channel mutation is
  disabled. Dividers project to `KeyValue` `hr` rows with stable IDs and remain cursor-addressable
  in the visible switch root. The nested title field tree is normalized as an atomic `group:title`
  render/reorder unit around structural dividers. The slice adds no keyboard insertion and no
  KeyValue model/API/domain semantics.
- Landed cursor-based divider insertion:
  `7883b4db0 feat(ui): support cursor-based divider insertion in InfoPanel config designer`. Durable
  truth: `InfoPanel.Config` owns the Option/Alt + Enter gesture and mutates only through the
  structural `items` / `onItemsChange` path. Insertion is disabled without a structural item source,
  without a current cursor target, for hidden targets, when cursor mode is disabled, from protected
  interactive descendants, and for Shift/Cmd/Ctrl/plain Enter variants. Visible field targets insert
  after their top-level visible item; title-family targets insert after the `group:title` atom;
  divider targets currently insert after that divider; new divider IDs are deterministic
  `divider:N`. No KeyValue model/API/domain semantics were added.
- Landed InfoPanel Config structural DEV/spec wiring:
  `c86bd59b0 test(ui): wire InfoPanel Config spec through structural items`. Durable truth: the
  DEV/spec harness persists and mutates through structural `items` / `onItemsChange`; stale DEV
  `fields` storage fallback was removed; this is harness glue only and adds no KeyValue helper API
  or domain semantics.
- Landed InfoPanel Config cursor keyboard AOI fix:
  `dc0f15bf1 fix(ui): wire InfoPanel Config cursor keyboard entry`. Durable truth:
  `InfoPanel.Config` now adopts the host-owned KeyValue cursor keyboard entry seam around its switch
  roots, so focused-root `Option+Enter` enters and `Escape` exits through the KeyValue cursor
  grammar; divider insertion remains host/domain-owned and `KeyValue.UI` remains non-mutating.
- Landed cursor keyboard namespace cleanup:
  `ead64e216 refactor(ui-components): namespace KeyValue cursor keyboard hooks`. Durable truth: the
  host-owned keyboard cursor adapter surface is now `KeyValue.Cursor.Keyboard.useEntry(...)` and
  `KeyValue.Cursor.Keyboard.useInsertAfter(...)`; the pure cursor helper remains
  `KeyValue.Cursor.insertAfter(...)`.
- Landed KeyValue cursor test fixture naming cleanup:
  `14c5ea049 refactor(ui-components): name KeyValue cursor test fixtures`. Durable truth: shared
  cursor test helpers live under `u.fixture.cursor.ts` / `u.fixture.keyboard.ts`.
- Landed reusable cursor insertion helpers:
  `c397a7f4e feat(ui-components): add KeyValue cursor item insertion helpers`. Durable truth:
  reusable cursor-addressed insertion is available through `KeyValue.Cursor.insertAfter(...)` and
  `KeyValue.Cursor.Keyboard.useInsertAfter(...)`; insertion remains host-owned, ID/item creation is
  host policy, no public `nextItemId(...)` exists, and insertion occurs within the current cursor
  sibling scope rather than blindly at top level.
- Landed KeyValue spec HR insertion proof:
  `b392ed57e test(ui-components): wire KeyValue spec cursor HR insertion`. Durable truth: the spec
  harness proves host-owned `Option+Enter` HR insertion with the reusable helper; `KeyValue.UI`
  remains primitive and non-mutating, and the focused-root help text renders gesture tokens through
  `Chip.UI`.
- Landed KeyValue cursor lane vertical movement fix:
  `90499871d fix(ui-components): collapse KeyValue cursor lanes on vertical movement`. Durable
  truth: key/value lane targets are projection parts, not nested scopes and not sticky row-to-row
  selection state; vertical movement moves to the previous/next sibling target and collapses to that
  target's atom. Block-edge and whole-set vertical movement use the same atom-collapse rule when
  they move to a different target. Boundary no-op movement keeps the current target unchanged,
  including any current lane.
- Landed KeyValue spec HR repeat guard:
  `ed755a7b1 fix(ui-components): prevent repeated KeyValue HR insertion`. Durable truth: repeated
  Option/Alt+Enter in the KeyValue spec/demo host no longer creates adjacent HR rows; the spec host
  owns the HR material rule, and `KeyValue.Cursor.Keyboard.useInsertAfter(...)` advances an internal
  latest-items projection after emitting `change.next` so follow-up key events do not reuse stale
  item arrays before React props catch up. `KeyValue.UI` remains primitive and non-mutating.
- Landed InfoPanel Config adjacent-divider guard:
  `15284a00f fix(ui): prevent adjacent divider insertion in InfoPanel config designer`. Durable
  truth: `InfoPanel.Config` no-ops if divider insertion would create adjacency at the resolved
  top-level insertion index; current-divider and immediately-before-divider cases do not prevent
  default, do not stop propagation, and do not emit `onItemsChange`; pre-existing bad adjacent data
  is not normalized in this slice.
- Landed lockfile follow-up after those slices:
  `46abd03c7 Update deno.lock`.
- Landed shared interactive descendant helper:
  `82458b2d5 refactor(ui-dom): centralize interactive descendant selector`. Durable truth:
  `Dom.Interactive.closest(...)`, `Dom.Interactive.Is.at(...)`, and
  `Dom.Interactive.Is.within(...)` now own conventional interactive/focusable DOM target detection;
  the raw selector remains private; exact-element `ignore` keeps host root policy local; KeyValue
  cursor internals and InfoPanel.Config now consume the shared helper without moving cursor,
  keyboard, divider, or React semantics into `@sys/ui-dom`.
- This plan file remains open/uncommitted as the current bookkeeping update.
- The former docs/help panel follow-up moved to
  `-agent/-plan/@sys.ui-components/markdown-backed-dev-help-panel.plan.md` because it is a
  Markdown/UI help rendering concern, not cursor interaction semantics.
- There are no remaining unchecked cursor-interaction entries in this plan.

Capstone commit slicing:

1. `feat(ui-components): add KeyValue cursor block-jump navigation`
   - Primitive implementation commit.
   - The block-jump design below is the implementation contract; no separate design-only commit is
     required.
   - Owns cursor reducer helpers/commands, focused-root keyboard mapping, DEBUG help, and focused
     KeyValue tests.
   - Does not include InfoPanel, Files<T>, config-designer, divider insertion, copy affordances,
     ARIA/grid expansion, or host domain edits.
2. `10ce1d60d feat(ui-components): add KeyValue cursor whole-set top-bottom navigation`
   - Landed primitive follow-up after the block-jump commit.
   - Adds whole-scope top/bottom navigation: Home/End plus platform Meta + ArrowUp/ArrowDown.
   - Uses the proper `@sys/ui-dom` Keyboard/platform-meta abstraction for the command-arrow path; it
     does not hard-code Mac-only `Cmd`/`metaKey` semantics into `KeyValue`.
   - Keeps it host-neutral and data-command based with `cursor:first` / `cursor:last`.
   - Does not include InfoPanel, Files<T>, config-designer, divider insertion, copy affordances,
     ARIA/grid expansion, or host domain edits.
3. `cfdbd090e feat(ui-components): distinguish focused and blurred KeyValue cursor affordance`
   - Landed primitive visual-state commit after whole-set navigation.
   - Makes the current cursor stronger when the KeyValue cursor root itself owns DOM focus and keeps
     the parked current cursor visible but dimmer when that root is blurred.
   - Owns only visual affordance state derived from DOM focus. It does not add cursor model fields,
     commands, activation, selection, clipboard, ARIA/grid expansion, or host/domain behavior.
   - Landed before InfoPanel divider insertion so the primitive cursor feels truthful during the
     host-domain capstone.
4. `7cb237a5a fix(ui-components): retarget KeyValue cursor with plain click after entry`
   - Landed primitive interaction-grammar repair after the focused/blurred affordance commit.
   - Preserves `Option+click` as the explicit entry gesture from inert/no-current cursor state.
   - Once cursor mode exists for the controlled KeyValue model, plain primary click on another
     cursor-addressable boundary retargets the current cursor and keeps/focuses the cursor root.
   - Plain primary click does not enter cursor mode from no-current state.
   - Same-target plain click focuses the cursor root without emitting a redundant no-op change.
   - Protected interactive descendants and nested boundary guards remain in force.
   - Keyboard truth remains unchanged: after entry, unmodified ArrowUp/ArrowDown already move the
     current cursor row; Option+ArrowUp/ArrowDown remain block jumps; Option+ArrowLeft/ArrowRight
     remain lane navigation; Escape exits cursor mode.
5. `1a3f38fcf feat(ui): add structural InfoPanel item config model`
   - Landed host/domain model commit before cursor-based insertion.
   - Adds a durable structural config item model so dividers are persisted as identity-bearing
     layout items, not overloaded field strings.
   - Keeps existing `fields?: Field[]` / `onFieldsChange` as the simple field-only path.
   - Introduces the minimal stable structural API: `Field | { kind: 'divider'; id: string }`.
   - Enforces strict source/mutation ownership: structural item sources mutate only through
     `onItemsChange`, and field-only sources mutate only through `onFieldsChange`.
   - Keeps title fields atomic around dividers because they render/reorder as `group:title`.
   - Does not add keyboard input, cursor actions, or KeyValue domain semantics.
6. `7883b4db0 feat(ui): support cursor-based divider insertion in InfoPanel config designer`
   - Landed host/domain interaction capstone after the structural item model exists.
   - Uses cursor target truth to perform host-owned divider insertion without teaching KeyValue any
     domain semantics.
   - Primary input: Option/Alt + Enter.
7. `c86bd59b0 test(ui): wire InfoPanel Config spec through structural items`
   - Landed DEV/spec harness follow-up so committed divider insertion behavior is manually
     verifiable.
   - Switches the InfoPanel.Config spec state path to structural `items` / `onItemsChange`.
   - Removed stale DEV `fields` storage fallback.
   - Harness glue only: no KeyValue hooks, no KeyValue domain semantics, no new public helper API.
8. `dc0f15bf1 fix(ui): wire InfoPanel Config cursor keyboard entry`
   - Landed host/AOI repair after spec wiring.
   - `InfoPanel.Config` installs the host-owned KeyValue cursor keyboard entry seam around its
     rendered switch roots.
   - Focused-root `Option+Enter` enters and `Escape` exits; divider insertion remains a separate
     host-owned `items` mutation path.
   - No generic KeyValue mutation or domain semantics.
9. `ead64e216 refactor(ui-components): namespace KeyValue cursor keyboard hooks`
   - Landed API naming cleanup before helper/spec insertion slices.
   - Public runtime surface is now `KeyValue.Cursor.Keyboard.useEntry(...)` and
     `KeyValue.Cursor.Keyboard.useInsertAfter(...)`.
   - Removed the awkward top-level hook shape from the current public surface.
10. `14c5ea049 refactor(ui-components): name KeyValue cursor test fixtures`
    - Landed test-fixture naming cleanup before helper/spec insertion slices.
    - Shared test helpers now use canon-clear fixture names: `u.fixture.cursor.ts` /
      `u.fixture.keyboard.ts`.
11. `c397a7f4e feat(ui-components): add KeyValue cursor item insertion helpers`
    - Landed primitive/helper slice.
    - Files:
      ```text
      code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.dom.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.event.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.insert.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-m.Cursor.insert.test.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.cursor-insertion.test.tsx
      ```
    - Adds reusable cursor-addressed insertion mechanics without mutating from `KeyValue.UI`.
    - Host supplies item creation/ID policy; no public `nextItemId(...)` exists.
    - `insertAfter(...)` operates inside the current cursor sibling scope.
12. `b392ed57e test(ui-components): wire KeyValue spec cursor HR insertion`
    - Landed spec/demo harness slice after helper landing.
    - Files:
      ```text
      code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-SPEC.Debug.tsx
      code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.CursorHelp.tsx
      code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.Root.tsx
      code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.spec-hr-insertion.test.tsx
      ```
    - Proves host-owned `Option+Enter` can insert `{ kind: 'hr' }` in the KeyValue spec harness.
    - Gesture help belongs in `CursorDebug.Help` and renders the gesture through `Chip.UI`.
    - No generic `KeyValue.UI` mutation or domain semantics.
13. `90499871d fix(ui-components): collapse KeyValue cursor lanes on vertical movement`
    - Landed primitive semantics fix before the next InfoPanel/domain fix.
    - Files:
      ```text
      code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.move.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-m.Cursor.test.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.cursor-navigation.test.tsx
      ```
    - DMIND choice: lane targets are projection parts of a row, not nested cursor scopes.
    - `ArrowUp` / `ArrowDown` from `part: 'key' | 'value'` move to the previous/next sibling target
      in the current scope and collapse to that target's atom.
    - Block-edge and whole-set vertical movement follow the same atom-collapse rule when they move
      to a different target.
    - Boundary no-op movement keeps the current target unchanged, including any current lane.
    - Do not make lane currentness trap vertical movement, change nested scope, or imply selection,
      editing, or activation semantics.
14. `ed755a7b1 fix(ui-components): prevent repeated KeyValue HR insertion`
    - Landed spec-host/material guard after the KeyValue spec HR insertion proof and lane repair.
    - Files:
      ```text
      code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/use.KeyboardInsertAfter.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.Root.tsx
      code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.spec-hr-insertion.test.tsx
      code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.cursor-insertion.test.tsx
      ```
    - Durable truth: the reusable keyboard insertion hook keeps a latest emitted item projection so
      rapid follow-up key events do not reuse stale items before host props re-render; host mutation
      remains via `onChange` and `KeyValue.UI` still performs no mutation.
    - The KeyValue spec/demo host owns the HR material rule and no-ops when insertion would be
      adjacent to an existing HR in the current sibling scope.
15. `15284a00f fix(ui): prevent adjacent divider insertion in InfoPanel config designer`
    - Landed host/domain material-shape constraint after divider insertion and lane vertical
      semantics were fixed.
    - Files:
      ```text
      code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/u.divider.ts
      code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/-test/-u.divider.test.ts
      code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/-test/-ui.cursor.test.tsx
      ```
    - Adjacent dividers are now unrepresentable through the insertion gesture: current divider,
      current target immediately before a divider, and title-family insertion immediately before a
      divider all no-op.
    - Delete/removal remains explicitly out of scope and needs its own DMIND design, including
      destructive confirmation semantics.
16. `82458b2d5 refactor(ui-dom): centralize interactive descendant selector`
    - Landed shared DOM helper after the KeyValue/InfoPanel material guards proved the duplicate
      selector shape.
    - Files:
      ```text
      code/sys.ui/ui-dom/src/m.Dom/m.Dom.Interactive.ts
      code/sys.ui/ui-dom/src/m.Dom/m.Dom.ts
      code/sys.ui/ui-dom/src/m.Dom/t.ts
      code/sys.ui/ui-dom/src/m.Dom/-.test.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.dom.ts
      code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.event.ts
      code/sys.ui/ui/src/common/libs.ts
      code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/u.divider.ts
      ```
    - Durable truth: `Dom.Interactive` centralizes conventional interactive/focusable DOM target
      detection with `closest(...)`, `Is.at(...)`, and `Is.within(...)`; selector detail is private.
    - Host policy remains local: KeyValue and InfoPanel pass their own root as an exact-element
      `ignore` when needed; `@sys/ui-dom` knows nothing about cursor roots, divider insertion,
      keyboard grammar, or React.

### Design contract: focused and blurred KeyValue cursor affordance

Status: LANDED in `cfdbd090e`.

Commit subject: `feat(ui-components): distinguish focused and blurred KeyValue cursor affordance`.

Intent:

- The cursor model already represents currentness; this slice makes the visual affordance
  distinguish an active keyboard-receiving cursor root from a parked/blurred cursor.
- A blurred cursor must remain visible so users can keep spatial context after the KeyValue root
  loses DOM focus.
- A focused cursor root should render the current item/lane with a stronger shade so the user can
  tell keyboard commands will move that cursor.

Implementation contract:

- Derive the state from DOM focus on the KeyValue cursor root, not from cursor model state.
- Final implementation is state-free: no React focus state; direct root focus/blur handlers update
  only currently rendered cursor target fills through private `m.Cursor/u/u.affordance.ts`.
- Treat the focus boundary as the actual KeyValue cursor root (`data-keyvalue-cursor-root`), not any
  arbitrary interactive descendant. Native interactive descendants remain protected from cursor
  keyboard navigation and should not make the primitive claim active cursor-root focus.
- Use root element identity, not generated class identity, when deriving initial focused render
  state; multiple KeyValue roots may share generated style classes.
- Keep zero-layout-shift currentness: change color/opacity only, not border width, padding, margin,
  or measured layout.
- Apply the distinction to both atom/group current boundaries and key/value lane current cells.
- Preserve the existing arrival flash semantics. Focus/blur changes must not spend, replay,
  suppress, or re-key arrival cues.
- Preserve existing public API: no new cursor props, no new command names, no new cursor model
  fields.
- Preserve the existing DOM truth markers. `DataAttr.cellCurrent` centralizes the current lane cell
  marker and `data-keyvalue-cursor-current` / `data-keyvalue-cursor-cell-current` remain the source
  of test/query truth.

Suggested visual contract:

- Blurred/parked current fill: visible but quiet, lower alpha than the current implementation if
  necessary.
- Focused/root-active current fill: stronger than blurred, still quiet enough not to read as
  selection or activation.
- Lane fill follows the same focused-vs-blurred rule, with a lane-specific color allowed but not a
  separate semantic state.
- Exact alpha values are implementation detail; tests should assert ordering
  (`focused > blurred > 0`) rather than pinning brittle numbers.

Required tests:

- Rendered affordance test proves current boundary background alpha is visible while root is
  blurred, grows when `data-keyvalue-cursor-root` receives DOM focus, and returns to the dimmer
  value after blur.
- Lane affordance test proves key/value current cell follows the same focused/blurred alpha
  ordering.
- Reorder path parity test proves direct reorder shells receive the same focused/blurred current
  affordance.
- Existing arrival cue tests continue to pass and prove arrival cue alpha remains independent of the
  focus/blur affordance state.

Explicit non-goals:

- No InfoPanel, Files<T>, config-designer, divider insertion, clipboard, CopyTarget, ARIA/grid,
  selection, or generic activation work.
- No generic `KeyValue.UI` action behavior.
- No command grammar changes.

### Design contract: KeyValue cursor retargeting after entry

Status: LANDED in `7cb237a5a`.

Commit subject: `fix(ui-components): retarget KeyValue cursor with plain click after entry`.

Intent:

- `Option+click` remains the explicit entry gesture from an inert KeyValue cursor state.
- After cursor mode exists, plain click should feel like retargeting the active cursor, not like a
  request to re-enter mode with the same modifier grammar.
- This aligns mouse and keyboard grammar: enter deliberately, then move/retarget directly until
  Escape exits.

Implementation contract:

- Plain primary click on a cursor-addressable boundary retargets only when the controlled cursor
  model already has a current target.
- Plain primary click while the model has no current target remains inert; it does not create cursor
  mode accidentally.
- `Option+click` continues to enter/retarget through the existing entry path.
- Retargeting emits the existing data-only `cursor:set` change shape as `reason: 'cursor:entry'`
  with `entry: 'click'`; no public cursor change union or command grammar was expanded.
- Retargeting focuses the KeyValue cursor root so subsequent unmodified ArrowUp/ArrowDown continue
  to move the current cursor.
- Same-target plain click focuses the cursor root but does not emit a redundant no-op `onChange`.
- Protected interactive descendants and nested boundary guards remain in force.
- Static and reorder render paths have parity.

Keyboard grammar truth:

- Unmodified ArrowUp/ArrowDown already move the current cursor after entry.
- Option+ArrowUp/ArrowDown remain block jumps.
- Home/End and platform command arrows remain whole-scope top/bottom jumps.
- Option+ArrowLeft/ArrowRight remain lane navigation; plain ArrowLeft/ArrowRight must not lane-nav.
- Escape exits cursor mode.

Required tests:

- Plain click with no current cursor does not enter mode.
- `Option+click` enters cursor mode as today.
- After entry, plain click on another cursor boundary retargets the current cursor and focuses the
  cursor root.
- Same-target plain click focuses the cursor root without emitting a no-op change.
- Plain click retargeting does not fire from interactive descendants or nested child boundaries.
- Reorder path parity covers the same after-entry retarget behavior.

Explicit non-goals:

- No generic `KeyValue.UI` activation/action behavior.
- No InfoPanel, divider insertion, clipboard, CopyTarget, ARIA/grid, or selection semantics.
- No change to the cursor data model or command grammar.

### Design contract: structural InfoPanel item config model

Status: LANDED in `1a3f38fcf`.

Commit subject: `feat(ui): add structural InfoPanel item config model`.

Intent:

- Dividers are structural layout items, not InfoPanel data fields.
- The existing field-only API remains the simple/default path.
- Divider-capable configuration gets identity-bearing items so multiple dividers can persist,
  reorder, render, and survive cursor insertion without sentinels.

Model contract:

- Preserve existing public field API:
  - `fields?: t.Files.InfoPanel.Field[]`
  - `onFieldsChange?: (e: { next: Field[] }) => void`
- Add structural item API with the smallest stable shape:
  - `items?: t.Files.InfoPanel.Config.Item[]`
  - `onItemsChange?: (e: { next: Item[] }) => void`
- Define structural items as the minimal stable union:
  - field shorthand: a public InfoPanel field string;
  - divider object: `{ kind: 'divider'; id: string }`.
- Do not use string sentinels such as `'hr'`, `'---'`, or `'divider'` as fields.
- Normalize fields through existing field dependency rules; preserve divider object identity/order.
- Keep the nested title field tree atomic around structural dividers because it renders as one
  `group:title` cursor/reorder atom.
- Maintain strict source/handler ownership: `fields` mutates through `onFieldsChange`, and `items`
  mutates through `onItemsChange`; do not emit cross-channel changes.
- Existing `fields` and `onFieldsChange` behavior stays source-compatible and green in field-only
  mode.
- When both item and field APIs are supplied, the item API is the richer source of render truth;
  structural mutation requires `onItemsChange` and does not fall back to `onFieldsChange`.

Projection contract:

- Visible structural items render through the visible `KeyValue.Switches` root.
- Divider items project to `KeyValue.Switches` / `KeyValue` `hr` items with stable IDs.
- Hidden rows remain field rows only; hidden dividers are not meaningful.
- Reorder over the visible section preserves divider items and emits structural item order when
  `onItemsChange` is provided.
- Field-only reorder continues to emit `onFieldsChange` exactly as before.

Explicit non-goals:

- No keyboard insertion yet.
- No cursor-based divider insertion yet.
- No KeyValue model/API changes.
- No generic activation, selection, clipboard, or ARIA/grid expansion.

### Design contract: cursor-based divider insertion in InfoPanel config designer

Status: LANDED in `7883b4db0`.

Commit subject: `feat(ui): support cursor-based divider insertion in InfoPanel config designer`.

Input grammar:

- Primary input: Option/Alt + Enter.
- Plain Enter remains cursor-enter / group descent.
- Shift+Enter is reserved by soft-break convention and must not mean structural insert.
- Command/Ctrl+Enter is reserved by send/submit/run convention and must not mean structural insert.

Behavior contract:

- Divider insertion is host/domain-owned by `InfoPanel.Config`; KeyValue remains primitive and
  domain-neutral.
- Insertion is opt-in and only enabled when the structural item model can persist dividers.
- No current cursor target: no-op.
- Current target in hidden section: no-op.
- Current visible field target: insert divider after the current top-level visible item.
- Current nested title child target: insert after the `group:title` atom, not inside title
  internals.
- Original `7883b4db0` behavior allowed current divider targets to insert after that divider; the
  adjacent-divider constraint below supersedes that behavior and makes current-divider insertion a
  no-op.
- Generate the next unused stable divider ID, e.g. `divider:1`, `divider:2`, ... .
- Preserve existing cursor keyboard grammar and focused/blurred affordance.

### Design contract: adjacent divider insertion constraint

Status: LANDED in `15284a00f`.

Commit subject: `fix(ui): prevent adjacent divider insertion in InfoPanel config designer`.

Intent:

- Make the structural item material feel self-governing: repeated divider insertion should not
  create low-signal adjacent separators.
- Keep this rule host/domain-owned by `InfoPanel.Config`; do not push divider material semantics
  into `KeyValue` or cursor helpers.

Implementation contract:

- `insertDividerAfterCursor(...)` remains the single pure material gate for structural divider
  insertion.
- Resolve the existing insertion index exactly as today:
  - visible field targets insert after their top-level visible item;
  - title-family targets insert after the atomic title group position;
  - hidden/missing/currentless targets stay no-op.
- After resolving the insertion index, no-op if inserting there would create adjacent dividers:
  - current item at the insertion index is already a divider;
  - or the next item after the insertion index is already a divider.
- Existing adjacent dividers, if already present in caller data, are not repaired in this slice;
  this slice only prevents the insertion gesture from creating new adjacency.
- Keep deterministic `divider:N` ID generation for allowed insertions.
- Keyboard handler behavior remains consistent with existing guards: if pure insertion returns
  `undefined`, do not prevent default, do not stop propagation, and do not emit `onItemsChange`.

Landed file set:

```text
code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/u.divider.ts
code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/-test/-u.divider.test.ts
code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/-test/-ui.cursor.test.tsx
```

Landed tests:

- Pure helper still inserts after a visible field target when no adjacent divider would result.
- Pure helper skips used divider IDs for allowed insertions.
- Pure helper no-ops when current target is a divider.
- Pure helper no-ops when current target is immediately before an existing divider.
- Pure helper no-ops for title-family insertion when the atomic title group is immediately before an
  existing divider.
- Rendered UI no-ops and emits no `onItemsChange` for at least one adjacent-divider cursor case.
- Existing keyboard grammar guards remain green: no plain Enter, no Shift+Enter, no Cmd/Ctrl+Enter,
  no interactive descendant insertion.

Explicit non-goals:

- No delete/remove behavior in this slice.
- No destructive confirmation design here; delete requires a separate DMIND pass.
- No normalization/cleanup of existing adjacent dividers in caller data.
- No KeyValue model/API/domain semantics.

### Design contract: InfoPanel Config structural-items DEV spec wiring

Status: LANDED in `c86bd59b0`.

Commit subject: `test(ui): wire InfoPanel Config spec through structural items`.

Intent:

- Make the `InfoPanel.Config` DEV/spec harness exercise the structural `items` API so Option/Alt +
  Enter divider insertion is manually verifiable.
- Keep this as harness/spec glue only.

Implementation contract:

- Drive the spec state through `items?: t.Files.InfoPanel.Config.Item[]`.
- Update the spec render path to use `items` and `onItemsChange` instead of the field-only `fields`
  / `onFieldsChange` path.
- Preserve reset/persistence behavior for the spec state.
- Do not add KeyValue hooks, KeyValue domain semantics, or new public helper APIs.

### Design contract: InfoPanel Config cursor keyboard entry adoption

Status: LANDED in `dc0f15bf1`.

Commit subject: `fix(ui): wire InfoPanel Config cursor keyboard entry`.

Intent:

- Complete the host adoption of the KeyValue cursor interaction idiom inside `InfoPanel.Config`.
- Option-click already worked because cursor props were threaded into `KeyValue.Switches`; the gap
  was keyboard/focus adoption at the InfoPanel host boundary.

Implementation contract:

- `InfoPanel.Config` installs `KeyValue.Cursor.Keyboard.useEntry(...)` around its switch roots.
- The hook receives the projected visible switch items when present, otherwise the hidden switch
  items, so focused-root entry has a deterministic first target.
- Focused-root `Option+Enter` enters through normal `cursor:entry` / `entry: 'option-enter'` change
  truth.
- Focused-root `Escape` clears current cursor truth through the existing KeyValue root grammar.
- Divider insertion remains separately host-owned through structural `items` / `onItemsChange`.
- `KeyValue.UI` remains primitive and non-mutating.

### Design contract: KeyValue cursor item insertion helpers

Status: LANDED in `c397a7f4e`.

Commit subject: `feat(ui-components): add KeyValue cursor item insertion helpers`.

Intent:

- Extract reusable cursor-addressed insertion mechanics from host/spec experiments without teaching
  `KeyValue.UI` any domain mutation semantics.
- Give hosts a small, tested cursor helper for inserting an item relative to the current target.

Implementation contract:

- Public cursor surface adds `KeyValue.Cursor.insertAfter(...)` and
  `KeyValue.Cursor.Keyboard.useInsertAfter(...)`.
- `insertAfter(...)` inserts into the current cursor sibling scope, not blindly into the top-level
  item array.
- Item creation and ID generation remain host policy. Do not expose a public
  `KeyValue.Cursor.nextItemId(...)` helper.
- `Keyboard.useInsertAfter(...)` is a host adapter: it listens for the chosen keyboard insertion
  grammar and calls host-provided creation/change callbacks; it does not mutate from `KeyValue.UI`.
- DOM/interactive-descendant guards are centralized in cursor internals for now, with a later
  `ui-dom` extraction still parked as its own refactor.

Landed files:

```text
code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.dom.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.event.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.insert.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-m.Cursor.insert.test.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.cursor-insertion.test.tsx
```

### Design contract: KeyValue spec cursor HR insertion

Status: LANDED in `b392ed57e`.

Commit subject: `test(ui-components): wire KeyValue spec cursor HR insertion`.

Intent:

- Prove the reusable insertion helper from a host-owned KeyValue spec harness.
- Keep the generic `KeyValue.UI` primitive: the spec host owns `{ kind: 'hr' }` creation and item
  mutation.

Implementation contract:

- Spec/debug root wires `KeyValue.Cursor.Keyboard.useInsertAfter(...)` to insert host-created HR
  items.
- Keyboard grammar avoids plain Enter, Shift+Enter, and Cmd/Ctrl+Enter; the intended demo gesture is
  Option/Alt + Enter.
- Help text lives in `CursorDebug.Help` under the focused-root/once-focused command list.
- Gesture tokens render through `Chip.UI`, not ad hoc chip styling.
- No public KeyValue mutation semantics, no InfoPanel domain coupling, and no item-ID policy in the
  primitive.

Landed files:

```text
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-SPEC.Debug.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.CursorHelp.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.Root.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.spec-hr-insertion.test.tsx
```

### Design contract: KeyValue cursor lane vertical movement semantics

Status: LANDED in `90499871d`.

Commit subject: `fix(ui-components): collapse KeyValue cursor lanes on vertical movement`.

Intent:

- Remove ambiguity around what `ArrowUp` / `ArrowDown` mean when the current target is inside a
  key/value lane.
- Keep the cursor model simple: `part` is a projection lane on the current row target, not a child
  scope and not sticky row-to-row selection state.
- Fix behavior before more host-domain divider work so InfoPanel insertion does not accidentally
  bend primitive cursor semantics.

Semantic decision:

- Choose corrected Option 2: vertical movement from `part: 'key' | 'value'` moves to the
  previous/next sibling target in the current cursor scope, then collapses to that target's atom.
- Do not preserve the lane part across row-to-row vertical movement.
- Do not no-op merely because the cursor is in a lane.
- Boundary movement that does not change targets remains a no-op and preserves the current lane.
- Do not treat lane currentness as nested scope entry; `Enter` / `Escape` remain the structural
  scope grammar.

Landed tests:

- Reducer/UI: `key` lane + `ArrowUp` moves to the previous row atom with no `part`.
- Reducer/UI: `value` lane + `ArrowDown` moves to the next row atom with no `part`.
- Reducer/UI: lane + vertical movement to a divider/title/group/non-row atom also lands on that atom
  with no `part`.
- Reducer: vertical movement remains within the current sibling scope; it does not enter or exit
  groups.
- Reducer/UI: block-edge and whole-set vertical movement collapse lanes when they move to a
  different target.
- Reducer: boundary no-op movement preserves the current lane because the target did not change.

Explicit non-goals:

- No selection model, editing mode, range behavior, or generic activation.
- No InfoPanel divider insertion changes in this commit.
- No new cursor target shape; keep `path + part`.

### Design contract: repeated KeyValue spec HR insertion guard

Status: LANDED in `ed755a7b1`.

Commit subject: `fix(ui-components): prevent repeated KeyValue HR insertion`.

Intent:

- Make the KeyValue spec/demo host obey the same low-signal material rule expected by real hosts:
  repeated `Option/Alt+Enter` should not stack adjacent HR rows.
- Keep HR/divider material semantics host-owned. The generic `KeyValue.UI` primitive remains
  non-mutating and domain-neutral.

Implementation contract:

- `KeyValue.Cursor.Keyboard.useInsertAfter(...)` keeps an internal latest-items projection and
  advances it to `change.next` before invoking host `onChange`.
- The hook still emits through host-owned `onChange`; it does not mutate `KeyValue.UI` state or own
  item creation/ID policy.
- When parent props later provide a new `items` array, the latest-items projection re-syncs to that
  source of truth.
- The KeyValue spec host no-ops HR creation when the current insertion point is adjacent to an
  existing HR in the current sibling scope.
- No-op insertions do not prevent default and do not stop keyboard propagation.

Landed files:

```text
code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/use.KeyboardInsertAfter.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.Root.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.spec-hr-insertion.test.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.cursor-insertion.test.tsx
```

### Design contract: shared interactive descendant helper

Status: LANDED in `82458b2d5`.

Commit subject: `refactor(ui-dom): centralize interactive descendant selector`.

Intent:

- Remove duplicate conventional interactive/focusable descendant selectors from KeyValue cursor
  internals and InfoPanel.Config divider insertion.
- Put the common DOM mechanism in `@sys/ui-dom` without moving host policy or domain semantics into
  the DOM package.

Implementation contract:

- Public DOM surface is behavioral and predicate-namespaced:
  - `Dom.Interactive.closest(target, options?)`
  - `Dom.Interactive.Is.at(target, options?)`
  - `Dom.Interactive.Is.within(target, boundary, options?)`
- The raw selector is private implementation detail, not public API.
- `options.ignore` ignores only the exact supplied element as an interactive match; descendants may
  still match.
- `Is.within(...)` rejects interactive ancestors that are outside the supplied boundary.
- `@sys/ui-dom` does not know about KeyValue cursor roots, InfoPanel dividers, keyboard grammar,
  React, or mutation semantics.
- KeyValue and InfoPanel own their local root-policy choices by passing `ignore` where needed.

Landed files:

```text
code/sys.ui/ui-dom/src/m.Dom/m.Dom.Interactive.ts
code/sys.ui/ui-dom/src/m.Dom/m.Dom.ts
code/sys.ui/ui-dom/src/m.Dom/t.ts
code/sys.ui/ui-dom/src/m.Dom/-.test.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.dom.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/m.Cursor/u/u.event.ts
code/sys.ui/ui/src/common/libs.ts
code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/u.divider.ts
```

### Retirement / successor work

This cursor interaction plan is complete. Keep it as landed-history reference until the broader
KeyValue/InfoPanel docs are consolidated.

Moved out of this plan:

```text
-agent/-plan/@sys.ui-components/markdown-backed-dev-help-panel.plan.md
```

That successor owns the former reusable help/docs panel item and the Markdown-backed UI rendering
question.

Remaining adjacent non-cursor candidate:

1. `refactor(ui): keep InfoPanel Config switch toggles in place`
   - If pursued, preserve the design note: toggle is not reorder.
   - Make any disabled-below-enabled organization an explicit command, not implicit toggle side
     effect.

## Historical archive

The remaining notes below preserve the original planning trail. Treat any old pre-implementation
language as historical unless it is restated above in the complete/current-reality sections.

Pre-implementation gate for block-jump: GO now. Required thinking level: HIGH, because the semantics
are bounded but the reducer/keyboard/test edge cases are structural.

Landing truth: the key/value cursor lane slice landed in commit `8bbe23a54`. The actual commit
subject at HEAD is `feat(workspace): collect capability-tagged native test stats`, but the landed
file set and behavior match the planned
`feat(ui-components): navigate KeyValue key/value cursor lanes` slice.

Post-lane repair truth:

- The lane slice landed in `8bbe23a54` and proves model identity, data-only lane commands, rendered
  DOM markers, and lane movement.
- The keyboard-entry/observability repair landed in `2296a73bd`.
- `Option+Enter` now enters cursor mode from an explicitly focused cursor root.
- `Option+ArrowLeft` and `Option+ArrowRight` now provide keyboard lane entry from the focused root
  and lane movement while currentness exists.
- Key/value lane currentness is now visibly observable with a minimal ruby/equivalent fill and a
  current-cell DOM marker derived from cursor truth.
- The repair did not introduce selection, generic activation, host edits, or `part: 'row'`.

Upstream keyboard-hardening truth:

- The KeyValue debug harness exposed a core `@sys/ui-dom` keyboard ownership bug: capture-phase
  global `Keyboard.until(...).on(...)` handlers could call destructive `handled()` and starve local
  React/DOM `onKeyDown` handlers.
- Keyboard ownership hardening landed upstream:
  - `6894df21e test(ui-dom): pin keyboard event ownership semantics (red tests)`
  - `d56f96eae feat(ui-dom): split keyboard default prevention routing and consumption controls`
  - `14c84ae28 refactor(ui-dom): group keyboard internals and tests`
  - `f1de84a65 refactor(ui-dom): organize keyboard internals and tests`
  - `8bea1856a refactor(ui-dev): migrate devharness keyboard ownership calls`
  - `ae2e3189f refactor(driver-monaco): make prompt escape keyboard ownership explicit`
  - `137b2a6e refactor(ui-components): return KeyValue cursor handoff through explicit keyboard ownership`
  - `105d16e20 feat(ui-dom)!: drop keyboard handled aliases`
- Current keyboard subscriber controls are explicit:
  - `preventDefault()` prevents browser default only;
  - `stopKeyboardPropagation()` stops later `Keyboard` subscribers for that monitor emission without
    stopping DOM propagation;
  - `consume()` is destructive ownership: default prevention plus keyboard and DOM propagation stop;
  - callable `handled()` aliases have been removed.
- The KeyValue harness uses the hardened API; global host handoff must never call destructive
  ownership when the KeyValue root is already the focused local keyboard receiver.

Harness composition proof truth:

- The debug harness handoff slice landed in `137b2a6e4`.
- It is intentionally a harness/host composition proof, not a new `KeyValue.UI` global-listener
  behavior.
- `Option+Enter` at host/page level can focus the KeyValue cursor root and seed the first cursor
  target through the controlled cursor model.
- If the KeyValue cursor root already has local focus, the harness backs off so the component's
  focused-root `Option+Enter` grammar handles the event.
- The handoff uses explicit `@sys/ui-dom` keyboard ownership and avoids destructive DOM propagation
  stops for local cursor grammar.
- This proof flushed and then consumed the upstream keyboard hardening work; it is the stable
  manual/debug substrate for the next cursor action slice.

## TMIND/DMIND arc review

Verdict: keep the arc as semantic proof boundaries. The original four-commit plan remains the design
spine, and current reality inserted two narrow pre-Space slices after lanes: keyboard entry/visual
observability, then a harness-owned global handoff proof on top of hardened `@sys/ui-dom` keyboard
ownership.

Design spine:

```text
semantic target → lane target → capability action → host command → visual confirmation
```

The arc moves are primitive, reliable boundaries:

1. `feat(ui-components): navigate KeyValue key/value cursor lanes`
   - Owns the structural model: target part, Left/Right grammar, vertical lane collapse, and
     part-first Escape.
   - This is the bedrock commit. It may be internally developed in smaller steps, but should not
     land a public `part` shape without truthful runtime navigation and tests in the same slice.
   - Visual proof should be minimal and subordinate to the model. A crude debug/proof fill is enough
     while shaping the behavior; it must not become the API.
   - No action, selection, editing, host insertion, keyboard-entry expansion, or polished arrival
     animation in this slice.
2. `fix(ui-components): make KeyValue cursor keyboard entry and lane affordance observable`
   - Landed in `2296a73bd`.
   - Repaired the acceptance gap after the lane commit.
   - Added honest keyboard entry via `Option+Enter` through an explicit DOM focus/capture surface.
   - Added `Option+ArrowLeft` / `Option+ArrowRight` as keyboard lane entry/movement without
     introducing selection, action, host edits, or `part: 'row'`.
   - Made key/value lane currentness visually observable enough for users and tests.
   - Kept keyboard semantics on the canonical `@sys/ui-dom` `Keyboard` surface through local
     `common.ts`.
   - Kept rendered keyboard tests DRY with a KeyValue-local test helper around `DomMock.Keyboard`.
3. `refactor(ui-components): return KeyValue cursor handoff through explicit keyboard ownership`
   - Landed in `137b2a6e4`.
   - Proved host-owned global command/focus arbitration without moving global listeners into
     `KeyValue.UI`.
   - Uses hardened `@sys/ui-dom` keyboard ownership so the harness can stop keyboard-bus propagation
     without starving local React/DOM cursor grammar.
   - Establishes the boring debug path for entering the structure from page/host context before
     action semantics.
4. `refactor(ui-components): isolate KeyValue cursor handoff hook`
   - Landed in `db7b0b806`.
   - Moved the harness-owned cursor keyboard handoff out of `-ui.Root.tsx` and into a spec-local
     hook file.
   - Keeps `Root` as render/adapter only.
   - Does not generalize the hook outside the KeyValue spec harness.
5. `refactor(ui-components): clarify KeyValue cursor command reducer naming`
   - Landed in `f25ccd916`.
   - Made command-shaped cursor reduction explicit with `Cursor.cmd(model, items, command)`.
   - Keeps `Cursor.set(model, items, target)` as convenience sugar that routes through
     `Cursor.cmd(...)`.
   - Preserved minimal public surface and avoided command factories or over-determined abstractions.
6. `refactor(ui-components): structure KeyValue cursor module internals`
   - Landed in `56aa956f6`.
   - Moved pure cursor helpers under `m.Cursor/u/`.
   - Moved the runtime `Cursor` module object under `m.Cursor/m/`.
   - Keeps `m.Cursor/mod.ts` as the stable public module boundary.
   - Added `m.Cursor/m/m.Cursor.u.ts` for private runtime reducer helpers.
   - No behavior or public API changes.
7. `feat(ui-components): toggle KeyValue.Switches with cursor Space`
   - Landed in `2aeb04c02`.
   - Proves capability-gated action from a cursor target without making every row actionable.
   - The switch projection owns the action capability; generic `KeyValue` still only owns target
     resolution and keyboard translation.
   - Row atom and value-lane targets toggle when the current target resolves to an enabled
     `KeyValue.Switches.Row` with `onToggle`.
   - Key-lane targets, groups, dividers, missing paths, disabled rows, and rows without handlers
     no-op.
   - Rejected cursor-Space attempts from the cursor root still prevent default scrolling while
     preserving no-op action semantics.
   - Toggle payloads are command/source-shaped: `keyvalue-switches:toggle` plus `pointer` or
     `cursor-keyboard` provenance; `synthetic` remains only a pointer compatibility bridge.
   - Generic `KeyValue.UI` did not gain activation behavior.
8. `refactor(ui-components): centralize KeyValue.Switches item guards`
   - Landed in `c44a2b94a`.
   - Centralized duplicated `KeyValue.Switches` item guards from item projection, cursor action
     resolution, and spec samples.
   - Exposed the typed root/public guard surface as `Switches.Is` / `KeyValue.Switches.Is` with
     `t.KeyValueSwitches.Is.Lib` and `t.KeyValue.Switches.Is.Lib`.
   - Kept standalone guard functions private to the guard module; outside consumers use the root
     object, not namespace/star imports.
   - Kept this separate from the Space feature commit so the action seam remains disciplined.
9. `refactor(ui-components): structure KeyValue.Switches utilities`
   - Landed in `ff63cb5cd`.
   - Moved Switches-local utility modules under `KeyValue.Switches/u/`:
     - `u.cursor-action.ts`
     - `u.interaction.ts`
     - `u.is.ts`
     - `u.items.tsx`
     - `u.layout.ts`
   - Updated imports from render, value switch, module boundary, and layout tests to the structured
     utility folder.
   - No behavior or public API changes beyond the already-landed guard root surface.
10. `feat(ui-components): add KeyValue cursor arrival cue`
    - Landed in `50f8d4c18`.
    - Added a visual-only, theme-derived, zero-layout-shift arrival overlay on the current cursor
      boundary.
    - The first pass keys the cue by current target path plus part, so row atom and lane arrivals
      are distinct.
    - It did not change cursor model, commands, target identity, generic activation, or host
      semantics.
11. `fix(ui-components): limit KeyValue cursor arrival cue to first adoption`
    - Landed in `803672e6e`.
    - Default semantics now cue only the first resolved cursor adoption for a mounted `KeyValue`
      instance, not ordinary cursor movement, parent re-render, exit/re-entry, or target/lane
      changes after adoption.
    - Adoption is spent only when the controlled current target resolves against rendered KeyValue
      items, so stale/unrenderable controlled targets do not consume the first cue.
    - The direct reorder shell path renders the same first-adoption cue through the shared cue
      renderer rather than bypassing the shell affordance.
    - No public option was added; the following feature slice can earn explicit cue modes.
    - The cue remains visual-only and derived from cursor truth. No model, command, or
      target-identity changes.
12. `refactor(ui-components): factor KeyValue cursor DEBUG fixture glue`
    - Landed in `c3a28604b`.
    - Factored shared cursor/debug fixture glue so `KeyValue` and `KeyValue.Switches` DEBUG call
      sites import minimal adapters rather than duplicating cursor enablement, arrival controls, or
      handoff wiring.
    - Exposed reusable KeyValue-family spec fixtures through the narrow `KeyValue/-spec/mod.ts`
      boundary rather than growing cross-harness deep imports into individual `-spec` files.
    - Kept the fixture spec-only: no product runtime API, no generic activation behavior, no
      Switches sample/value/toggle domain logic in generic KeyValue helpers.
    - `KeyValue.Switches` adapts its projection through `Switches.toItems(items)` before sharing the
      cursor keyboard handoff.
    - No product behavior change; this was prep/structure so cursor affordance work lands as clean
      small insertions.
13. `refactor(ui-components): extract shared Chip primitive from cursor DEBUG help`
    - Landed as two disciplined commits:
      - `cf8eb30a6 feat(ui-components): add Chip inline token component`
      - `7cf88c6c1 refactor(ui-components): use Chip in KeyValue cursor DEBUG help`
    - `Chip` is a pure visual inline token component exposed as ESM leaf exports
      `@sys/ui-components/react/chip` and `@sys/ui-components/chip`.
    - The component follows the standard `@sys/tmpl` UI module shape: `Chip.UI` on `t.Chip.Lib`.
    - It is intentionally visual-only: children, size, mono, theme, debug, and style. It has no
      cursor, clipboard, keyboard, command, selection, or domain semantics.
    - Sizing is context-relative with `em` units so chips scale with parent font size. `mono`
      defaults to true for token/value usage.
    - Without an explicit theme, fill and border derive from inherited `currentColor`; explicit
      `theme` remains available for standalone/debug-help contexts.
    - `KeyValue` cursor DEBUG help now uses `Chip.UI` for gesture tokens rather than local ad hoc
      chip styling.
    - The comprehensive KeyValue sample includes a chip value row (`1234cqi`) to prove ordinary
      value-cell usage.
14. `design(ui-components): define host-owned KeyValue cursor entry handoff`
    - Design review completed in the feature slice that landed as
      `cd657f730 feat(ui-components): expose KeyValue cursor keyboard entry hook`.
    - No standalone design commit was created for this item.
    - The concrete seam is host-owned keyboard entry into a controlled KeyValue cursor root: global
      `Option+Enter` can focus the cursor root and seed cursor currentness, while focused-root
      grammar remains owned by `KeyValue.UI`.
    - The durable design sentence: `KeyValue.UI` owns focused-root cursor grammar; hosts own global
      entry/focus arbitration.
    - The prior reuse through `KeyValue/-spec` was graduated out of the spec seam; the deleted
      helper was `KeyValue/-spec/-use.Cursor.ts`.
    - The reusable primitive graduated as a host adapter, not as component-internal behavior. Landed
      implementation surface: `KeyValue.Cursor.Keyboard.useEntry`.
    - The adapter should accept an optional host `ref`, return the resolved `ref`, accept projected
      `KeyValue.Item[]`, controlled cursor model, and `onChange`; it must not mutate signal objects
      directly.
    - `KeyValue.Switches` should continue to adapt through `Switches.toItems(items)` before calling
      the generic handoff adapter.
    - Handoff should emit normal controlled cursor entry truth, not a special side channel:
      `reason: 'cursor:entry'`, `entry: 'option-enter'`, and `command.name: 'cursor:set'`.
    - It should focus the rendered KeyValue cursor root and set the first cursor-addressable target
      only when the host currently owns global entry and the cursor has no current target.
    - It must back off when the KeyValue cursor root or one of its descendants already owns DOM
      focus, so local focused-root grammar handles `Option+Enter`.
    - It must also avoid stealing input from unrelated interactive descendants or external active
      controls.
    - Non-goals: no global listeners inside `KeyValue.UI`; no Escape handling here; no generic
      activation; no Switches, InfoPanel, divider, clipboard, selection, or domain semantics in the
      adapter.
    - Implementation landed as:
      `cd657f730 feat(ui-components): expose KeyValue cursor keyboard entry hook`.
15. `feat(ui-components): expose KeyValue cursor keyboard entry hook`
    - Landed in `cd657f730`.
    - Public runtime surface: `KeyValue.Cursor.Keyboard.useEntry`.
    - The hook is a host adapter for global `Option+Enter`; it is not pointer entry, navigation,
      Escape handling, activation, or domain behavior.
    - The hook returns a `ref` to place on the host element and accepts an optional supplied `ref`.
      If no ref is supplied, it creates and returns an internal host ref.
    - In multi-host compositions, many hooks may be mounted, but callers should gate `enabled` so
      only one command-scope owner accepts global `Option+Enter` at a time.
    - The hook focuses the rendered KeyValue cursor root and emits normal controlled entry truth to
      the first cursor-addressable item when the model has no current target.
    - It emits `reason: 'cursor:entry'`, `entry: 'option-enter'`, and `command.name: 'cursor:set'`
      through `cursor.onChange`; it never mutates signal objects directly.
    - It backs off when the rendered cursor root or one of its descendants already owns focus, so
      `KeyValue.UI` focused-root grammar remains authoritative.
    - It avoids stealing from active interactive controls and ignores detached active elements left
      behind by unmounted test/runtime hosts.
    - `KeyValue.Switches` adapts through `Switches.toItems(items)` before invoking the generic
      cursor hook.
    - Follow-up package type-surface repair landed in `b67853a9b`, exporting `VimeoBackground/t.ts`
      through `src/types.ts` so broad `deno task check` passes again.
16. `fix(ui-components): export VimeoBackground types through package type surface`
    - Landed in `b67853a9b`; actual commit subject is `Update types.ts`.
    - Exports `./ui.react/VimeoBackground/t.ts` from `src/types.ts`.
    - Restores shared `t.VimeoBackgroundProps` and `t.VimeoIFrame` visibility for the
      `VimeoBackground` implementation/spec files.
    - `deno task check` passes for `code/sys.ui/ui-components` after this repair.
17. `feat(ui-components): add KeyValue cursor arrival flash mode`
    - Landed in `a4173a28c` after implementation/tidy commits in the same arrival-flash arc.
    - Collapsed the public arrival-cue policy surface to two states: `arrival?: false | 'flash'`.
    - `false` disables the arrival cue.
    - `flash` enables a single user-facing visual affordance while internally rendering a strong
      first-adoption flash and a subtler subsequent target-change flash.
    - Kept `first-adoption` and `target-change` as internal cue-kind/test truth only; those
      mechanics are not public product modes.
    - Moved arrival state/resolution into the cursor hook module
      `KeyValue/m.Cursor/u/use.arrival.ts`; `ui.tsx` only orchestrates the hook result.
    - Passed arrival render data as a cohesive internal cue packet, not separate fill/key/kind
      props.
    - DEBUG harness controls cycle through `false` and `flash` using the shared fixture glue.
    - Tests assert cue identity, phase, disablement, reorder parity, lane-keying, and relative
      first-adoption vs target-change intensity without brittle exact computed-color handshakes.
    - Cue behavior remains visual-only and derived from cursor target truth. No cursor model,
      command, generic activation, or target-identity changes.
18. `fix(ui-components): require option modifier for KeyValue cursor lane navigation`
    - Landed in `13e44dbe8`.
    - Requires `Option+ArrowLeft` and `Option+ArrowRight` for cursor key/value lane entry and lane
      movement.
    - Plain `ArrowLeft` and `ArrowRight` no longer perform cursor lane navigation.
    - Preserves `ArrowUp` and `ArrowDown` as ordinary sibling navigation.
    - Kept as a narrow keyboard grammar fix, separate from DEBUG fixture and arrival-cue work.
19. `feat(ui-components): add KeyValue cursor block-jump navigation`
    - Design outcome: proceed with a narrow primitive-level block-jump feature before the host
      divider-insertion capstone. The design is captured here and lands with the implementation
      commit rather than as a standalone design commit.
    - Interaction:
      - `Option+ArrowDown` moves to the bottom cursor-addressable target of the current block; if
        already at that bottom edge, it moves to the first cursor-addressable target in the next
        non-empty block.
      - `Option+ArrowUp` moves to the top cursor-addressable target of the current block; if already
        at that top edge, it moves to the last cursor-addressable target in the previous non-empty
        block.
      - Stable `hr` current targets behave as delimiters: down enters the following block's top
        edge, up enters the preceding block's bottom edge.
      - Plain `ArrowUp` / `ArrowDown` remain ordinary sibling navigation.
      - `Option+ArrowLeft` / `Option+ArrowRight` remain lane entry/movement and are not changed.
    - Scope rule:
      - Block-jump operates only within the cursor's current direct sibling scope.
      - It does not cross group boundaries; `Enter` / `Escape` continue to own group scope entry and
        exit.
      - A group item in the current scope is treated as one atom for block-jump purposes, just as it
        is for ordinary sibling navigation.
    - Block definition:
      - A block is a maximal contiguous run of direct-sibling items between direct-sibling `hr`
        items.
      - `hr` items are delimiters, not block members, for block-jump targeting.
      - `hr` delimiter status is structural and should not require the `hr` item itself to be
        cursor-addressable or have a stable ID.
      - `title`, `spacer`, `row`, and `group` items are ordinary block members. They do not delimit
        blocks.
      - Blocks with no cursor-addressable targets are skipped.
    - Current-target rule:
      - Block-jump requires a resolved current cursor target. It is not an additional cursor-entry
        gesture from an empty model.
      - If the current target cannot be resolved in the current item tree, block-jump is a no-op;
        ordinary cursor entry/set/move remains responsible for recovery behavior.
      - If current is a stable `hr` delimiter, `Option+ArrowDown` targets the first addressable item
        in the following non-empty block and `Option+ArrowUp` targets the last addressable item in
        the preceding non-empty block.
    - Lane rule:
      - Original block-jump implementation preserved the current lane part when the destination row
        supported it.
      - Current landed truth after `90499871d`: block-jump is vertical movement and collapses any
        row lane when it moves to a different target; boundary no-op movement preserves the current
        lane because the target did not change.
      - Never introduce a public `part: 'row'` or any second representation of row identity.
    - Command/API shape:
      - Add pure cursor helpers, likely `Cursor.previousBlock(model, items)` and
        `Cursor.nextBlock(model, items)`.
      - Add data-only commands, likely `cursor:previous-block` and `cursor:next-block`.
      - Keep command names in the existing single-colon/kebab-action grammar; do not introduce
        `cursor:next:block` or `cursor:next.block`.
      - Route keyboard input through the same controlled navigation event path as the existing
        cursor commands.
      - Emitted changes stay `reason: 'cursor:navigation'`; only `command.name` distinguishes block
        jumps.
    - Tests required before landing implementation:
      - Pure cursor reducer tests for leading/trailing/consecutive `hr` delimiters, empty blocks,
        unstable/unaddressable items, stable `hr` current targets, groups-as-atoms, nested group
        scope isolation, first/last no-op behavior, unresolved current no-op behavior, and lane
        collapse/no-op preservation.
      - UI keyboard tests for `Option+ArrowUp` / `Option+ArrowDown`, proving plain arrows are
        unchanged and `Option+ArrowLeft` / `Option+ArrowRight` still own lanes.
      - Reorder-root parity if block-jump routes through the same cursor navigation root path.
      - DEBUG help should mention `Option + ↑/↓` only after behavior lands.
    - Non-goals:
      - No InfoPanel, Files<T>, config-designer, or divider-insertion semantics in `KeyValue`.
      - No selection model, clipboard affordance, ARIA/grid expansion, block labels, wrapping, or
        cross-scope jumps in this slice.
      - No global host-entry changes; `KeyValue.Cursor.Keyboard.useEntry` remains host-owned
        `Option+Enter` only.
    - Why this is worth doing now:
      - It is the smallest structural navigation primitive that matches divider-oriented KeyValue
        projections.
      - It makes the cursor genuinely useful in sectioned editor/config/file projections without
        teaching the primitive any host domain language.
      - It closes the primitive grammar just enough for the next host-owned divider insertion work,
        then the arc should stop.
    - Keep the implementation focused on cursor model, keyboard mapping, DEBUG help, and tests.
    - Do not combine with InfoPanel/Files<T> domain edits.
20. `feat(ui-components): add KeyValue cursor whole-set top-bottom navigation`
    - Adds Home/End plus platform Meta + ArrowUp/ArrowDown movement to the top/bottom
      cursor-addressable item of the current whole set/scope.
    - Use the proper `@sys/ui-dom` Keyboard/platform-meta abstraction for the command-arrow path
      rather than hard-coding Mac-only `Cmd`/`metaKey` checks in `KeyValue`.
    - Keep plain ArrowUp/ArrowDown as sibling movement and Option+ArrowUp/ArrowDown as block-edge
      movement.
    - Keep command grammar single-colon/kebab-action; likely command names are `cursor:first` and
      `cursor:last` unless implementation review finds a clearer existing grammar.
    - Host-neutral only: no InfoPanel, Files<T>, config-designer, divider insertion, clipboard,
      selection, or ARIA/grid expansion semantics.
21. `feat(ui-components): distinguish focused and blurred KeyValue cursor affordance`
    - Promoted from TBD to the next primitive implementation slice after whole-set navigation.
    - Render the current cursor with a more prominent shade when the KeyValue cursor root itself is
      focused.
    - Keep the current cursor visible but dimmer/lower-opacity when the root is blurred.
    - Treat this as visual state derived from DOM focus, not as cursor model state.
    - Prefer root-scoped CSS variables or `:focus` styling so focus/blur does not mutate cursor
      state or replay arrival cues.
    - Apply to atom/group current boundaries, key/value current cells, and the reorder shell path.
    - No activation, selection model, clipboard, ARIA/grid expansion, host semantics, or generic
      `KeyValue.UI` action behavior.
22. `feat(ui): support cursor-based divider insertion in InfoPanel config designer`
    - Proves the host seam after the focused/blurred cursor affordance lands: `InfoPanel.Config`
      consumes cursor target truth and emits host-owned domain edits.
    - `KeyValue` must not learn divider semantics, config designer layout rules, or persistence.
23. Moved: markdown-backed dev/help docs panel
    - The former reusable help/docs panel item is not cursor interaction work.
    - Successor plan:
      `-agent/-plan/@sys.ui-components/markdown-backed-dev-help-panel.plan.md`.

## Parked primitive: CopyTarget inline clipboard affordance

- Parked, not part of the current cursor arc.
- The need is real and recurring: inline displayed values often need an unobtrusive copy affordance.
- Do not put clipboard behavior into `Chip`; `Chip` remains a visual token only.
- Candidate future design item:
  `design(ui-components): define CopyTarget inline clipboard affordance`.
- Candidate future feature item: `feat(ui-components): add CopyTarget inline clipboard affordance`.
- Seed shape:

```tsx
<CopyTarget.UI text='1234cqi'>
  <Chip.UI>1234cqi</Chip.UI>
</CopyTarget.UI>;
```

- Requirements seed:
  - wraps arbitrary inline children;
  - no layout shift;
  - copy icon/button absolutely positioned to the right of the content;
  - reveal on hover/focus in v1;
  - keyboard accessible;
  - clipboard write plus copied/error feedback;
  - no modifier-key complexity until proven.

TMIND failure modes to keep out:

- A public `part: 'row'` creates two row identities (`undefined` and `'row'`). Do not introduce that
  dual representation.
- Lane navigation that only changes styling is false progress; model helpers and emitted changes
  must carry the lane target truth.
- Space activation before lanes are settled will choose the wrong target contract.
- Host divider insertion before lanes risks bending `KeyValue` around InfoPanel urgency.
- Arrival cue before the bones risks polishing ambiguity.

## MIND review: next cursor power

The next fundamental UX power is not another visible highlight. The forcing case is a current row in
a table projection: the user needs to step from the row atom into its key/value subparts, move
horizontally within those subparts, move vertically back to row atoms, and get back out without
losing the larger structural cursor model.

Design read:

- `Option/Alt` is the entry modifier. `Option+click` is the pointer entry gesture; `Option+Enter` is
  the keyboard mirror through the explicit focused cursor root.
- `Option+ArrowLeft` / `Option+ArrowRight` now serve keyboard lane entry from an empty cursor and
  lane movement while cursor currentness exists. Plain Left/Right do not perform cursor lane
  navigation; this keeps lane movement aligned with the Option-entry idiom and avoids stealing
  ordinary horizontal-arrow meaning from future hosts or native descendants. Up/Down remain peer
  movement, Enter enters child scope, and Escape unwinds part → scope → currentness.
- Keyboard entry is a separate entry problem, not hidden global navigation. Component entry uses the
  truthful focused-root capture surface and a deterministic default target; host/harness global
  handoff may focus the root and seed the controlled cursor model, but must back off when the root
  is already handling the event locally.
- Lane state belongs on the cursor target, not in DOM focus and not in host domain state.
- Escape should unwind the nearest cursor depth first: part → row atom, then nested scope → parent
  group atom, then root current → no current.
- The lane slice must not introduce action semantics, selection, editing, or host-specific config
  designer rules.

Implementation implication: lane model landed first, keyboard entry/observability was repaired,
action was proven through `KeyValue.Switches`, the first visual arrival cue landed, default arrival
replay was limited to first resolved adoption, DEBUG fixture glue was factored, arrival mode was
collapsed to `false | 'flash'`, lane navigation now requires the Option modifier, DEBUG chip styling
has graduated into the pure `Chip` inline token component, host-owned cursor entry handoff has
graduated to `KeyValue.Cursor.Keyboard.useEntry`, and reusable host-owned cursor insertion has
landed through `KeyValue.Cursor.insertAfter(...)` plus
`KeyValue.Cursor.Keyboard.useInsertAfter(...)`, without moving mutation into `KeyValue.UI`.

## Current truth

- The durable noun is `cursor`, not `focus`.
- `focus` and `blur` are reserved for actual DOM/browser focus mechanics.
- Public cursor vocabulary is now rooted on `KeyValue.Cursor`, `cursor`, `current`, and `target`.
- The current implementation supports:
  - single cursor model: `Cursor.Model { current?: Cursor.Target }`;
  - cursor target identity by stable `KeyValue.Item.id` path tokens;
  - row lane identity by `Cursor.Target.part?: 'key' | 'value'`;
  - root and nested cursor scopes;
  - `Option+click` or configured `click` pointer entry;
  - focused-root keyboard entry by `Option+Enter`;
  - focused-root lane entry by `Option+ArrowLeft` and `Option+ArrowRight`;
  - host-owned keyboard handoff by global `Option+Enter` through `KeyValue.Cursor.Keyboard.useEntry`
    and hardened `@sys/ui-dom` keyboard ownership controls;
  - host-owned cursor item insertion through `KeyValue.Cursor.insertAfter(...)` and
    `KeyValue.Cursor.Keyboard.useInsertAfter(...)`, with item creation/ID policy owned by hosts;
  - keyboard navigation by `ArrowUp`, `ArrowDown`, `Option+ArrowLeft`, `Option+ArrowRight`,
    `Option+ArrowUp`, `Option+ArrowDown`, `Home`, `End`, platform command arrows, `Enter`, and
    `Escape`;
  - switch-specific cursor Space action through `KeyValue.Switches` only;
  - current-target DOM marking, quiet theme-derived row current fill, visible ruby/equivalent lane
    fill, and current-cell DOM marking;
  - cursor arrival cue as public `arrival?: false | 'flash'`: `false` disables the cue, while
    `flash` renders a strong first-adoption flash and a subtler subsequent target-change flash;
  - arrival cue internals are visual-only and keyed by resolved current target path plus part, with
    `first-adoption` / `target-change` kept as internal cue-kind/test truth rather than public
    product modes;
  - shared DEBUG fixture glue for KeyValue cursor enablement, arrival cycling, and help text across
    `KeyValue` and `KeyValue.Switches` DEBUG surfaces;
  - shared `Chip.UI` inline token component for DEBUG/help/value chips, with context-relative `em`
    sizing and no cursor/copy/action semantics;
  - controlled cursor changes through data-only command-shaped payloads;
  - switch toggle payloads through command/source-shaped action intents;
  - typed `KeyValue.Switches.Is` / `Switches.Is` item guards for switch projection inputs;
  - structured `KeyValue.Switches/u/` utility internals for cursor action, interaction, guards, item
    projection, and layout.
- The primitive intentionally does **not** introduce selection, multi-cursor, range, control lanes,
  generic activation, or host editing yet.
- `InfoPanel.Config` is a consumer/reality test, not the owner of the cursor model.

## North star

`<KeyValue>` should be able to become an OS-like interaction substrate for dense projected
structures: as boring, reliable, and eventually invisible as a good editor cursor.

Quality bar:

- The user stops thinking about React component mechanics.
- The user can enter the structure, move through it, descend/ascend nested scopes, and act on the
  current target without ambiguity.
- Hosts can build fast UX on top without smuggling domain semantics into `KeyValue`.
- Cursor behavior feels deterministic enough to support advanced commands later: insert, delete,
  reorder, indent, group, command palette actions.
- The primitive remains small enough that `KeyValue` does not become a domain editor.

## Scope

This plan owns the cursor interaction idiom for:

```text
code/sys.ui/ui-components/src/ui.react/KeyValue/
```

It does not own higher-order host persistence or domain editing in:

```text
code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel.Config/
```

The host may consume cursor changes and issue domain commands, but the primitive must stay
host-neutral.

## Core question

What item, row part, or scope inside a dense `KeyValue` projection is command-addressable right now?

The answer is the cursor.

## Vocabulary

- **DOM focus**: the browser/OS keyboard target. This is substrate only.
- **Cursor**: the single semantic position in the projected `KeyValue` item tree.
- **Current**: the cursor state field naming the current semantic target.
- **Target**: the command-addressable address under the cursor.
- **Scope**: the peer set through which Up/Down navigation moves.
- **Part/lane**: a row subdivision such as key/value/control; the row atom is represented by no
  part.
- **Selection**: future multi/range semantics; not part of this cursor model.

Forbidden drift:

- Do not use `focus` as semantic cursor language.
- Do not introduce `selection` to solve single-cursor problems.
- Do not use `active` for cursor state; use `current`.
- Do not use `ref` for cursor address; use `target`.
- Do not make row index position the default identity model.

## Existing API shape

Current public type center:

```ts
type CursorTarget = {
  readonly path: t.ObjectPath;
  readonly part?: 'key' | 'value';
};

type CursorModel = {
  readonly current?: CursorTarget;
};

type CursorProps = {
  readonly enabled?: boolean;
  readonly model?: CursorModel;
  readonly entry?: false | 'option-click' | 'click';
  readonly navigation?: false | 'keyboard';
  readonly arrival?: false | 'flash';
  readonly onChange?: (e: CursorChange) => void;
};
```

Current command names:

```ts
type CursorCommandName =
  | 'cursor:set'
  | 'cursor:next'
  | 'cursor:previous'
  | 'cursor:left'
  | 'cursor:right'
  | 'cursor:enter'
  | 'cursor:exit';
```

Keep these commands data-only and `Cmd<T>`-friendly, but do not introduce `@sys/event/cmd` until a
real runtime boundary requires it.

## Cursor identity invariants

- A target path is a `t.ObjectPath` of stable `KeyValue.Item.id` tokens.
- Items without stable identity are not cursor-addressable by default.
- Duplicate direct-scope IDs invalidate addressability for that scope.
- A group is an atom in its parent scope until entered.
- Child scope movement never relies on unstable parent identity.
- Equality uses `Obj.Path` semantics, not ad hoc string comparison except for explicit DOM-safe
  encoding.
- DOM data attributes are render markers, not the source of cursor truth.

## Scope semantics

Root scope:

- peer set: root direct cursor-addressable items;
- groups count as one atom;
- Up/Down moves among peers without wrapping.

Entered group scope:

- peer set: direct cursor-addressable children of the current group;
- `Enter` on an enterable group places the cursor on the first eligible child;
- `Escape` from a child scope returns to the parent group atom;
- `Escape` at root clears current cursor target and exits cursor currentness.

No hidden stack is needed while target paths honestly encode ancestry.

## Keyboard grammar

Current grammar:

- Entry: `Option+click` by default; configured `click` may be used by explicit hosts/harnesses.
- Focused-root keyboard entry: `Option+Enter` enters the first cursor-addressable target when no
  current cursor exists.
- Debug/host handoff proof: a host-level `Option+Enter` may focus the KeyValue cursor root and seed
  the first cursor target through the controlled cursor model when focus is outside the root and not
  inside a protected native/interactive control.
- `ArrowDown`: move to next target atom in current scope, collapsing any row lane.
- `ArrowUp`: move to previous target atom in current scope, collapsing any row lane.
- `Option+ArrowLeft`: enter or move to the key lane.
- `Option+ArrowRight`: enter or move to the value lane.
- Plain `ArrowLeft` / `ArrowRight`: not cursor lane navigation.
- `Enter`: enter current group scope if enterable.
- `Escape`: exit row lane, child scope, or currentness in that order.

Reserved grammar:

- `Space`: action on current target only when the target truthfully supports activation.
- `Cmd/Meta` chords: host/editor commands, not base cursor movement.

Do not steal keyboard behavior from native interactive descendants. Global host keyboard listeners
must use the explicit `@sys/ui-dom` ownership controls and should prefer non-destructive routing
(`preventDefault` / `stopKeyboardPropagation`) unless they intentionally own the whole DOM event
with `consume()`.

## DOM focus boundary

DOM focus is only the keyboard capture substrate.

Acceptable DOM focus usage:

- focusing the hidden/root KeyValue keyboard receiver after successful cursor entry;
- host/harness handoff focusing the cursor root only when the root is not already handling the local
  key event;
- suppressing native focus ring if the cursor affordance is the visible semantic indicator;
- using `:focus-visible` only for actual DOM mechanics.

Unacceptable drift:

- calling the semantic cursor a focused row;
- using DOM focus as the cursor state source of truth;
- blurring native controls to force cursor behavior;
- treating `document.activeElement` as the model;
- using destructive global keyboard ownership to block the component's own focused-root grammar.

## Visual affordance

Current baseline:

- quiet theme-derived fill from foreground alpha;
- first-pass arrival cue from foreground alpha;
- zero layout shift;
- rendered through normal, projection-animation, and reorder shells;
- no red proof marker remains.

Follow-up visual slice: first-adoption arrival semantics.

Structural work should not wait for polished styling. During lane work, a deliberately crude proof
marker such as `Color.ruby(0.2)` is acceptable only as a temporary/debug display; it must not
complicate target identity, commands, tests, or public API.

Arrival cue rules:

- landed first pass currently replays by current target identity; follow-up should narrow the
  default;
- cue only on first cursor adoption for the rendered `KeyValue` lifetime;
- do not replay on ordinary `current → current` movement;
- visual-only previous-current tracking is allowed if local and non-persistent;
- respect reduced motion if the platform/browser exposes a safe signal in this layer;
- keep zero layout shift;
- use theme-compatible color/alpha, not hard-coded novelty styling.

The cue should say “you have entered the structure,” not “this row was selected.”

## Lane/part model

The first major semantic expansion is row part targeting.

Current first-slice shape:

```ts
type CursorPart = 'key' | 'value'; // future: 'control'

type CursorTarget = {
  readonly path: t.ObjectPath;
  readonly part?: CursorPart;
};
```

Rules:

- `path` remains item identity; `part` is a projection lane, not a source-object property and not a
  nested cursor scope.
- Omitted `part` is the row/item atom. Do not add an explicit `'row'` part unless a future need
  earns it and boundary normalization prevents dual identity.
- First lane slice should prove only key/value row parts. `control` waits for a forcing control
  affordance.
- Only rendered rows support key/value parts. Titles, dividers, spacers, and groups stay item atoms.
- Equality includes normalized part identity; row atom equality remains path-only.
- ArrowLeft/ArrowRight navigate row parts once cursor currentness exists.
- From a row atom, ArrowLeft enters the key lane and ArrowRight enters the value lane when those
  lanes exist.
- Within key/value, ArrowLeft/ArrowRight move between supported row lanes without wrapping.
- ArrowUp/ArrowDown from a lane target move vertically to the previous/next sibling target in the
  current scope and collapse to that target's row/item atom.
- Escape from a key/value part returns to the row atom before exiting a nested scope.
- Enter remains structural: from an enterable group atom it enters the child scope. Do not make
  Enter an implicit lane/action command.
- `Option/Alt+Enter` is keyboard entry, but it is an entry gesture, not a replacement for Enter's
  structural meaning after currentness exists.
- Lane work must not sneak in selection, editing, action activation, or InfoPanel-specific divider
  insertion.

Working grammar:

```text
Option+click          → enter cursor at clicked row/item atom
Option+Enter          → focused-root keyboard entry to default target when local focus/capture is explicit
host Option+Enter     → optional harness/host handoff: focus root + seed first target when safe
ArrowUp/Down          → previous/next peer atom in current scope, collapsing any part
ArrowLeft on atom     → key lane when supported
ArrowRight on atom    → value lane when supported
ArrowLeft/Right lane  → move between key/value without wrapping
Enter                 → enter child KeyValue scope from an enterable group atom
Escape                → part → row atom → parent group atom → no current
```

## Action semantics

Generic `KeyValue` remains semantics-free.

`Space` is not a generic row activation primitive. It becomes valid only where a rendered target
truthfully advertises an action.

First action reality test:

- `KeyValue.Switches` may toggle with Space only when the current target addresses an enabled switch
  affordance.
- With cursor parts, key-lane targets must no-op; row atom and value/future-control targets need an
  explicit switch capability rule before they act.
- Disabled switches, non-switch rows, titles, dividers, spacers, and groups must no-op.
- The action must route through the same switch toggle contract as pointer interaction.
- Cursor entry clicks must not accidentally toggle switches.

### XHIGH/STIER pre-implementation contract: Switches Space

This slice is the first proof of the action seam:

```text
semantic target → capability resolver → data command/intent → domain callback
```

The 100-year quality move is to treat switch toggle as a domain command/intent, not as a mouse
event.

Do not simply widen the current toggle payload to `ReactMouseEvent | ReactKeyboardEvent`. That keeps
React synthetic event mechanics as the center and makes future command streams awkward.

Preferred shape:

```ts
type SwitchToggleCommand = {
  readonly name: 'keyvalue-switches:toggle';
  readonly payload: {
    readonly target: t.KeyValue.Cursor.Target;
    readonly next?: boolean;
  };
};

type SwitchToggleSource =
  | { readonly kind: 'pointer'; readonly event: t.ReactMouseEvent }
  | { readonly kind: 'cursor-keyboard'; readonly event: t.ReactKeyboardEvent }
  | { readonly kind: 'cmd' };

type SwitchToggleArgs = {
  readonly current: boolean;
  readonly next: boolean;
  readonly item: t.KeyValueSwitches.Row;
  readonly index: number;
  readonly command: SwitchToggleCommand;
  readonly source: SwitchToggleSource;
};
```

Implementation may keep a pointer-only compatibility bridge if needed, but new code should key off
`command` and `source`, not a required `synthetic` mouse event.

Command-shape rules:

- Keep the command data-only and `Cmd<T>`-friendly.
- Do not import or require a global `Cmd<T>` runtime until a real external command boundary exists.
- A future host/remote/controller command stream should be able to feed the same `KeyValue.Switches`
  resolver without reinterpreting DOM events.
- The command expresses intent; the Switches capability resolver decides if it is allowed for the
  current item, enabled state, and lane.
- Pointer clicks and cursor Space converge after input normalization; neither path bypasses
  capability checks.

Space resolver rules:

- Read `cursor.model.current` as the semantic address.
- Resolve the path against the original `KeyValue.Switches.Item[]`, not against DOM nodes.
- Allow row atom (`part === undefined`) and value lane (`part === 'value'`).
- Reject key lane (`part === 'key'`).
- Reject missing paths, `hr`, groups as action targets, disabled rows, and rows without `onToggle`.
- For nested groups, path tokens must resolve by stable item IDs consistently with `KeyValue.Cursor`
  target paths.
- Cursor Space is owned by the focused cursor root path. Native interactive descendants keep their
  own keyboard behavior.

Tests should prove:

- row atom Space toggles the addressed switch;
- value-lane Space toggles the addressed switch;
- key-lane Space does not toggle;
- disabled rows and rows without handlers do not toggle;
- nested group cursor paths toggle the correct row;
- pointer click and cursor Space emit the same command name with distinct `source.kind` values;
- generic `KeyValue.UI` does not gain activation behavior.

Future actions should be capability-gated, not inferred from visual shape alone.

## Host boundary

`KeyValue` owns:

- cursor model helpers;
- target/scope resolution;
- cursor entry/navigation event translation;
- current-target rendering;
- data-only cursor change payloads.

Hosts own:

- domain models;
- validation;
- persistence;
- edit commands such as insert/delete/indent/group;
- capability policy for what actions are allowed.

`InfoPanel.Config` should consume cursor state and emit host-owned config changes. It should not
define cursor identity rules.

## Future command reality tests

These are tests of the cursor primitive, not first-class `KeyValue` domain features.

### Insert

- Slot-based: before, after, inside when permitted.
- HR/divider is the first forcing item kind, but the shape should also support spacer/title/custom
  items later.
- Host reducer owns the actual item/config mutation.

### Delete

- Capability-gated per host and item kind.
- Acts on selection if future selection exists; otherwise current cursor target.
- Domain reducer owns required-field/dependency rules.

### Indent/dedent

- Host/designer command, not base `KeyValue` hierarchy editing.
- `KeyValue` receives an honest projected tree/depth; it does not mutate hierarchy itself.

### Group

- Wait for selection/range semantics.
- Do not define grouping from a single current target.

## Projection seam

Keep the seam pure:

1. Host resolves domain state.
2. Host projects `KeyValue.Item[]`.
3. `KeyValue.Cursor` resolves scopes/targets from `Item[]`.
4. Cursor commands produce a new `Cursor.Model`.
5. `KeyValue.UI` renders cursor-aware projection when `cursor` is enabled.
6. Host receives cursor changes and decides whether to issue domain commands.
7. Host projects the next `Item[]` back into `KeyValue`.

This keeps `KeyValue.Switches` a projection layer, not a domain editor.

## Design traps

- **Name trap**: `focus` feels familiar but corrupts the model; reserve it for DOM only.
- **Selection trap**: do not solve current-target polish by inventing multi-target state.
- **Activation trap**: a current cursor row is addressable, not automatically actionable.
- **Index trap**: position is not identity for projected structures with reorder/insert/delete.
- **DOM trap**: data attributes and focus roots are implementation details, not model truth.
- **Host trap**: InfoPanel urgency must not push domain-specific layout semantics into the base
  primitive.
- **Visual trap**: affordance polish must remain zero-layout-shift and non-flashy.

## Review gates

Before each cursor commit lands:

- [ ] Scope remains `@sys/ui-components` unless the commit is explicitly a consumer integration.
- [ ] Public names use `cursor`, `current`, and `target`.
- [ ] DOM focus wording appears only for real browser focus mechanics.
- [ ] No `selection` API appears in the cursor model.
- [ ] No lane/part semantics land before their dedicated slice.
- [ ] No explicit row part creates dual row target identity.
- [ ] No Space/action semantics land before the switch-specific slice.
- [ ] Visual/proof styling never leads or complicates cursor model design.
- [ ] Base `KeyValue` remains visually unchanged when `cursor` is absent or disabled.
- [ ] Native interactive descendants keep their normal event semantics.
- [ ] Any global keyboard listener uses explicit `@sys/ui-dom` ownership controls and does not
      starve local focused-root cursor grammar.
- [ ] Reorder, projection animation, and static render paths stay behaviorally aligned.
- [ ] Tests cover pure model helpers and rendered interaction paths.
- [ ] `ui-components` check/test passes before landing.
- [ ] Any `@sys/ui` consumer change is explicitly separated or justified.
