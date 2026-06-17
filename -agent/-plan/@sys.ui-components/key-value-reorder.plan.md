# @sys/ui-components KeyValue Reorder Plan

- [x] refactor(ui-components): add KeyValue item identity seam
- [x] refactor(ui-components): introduce KeyValue item shell
- [ ] feat(ui-components): add KeyValue reorder affordance
- [ ] test(ui-components): prove KeyValue reorder identity contract

## Status
Design captured before implementing `Files.InfoPanel.Config` so the config component does not paint the system into an API corner.

Do not implement drag/reorder as part of the first `Files.InfoPanel.Config` pass. The immediate purpose of this plan is to preserve the future path and identify the smallest clean preparatory seam.

The item-shell pre-pass is complete and tracked in:
```text
-agent/-plan/@sys.ui-components/key-value-item-shell.plan.md
a89cbd74e refactor(ui-components): introduce KeyValue item shell (DOM)
```

## TMIND review
- The immediate implementation should stop at identity. Identity is a stable, low-risk semantic improvement even without reorder.
- Do not introduce the `reorder` prop, reorder events, drag handles, library imports, or layout-motion behavior in the identity-seam commit.
- Keep `id` optional so static `KeyValue.UI` remains lightweight and backwards compatible.
- Treat `item.id ?? index` as a static-render React key fallback only; it is not sufficient identity for reorder mode.
- Future reorder mode must require stable identity through explicit item IDs or a caller-provided `getItemId`.
- Future callbacks must emit immutable next arrays and never mutate caller-provided `items`.
- Public types must remain `@sys` types; third-party library choices stay internal.

## Intent
- Put reorder capability at the root `KeyValue` item layer so composed variants inherit it.
- Keep reorder semantics in `@sys` types; never expose Motion, dnd-kit, or another sub-library in public API.
- Preserve `KeyValue` as a structural row/list grammar, with reorder as an optional affordance.
- Ensure `KeyValue.Switches.UI`, `Files.InfoPanel.Config`, and future compound views can opt into reorder without bespoke local implementations.

## Non-goals for now
- No drag/reorder UI in the first `Files.InfoPanel.Config` implementation.
- No reorder persistence policy in `KeyValue`.
- No generated random IDs during render.
- No Motion/dnd-kit/public library event leakage.
- No global config framework.
- No tricky sortable implementation until a concrete call-site earns it.

## Design principle
Static rendering remains simple:
```tsx
<KeyValue.UI items={items} />
```

Reorder is an optional mode:
```tsx
<KeyValue.UI
  items={items}
  reorder={{
    enabled: true,
    onChange: (next, e) => setItems(next),
  }}
/>
```

If reorder is enabled, item identity must be stable. Ordinary static rendering should not require IDs.

## Identity seam
Future-safe item identity should be optional on every item variant:
```ts
type KeyValue.Item = Row | Title | Hr | Spacer;

type Row = {
  readonly id?: string;
  readonly kind?: 'row';
  readonly k: React.ReactNode;
  readonly v?: React.ReactNode;
};

type Title = {
  readonly id?: string;
  readonly kind: 'title';
  readonly v: React.ReactNode | [React.ReactNode, React.ReactNode];
};

type Hr = {
  readonly id?: string;
  readonly kind: 'hr';
};

type Spacer = {
  readonly id?: string;
  readonly kind: 'spacer';
};
```

Static mode may use `item.id ?? index` for React keys.

Reorder mode must require one of:
- explicit `item.id`, or
- `reorder.getItemId(item, index)`.

Do not call `slug()` or any random ID generator during render. Random/render-time IDs break React identity, animation identity, focus, and reorder semantics.

## Candidate reorder API sketch
```ts
export type Reorder = {
  enabled?: boolean;
  getItemId?: GetItemId;
  onChange?: ReorderHandler;
};

export type GetItemId = (item: Item, index: number) => string | undefined;

export type ReorderHandler = (next: Item[], e: ReorderEvent) => void;

export type ReorderEvent = {
  readonly from: number;
  readonly to: number;
  readonly item: Item;
};
```

Rules:
- `onChange` receives a new immutable array.
- `KeyValue` does not mutate `items`.
- Caller owns state and passes the next `items` prop back down.
- Reorder event types are ours; internal libraries remain implementation details.

## Implementation library boundary
`motion/react` is already available in `@sys/ui-components`, so it is a plausible internal implementation for layout/reorder affordances.

However, the public API must remain independent:
- no `Motion` types,
- no dnd-kit types,
- no third-party sensor/event objects,
- no library-specific prop names.

If Motion later proves insufficient, the implementation can change behind the same `KeyValue.Reorder` contract.

## Relationship to KeyValue.Switches
`KeyValue.Switches.Row` already has a stable `id`.

A minimal identity seam should preserve that ID when mapping:
```ts
KeyValue.Switches.toItem({ id: 'events', ... })
// => { id: 'events', kind: 'row', k: 'events', v: <SwitchValue /> }
```

This is useful even before drag/reorder because it gives `KeyValue.UI` stable React keys when available.

## Relationship to Files.InfoPanel.Config
`Files.InfoPanel.Config` should use ordered immutable arrays now:
```ts
fields: Files.InfoPanel.Field[];
onFieldsChange(next: Files.InfoPanel.Field[]): void;
```

The field values are already stable IDs:
```ts
'status:title'
'status'
'fidelity'
'capabilities'
'error'
'events'
```

The first config pass should only toggle fields on/off while preserving canonical order. Future drag/reorder can emit a new field array through the same callback shape.

## Minimal clean pass recommendation
Before implementing full reorder, a small preparatory pass is likely warranted:

```text
refactor(ui-components): add KeyValue item identity seam
```

Scope:
- Add optional `id?: string` to `KeyValue.Row`, `Title`, `Hr`, and `Spacer`.
- Use `item.id ?? index` for React keys in `KeyValue.UI`.
- Forward `KeyValue.Switches.Row.id` into the mapped `KeyValue.Row` from `toItem(...)`.
- Add narrow tests proving `KeyValue.Switches.toItem` preserves row identity.

Do not add reorder props in this pass.
Do not add drag UI in this pass.

Acceptance criteria:
- `t.KeyValue.Row`, `Title`, `Hr`, and `Spacer` each accept optional `id?: string`.
- Existing callers without IDs still render and type-check.
- `KeyValue.UI` uses stable explicit IDs for React keys when provided.
- `KeyValue.Switches.toItem(...)` preserves `Row.id` into the returned `KeyValue.Row`.
- Tests prove the identity mapping without asserting any drag/reorder behavior.

## Future reorder affordance criteria
When the later reorder affordance is implemented:
- Reorder mode must be opt-in.
- Reorder mode must reject or disable reorder for items without stable identity unless `getItemId` supplies one.
- `onChange` must receive a fresh immutable item array.
- Library implementation must remain replaceable behind `KeyValue.Reorder` types.
- The first concrete reorder consumer should prove both `KeyValue.UI` and a composed variant such as `KeyValue.Switches.UI`.

## Proof path
From `code/sys.ui/ui-components`:
- `deno task test --trace-leaks ./src/ui.react/KeyValue.Switches/-test/-.test.ts`
- `deno task test --trace-leaks ./src/ui.react/KeyValue/-.test.ts`
- `deno task check`

From `code/sys.ui/ui` after Files config work:
- `deno task test --trace-leaks ./src/ui.react/ui.files`
- `deno task check`
