import type { t } from './common.ts';

/**
 * InfoPanel configuration component contracts.
 */
export declare namespace InfoPanelConfig {
  /** Public runtime surface for the InfoPanelConfig component. */
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly DEFAULTS: Defaults;
  };

  /** Public default prop values for InfoPanelConfig composition. */
  export type Defaults = {
    readonly fields: readonly t.Files.InfoPanel.Field[];
    readonly reorder: boolean;
    readonly animation: t.KeyValue.Animation;
  };

  /** Props accepted by InfoPanelConfig. */
  export type Props = {
    fields?: t.Files.InfoPanel.Field[];
    items?: Item[];
    reorder?: boolean;
    animation?: t.KeyValue.Animation;
    cursor?: t.KeyValue.Cursor.Props;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
    onFieldsChange?: Fields.ChangeHandler;
    onItemsChange?: Items.ChangeHandler;
  };

  /** Ordered structural item accepted by the InfoPanel configuration designer. */
  export type Item = t.Files.InfoPanel.Field | Item.Divider;

  /** Structural item details. */
  export namespace Item {
    /** Identity-bearing horizontal divider item. */
    export type Divider = { readonly kind: 'divider'; readonly id: string };
  }

  /**
   * Field configuration details.
   */
  export namespace Fields {
    /** Receive the next visible InfoPanel field list. */
    export type ChangeHandler = (e: Change) => void;

    /** Field-change event payload. */
    export type Change = { readonly next: t.Files.InfoPanel.Field[] };
  }

  /**
   * Structural item configuration details.
   */
  export namespace Items {
    /** Receive the next visible structural InfoPanel item list. */
    export type ChangeHandler = (e: Change) => void;

    /** Structural item-change event payload. */
    export type Change = { readonly next: Item[] };
  }
}
