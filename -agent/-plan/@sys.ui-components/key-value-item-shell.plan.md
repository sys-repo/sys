# @sys/ui-components KeyValue Item Shell Plan

- [x] refactor(ui-components): introduce KeyValue item shell — `a89cbd74e`
- [x] test(ui-components): prove KeyValue item shell preserves item mapping — `a89cbd74e`
- [x] proof(ui-components): visually confirm KeyValue table fidelity — accepted into `a89cbd74e` after human/runtime proof

## Status
Spent/closed.

Landed in:
```text
a89cbd74e refactor(ui-components): introduce KeyValue item shell (DOM)
```

Implementation, automated checks, and human/runtime visual proof are complete. This plan is now historical context for future KeyValue reorder work, not an active work item.

Preparatory hardening plan before future KeyValue reorder work.

This is not a drag/drop implementation. It is a careful internal layout refactor that makes the semantic `KeyValue.Item` boundary explicit and measurable without changing the public `KeyValue` API.

## Intent
- Preserve all current `KeyValue` visual fidelity.
- Introduce a real per-item DOM boundary/shell for each `KeyValue.Item`.
- Remove reliance on row-level `display: contents` as the long-term item boundary.
- Keep the future reorder insertion point clean for Motion, dnd-kit, or another internal implementation.
- Keep reorder library choices hidden behind future `@sys` types.

## Non-goals
- No public API change.
- No `reorder` prop.
- No Motion import.
- No dnd-kit import.
- No drag handle.
- No reorder behavior.
- No broad redesign of `KeyValue` semantics.
- No loss of current table layout fidelity.

## Landed structure
`KeyValue.UI` now maps each item through an internal item shell:
```tsx
<ItemShell key={key} item={item} layout={layout}>
  <Row | Title | Hr | Spacer />
</ItemShell>
```

The shell is internal only. It does not appear in the public API.

For table rows, `ItemShell` uses:
```ts
display: 'grid';
gridColumn: '1 / -1';
gridTemplateColumns: 'subgrid';
```

This preserves the parent `KeyValue` grid column tracks while giving each logical item a real DOM boundary. Non-row/table-spanning items use the shell as a span-all boundary.

Future reorder can make this shell become or render the internal Motion/dnd item boundary without changing caller code.

## Table layout fidelity requirement
The table layout must continue to preserve:
- global widest-left-column behavior across rows,
- `keyMax`,
- `keyAlign`,
- row/value alignment,
- row gaps,
- `x`/`y` spacing,
- title/hr/spacer span-all behavior,
- truncation behavior,
- baseline/start/center/end alignment behavior.

The current table intent is:
```text
parent grid defines columns:
  key column = max-content or fit-content(keyMax)
  value column = 1fr

row key cell participates in parent column 1
row value cell participates in parent column 2
```

## Table implementation
CSS subgrid was accepted after automated and visual proof:
```tsx
<ItemShell>
  <Cell role="key" />
  <Cell role="val" />
</ItemShell>
```

The point was not to modernize for its own sake; the point was to keep the table semantics while making each item a real measurable DOM unit.

## Browser/support note
CSS subgrid was accepted for the current target/runtime path after proof. If a future browser/support issue appears, the fallback options remain:
- use item shell only for spaced layout,
- keep table mode on `display: contents`,
- gate future reorder to spaced layout,
- revisit table reorder with a different internal strategy.

Do not trade table layout reliability for reorder convenience.

## Acceptance criteria
- Public `KeyValue` API is unchanged.
- Existing `KeyValue` callers type-check without changes.
- Every rendered `KeyValue.Item` has a stable internal item boundary where feasible.
- Table layout preserves global key-column sizing across rows.
- `KeyValue.Switches.UI` output remains visually equivalent.
- Existing `KeyValue` and `KeyValue.Switches` tests pass.
- Full `@sys/ui-components` check passes.

## Visual proof checklist
Completed against before/after screenshots. New table/spaced screenshots visually match the earlier baselines; observed differences are screenshot crop/viewport only.

Use the `KeyValue` spec samples to compare before/after:
- dark theme table sample,
- long key/value truncation,
- right-aligned title,
- horizontal divider span width,
- link rows,
- JSX element values,
- spaced layout sample,
- `KeyValue.Switches` sample.

Screenshots that motivated fidelity concern:
- `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-clipboard-a05c6a99-4226-4913-8e6b-b2fae06516f7.png`
- `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/pi-clipboard-903dbb95-ecab-476b-a10b-5cfc5d4fcacf.png`

## Proof path
From `code/sys.ui/ui-components`:
- `deno task test --trace-leaks ./src/ui.react/KeyValue/-test/-.test.tsx ./src/ui.react/KeyValue/-test/-u.fromObject.test.ts ./src/ui.react/KeyValue/-test/-u.href.test.ts ./src/ui.react/KeyValue.Switches/-test/-.test.ts`
- `deno task check`

Runtime proof completed:
- Opened `KeyValue` spec.
- Compared table/spaced samples visually.
- Opened `KeyValue.Switches` spec.
- Confirmed no visual regression.

## Relationship to reorder plan
This plan is a structural pre-pass for:
```text
-agent/-plan/@sys.ui-components/key-value-reorder.plan.md
```

The reorder plan remains responsible for future public reorder semantics and implementation-library selection.

This item-shell plan only prepares the internal DOM/layout boundary so the later reorder work can remain simple and maintainable.
