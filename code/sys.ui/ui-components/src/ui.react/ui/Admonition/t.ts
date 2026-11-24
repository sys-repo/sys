import type { t } from './common.ts';

/**
 * A compact editorial aside.
 */
export declare namespace Admonition {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };
}
