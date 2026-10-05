import type { t } from './common.ts';

/**
 * Defines the reading geometry for prose, including measure, margins, and gutters.
 */
export namespace ProseMeasure {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
