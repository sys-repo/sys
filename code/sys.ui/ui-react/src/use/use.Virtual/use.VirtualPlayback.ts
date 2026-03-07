import React from 'react';
import { type t, Timecode } from './common.ts';
import { startRafClockLoop } from './u.raf.ts';

export const useVirtualPlayback: t.UseVirtualPlayback = (resolved, opts = {}) => {
  const {
    startAt = 0,
    autoPlay = true,
    loop = false,
    speed = 1,
    life,
    driver = 'raf',
    debug,
  } = opts;

  const clockRef = React.useRef<t.VirtualClock | null>(null);

  const [snap, setSnap] = React.useState<t.VirtualClockState>(() => ({
    vtime: Timecode.VTime.zero,
    index: -1,
    seg: undefined,
    playing: autoPlay,
  }));

  React.useEffect(() => {
    if (!resolved || resolved.total <= 0) {
      clockRef.current = null;
      setSnap({ vtime: Timecode.VTime.zero, index: -1, seg: undefined, playing: autoPlay });
      return;
    }

    const clock = Timecode.VClock.make(
      { total: resolved.total, segments: resolved.segments },
      { startAt, loop, speed },
    );
    if (!autoPlay) clock.pause();
    clockRef.current = clock;

    if (debug?.onClock) debug.onClock(clock);

    let lastSnap = clock.get();
    setSnap(lastSnap);

    if (driver === 'off') return;

    const dispose = startRafClockLoop(life, {
      getClock: () => clockRef.current,
      publish(next) {
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

    return dispose;
  }, [resolved, startAt, autoPlay, loop, speed, life, driver]);

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
};
