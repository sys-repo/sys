import type { t } from './common.ts';

/** SlugSheetStack runtime library surface. */
export type SlugSheetStackLib = { readonly UI: t.FC<SlugSheetStackProps> };

/**
 * Component:
 */
/** Props for the SlugSheetStack component. */
export type SlugSheetStackProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
