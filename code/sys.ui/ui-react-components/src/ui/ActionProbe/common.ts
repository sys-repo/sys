import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Button } from '../Button/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { Spinners } from '../Spinners/mod.ts';

/**
 * Constants:
 */
const name = 'ActionProbe';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  borderRadius: 6,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
