import type { t } from './common.ts';

/**
 * Tabs primitive for composing discrete panel views.
 */
export declare namespace Tabs {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
