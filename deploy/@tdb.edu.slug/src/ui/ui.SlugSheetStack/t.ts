import type { t } from './common.ts';

/**
 *
 */
export type SlugSheetStackLib = { readonly UI: t.FC<SlugSheetStackProps> };

/**
 * Component:
 */
export type SlugSheetStackProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
