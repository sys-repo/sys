import { useEffect, useRef } from 'react';
import { type t } from './common.ts';

export function useJumpTo(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  lens: t.VideoCropLens,
  jumpTo?: t.VideoPlayerSeek,
) {
  const lastRef = useRef<t.VideoPlayerSeek>(undefined);
  const lensKeyRef = useRef<string>(undefined);

  useEffect(() => {
    if (!jumpTo) return;

    // Normalize lens + reset debounce on crop changes.
    const lensKey = `${lens.duration.full}:${lens.range.start}:${lens.range.end}`;
    if (lensKeyRef.current !== lensKey) {
      lensKeyRef.current = lensKey;
      lastRef.current = undefined; // crop changed → allow remap
    }

    const el = videoRef.current;
    if (!el) return;

    // Map requested time to full timeline, clamped to cropped range.
    const croppedDur = lens.duration.cropped;
    let croppedSec = jumpTo.second;
    if (croppedSec < 0) croppedSec = Math.max(0, croppedDur + croppedSec); // NB: negative = from cropped end.
    croppedSec = Math.min(Math.max(0, croppedSec), croppedDur);
    const fullSec = lens.toFull(croppedSec);

    // Skip identical seeks only if the element already landed.
    // Debounce identical commands only if we're already at the target.
    const last = lastRef.current;
    const isSame = last?.second === jumpTo.second && last?.play === jumpTo.play;
    if (isSame) {
      const delta = Math.abs(el.currentTime - fullSec);
      if (delta < 0.05) return;
    }
    lastRef.current = {
      second: jumpTo.second,
      play: jumpTo.play,
    };

    // Apply seek, then optionally enforce play/pause.
    el.currentTime = fullSec;

    if (jumpTo.play === true) void el.play().catch(() => {});
    if (jumpTo.play === false) el.pause();
  }, [videoRef.current, lens, jumpTo]);
}
