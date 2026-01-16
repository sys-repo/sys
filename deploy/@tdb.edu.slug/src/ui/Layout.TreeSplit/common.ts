import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Tree, SplitPane } from '@sys/ui-react-components';

type P = t.LayoutTreeSplitProps;

/**
 * Constants:
 */
const name = 'LayoutTreeSplit';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  split: [0.35, 0.65] satisfies P['split'],
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
