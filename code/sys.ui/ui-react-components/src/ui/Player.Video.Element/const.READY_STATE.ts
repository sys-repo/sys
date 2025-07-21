import type { t } from './common.ts';

/**
 * Const: ReadyState
 */
type R = t.NumberMediaReadyState;
const HAVE_NOTHING: R = 0;
const HAVE_METADATA: R = 1;
const HAVE_CURRENT_DATA: R = 2;
const HAVE_FUTURE_DATA: R = 3;
const HAVE_ENOUGH_DATA: R = 4;

export const READY_STATE = {
  /** No information is available about the media resource. */
  HAVE_NOTHING,
  /** Metadata is available, e.g. duration and dimensions. */
  HAVE_METADATA,
  /** Data for the current playback position is available, but not enough to play next frame. */
  HAVE_CURRENT_DATA,
  /** Data for the current position and at least one frame ahead is available. */
  HAVE_FUTURE_DATA,
  /** Enough data is available to play through to the end without stalling. */
  HAVE_ENOUGH_DATA,
} as const;
