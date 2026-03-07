import type { t } from './common.ts';

/**
 * Canonical app splash primitive.
 */
export declare namespace Splash {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    pkg?: t.Pkg;
    keyboardEnabled?: boolean;
    qs?: string;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
