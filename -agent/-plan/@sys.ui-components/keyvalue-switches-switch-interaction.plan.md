# KeyValue.Switches switch interaction plan

Commit arc:

- [x] 3180a2c25 chore(ui-components): tidy KeyValue.Switches harness samples
- [x] 7e0c5f771 feat(ui-components): add semantic Switch toggle handler
- [x] b989522d3 chore(ui-components): namespace Switch types
- [x] f1c6af6b9 chore(ui-components): namespace Buttons.Icons types
- [x] 93a59cfba chore(ui-components): namespace Buttons types
- [x] 3e1de46ec chore(ui-components): namespace Button types
- [x] e1d31001d feat(ui-components): make Switch a semantic switch button
- [x] 20023a868 feat(ui-components): let KeyValue.Switches labels toggle rows
- [x] ed86000eb feat(ui-components): associate KeyValue.Switches labels with switches

## BMIND review

The interaction should be expressed where the intent lives:

- `Switch` owns the physical gesture and current boolean value.
- `KeyValue.Switches` owns the labeled-row meaning.
- `KeyValue` remains a generic key/value renderer and should not learn switch-specific click behavior.

The clean path is additive and narrow: first make `Switch` expose a semantic toggle event, then let `KeyValue.Switches` compose label and switch clicks through the same row toggle action.

## Phase 1: harness sample tidy

Status: landed in `3180a2c25`.

Scope:

- Default debug `reorder` to `true`.
- Make `basic` sample generic: `alpha`, `bravo`, `charlie`.
- Make `grouped` sample demonstrate a reorderable atomic group with root siblings:
  - `foo`
  - `sample-group`
    - `primary row`
    - indented `nested alpha`
    - indented `nested bravo`
    - divider
    - `secondary row`
  - `bar`
  - `baz`

Proof:

- `deno task test --trace-leaks ./src/ui.react/KeyValue.Switches/-test/-.test.ts`
- `deno task check`

## Phase 2: semantic Switch toggle event

Add a semantic toggle callback to `Buttons.Switch` without removing the existing low-level `onClick` surface.

Status: landed in `7e0c5f771`.

Public surface:

```ts
onToggle?: t.Switch.Toggle.Handler;

declare namespace Switch.Toggle {
  type Handler = (e: Args) => void;
  type Args = {
    readonly current: boolean;
    readonly next: boolean;
    readonly synthetic: React.MouseEvent;
  };
}
```

Adjacent `KeyValue.Switches.Row.onToggle` was normalized to:

```ts
onToggle?: t.KeyValueSwitches.Item.Toggle.Handler;
```

Runtime behavior:

- Fires only when enabled.
- Fires on the same primary-button release gesture currently used for `onClick`.
- Computes `current` and `next` from the current `value` snapshot.
- Preserves existing `onClick` behavior for compatibility.
- Do not change the DOM substrate in this commit.
- Normalize the adjacent `KeyValue.Switches.Row.onToggle` handler to the same single event-object convention.

Proof target:

- Add a narrow `Buttons.Switch` DOM test for click toggle semantics.
- Keep `KeyValue.Switches` type/surface tests passing.
- Existing switch theme tests remain unchanged.

## Phase 2.5: button-family type namespace tidy

Before changing runtime semantics again, move the button-family type files into the modern namespaced `t.*` shape.
Keep each step mechanical and reviewable: namespace the public types, update call-sites, and do not leave flat back-compat aliases.

Commit steps:

- [x] `b989522d3 chore(ui-components): namespace Switch types`
- [x] `f1c6af6b9 chore(ui-components): namespace Buttons.Icons types`
- [x] `93a59cfba chore(ui-components): namespace Buttons types`
- [x] `3e1de46ec chore(ui-components): namespace Button types`

Status: landed across `b989522d3`, `f1c6af6b9`, `93a59cfba`, and `3e1de46ec`.

Scope:

- `Buttons.Switch/t.ts` → `t.Switch.*`
- `Buttons.Icons/t.ts` → `t.ButtonsIcons.*`
- `Buttons/t.ts` → `t.Buttons.*`
- `Button/t.ts` → `t.Button.*`
- Flat aliases were removed rather than retained as back-compat shims.

Proof target:

- Focused button-family tests where present.
- `deno task check`

## Phase 3: semantic Switch button substrate

Status: landed in `e1d31001d`.

Move `Buttons.Switch` from a generic `div` gesture surface to a native button substrate in a separate commit.

Runtime shape:

- Render a reset-styled `<button type="button">`.
- Add `role="switch"` and `aria-checked={value}`.
- Use native `disabled` semantics when disabled.
- Let native button keyboard activation route through the same `onClick`/`onToggle` path.
- Keep this contained in `Switch`; do not spread accessibility mechanics into `KeyValue.Switches`.

Focus styling:

- Do not accept accidental browser focus halo as the final visual design.
- Reset button chrome deliberately: appearance, border, padding, background.
- Add a controlled focus-visible style, or defer only if the visual pass explicitly records it as unfinished.

Proof target:

- Add a narrow `Buttons.Switch` DOM test for role/aria and keyboard activation.

## Phase 4: KeyValue.Switches label toggles row

Status: landed in `20023a868`.

Compose the row action once and use it from both value-side switch and key-side label.

Implementation shape:

- Add a small local helper/model for switch row interaction:
  - `value`
  - `enabled`
  - `toggle(next?)`
- Update `SwitchValue` to use `Switch.onToggle` instead of re-deriving `!value` in `onClick`.
- Wrap row `k` label in a small label component only inside `KeyValue.Switches.toItem`.
- The label toggles only when the row interaction model is enabled.

Non-goals:

- Do not add generic `KeyValue.Row.onClick` yet.
- Do not change `KeyValue` row/cell public contracts.
- Do not make labels reorder drag handles or alter reorder semantics.

Proof:

- Added `KeyValue.Switches` DOM coverage proving:
  - clicking the label toggles the row;
  - disabled rows do not toggle;
  - rows without `onToggle` do not toggle;
  - the value-side switch routes through the same row toggle action.

## Phase 5: visible label association

Status: landed in `ed86000eb`.

Associate visible `KeyValue.Switches` labels with their switch controls without moving DOM identity into the data model.

Runtime shape:

- `Switches.UI` owns render-instance identity via React `useId()`.
- Internal render conversion assigns scoped label ids with row path entropy.
- Switch buttons use `aria-labelledby` when a rendered visible label id exists.
- Public `toItem`/`toItems` remain pure and use a safe `aria-label` fallback from string label or item id when no render-owned label id exists.
- No global counters, random ids, public DOM-id scope option, or unsafe `<label htmlFor>` coupling.

Proof:

- Added `KeyValue.Switches` DOM coverage proving:
  - rendered switch rows use `aria-labelledby` and do not duplicate `aria-label`;
  - duplicate item ids across nested groups and multiple rendered instances do not duplicate label ids;
  - direct public conversion switches are still named without unsafe DOM ids.

## Review gates

Before landing:

- [x] Confirm no duplicate switch-toggle logic remains in `KeyValue.Switches`.
- [x] Confirm disabled behavior is identical for switch and label activation.
- [x] Confirm keyboard handling lives only in `Switch`.
- [x] Confirm `KeyValue` stays generic.
- [x] Confirm visible labels programmatically name switches without data-model-owned DOM ids.
- [x] Confirm public conversion paths still produce named switches.
