import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

type P = t.VideoProps;

/**
 * Constants:
 */
const name = 'Media.Video';
const constraints: MediaStreamConstraints = { video: true, audio: true };
const fit: P['fit'] = 'responsive';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  constraints,
  fit,
  borderRadius: 0,
  aspectRatio: undefined,
} as const;
export const D = DEFAULTS;
