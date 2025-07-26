import { useEffect, useRef } from 'react';
import { type t } from './common.ts';

export function useJumpTo(
  videoRef: React.RefObject<HTMLVideoElement>,
  lens: t.VideoCropLens,
  jumpTo?: t.VideoPlayerSeek,
) {
  const lastRef = useRef<t.VideoPlayerSeek>();
  const lensKeyRef = useRef<string>();

  useEffect(() => {
    if (!jumpTo) return;

    const lensKey = `${lens.duration.full}:${lens.range.start}:${lens.range.end}`;
    if (lensKeyRef.current !== lensKey) {
      lensKeyRef.current = lensKey;
      lastRef.current = undefined; // crop changed → allow remap
    }

    // Debounce identical commands:
    if (lastRef.current?.second === jumpTo.second && lastRef.current?.play === jumpTo.play) return;
    lastRef.current = { second: jumpTo.second, play: jumpTo.play };

    const el = videoRef.current;
    if (!el) return;

    const croppedDur = lens.duration.cropped;
    let croppedSec = jumpTo.second;
    if (croppedSec < 0) croppedSec = Math.max(0, croppedDur + croppedSec); // NB: negative = from cropped end.
    croppedSec = Math.min(Math.max(0, croppedSec), croppedDur);
    const fullSec = lens.toFull(croppedSec);

    el.currentTime = fullSec;

    if (jumpTo.play === true) void el.play().catch(() => {});
    if (jumpTo.play === false) el.pause();
  }, [videoRef.current, lens, jumpTo]);
}
