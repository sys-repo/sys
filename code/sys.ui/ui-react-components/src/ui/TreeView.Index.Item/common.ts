import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Icons } from '../ui.Icons.ts';

type P = t.IndexTreeViewItemProps;

/**
 * Constants:
 */
const name = 'TreeView.Index.Item';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  label: 'Unnamed',
  padding: [15, 8, 15, 15] satisfies P['padding'],
  chevron: true satisfies P['chevron'],
  enabled: true,
  active: true,
  selected: false,
} as const;
export const D = DEFAULTS;
