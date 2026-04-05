import type { t } from './common.ts';

/**
 * UI helpers for loading and selecting staged data mounts.
 */
export declare namespace Mounts {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
