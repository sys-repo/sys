import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'MediaRecorder';
const constraints: MediaStreamConstraints = { video: true, audio: true };
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  constraints,
} as const;
export const D = DEFAULTS;
