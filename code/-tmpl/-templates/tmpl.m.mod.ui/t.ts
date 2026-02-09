import type { t } from './common.ts';

/**
 *
 */
export declare namespace MyComponent {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
