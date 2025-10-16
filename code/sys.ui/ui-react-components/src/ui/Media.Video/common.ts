import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { logMedia } from '../Media.Devices/u.logging.ts';
export { AspectRatio } from '../Media/m.AspectRatio.ts';
export { Is } from '../Media/m.Is.ts';
export { Log } from '../Media/m.Log.ts';
export { Slider } from '../Slider/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Video';
const constraints: MediaStreamConstraints = { video: true, audio: true };
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  constraints,
  borderRadius: 0,
  aspectRatio: undefined,
  muted: true,
} as const;
export const D = DEFAULTS;
