# KeyValue.Switches switch interaction plan

- [ ] chore(ui-components): tidy KeyValue.Switches harness samples
- [ ] feat(ui-components): add semantic Switch toggle handler
- [ ] feat(ui-components): let KeyValue.Switches labels toggle rows

## BMIND review

The interaction should be expressed where the intent lives:

- `Switch` owns the physical gesture and current boolean value.
- `KeyValue.Switches` owns the labeled-row meaning.
- `KeyValue` remains a generic key/value renderer and should not learn switch-specific click behavior.

The clean path is additive and narrow: first make `Switch` expose a semantic toggle event, then let `KeyValue.Switches` compose label and switch clicks through the same row toggle action.

## Phase 1: harness sample tidy

Status: implemented in working tree.

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

Public surface:

```ts
onToggle?: (next: boolean, e: React.MouseEvent) => void;
```

Runtime behavior:

- Fires only when enabled.
- Fires on the same primary-button release gesture currently used for `onClick`.
- Computes `next` from the current `value` snapshot.
- Preserves existing `onClick` behavior for compatibility.

Role/button polish:

- The switch root can become keyboard-visible and semantically identifiable without broad API churn.
- Add `role="switch"` and `aria-checked={value}`.
- Add `aria-disabled={!isEnabled}` when disabled.
- Add `tabIndex={isEnabled ? 0 : -1}`.
- Add keyboard activation for `Enter` and `Space`, routing through the same semantic toggle path.
- Keep this contained in `Switch`; do not spread accessibility mechanics into `KeyValue.Switches`.

Proof target:

- Add a narrow `Buttons.Switch` DOM test for click and keyboard toggle semantics.
- Existing switch theme tests remain unchanged.

## Phase 3: KeyValue.Switches label toggles row

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

Proof target:

- Add a `KeyValue.Switches` DOM test proving:
  - clicking the label toggles the row;
  - disabled rows do not toggle;
  - rows without `onToggle` do not toggle.

## Review gates

Before landing:

- Confirm no duplicate switch-toggle logic remains in `KeyValue.Switches`.
- Confirm disabled behavior is identical for switch and label activation.
- Confirm keyboard handling lives only in `Switch`.
- Confirm `KeyValue` stays generic.
