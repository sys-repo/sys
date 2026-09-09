import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Layout.CenterColumn';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  center: { align: 'Center', width: 390 },
  gap: 0,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
