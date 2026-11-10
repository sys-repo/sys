import type { t } from './common.ts';

/**
 * Dev-only composition primitives built from system UI components.
 */
export declare namespace Dev {
  export type Lib = {
    readonly Help: t.DevHelp.Lib;
    readonly Button: t.FC<Button.Props>;
    readonly Divider: t.FC<Divider.Props>;
    readonly ObjectView: t.FC<ObjectView.Props>;
    readonly Link: t.FC<Link.Props>;
    readonly List: <Id extends string = string>(props: List.Props<Id>) => t.ReactNode;
  };

  /**
   * Compact row-method authoring over BulletList; state remains caller-owned.
   */
  export namespace List {
    /** Presentation is forwarded unchanged; defaults are sm and padding [0, 8, 0, 5]. */
    export type Props<Id extends string = string> =
      & Pick<t.BulletList.Props<Id>, 'theme' | 'style' | 'size' | 'itemPadding' | 'columns'>
      & {
        items: readonly Item<Id>[];
        /** Undefined: commands; defined (including []): controlled choices. Never auto-toggled. */
        selected?: t.BulletList.Selected<NoInfer<Id>>;
      };

    /** Stable unique ID and explicit non-interactive label; callers supply a non-empty name. */
    export type Item<Id extends string = string> =
      & Pick<t.BulletList.Item.Action<Id>, 'id' | 'enabled'>
      & {
        /** Strings remain literal; rich presentation uses explicit non-interactive React nodes. */
        label: t.ReactNode;
        /** One method per eligible activation, including reselection; callers own async/errors. */
        onActivate: t.BulletList.Activate.Handler<NoInfer<Id>>;
      };
  }

  /**
   * Anchor.Link with resource='web' by default.
   * Caller props take precedence: resource={undefined} omits the globe.
   * Opening context and all other behavior remain owned by Anchor.Link.
   */
  export namespace Link {
    export type Props = Omit<t.Anchor.Link.Props, 'resource'> & {
      /**
       * Resource identity, not origin, trust, or availability.
       * Omitted defaults to web; explicitly pass undefined for no resource marker.
       */
      resource?: t.Anchor.Link.Props['resource'];
    };
  }

  /**
   * The existing object inspector, without added defaults or behavior.
   */
  export namespace ObjectView {
    export type Props = t.ObjectViewProps;
  }

  /**
   * A neutral debug-row frame around the production Button.
   */
  export namespace Button {
    /**
     * Forwarded unchanged to Button, including original style input.
     * Default Button margin/padding extend its left edge 2px without moving the label;
     * supplied margin/padding replace those defaults. The frame supplies compact line-height
     * and non-clickable outline clearance. Allow 6px left and 4px right overhang inside the host
     * panel; larger custom outlines need their own clearance. Font size is inherited.
     */
    export type Props = t.Button.Props;
  }

  /**
   * Decorative specimen break, not a semantic thematic break or interactive separator.
   */
  export namespace Divider {
    /**
     * Defaults to a 5px rule at 0.1 foreground alpha, extending 25px past each horizontal edge.
     * Owns 14px top / 10px bottom spacing; the host must allow the overhang.
     * Caller style composes last using css; raw undefined declarations clear matching defaults.
     * Margin: undefined does not clear expanded margins; pre-transforming style can discard clears.
     */
    export type Props = { theme?: t.CommonTheme; style?: t.CssInput };
  }

  /**
   * Help and documentation composition helpers.
   */
  export namespace Help {
    export type Lib = t.DevHelp.Lib;

    /**
     * Markdown help rendering with dev-friendly component defaults.
     */
    export namespace Markdown {
      export type Lib = t.DevHelpMarkdown.Lib;

      /** Props accepted by the Markdown help renderer. */
      export type Props = t.DevHelpMarkdown.Props;
    }
  }
}
