import type { t } from './common.ts';

/**
 *
 */
export type LayoutTreeSplitLib = { readonly UI: t.FC<LayoutTreeSplitProps> };

/**
 * Component:
 */
export type LayoutTreeSplitProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  children?: t.ReactNode;
};
