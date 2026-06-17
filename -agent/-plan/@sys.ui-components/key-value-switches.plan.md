# @sys/ui-components KeyValue.Switches Plan

- [x] 4697d767b feat(ui-components): scaffold KeyValue.Switches
- [x] a9a6431d6 fix(ui-components): export missing component types
- [x] 3485c2729 feat(ui-components): define KeyValue.Switches contract
- [x] c8d81826e feat(ui-components): implement KeyValue.Switches
- [x] eccf66bcc feat(ui-components): refine KeyValue.Switches row mapping
- [x] 69cb1acac refactor(ui): consume KeyValue.Switches in Files.InfoPanel

Status: complete. The reusable `KeyValue.Switches` primitive exists, is consumed by `Files.InfoPanel`, and further Files panel work now belongs to Files-owned plans.

Plan-record commit message:
```text
docs(plan): close KeyValue.Switches arc
```

## What / why
- Add `KeyValue.Switches` as the reusable KeyValue-shaped boolean-control map: `label → small Switch`, ordered by caller input and composable inside higher-order panels.
- The immediate use-case is `Files.InfoPanel`, but the primitive belongs to `@sys/ui-components` because it is a general debug/control surface for props maps, visibility toggles, and harness knobs.

## Name
- Public runtime name: `KeyValue.Switches`.
- Plan name: `key-value-switches.plan.md`.
- Avoid Files-specific naming; Files is the proving use-case, not the component noun.

## Current call-site chain
- Primitive home:
  - `code/sys.ui/ui-components/src/ui.react/KeyValue/`
  - current public leaf: `@sys/ui-components/react/key-value`
- Primary downstream use-case:
  - `code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel/ui.tsx`
  - row assembly: `code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel/u.items.tsx`
  - retired bespoke switch renderer: `code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel/ui.EventSwitch.tsx` removed by `69cb1acac`
  - spec/debug harness: `code/sys.ui/ui/src/ui.react/ui.files/ui.InfoPanel/-spec/-SPEC.Debug.tsx`
- Upstream app-shell consumer to re-check after the downstream refactor:
  - `deploy/@draft.shell/src/ui/ui.AppShell/common.ts` exports `Files` from `@sys/ui/react/files`
  - `deploy/@draft.shell/src/ui/ui.AppShell/-spec/-SPEC.Debug.tsx` renders `<Files.InfoPanel theme={theme.name} />`

## Final code truth
- `KeyValue.Switches` is attached to the public `KeyValue` surface as `KeyValue.Switches`.
- Runtime surface is `{ UI, toItem, toItems }`.
- `KeyValue.Switches.UI` is the component adapter for homogeneous switch rows plus dividers.
- `KeyValue.Switches.toItem(...)` is the adapter seam used inside mixed `KeyValue.UI` panels such as `Files.InfoPanel`.
- Public item shape is now `KeyValueSwitches.Item = Row | t.KeyValue.Hr`.
- `Row` is the switch-bearing item with `id`, `label`, `value`, `enabled`, `tooltip`, `switch`, `opacity`, and `onToggle`.
- `opacity` forwards directly to the underlying `KeyValue.Row.opacity` hook.
- Default layout uses `KeyValue` spaced defaults with `align: 'start'` so switch values align to the label start/first line.
- Spec samples live in `-samples.tsx` because they contain JSX labels.
- Files consumption is complete: the former bespoke `EventSwitch` value renderer was removed and `Files.InfoPanel` now uses `KeyValue.Switches.toItem(...)` for the `events` row.

## Target behavior
- Render rows like:
  - `capabilities    [switch]`
  - `events          [switch]`
- Compose through `KeyValue.UI` so spacing, theme, mono/truncate defaults, and row layout remain visually aligned with ordinary KeyValue rows.
- Use small switches by default, matching the current Files event switch scale.
- Preserve caller-owned order: array order is the first-class ordering mechanism.
- Let consumers decide what toggles mean. For `Files.InfoPanel`, toggles can control row visibility/order policy outside the primitive.

## Hardened public shape
```tsx
<KeyValue.Switches.UI
  theme={theme.name}
  items={[
    { id: 'capabilities', value: showCapabilities, onToggle: setShowCapabilities },
    { id: 'events', value: showEvents, onToggle: setShowEvents },
  ]}
/>
```

Manual `KeyValue.UI` composition stays first-class through row conversion helpers:
```tsx
<KeyValue.UI
  theme={theme.name}
  items={[
    KeyValue.Switches.toItem(
      { id: 'events', value: showEvents, onToggle: setShowEvents },
      { theme: theme.name },
    ),
  ]}
/>
```

Final type spine:
```ts
import type { t } from './common.ts';

/**
 * KeyValue-shaped switches for labeled boolean controls.
 */
export declare namespace KeyValueSwitches {
  /** Public runtime surface for `KeyValue.Switches`. */
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly toItem: ToItem;
    readonly toItems: ToItems;
  };

  /** Props for rendering switch rows through `KeyValue.UI`. */
  export type Props = Omit<t.KeyValue.Props, 'items'> & {
    /** Ordered switch items rendered through `KeyValue.UI`. */
    items?: Item[];
    /** Default switch options for every row; item options override these. */
    switch?: Item.SwitchOptions;
  };

  /** Ordered switch item input mapped into `KeyValue` items. */
  export type Item = Row | t.KeyValue.Hr;

  /** Ordered switch row input mapped into a `KeyValue` row. */
  export type Row = {
    /** Stable identity and fallback label. */
    id: string;
    /** Display label; defaults to `id`. */
    label?: t.ReactNode;
    /** Current switch value. */
    value?: boolean;
    /** Item-level enabled override composed with parent enabled and handler presence. */
    enabled?: boolean;
    /** Native tooltip for the switch control. */
    tooltip?: string;
    /** Per-row switch options overriding component defaults. */
    switch?: Item.SwitchOptions;
    /** Row-level opacity forwarded to the underlying `KeyValue` row. */
    opacity?: t.KeyValue.Row['opacity'];
    /** Receive the next switch value. */
    onToggle?: Item.ToggleHandler;
  };

  /** Convert one switch row input into a `KeyValue` row. */
  export type ToItem = (item: Row, options?: ToItem.Options) => t.KeyValue.Row;

  /** Convert switch inputs into `KeyValue` items. */
  export type ToItems = (items?: Item[], options?: ToItems.Options) => t.KeyValue.Item[];

  /**
   * Item-local details.
   */
  export namespace Item {
    /** Appearance options forwarded to the rendered switch control. */
    export type SwitchOptions = Pick<
      t.SwitchProps,
      'width' | 'height' | 'transitionSpeed' | 'track' | 'thumb'
    >;

    /** Receive the next switch value and row context. */
    export type ToggleHandler = (next: boolean, e: ToggleArgs) => void;

    /** Context passed to a switch toggle handler. */
    export type ToggleArgs = {
      readonly item: KeyValueSwitches.Row;
      readonly index: number;
    };
  }

  /**
   * Single-item conversion details.
   */
  export namespace ToItem {
    /** Options for converting one switch item. */
    export type Options = ToItems.Options & { index?: number };
  }

  /**
   * Multi-item conversion details.
   */
  export namespace ToItems {
    /** Options shared while converting switch items. */
    export type Options = {
      enabled?: boolean;
      theme?: t.CommonTheme;
      switch?: Item.SwitchOptions;
    };
  }
}
```

Type/API decisions:
- `KeyValueSwitches` is the type namespace; `Switches` is the local runtime name; public composition is `KeyValue.Switches`.
- JSX usage is `KeyValue.Switches.UI`, matching the existing `KeyValue.UI` package idiom.
- `Props` is a near-pure `KeyValue.Props` pass-through, omitting only `items` because this component maps its own item shape into normal `KeyValue.Item[]`.
- `items` stays array-first so caller order is the ordering contract.
- `Item = Row | t.KeyValue.Hr`; `Item` means an ordered render item, while `Row` means a switch-bearing row.
- `Row.id` is stable identity and fallback label; `Row.label` is display override.
- `Row.opacity` forwards to `KeyValue.Row.opacity` for pure row presentation control.
- `Item.SwitchOptions` is an options subset, not the full switch prop surface.
- `Props.switch` is the component-level default for all rows; `Item.switch` is the per-row override.
- Switch option resolution is `internal small-switch defaults` → `Props.switch` → `Item.switch`.
- `enabled` is inherited from `KeyValue.Props` and composes with item-level `enabled` and `onToggle` presence.
- `toItem` / `toItems` expose the reusable mapping seam for manual `KeyValue.UI` composition without exposing an extra public subcomponent.
- No resolver/generator function in this pass; callers can generate `Item[]` directly and a resolver is earned only by repeated call-sites.
- No record/map helper until repeated call-sites earn it.

## Implementation seams
- `ui-components`:
  - implement `src/ui.react/KeyValue.Switches/ui.tsx` as the thin adapter: `KeyValueSwitches.Item[]` → `t.KeyValue.Item[]` → `<KeyValue.UI>`;
  - add conversion helpers, likely in `u.items.tsx`, and expose them as `KeyValue.Switches.toItem` / `KeyValue.Switches.toItems`;
  - add `src/ui.react/KeyValue.Switches/ui.Switch.tsx` as the isolated row-value switch renderer;
  - compose existing `KeyValue.UI` and `Switch` from `Buttons.Switch` through the local `common.ts` lane;
  - keep `KeyValue.Switches` attached through `t.KeyValue.Lib` and `m.KeyValue.ts`;
  - add KeyValue.Switches spec sample rows for labeled switches.

## Debug harness shape
- Keep debug controls in `src/ui.react/KeyValue.Switches/-spec/-SPEC.Debug.tsx`; pure render files must not own persistence.
- Minimal controls:
  - `theme: Light/Dark`
  - `enabled: true/false`
  - `Samples` section separated by `<hr>`
  - `sample: basic`
  - `sample: mixed`
  - final debug/reset/object-view section
- `basic` proves two normal ordered rows using component-level switch defaults.
- `mixed` proves a custom JSX label, a large switch, an HR divider, an overflowing label on a normal switch, a disabled row with label opacity, and a multiline label.
- Keep sample descriptors and value materialization in `-spec/-samples.tsx`; debug storage owns a generic `values: Record<string, boolean>` map, not row-specific boolean fields.
- Do not mirror the full `KeyValue` debug panel; `KeyValue.Switches` only proves switch-row mapping and option composition.
- `@sys/ui/react/files`:
  - completed by `69cb1acac`: `Files.InfoPanel` consumes `KeyValue.Switches.toItem(...)` for the `events` row;
  - completed by `69cb1acac`: `ui.EventSwitch.tsx` was retired;
  - Files policy remains in `u.items.tsx` / controller state, not in `KeyValue.Switches`;
  - no Files service/client lifecycle changed.
- `deploy/@draft.shell`:
  - verify the existing AppShell spec still reaches the updated `Files.InfoPanel` through `@sys/ui/react/files`.

## Proof path
Completed proofs during the arc:
- From `code/sys.ui/ui-components`:
  - `deno task test --trace-leaks ./src/ui.react/KeyValue.Switches/-test/-.test.ts`
  - `deno task check`
- From `code/sys.ui/ui`:
  - `deno task test --trace-leaks ./src/ui.react/ui.files`
  - `deno task check`

Further app-shell and richer Files panel behavior belongs to Files-owned follow-up plans.

## Non-goals
- No Files-specific code in `@sys/ui-components`.
- No drag/drop reorder UI in this first unit; caller-provided order is enough.
- No hidden persistence or harness storage inside `KeyValue.Switches`.
- No global control-panel abstraction until repeated use earns it.
- No changes to `@sys/model/files` or `@sys/server/files`.
