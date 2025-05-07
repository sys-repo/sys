import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'MediaRecorder';
const constraints: MediaStreamConstraints = { video: true, audio: true };
const fit: t.MediaRecorderProps['fit'] = 'responsive';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  constraints,
  fit,
  borderRadius: 0,
  aspectRatio: undefined,
} as const;
export const D = DEFAULTS;
