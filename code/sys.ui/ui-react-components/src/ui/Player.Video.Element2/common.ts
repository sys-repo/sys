import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'VideoElement';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;

export const READY_STATE = {
  /** No information is available about the media resource. */
  HAVE_NOTHING: 0,
  /** Metadata is available, e.g. duration and dimensions. */
  HAVE_METADATA: 1,
  /** Data for the current playback position is available, but not enough to play next frame. */
  HAVE_CURRENT_DATA: 2,
  /** Data for the current position and at least one frame ahead is available. */
  HAVE_FUTURE_DATA: 3,
  /** Enough data is available to play through to the end without stalling. */
  HAVE_ENOUGH_DATA: 4,
} as const;
