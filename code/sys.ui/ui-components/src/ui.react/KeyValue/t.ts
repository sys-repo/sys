import type React from 'react';
import type { t } from '../common.ts';

/**
 * Types for the KeyValue primitive.
 * A minimal table for rendering key/value data with optional titles and dividers.
 */
export declare namespace KeyValue {
  /** Size flags. */
  export type Size = 'xs' | 'sm' | 'md';

  /** Item kinds. */
  export type Item = Row | Title | Hr | Spacer | Group;

  /** Spacing offset around an item. */
  export type Spacing = t.Pixels | [t.Pixels, t.Pixels] | readonly [t.Pixels, t.Pixels];

  /**
   * Optional opacity overrides for key/value pairs.
   * - Single number: applied uniformly to both key and value.
   * - Object: per-side overrides (k = key, v = value).
   */
  export type Opacity = t.Percent | { readonly k?: t.Percent; readonly v?: t.Percent };

  export type LinkOpen = 'new-tab' | 'inline';
  export type LinkDisplay = 'raw' | 'trim-http';

  export type Defaults = {
    /**
     * Opacity applied to value-side cells (`v`) when `enabled` is false.
     * Key-side styling remains unchanged by default.
     */
    readonly disabledOpacity?: t.Percent;
  };

  /** Compact action button props for use in a KeyValue row value cell. */
  export type ActionButtonProps = {
    label: React.ReactNode;
    enabled?: boolean;
    tooltip?: string;
    onClick?: React.MouseEventHandler;
  };

  /**
   * Opt-in animation settings for static direct-child item projection.
   *
   * Projection animation requires stable, unique IDs on the root direct-child
   * item list. When controlled reorder mode is active, Motion Reorder owns item
   * motion and this projection path is not used.
   */
  export type Animation = boolean | Animation.Options;

  /** Animation option contracts. */
  export namespace Animation {
    /** Supported projection easing presets. */
    export type Ease = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

    /** Component-level animation options. */
    export type Options = {
      /** Master enable flag; `false` disables all KeyValue animation options. */
      readonly enabled?: boolean;
      /** Animate static root direct-child insert/remove/order layout projection. */
      readonly projection?: boolean | Projection;
    };

    /** Direct-child projection animation tuning. */
    export type Projection = {
      /** Projection-local enable flag. */
      readonly enabled?: boolean;
      /** Transition duration in milliseconds. */
      readonly duration?: t.Msecs;
      /** Motion easing preset. */
      readonly ease?: Ease;
    };
  }

  export type LinkProps = {
    readonly href?: t.StringUri;
    readonly infer?: boolean;
    readonly open?: LinkOpen;
    readonly display?: LinkDisplay;
    readonly rel?: string;
  };

  export type LinkDef = boolean | t.StringUri | LinkProps;
  export type Href = LinkDef | { readonly k?: LinkDef; readonly v?: LinkDef };

  /**
   * Public module surface.
   */
  export type Lib = {
    readonly UI: React.FC<Props>;
    readonly ActionButton: React.FC<ActionButtonProps>;
    readonly Switches: Switches.Lib;
    fromObject: FromObject;
  };

  /**
   * KeyValue-shaped switches for labeled boolean controls.
   */
  export namespace Switches {
    /** Public runtime surface for `KeyValue.Switches`. */
    export type Lib = t.KeyValueSwitches.Lib;

    /** Props for rendering switch rows through `KeyValue.UI`. */
    export type Props = t.KeyValueSwitches.Props;

    /** Ordered switch item input mapped into `KeyValue` items. */
    export type Item = t.KeyValueSwitches.Item;

    /** Ordered switch row input mapped into a `KeyValue` row. */
    export type Row = t.KeyValueSwitches.Row;

    /** Recursive switch item group mapped into a `KeyValue` group. */
    export type Group = t.KeyValueSwitches.Group;

    /** Convert one switch row input into a `KeyValue` row. */
    export type ToItem = t.KeyValueSwitches.ToItem;

    /** Convert switch inputs into `KeyValue` items. */
    export type ToItems = t.KeyValueSwitches.ToItems;

    /**
     * Item-local details.
     */
    export namespace Item {
      /** Appearance options forwarded to the rendered switch control. */
      export type SwitchOptions = t.KeyValueSwitches.Item.SwitchOptions;

      /** Receive the next switch value and row context. */
      export type ToggleHandler = t.KeyValueSwitches.Item.ToggleHandler;

      /** Context passed to a switch toggle handler. */
      export type ToggleArgs = t.KeyValueSwitches.Item.ToggleArgs;
    }

    /**
     * Single-item conversion details.
     */
    export namespace ToItem {
      /** Options for converting one switch item. */
      export type Options = t.KeyValueSwitches.ToItem.Options;
    }

    /**
     * Multi-item conversion details.
     */
    export namespace ToItems {
      /** Options shared while converting switch items. */
      export type Options = t.KeyValueSwitches.ToItems.Options;
    }
  }

  /** Component props for the <KeyValue> component. */
  export type Props = {
    items?: Item[];
    reorder?: Reorder;
    animation?: Animation;

    layout?: Layout;
    size?: Size;
    mono?: boolean;
    truncate?: boolean;
    selectable?: boolean;
    enabled?: boolean;
    defaults?: Defaults;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /** Component props for a single row within the <KeyValue> component. */
  export type ItemProps = {
    item: Item;
    enabled?: boolean;
    disabledOpacity?: t.Percent;
    mono?: boolean;
    truncate?: boolean;
    layout?: Layout;
    size?: Size;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /** Controlled reorder affordance. */
  export type Reorder = {
    readonly enabled?: boolean;
    readonly getItemId?: Reorder.GetItemId;
    readonly onStart?: Reorder.StartHandler;
    readonly onChange?: Reorder.ChangeHandler;
    readonly onEnd?: Reorder.EndHandler;
  };

  /**
   * Reorder callback and identity contracts.
   */
  export namespace Reorder {
    /** Resolve stable item identity for reorder mode. */
    export type GetItemId = (item: Item, index: number) => string | undefined;
    /** Reorder item reference. */
    export type ItemRef = { readonly id: string; readonly item: Item; readonly index: number };
    /** Reorder start event. */
    export type Start = { readonly active: ItemRef; readonly items: readonly Item[] };
    /** Reorder change event. */
    export type Change = { readonly next: Item[] };
    /** Reorder end event. */
    export type End = {
      readonly active: ItemRef;
      readonly items: readonly Item[];
      readonly changed: boolean;
    };
    /** Reorder start callback. */
    export type StartHandler = (e: Start) => void;
    /** Reorder change callback. */
    export type ChangeHandler = (e: Change) => void;
    /** Backwards-compatible reorder change callback alias. */
    export type Handler = ChangeHandler;
    /** Reorder end callback. */
    export type EndHandler = (e: End) => void;
  }

  /** Layout config for key/value rows. */
  export type Layout = LayoutSpaced | LayoutTable;
  export type LayoutSpaced = LayoutCommon & { kind: 'spaced' };
  export type LayoutTable = LayoutCommon & {
    kind: 'table';
    keyMax?: string | t.Pixels;
    keyAlign?: 'left' | 'right';
  };
  export type LayoutCommon = {
    columnGap?: t.Pixels;
    rowGap?: t.Pixels;
    align?: 'baseline' | 'start' | 'center' | 'end';
  };

  /** A single key/value row. */
  export type Row = {
    readonly id?: string;
    readonly kind?: 'row';
    readonly k: React.ReactNode;
    readonly v?: React.ReactNode;
    readonly mono?: boolean;
    readonly truncate?: boolean;
    readonly x?: Spacing; // spacing: [left, right]
    readonly y?: Spacing; // spacing: [top, bottom]
    /**
     * Row-level opacity overrides.
     * - Number: dims both key and value by this factor.
     * - Object: per-side overrides (k = key, v = value).
     */
    readonly opacity?: Opacity;
    /**
     * Optional link wrapper for row cells.
     * - `string`/`boolean`/props object → applies to `v` (value) side by default.
     * - `{ k, v }` → per-side configuration.
     */
    readonly href?: Href;

    /** Row-level `user-select` overrides. */
    userSelect?: t.CssProps['userSelect'];
  };

  /** A section title. */
  export type Title = {
    readonly id?: string;
    readonly kind: 'title';
    readonly v: React.ReactNode | [React.ReactNode, React.ReactNode];
    readonly x?: Spacing; // spacing: [left, right]
    readonly y?: Spacing; // spacing: [top, bottom]
  };

  /** A horizontal divider (<hr>). */
  export type Hr = {
    readonly id?: string;
    readonly kind: 'hr';
    readonly thickness?: t.Pixels;
    readonly opacity?: t.Percent;
    readonly x?: Spacing; // spacing: [left, right]
    readonly y?: Spacing; // spacing: [top, bottom]
  };

  /** A vertical spacer (extra gap between items). */
  export type Spacer = {
    readonly id?: string;
    readonly kind: 'spacer';
    readonly size?: number | string;
  };

  /** A recursive item group that moves as one direct child. */
  export type Group = {
    readonly id: string;
    readonly kind: 'group';
    readonly items: Item[];
  };

  /** Build `Item[]` rows from a plain object. */
  export type FromObject = (obj?: Record<string, unknown>, options?: FromObjectOptions) => Item[];

  /** Options for the `KeyValue.fromObject` method. */
  export type FromObjectOptions = {
    filter?: (key: string, value: unknown) => boolean;
    format?: (value: unknown) => React.ReactNode;
  };
}
