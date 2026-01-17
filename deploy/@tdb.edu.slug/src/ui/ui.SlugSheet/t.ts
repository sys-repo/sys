import type { t } from './common.ts';

/**
 * SlugSheet
 * Atomic sheet render primitive.
 */
export type SlugSheetLib = { readonly UI: t.FC<SlugSheetProps> };

/**
 * Component:
 */
export type SlugSheetProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
