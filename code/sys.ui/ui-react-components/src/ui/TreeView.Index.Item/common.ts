import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Icons } from '../common/u.icons.ts';

type P = t.IndexTreeViewItemProps;

/**
 * Constants:
 */
const name = 'TreeView.Index.Item';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  label: 'Unnamed',
  padding: [15, 8, 15, 15] satisfies P['padding'],
  chevron: true satisfies P['chevron'],
  enabled: true,
  active: true,
  selected: false,
  indentSize: 20,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
