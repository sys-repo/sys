import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Spinner.Bar';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  width: 80,
  height: 4,
} as const;
export const DEFAULTS = D;
