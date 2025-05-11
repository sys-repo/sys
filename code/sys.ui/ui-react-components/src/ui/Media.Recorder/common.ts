import { type t, pkg, Pkg } from '../common.ts';
import { Icons } from '../Icons.ts';

export * from '../common.ts';
export { MediaVideo } from '../Media.Video/mod.ts';
export { Icons };

/**
 * Constants:
 */
const name = 'Media.Recorder';
const fit: t.MediaVideoFit = 'AspectRatio';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  fit,
} as const;
export const D = DEFAULTS;
