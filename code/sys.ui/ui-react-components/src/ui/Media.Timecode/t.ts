import type { t } from './common.ts';

/** Type exports:  */
export type * from './t.Playback.ts';

/**
 * UI primitives for working with time-code
 */
export type MediaTimecodeLib = {
  Playback: t.FC<t.PlayerControlsProps>;
};

/**
 * Generic bundle the UI will eventually consume.
 * Note: P = beat payload (opaque to the generic UI components).
 */
export type MediaTimecodePlaybackBundle<P = unknown> = {
  readonly spec: t.Timecode.Playback.Spec<P>;
  readonly resolveMedia: t.MediaResolver;
};
