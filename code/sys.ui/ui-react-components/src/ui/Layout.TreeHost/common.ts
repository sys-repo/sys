import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

type P = t.TreeHostProps;

export { Spinners } from '../Spinners/mod.ts';
export { Data as TreeData } from '../TreeView.Index.Data/mod.ts';
export { TreeView } from '../TreeView/mod.ts';

/**
 * Constants:
 */
const name = 'TreeHost';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  spinner: {
    opacity: 0.2,
    backgroundBlur: 1 as t.Pixels | undefined,
    position: 'middle' as t.TreeHostSpinnerPosition,
  },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
