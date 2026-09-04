import type { t } from './common.ts';

/**
 * Compact inline visual token.
 */
export declare namespace Chip {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Size = 'xs' | 'sm' | 'md';
  export type Props = {
    children?: t.ReactNode;
    size?: Size;
    mono?: boolean;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
