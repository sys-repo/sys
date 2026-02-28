import type { t } from './common.ts';

/**
 * @module
 * Canonical splash screen.
 */
export declare namespace Splash {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
