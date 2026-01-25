import type { t } from '../common.ts';
import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Data } from '../TreeView.Index.Data/mod.ts';
export { IndexTreeViewItem } from '../TreeView.Index.Item/mod.ts';
export { Icons } from '../ui.Icons.ts';

/**
 * Constants:
 */
const name = 'TreeView.Index';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  minWidth: 280,
  slideDuration: 200,
  slideOffset: 50,
  showChevron: 'auto' satisfies t.IndexTreeViewChevronMode,
  indentSize: 20,
} as const;
export const D = DEFAULTS;
