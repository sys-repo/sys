import { pkg, Pkg } from '../common.ts';

/**
 * Libs:
 */
export { Monaco } from '@sys/driver-monaco';

export * from '../common.ts';
export { Icons } from '../ui.Icons.ts';

/**
 * Constants:
 */
const name = 'catalog.edu.sample:editor-2';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
