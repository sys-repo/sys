import type { t } from './common.ts';

/**
 * Dev-only composition primitives built from system UI components.
 */
export declare namespace Dev {
  export type Lib = {
    readonly Help: t.DevHelp.Lib;
    readonly Button: t.FC<Button.Props>;
  };

  /** A neutral debug-row frame around the production Button. */
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
