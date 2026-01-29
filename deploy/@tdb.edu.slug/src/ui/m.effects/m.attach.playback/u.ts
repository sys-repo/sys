import { type t } from '../common.ts';

/**
 * Merge helpers for nested SlugPlayback state slices.
 */
export function mergePlayback(
  state: t.SlugPlaybackState | undefined,
  patch: t.SlugPlaybackRuntime,
): t.SlugPlaybackPatch {
  return {
    playback: { ...(state?.playback ?? {}), ...patch },
  };
}
