import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { MediaVideo } from '../Media.Video/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Recorder';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
} as const;
export const D = DEFAULTS;
