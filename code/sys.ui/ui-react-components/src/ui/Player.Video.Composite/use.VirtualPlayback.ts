import React from 'react';
import { Schedule, Timecode, type t } from './common.ts';
import { startRafClockLoop } from './use.VirtualPlayback.u.raf.ts';

export type UseVirtualPlaybackOptions = {
  readonly startAt?: t.Msecs;
  readonly autoPlay?: boolean; // default true
  readonly loop?: boolean; //     default false
  readonly speed?: number; //     default 1
  readonly life?: t.LifeLike; //  optional lifecycle for scheduling/cleanup
};

export function useVirtualPlayback(
  resolved?: t.TimecodeCompositionResolved,
  opts?: UseVirtualPlaybackOptions,
) {
  const { startAt = 0, autoPlay = true, loop = false, speed = 1, life } = opts ?? {};

  const clockRef = React.useRef<t.VirtualClock | null>(null);

  // Single source of truth (clock snapshot).
  const [snap, setSnap] = React.useState<t.VirtualClockState>(() => ({
    vtime: Timecode.VTime.zero,
    index: -1,
    seg: undefined,
    playing: autoPlay,
  }));

  /**
   * Build/replace clock and start a lifecycle-aware frame driver.
   */
  React.useEffect(() => {
    // No timeline → reset state, no clock.
    if (!resolved || resolved.total <= 0) {
      clockRef.current = null;
      setSnap({ vtime: Timecode.VTime.zero, index: -1, seg: undefined, playing: autoPlay });
      return;
    }

    // Create clock bound to current resolved timeline.
    const clock = Timecode.VClock.make(
      { total: resolved.total, segments: resolved.segments } as t.TimecodeResolved,
      { startAt, loop, speed },
    );
    if (!autoPlay) clock.pause();
    clockRef.current = clock;

    // Initial publish (sync).
    let lastSnap = clock.get();
    setSnap(lastSnap);

    // Start frame driver (lifecycle-aware if life is provided).
    const dispose = startRafClockLoop(life, {
      getClock: () => clockRef.current,
      publish(next) {
        // Cheap dedupe to avoid redundant renders.
        if (
          next.playing !== lastSnap.playing ||
          next.index !== lastSnap.index ||
          next.seg !== lastSnap.seg ||
          Timecode.VTime.toMsecs(next.vtime) !== Timecode.VTime.toMsecs(lastSnap.vtime)
        ) {
          lastSnap = next;
          setSnap(next);
        }
      },
    });

    return () => dispose();
  }, [resolved, startAt, autoPlay, loop, speed, life]);

  /**
   * Controls: delegate to the clock and publish returned snapshots.
   */
  const apply = React.useCallback((s: t.VirtualClockState) => setSnap(s), []);

  const play = React.useCallback(() => {
    const c = clockRef.current;
    if (c) apply(c.play());
  }, [apply]);

  const pause = React.useCallback(() => {
    const c = clockRef.current;
    if (c) apply(c.pause());
  }, [apply]);

  const seek = React.useCallback(
    (v: t.TimecodeVTime) => {
      const c = clockRef.current;
      if (!c) return;
      apply(c.seek(Timecode.VTime.fromMsecs(v)));
    },
    [apply],
  );

  const setSpeed = React.useCallback(
    (n: number) => {
      const c = clockRef.current;
      if (!c) return;
      apply(c.setSpeed(n));
    },
    [apply],
  );

  const mapToSource = React.useCallback((v: t.TimecodeVTime) => {
    const c = clockRef.current;
    if (!c) return null;
    return c.mapToSource(Timecode.VTime.fromMsecs(v));
  }, []);

  const vtime: t.TimecodeVTime = Timecode.VTime.toMsecs(snap.vtime);
  return {
    vtime,
    index: snap.index,
    seg: snap.seg,
    playing: snap.playing,
    play,
    pause,
    seek,
    setSpeed,
    mapToSource,
  };
}
