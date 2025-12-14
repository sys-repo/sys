import type { t } from './common.ts';

/** Type exports: */
export type * from './m.playback/t.ts';

/**
 * UI state library for timecode orchestration.
 *
 * Defines the public surface for timecode-related
 * state machines and command algebras.
 */
export type TimecodeStateLib = {
  readonly Playback: t.PlaybackStateLib;
};
