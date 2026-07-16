import type React from 'react';
import type { t } from '../common.ts';

/**
 * Types for the KeyValue primitive.
 * A minimal table for rendering key/value data with optional titles and dividers.
 */
export declare namespace KeyValue {
  /**
   * Public module surface.
   */
  export type Lib = {
    readonly UI: React.FC<Props>;
    readonly ActionButton: React.FC<ActionButton.Props>;
    readonly Cursor: Cursor.Lib;
    readonly Switches: Switches.Lib;
    fromObject: FromObject;
  };

  /** Size flags. */
  export type Size = 'xs' | 'sm' | 'md';

  /** Item kinds. */
  export type Item = Item.Row | Item.Title | Item.Hr | Item.Spacer | Item.Group;

  /** KeyValue item-shape type family. */
  export namespace Item {
    /** Spacing offset around an item. */
    export type Spacing = t.Pixels | [t.Pixels, t.Pixels] | readonly [t.Pixels, t.Pixels];

    /**
     * Optional opacity overrides for key/value pairs.
     * - Single number: applied uniformly to both key and value.
     * - Object: per-side overrides (k = key, v = value).
     */
    export type Opacity = t.Percent | { readonly k?: t.Percent; readonly v?: t.Percent };

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
      readonly href?: Link.Href;

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
      readonly items: KeyValue.Item[];
    };
  }

  /** Link type details. */
  export namespace Link {
    /** Link opening target. */
    export type Open = 'new-tab' | 'inline';

    /** Link text display mode. */
    export type Display = 'raw' | 'trim-http';

    /** Link options for one rendered row cell. */
    export type Props = {
      readonly href?: t.StringUri;
      readonly infer?: boolean;
      readonly open?: Open;
      readonly display?: Display;
      readonly rel?: string;
    };

    /** Link shorthand accepted by a rendered row cell. */
    export type Def = boolean | t.StringUri | Props;

    /** Link configuration for value or per-side key/value cells. */
    export type Href = Def | { readonly k?: Def; readonly v?: Def };
  }

  /** Component default options. */
  export type Defaults = {
    /**
     * Opacity applied to value-side cells (`v`) when `enabled` is false.
     * Key-side styling remains unchanged by default.
     */
    readonly disabledOpacity?: t.Percent;
  };

  /** Compact action button details. */
  export namespace ActionButton {
    /** Props for the compact action button in a KeyValue row value cell. */
    export type Props = {
      label: React.ReactNode;
      enabled?: boolean;
      tooltip?: string;
      onClick?: React.MouseEventHandler;
    };
  }

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

  /**
   * Cursor model for command-addressable KeyValue item projections.
   * This is controlled interaction/navigation state, intentionally separate from
   * a complete ARIA/grid accessibility contract. Consumers and future
   * accessibility adapters own semantic roles, announcements, and domain
   * workflow accessibility.
   */
  export namespace Cursor {
    /** Public runtime surface for the KeyValue cursor model. */
    export type Lib = {
      /** Host-owned keyboard entry into a rendered KeyValue cursor root. */
      useKeyboardEntry: Keyboard.UseEntry;
      target(path: t.ObjectPath, part?: Part): Target;
      eql(a?: Target, b?: Target): boolean;
      scope(items: KeyValue.Item[], path?: t.ObjectPath): Scope;
      /** Convenience helper for routing a `cursor:set` command. */
      set(model: Model, items: KeyValue.Item[], target?: Target): Model;
      /** Move to the next cursor-addressable sibling in the current scope. */
      next(model: Model, items: KeyValue.Item[]): Model;
      /** Move to the previous cursor-addressable sibling in the current scope. */
      previous(model: Model, items: KeyValue.Item[]): Model;
      /** Move to the next cursor target at `hr`-delimited block granularity. */
      nextBlock(model: Model, items: KeyValue.Item[]): Model;
      /** Move to the previous cursor target at `hr`-delimited block granularity. */
      previousBlock(model: Model, items: KeyValue.Item[]): Model;
      left(model: Model, items: KeyValue.Item[]): Model;
      right(model: Model, items: KeyValue.Item[]): Model;
      enter(model: Model, items: KeyValue.Item[]): Model;
      exit(model: Model): Model;
      /** Route a data-only cursor command through the cursor reducer. */
      cmd(model: Model, items: KeyValue.Item[], command: Command): Model;
    };

    /** Host-owned keyboard cursor adapters. */
    export namespace Keyboard {
      /**
       * Hook factory for host-owned keyboard entry into a rendered KeyValue cursor root.
       *
       * Handles host/global `Option+Enter` only. Focused-root keyboard cursor grammar remains owned
       * by `KeyValue.UI`.
       *
       * ```tsx
       * const keyboardEntry = KeyValue.Cursor.useKeyboardEntry({ enabled: hostOwnsEntry, items, cursor });
       * return <div ref={keyboardEntry.ref}><KeyValue.UI items={items} cursor={cursor} /></div>;
       * ```
       */
      export type UseEntry = <T extends HTMLElement = HTMLDivElement>(
        args?: EntryArgs<T>,
      ) => EntryHook<T>;

      /** Input for host-owned KeyValue cursor keyboard entry. */
      export type EntryArgs<T extends HTMLElement = HTMLDivElement> = {
        /** Host element containing the rendered KeyValue cursor root. Generated when omitted. */
        ref?: React.RefObject<T | null>;
        /**
         * Whether this host currently owns the global `Option+Enter` entry shortcut.
         *
         * Defaults to true. In multi-host compositions, gate this so only one command-scope owner is
         * enabled at a time.
         */
        enabled?: boolean;
        /** KeyValue item projection used to resolve the first cursor-addressable target. */
        items?: KeyValue.Item[];
        /** Controlled cursor props for emitting entry changes; keep coherent with `KeyValue.UI`. */
        cursor?: Pick<Props, 'enabled' | 'entry' | 'model' | 'onChange'>;
      };

      /** Result of host-owned KeyValue cursor keyboard entry wiring. */
      export type EntryHook<T extends HTMLElement = HTMLDivElement> = {
        /** Ref to place on the host element containing the rendered KeyValue cursor root. */
        readonly ref: React.RefObject<T | null>;
      };
    }

    /** Opt-in cursor props for the rendered KeyValue projection. */
    export type Props = {
      readonly enabled?: boolean;
      readonly model?: Model;
      readonly entry?: Entry;
      readonly navigation?: Navigation;
      /** Visual arrival cue mode. Defaults to `flash`. */
      readonly arrival?: Arrival;
      readonly onChange?: ChangeHandler;
    };

    /**
     * Configured cursor-entry behavior.
     * Default entry is Option-click, with keyboard entry available from the
     * focused cursor root while keyboard navigation is enabled.
     */
    export type Entry = false | EntryMode;

    /** Enabled pointer cursor-entry mode. */
    export type EntryMode = 'option-click' | 'click';

    /**
     * Cursor-entry input that emitted a controlled entry change.
     * - `option-enter` enters the first cursor-addressable item.
     * - `option-arrow-left` enters the first key lane.
     * - `option-arrow-right` enters the first value lane.
     */
    export type EntryInput =
      | EntryMode
      | 'option-enter'
      | 'option-arrow-left'
      | 'option-arrow-right';

    /** Configured cursor-navigation behavior. */
    export type Navigation = false | NavigationMode;

    /** Enabled cursor-navigation input mode. */
    export type NavigationMode = 'keyboard';

    /** Configured visual cue behavior when a cursor target receives focus. */
    export type Arrival = false | ArrivalMode;

    /** Enabled cursor-arrival visual cue mode. */
    export type ArrivalMode = 'flash';

    /** Keyboard input that maps to a cursor-navigation command. */
    export type NavigationKey =
      | 'ArrowUp'
      | 'ArrowDown'
      | 'ArrowLeft'
      | 'ArrowRight'
      | 'Enter'
      | 'Escape';

    /** Cursor change emitted by rendered KeyValue cursor inputs. */
    export type Change = EntryChange | NavigationChange;

    /** Cursor change emitted by a cursor-entry input. */
    export type EntryChange = {
      readonly reason: 'cursor:entry';
      readonly entry: EntryInput;
      readonly previous: Model;
      readonly next: Model;
      readonly target: Target;
      readonly command: Command<'cursor:set'>;
    };

    /** Cursor change emitted by a cursor-navigation input. */
    export type NavigationChange = {
      readonly reason: 'cursor:navigation';
      readonly navigation: NavigationMode;
      readonly key: NavigationKey;
      readonly previous: Model;
      readonly next: Model;
      readonly command: Command<NavigationCommandName>;
    };

    /** Receives controlled KeyValue cursor changes. */
    export type ChangeHandler = (e: Change) => void;

    /** Supported row projection lanes for a cursor target. */
    export type Part = 'key' | 'value';

    /** Stable cursor target for one projected item or item lane in a KeyValue item tree. */
    export type Target = {
      readonly path: t.ObjectPath;
      readonly part?: Part;
    };

    /** Single-cursor model; future multi-target semantics are intentionally outside this model. */
    export type Model = { readonly current?: Target };

    /** One cursor-addressable item in a resolved cursor scope. */
    export type Item = {
      readonly target: Target;
      readonly id: string;
      readonly item: KeyValue.Item;
      readonly parts: readonly Part[];
      readonly enterable: boolean;
    };

    /** Peer cursor-addressable items at one scope path. */
    export type Scope = {
      readonly path: t.ObjectPath;
      readonly items: readonly Item[];
    };

    /** Data-only cursor command names. */
    export type CommandName = 'cursor:set' | NavigationCommandName;

    /** Data-only cursor-navigation command names. */
    export type NavigationCommandName =
      | 'cursor:next'
      | 'cursor:previous'
      | 'cursor:next-block'
      | 'cursor:previous-block'
      | 'cursor:left'
      | 'cursor:right'
      | 'cursor:enter'
      | 'cursor:exit';

    /** Data-only cursor command payloads. */
    export type CommandPayload = {
      readonly 'cursor:set': { readonly target?: Target };
      readonly 'cursor:next': Record<string, never>;
      readonly 'cursor:previous': Record<string, never>;
      readonly 'cursor:next-block': Record<string, never>;
      readonly 'cursor:previous-block': Record<string, never>;
      readonly 'cursor:left': Record<string, never>;
      readonly 'cursor:right': Record<string, never>;
      readonly 'cursor:enter': Record<string, never>;
      readonly 'cursor:exit': Record<string, never>;
    };

    /** Data-only cursor command. */
    export type Command<K extends CommandName = CommandName> = {
      readonly [P in K]: {
        readonly name: P;
        readonly payload: CommandPayload[P];
      };
    }[K];
  }

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

    /** Switch item type guards. */
    export namespace Is {
      /** Public runtime surface for switch item guards. */
      export type Lib = t.KeyValueSwitches.Is.Lib;
    }

    /**
     * Item-local details.
     */
    export namespace Item {
      /** Appearance options forwarded to the rendered switch control. */
      export type SwitchOptions = t.KeyValueSwitches.Item.SwitchOptions;

      /** Switch row toggle intent. */
      export namespace Toggle {
        /** Receive the next switch value and row context. */
        export type Handler = t.KeyValueSwitches.Item.Toggle.Handler;

        /** Context passed to a switch toggle handler. */
        export type Args = t.KeyValueSwitches.Item.Toggle.Args;
      }
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
    cursor?: Cursor.Props;

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
    /** Reorder end callback. */
    export type EndHandler = (e: End) => void;
  }

  /** Layout config for key/value rows. */
  export type Layout = Layout.Spaced | Layout.Table;

  /** KeyValue row layout type family. */
  export namespace Layout {
    /** Spaced layout config for stacked key/value rows. */
    export type Spaced = Common & { kind: 'spaced' };

    /** Table layout config for aligned key/value rows. */
    export type Table = Common & {
      kind: 'table';
      keyMax?: string | t.Pixels;
      keyAlign?: 'left' | 'right';
    };

    /** Common layout options shared by KeyValue row layouts. */
    export type Common = {
      columnGap?: t.Pixels;
      rowGap?: t.Pixels;
      align?: 'baseline' | 'start' | 'center' | 'end';
    };
  }

  /** Build `Item[]` rows from a plain object. */
  export type FromObject = (obj?: Record<string, unknown>, options?: FromObject.Options) => Item[];

  /** Plain-object conversion type family. */
  export namespace FromObject {
    /** Options for the `KeyValue.fromObject` method. */
    export type Options = {
      filter?: (key: string, value: unknown) => boolean;
      format?: (value: unknown) => React.ReactNode;
    };
  }
}
