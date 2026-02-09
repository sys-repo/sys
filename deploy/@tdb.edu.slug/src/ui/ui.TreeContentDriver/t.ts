import type { t } from './common.ts';

/**
 * Composable TreeHost selection-to-content bridge adapter.
 */
export declare namespace TreeContentDriver {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
