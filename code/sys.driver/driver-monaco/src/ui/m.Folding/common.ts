import { pkg, Pkg } from './common.ts';
export * from '../common.ts';

/**
 * Constants
 */
export const D = {
  FOLD_MARK: Pkg.toString(pkg, 'fold', { version: false }),
};
export const DEFAULTS = D;
