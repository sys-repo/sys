import { useEffect } from 'react';

import { type t, rx } from './common.ts';
import { resolveCropEnd, Wrangle } from './u.ts';

type P = Pick<t.VideoElementProps, 'crop' | 'onEnded'>;

/**
 * Enforce [start..end] playback bounds on the <video>.
 */
export function useCropBounds(videoRef: React.RefObject<HTMLVideoElement>, props: P) {
  const { onEnded } = props;
  const crop = Wrangle.crop(props.crop);

  /**
   * Effect:
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // If cropping disabled, jump back to 0:
    if (!crop) {
      el.currentTime = 0;
      return;
    }

    const { start = 0 } = crop;
    const end = resolveCropEnd(crop.end, el.duration);

    // Immediately seek to start:
    el.currentTime = start;

    // When metadata loads, ensure we're at or after start:
    const onLoaded = () => {
      if (el.currentTime < start) el.currentTime = start;
    };

    // If play begins early, rewind to start:
    const onPlay = () => {
      if (el.currentTime < start) el.currentTime = start;
    };

    // During playback clamp and fire ended:
    const onTimeUpdate = () => {
      if (el.currentTime < start) el.currentTime = start;
      if (end !== undefined && el.currentTime > end) {
        el.currentTime = end;
        el.pause(); // NB: treat as ended.
        onEnded?.({ reason: 'ended' });
      }
    };

    const { dispose, signal } = rx.abortable();
    el.addEventListener('loadedmetadata', onLoaded, { signal });
    el.addEventListener('play', onPlay, { signal });
    el.addEventListener('timeupdate', onTimeUpdate, { signal });

    return dispose;
  }, [videoRef, crop?.start, crop?.end, onEnded]);
}
