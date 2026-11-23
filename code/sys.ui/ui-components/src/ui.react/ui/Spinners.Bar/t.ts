import type { t } from './common.ts';

/**
 * Clipped bar for indeterminate activity.
 */
export declare namespace BarSpinner {
  export type Lib = { readonly UI: t.FC<Props> };

  export type Props = {
    width?: number;
    height?: number;
    transparentTrack?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
