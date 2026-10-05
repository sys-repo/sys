import type { t } from './common.ts';

/**
 * Dev-only composition primitives built from system UI components.
 */
export declare namespace Dev {
  export type Lib = {
    readonly Help: t.DevHelp.Lib;
  };

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
