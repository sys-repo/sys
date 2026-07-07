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
    /** Ordered switch rows rendered through `KeyValue.UI`. */
    items?: Item[];
    /** Default switch options for every row; item options override these. */
    switch?: Item.SwitchOptions;
  };

  /** Ordered switch item input mapped into `KeyValue` items. */
  export type Item = Row | t.KeyValue.Hr | Group;

  /** Recursive switch item group mapped into a `KeyValue` group. */
  export type Group = {
    /** Stable identity for the group as an atomic direct child. */
    id: string;
    /** Recursive group marker. */
    kind: 'group';
    /** Ordered child switch items owned by this group. */
    items: Item[];
  };

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
      /** Index within the row's containing switch item list. */
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
