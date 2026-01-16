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
  root?: t.TreeNodeList;
  split?: t.Percent[];
  path?: t.ObjectPath;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPathChange?: (args: { path: t.ObjectPath | undefined }) => void;
  onSplitChange?: (args: { split: t.Percent[] }) => void;
};
