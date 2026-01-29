import { type t } from '../common.ts';

/**
 * Merge helpers for nested SlugPlayback state slices.
 */
export function mergeSlug(
  state: t.SlugPlaybackState | undefined,
  patch: t.SlugPlaybackSlugState,
): t.SlugPlaybackPatch {
  return {
    slug: { ...(state?.slug ?? {}), ...patch },
  };
}
