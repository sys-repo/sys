import type { t } from './common.ts';

/**
 * Index of commonly reused web-font bundles.
 */
export namespace WebFonts {
  export type Lib = {
    readonly ETBook: Bundle;
    readonly useFont: Hook;
  };

  /**
   * A web-font configuration bundle.
   */
  export type Bundle = {
    readonly dir: t.StringDir;
    readonly config: t.WebFontConfig;
  };

  /** Hook that injects @font-face rules for the given family into <head> once. */
  export type Hook = (bundle: Bundle) => void;
}
