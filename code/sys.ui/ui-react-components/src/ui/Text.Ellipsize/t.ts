import type { t } from './common.ts';

/**
 * Text ellipsis UI primitive.
 */
export declare namespace TextEllipsize {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    text: string;
    tail?: number;
    ellipsis?: string;
    debug?: boolean;
    style?: t.CssInput;
  };
}
