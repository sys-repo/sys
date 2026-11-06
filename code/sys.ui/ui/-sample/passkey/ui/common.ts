import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Passkey';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  debug: false,
  spinner: { width: 24, height: 3 },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
