import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Data, Is, Yaml } from '../Tree.Index.data/mod.ts';
export { IndexTreeItem } from '../Tree.Index.Item/mod.ts';
export { Icons } from '../ui.Icons.ts';

/**
 * Constants:
 */
const name = 'Tree.Index';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  minWidth: 280,
  slideDuration: 200,
  slideOffset: 50,
} as const;
export const D = DEFAULTS;
