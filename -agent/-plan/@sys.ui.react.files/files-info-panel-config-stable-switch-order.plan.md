@sys.ui.react.files
files-info-panel-config-stable-switch-order.plan.md
- [ ] refactor(ui): keep InfoPanel Config switch toggles in place
- [ ] feat(ui): add explicit disabled-row organization action, if the first slice proves it useful
- [ ] test(ui): prove stable config row identity, order, and cursor continuity

## Status

Focused forward UI refactor. The cursor/divider forcing case is complete; this plan owns only the
remaining host-level switch-order problem.

## Problem

`Files.InfoPanel.Config` currently partitions rows into two `KeyValue.Switches` roots:

- visible/on rows are reorderable;
- hidden/off rows are toggle-only and render below.

Toggling a row off therefore removes it from one root and remounts it in the other. The local switch
change becomes an implicit reorder/teleport, loses spatial continuity, and complicates cursor
continuity.

## Target behavior

- Render one stable ordered switch list/root.
- Toggling a row changes enabled state without changing its position.
- Explicit user reorder changes position.
- The subject `Files.InfoPanel` projection derives visible items from enabled rows.
- Disabled rows remain addressable and reorderable according to the selected host policy.
- `KeyValue` stays domain-neutral; Files Config owns order and enabled semantics.

## Host model seam

The existing visible-only `Field[]` / `ConfigItem[]` model cannot remember disabled-row positions.
Choose a host-owned representation such as:

- stable row order plus a separate enabled set; or
- an ordered config-row model carrying field identity and enabled state.

Do not encode disabled rows as fake Files fields, and do not teach `KeyValue` Files-domain
semantics. Preserve structural divider items and title-group dependency rules.

## First slice

1. Define the smallest caller-owned state shape that preserves all row positions.
2. Project one `KeyValue.Switches` root from that state.
3. Make toggles update enabled state only.
4. Keep drag/reorder explicit and durable.
5. Derive the visible subject projection separately.
6. Prove cursor target continuity across toggles and reorders.

## Optional follow-on

An explicit `organize`, `tidy`, or `move disabled below enabled` action may move disabled rows below
enabled rows while preserving relative order. This must be a visible user command, not a side effect
of toggling.

## Proof

- Toggling off does not move or remount the row.
- Toggling on restores subject visibility without moving the config row.
- Explicit reorder changes durable order.
- Title dependency normalization remains correct.
- Divider identity/order remains correct.
- Cursor target remains truthful when row enabled state changes.
- Subject projection animation responds only to legitimate visible item changes.

## Non-goals

- No new KeyValue cursor primitive.
- No generic form/config-designer framework.
- No Files client or service lifecycle ownership.
- No automatic disabled-row partitioning.
- No status recovery event model; that remains a separate Files UI plan.
