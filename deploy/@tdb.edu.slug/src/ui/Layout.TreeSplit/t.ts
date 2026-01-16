import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.data.ts';

/**
 * Split layout with main tree navigation.
 */
export type LayoutTreeSplitLib = {
  readonly UI: t.FC<LayoutTreeSplitProps>;
  readonly Data: t.LayoutTreeSplitDataLib;
};

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
