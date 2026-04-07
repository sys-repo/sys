import type { t } from './common.ts';

/**
 * Text ellipsis UI primitive.
 */
export declare namespace TextEllipsize {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
