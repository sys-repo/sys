@sys.ui-components
keyvalue-typography-and-spec-lists.plan.md
- [x] 0b64164d6 refactor(ui/keyvalue): organize spec samples and motion commands with Dev.List
- [x] f5f07e0fc fix(ui/keyvalue): balance monospace values with adjacent sans text
- [x] 634596bb8 feat(ui/keyvalue): let the projection motion hint turn reorder off

## 1. Separate choosing a dataset from acting on it

Scope: the KeyValue DevHarness sidebar's `items` and `projection motion` sections only.
One answers "which sample?"; the other answers "what can I do to its current order?".
Do not present a command as a selected sample, or convert the whole debug panel into a list.

Precedents under `code/sys.ui/ui-components/src/ui.react/`:

- `ui/Anchor/-spec/-ui.Samples.tsx` keeps a named sample catalogue and its activation wiring
  outside Debug. Its presets are commands, so its `Dev.List` omits `selected`.
- `ui/Chip/-spec/-SPEC.Debug.tsx` derives `selected` from existing signals. Borrow the controlled
  selection, not the inline catalogue. `dev/m.List/t.ts` distinguishes omitted `selected`
  (commands) from a supplied ID (pressed state); activation also fires on reselection.

**Samples.** Replace `KeyValue/-spec/-ui.Buttons.Samples.tsx` with a spec-local `Samples` view.
Use one `Dev.List` under `Samples`, with short labels and stable IDs: None, Simple, Comprehensive,
Action buttons, Opacity, Links, Recursive groups, Reorder. Try two columns at normal sidebar width;
use one if labels wrap awkwardly. Derive the selected ID from `p.sample`; a list-only `none` ID
maps to `undefined`, never to a new persisted sample kind. Activation, including reselection,
loads fresh `SAMPLE.items(kind)` and updates the existing sample signal. Selection identifies the
source dataset, not whether it has since been reordered. Preserve startup, reset and persistence.

**Projection motion.** Give this section its own spec-local view. Keep the animation toggle and
the conditional explanation separate from a command-only `Dev.List` for shuffle, move one direct
child and restore sample order. Omit `selected`; set each command's `enabled` from `!p.reorder.value`.
Move the existing order operations with their view; preserve direct-child scope and restore from
the current sample. No second selection store, new general-purpose helper or changes to `Dev.List`.

**Proof and cleanup.** Update `KeyValue/-test/-ui.spec-action-buttons.test.tsx` to exercise the new
selector without losing its action-row assertions. Verify None, mouse and keyboard selection,
reselection after modifying order, reload/reset and reorder-on disabled commands. With reorder off,
verify move/shuffle preserve the children and restore recreates sample order. Inspect at sidebar
width in DevHarness. For these sections `-SPEC.Debug.tsx` should only compose the two views: no
catalogue, action algorithms or duplicated markup. Remove the old button factory, tree marker,
repeated `sample:` prefixes, obsolete names/imports and unused styles; leave unrelated knobs alone.

## 2. Match apparent size, not nominal size

In the Context panel, compare the plain `localhost` value with `Passkey sample` below it.
The hostname looks larger even without the Origin link's underline or arrow. Mono should signal
an exact technical value, not a more important row.

- Trial a 1 CSS px reduction on KeyValue's own monospace value text, including generated links.
  Both layouts render `KeyValue/ui/ui.Cell.tsx`. Apply the correction there, once, using the
  effective mono setting. Keep keys, sans values, titles and caller-rendered controls unchanged.
  Do not change global typography or add a public prop: `KeyValue/u/u.style.ts` supplies base
  sizes to the root as well as the cells.
- Compare before/after at 100% browser zoom in `spaced` and `table`, with mixed rows and with
  component-wide mono. Base sizes are xs/sm/md = 10/11/13 px. Check `:1234`, slashes and short
  numerals; if 9 px compromises xs legibility, retain 10 px at xs. Keep weight, alignment,
  row gaps and truncation rules fixed. Accept the offset only where values read as peers and
  remain legible. Pin the accepted mono/sans sizing boundary in a focused rendered-cell test.

## 3. Turn reorder off from the hint

In `KeyValue/-spec/-ui.ProjectionMotion.tsx`, make the words “Turn reorder off” an inline
button within the existing sentence. On activation, set the existing `reorder.value` to `false`;
leave the main toggle in place. Do not change `animation`, sample selection, or item order.

Extend the spec interaction test: starting with reorder on, activate the hint by mouse or keyboard.
Verify the main control reads `reorder: false`, the hint disappears, and all three motion commands
are enabled without executing any of them.

## Completion evidence

- In Comprehensive, all eight sample labels fit in two columns. The matched `spaced` comparison
  and final `table` views supported keeping the 1 px reduction for KeyValue-owned monospace values
  at `sm` and `md`; `xs` stays at 10 px. Passkey's caller-rendered values were an unchanged reference.
- The hint uses the shared Button with blue text and a CSS hover underline. The interaction test
  verifies that Enter clears reorder and enables all three commands without changing the animation
  setting, selected sample, or item order.
- Final KeyValue test run: 21 passed (187 steps), 0 failed. Formatting and `git diff --check` passed.
