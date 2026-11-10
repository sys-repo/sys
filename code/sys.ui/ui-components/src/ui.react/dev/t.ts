import type { t } from './common.ts';
import type { Props as ButtonProps } from './m.Button/t.ts';
import type { Props as DividerProps } from './m.Divider/t.ts';
import type { Props as LinkProps } from './m.Link/t.ts';
import type { Item as ListItem, Props as ListProps } from './m.List/t.ts';

/**
 * Public contracts for the Dev specimen-authoring surface.
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
    export type Props<Id extends string = string> = ListProps<Id>;
    export type Item<Id extends string = string> = ListItem<Id>;
  }

  /**
   * Anchor.Link with resource='web' by default.
   * Caller props take precedence: resource={undefined} omits the globe.
   * Opening context and all other behavior remain owned by Anchor.Link.
   */
  export namespace Link {
    export type Props = LinkProps;
  }

  /**
   * ObjectView alias with no added defaults or behavior.
   */
  export namespace ObjectView {
    export type Props = t.ObjectViewProps;
  }

  /**
   * A neutral debug-row frame around the production Button.
   */
  export namespace Button {
    export type Props = ButtonProps;
  }

  /**
   * Decorative specimen break, not a semantic thematic break or interactive separator.
   */
  export namespace Divider {
    export type Props = DividerProps;
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
