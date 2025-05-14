import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Media.VideoStream';
const constraints: MediaStreamConstraints = { video: true, audio: true };
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  constraints,
  borderRadius: 0,
  aspectRatio: undefined,
} as const;
export const D = DEFAULTS;
