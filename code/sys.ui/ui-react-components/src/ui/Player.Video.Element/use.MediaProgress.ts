import { useEffect, useState } from 'react';
import { type t } from './common.ts';
import { Crop } from './u.ts';

export function useMediaProgress(
  videoRef: React.RefObject<HTMLVideoElement>,
  props: Pick<t.VideoElementProps, 'src' | 'crop' | 'onTimeUpdate' | 'onDurationChange'>,
) {
  const { src, onTimeUpdate, onDurationChange } = props;
  const crop = Crop.wrangle(props.crop);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Reset when src or crop changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    onTimeUpdate?.({ secs: 0 });
    onDurationChange?.({ secs: 0 });
  }, [src, crop]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const cbTime = () => {
      const rawDur = Number.isFinite(el.duration) ? el.duration : 0;
      const end = Crop.resolveEnd(crop?.end, rawDur);
      const start = crop?.start ?? 0;
      const max = end - start;

      // duration
      const d = Math.max(0, max);
      setDuration(d);
      onDurationChange?.({ secs: d });

      // currentTime
      let t = el.currentTime - start;
      t = Math.max(0, Math.min(t, max));
      setCurrentTime(t);
      onTimeUpdate?.({ secs: t });
    };

    // seed & listen
    cbTime();
    el.addEventListener('loadedmetadata', cbTime);
    el.addEventListener('durationchange', cbTime);
    el.addEventListener('timeupdate', cbTime);

    return () => {
      el.removeEventListener('loadedmetadata', cbTime);
      el.removeEventListener('durationchange', cbTime);
      el.removeEventListener('timeupdate', cbTime);
    };
  }, [videoRef, src, crop, onTimeUpdate, onDurationChange]);

  return { currentTime, duration };
}

// export function useMediaProgress(
//   videoRef: React.RefObject<HTMLVideoElement>,
//   props: Pick<t.VideoElementProps, 'src' | 'crop' | 'onTimeUpdate' | 'onDurationChange'>,
// ) {
//   const { src, crop: rawCrop, onTimeUpdate, onDurationChange } = props;
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//
//   // 1) reset when source or crop changes
//   useEffect(() => {
//     setCurrentTime(0);
//     setDuration(0);
//     onTimeUpdate?.({ secs: 0 });
//     onDurationChange?.({ secs: 0 });
//   }, [src, rawCrop]);
//
//   // 2) attach all the events you need, plus seed once on mount
//   useEffect(() => {
//     const el = videoRef.current;
//     if (!el) return;
//
//     const crop: t.VideoCropRange | undefined = Array.isArray(rawCrop)
//       ? { start: rawCrop[0], end: rawCrop[1] }
//       : rawCrop;
//
//     const updateAll = () => {
//       const fullDur = Number.isFinite(el.duration) ? el.duration : 0;
//       const lens = createCropLens(crop, fullDur);
//
//       // duration → cropped length
//       setDuration(lens.cropDuration);
//       onDurationChange?.({ secs: lens.cropDuration });
//
//       // currentTime → mapped
//       const ct = lens.mapFullToCropped(el.currentTime);
//       setCurrentTime(ct);
//       onTimeUpdate?.({ secs: ct });
//     };
//
//     const { dispose, signal } = rx.abortable();
//
//     // seed immediately (so your slider isn’t stuck at 0 until timeupdate)
//     updateAll();
//
//     // cover every “ready” event that might give you duration or a frame
//     el.addEventListener('loadedmetadata', updateAll, { signal });
//     el.addEventListener('loadeddata', updateAll, { signal });
//     el.addEventListener('canplay', updateAll, { signal });
//     el.addEventListener('durationchange', updateAll, { signal });
//     el.addEventListener('timeupdate', updateAll, { signal });
//
//     return dispose;
//   }, [videoRef, src, rawCrop, onTimeUpdate, onDurationChange]);
//
//   return { currentTime, duration } as const;
// }
//
// // import { useEffect, useState } from 'react';
// // import { type t, createCropLens, rx } from './common.ts';
// //
// // export function useMediaProgress(
// //   videoRef: React.RefObject<HTMLVideoElement>,
// //   props: Pick<t.VideoElementProps, 'src' | 'crop' | 'onTimeUpdate' | 'onDurationChange'>,
// // ) {
// //   const { src, crop: rawCrop, onTimeUpdate, onDurationChange } = props;
// //   const [currentTime, setCurrentTime] = useState(0);
// //   const [duration, setDuration] = useState(0);
// //
// //   // Reset when source or crop changes
// //   useEffect(() => {
// //     setCurrentTime(0);
// //     setDuration(0);
// //     onTimeUpdate?.({ secs: 0 });
// //     onDurationChange?.({ secs: 0 });
// //   }, [src, rawCrop]);
// //
// //   useEffect(() => {
// //     const el = videoRef.current;
// //     if (!el) return;
// //
// //     // we’ll re-derive these each time
// //     const crop: t.VideoCropRange | undefined = Array.isArray(rawCrop)
// //       ? { start: rawCrop[0], end: rawCrop[1] }
// //       : rawCrop;
// //
// //     const updateAll = () => {
// //       const fullDur = Number.isFinite(el.duration) ? el.duration : 0;
// //       const lens = createCropLens(crop, fullDur);
// //
// //       // 1) duration → cropped length
// //       setDuration(lens.cropDuration);
// //       onDurationChange?.({ secs: lens.cropDuration });
// //
// //       // 2) currentTime → mapped
// //       const ct = lens.mapFullToCropped(el.currentTime);
// //       setCurrentTime(ct);
// //       onTimeUpdate?.({ secs: ct });
// //     };
// //
// //     const { dispose, signal } = rx.abortable();
// //     el.addEventListener('loadedmetadata', updateAll, { signal });
// //     el.addEventListener('durationchange', updateAll, { signal });
// //     el.addEventListener('timeupdate', updateAll, { signal });
// //
// //     return dispose;
// //   }, [videoRef, src, rawCrop, onTimeUpdate, onDurationChange]);
// //
// //   return { currentTime, duration } as const;
// // }
