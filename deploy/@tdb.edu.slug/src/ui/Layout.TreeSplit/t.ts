import type { t } from './common.ts';

/**
 * Split layout with main tree navigation.
 */
export type LayoutTreeSplitLib = { readonly UI: t.FC<LayoutTreeSplitProps> };

/**
 * Component:
 */
export type LayoutTreeSplitProps = {
  children?: t.ReactNode;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  split?: t.Percent[];
  onSplitChange?: (args: { split: t.Percent[] }) => void;
};
