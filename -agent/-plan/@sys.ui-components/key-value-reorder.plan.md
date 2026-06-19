# @sys/ui-components KeyValue Reorder Plan

## Status: closed / landed

The root `KeyValue` reorder arc has landed. This plan is now historical trace, not an active implementation plan.

Landed commits:
- [x] `636cb031c` `refactor(ui-components): add KeyValue item identity seam`
- [x] `a89cbd74e` `refactor(ui-components): introduce KeyValue item shell (DOM)`
- [x] `d6a35f1d` `feat(ui-components): add KeyValue reorder affordance`
- [x] `313fc18e` `chore(ui-components): align Switches debug reorder controls`
- [x] `f59c75f` `feat(ui-components): add KeyValue reorder lifecycle events`

## Landed shape

`KeyValue.UI` now supports an optional controlled `reorder` affordance at the root item layer.

```tsx
<KeyValue.UI
  items={items}
  reorder={{
    enabled: true,
    onChange: (e) => setItems(e.next),
  }}
/>
```

Reorder mode is active only when:
- `reorder` exists,
- `reorder.enabled !== false`,
- `reorder.onChange` exists,
- every item has stable unique identity from `reorder.getItemId(item, index)` or `item.id`.

If identity is missing or duplicated, `KeyValue.UI` falls back to the static render path. It does not throw in ordinary render and does not fabricate random/render-time IDs.

## Public API

Current public reorder type family:

```ts
export type Reorder = {
  readonly enabled?: boolean;
  readonly getItemId?: Reorder.GetItemId;
  readonly onStart?: Reorder.StartHandler;
  readonly onChange?: Reorder.ChangeHandler;
  readonly onEnd?: Reorder.EndHandler;
};

export namespace Reorder {
  export type GetItemId = (item: Item, index: number) => string | undefined;

  export type ItemRef = {
    readonly id: string;
    readonly item: Item;
    readonly index: number;
  };

  export type Start = {
    readonly active: ItemRef;
    readonly items: readonly Item[];
  };

  export type Change = {
    readonly next: Item[];
  };

  export type End = {
    readonly active: ItemRef;
    readonly items: readonly Item[];
    readonly changed: boolean;
  };

  export type StartHandler = (e: Start) => void;
  export type ChangeHandler = (e: Change) => void;
  export type Handler = ChangeHandler;
  export type EndHandler = (e: End) => void;
}
```

Lifecycle is:

```text
start → change* → end
```

Semantics:
- `active` is the item being reordered.
- `items` is the lifecycle snapshot at `onStart` or `onEnd`.
- `next` is the controlled replacement payload for `onChange`.
- `changed` summarizes whether the final item order differs from the start order.
- `Handler` remains as a backwards-compatible alias for `ChangeHandler`.

No `changing` event landed. No `prev`, `from`, `to`, `item`, `reason`, or Motion/dnd-kit event payloads landed.

## Implementation notes

- Motion is internal only, imported as `ReorderBase` from the local common lane.
- Public API exposes only `@sys` types.
- Reorder values are stable string IDs, not item object references.
- `toReorderModel(...)` owns identity resolution:
  ```ts
  reorder.getItemId?.(item, index) ?? item.id
  ```
- `toReorderedItems(...)` accepts only valid permutations:
  - same length,
  - no duplicate IDs,
  - every ID maps back to a known item.
- `sameIds(...)` suppresses no-op controlled churn.
- `Reorder.Item` is the direct parent-grid child in reorder mode, preserving the table/subgrid item-shell invariant.
- Static mode still uses `item.id ?? index` only as a React key fallback.

## KeyValue.Switches status

`KeyValue.Switches.UI` inherits root `KeyValue` reorder support because its props extend `KeyValue.Props` and `toItem(...)` preserves row `id`.

The Switches debug harness now includes a `reorder: boolean` control and proves reorder through the wrapper without bespoke production logic.

Production call-sites should opt into reorder only when earned.

## Files.InfoPanel.Config relationship

Do not fold reorder policy into `Files.InfoPanel.Config`.

The clean downstream path remains:
- represent fields as ordered immutable arrays,
- toggle visible fields while preserving canonical order,
- later pass `reorder` through root `KeyValue` only if the production config UI earns drag/reorder.

No Files production reorder call-site has landed from this plan.

## Proofs run during the arc

Focused tests:

```text
deno task test --trace-leaks ./src/ui.react/KeyValue/-test/-.test.tsx ./src/ui.react/KeyValue/-test/-u.reorder.test.ts ./src/ui.react/KeyValue/-test/-u.fromObject.test.ts ./src/ui.react/KeyValue/-test/-u.href.test.ts ./src/ui.react/KeyValue.Switches/-test/-.test.ts
```

Package check:

```text
deno task check
```

Runtime/spec proofs:
- static table and spaced samples did not regress,
- reorder sample dragged successfully,
- `reorder: true/false` applies uniformly across visible KeyValue samples,
- Switches debug harness can prove inherited reorder through the wrapper,
- lifecycle console events mirror the final shape:
  - `KeyValue.reorder.onStart`,
  - `KeyValue.reorder.onChange`,
  - `KeyValue.reorder.onEnd`.

## Remaining true follow-up

- Tune reorder motion feel only if needed: bounce, landing softness, dense-list feel, and overall “buttery” movement. This is animation tuning only; do not change the public API unless a real product need earns it.

## Closed decisions

- Reorder belongs at root `KeyValue.UI` item layer.
- Reorder is controlled only.
- Reorder mode requires stable identity.
- `reorder.getItemId(...)` explicitly overrides `item.id`.
- First drag surface is the whole item/row.
- No drag handles until interaction conflicts earn them.
- No random/render-time IDs.
- No persistence in `KeyValue`.
- No Files semantics in `KeyValue`.
- No third-party public types.
- `start → change* → end` is the lifecycle model.
- `current + next` transition payloads are not needed for the landed model.
