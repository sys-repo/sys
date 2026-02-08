import type { t } from './common.ts';

/**
 * Index of commonly reused web-font bundles.
 */
export namespace Fonts {
  export type Lib = {
    readonly ETBook: Bundle;
  };

  /** A web-font configuration bundle. */
  export type Bundle = {
    readonly dir: t.StringDir;
    readonly config: t.WebFontConfig;
  };

  /** Hook that injects @font-face rules for the given family into <head> once. */
  export type Hook = (bundle: Bundle) => void;
}
