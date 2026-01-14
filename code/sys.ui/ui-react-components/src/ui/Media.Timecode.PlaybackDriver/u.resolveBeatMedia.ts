import { type t } from './common.ts';

/**
 * Resolve runtime media identity for a playback beat.
 *
 * Given a bundled playback spec and resolver, returns a function that maps
 * a beat index → concrete media URL (+ optional slice), or <undefined> when
 * the media is unavailable.
 *
 * This is the sole boundary where authoring-time media refs are translated
 * into runtime playback media.
 */
export function resolveBeatMedia(
  bundle: t.TimecodePlaybackDriver.Wire.Bundle,
): t.TimecodePlaybackDriver.ResolveBeatMedia {
  /**
   * Resolve the media identity for a beat.
   * Returns <undefined> when the authoring context is missing required media.
   */
  return (beatIndex) => {
    const { spec } = bundle;
    const beat = spec.beats[beatIndex];
    if (!beat) return undefined;

    const src = beat.src;
    if (!src) return undefined;

    // NOTE: this is now the *only* place that knows how
    // authoring-time src maps to runtime media identity
    const kind = src.kind;
    const logicalPath = src.logicalPath;
    if (!kind || !logicalPath) return undefined;

    const asset = bundle.resolveAsset({ kind, logicalPath });
    if (!asset) return undefined;
    const url = asset.href;

    return {
      src: url,
      slice: src.slice,
    };
  };
}
