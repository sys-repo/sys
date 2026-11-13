import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';
export type * as t from './t.internal.ts';
export { Markdown } from '@sys/markdown';

/**
 * Constants:
 */
const name = 'TextLabel';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  overflow: 'flow' satisfies t.TextLabel.Overflow,
  debug: false,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
