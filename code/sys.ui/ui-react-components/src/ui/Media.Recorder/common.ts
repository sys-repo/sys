import { type t, pkg, Pkg } from '../common.ts';
import { Icons } from '../Icons.ts';

export * from '../common.ts';
export { Video } from '../Media.Video/mod.ts';
export { Icons };

/**
 * Constants:
 */
const name = 'Media.Recorder';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
} as const;
export const D = DEFAULTS;
