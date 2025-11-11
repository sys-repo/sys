import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { VideoElement } from '../Player.Video.Element/mod.ts';

/**
 * Constants:
 */
const name = 'CompositeVideo';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
