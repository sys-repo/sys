import { useEffect, useRef } from 'react';
import { type t, Schedule, Timecode } from './common.ts';

/**
 * Drive virtual-time progression for playback using a VirtualClock.
 *
 * - Advances virtual time via RAF while intent === 'play'.
 * - Seeds the clock on beat changes.
 * - Emits 'video:time' inputs to the runner.
 * - Materializes beat.pause windows by issuing deck pause/play commands.
 *
 * Responsibility boundary:
 * - This hook owns virtual-time progression and scheduling only.
 * - Timeline resolution, state transitions, and media-time mapping remain in the runner.
 */
export function usePlaybackClock(args: {
  runtime: t.PlaybackRuntime;
  getRunner: () => t.PlaybackRunner | undefined;
}): void {
  /**
   * VirtualClock integration.
   *
   * This hook operates purely in virtual-time space.
   * It requires:
   *   - clamped, monotonic vTime advancement
   *   - pause / play control
   *
   * It does NOT require segment-level source mapping.
   * A total-duration clock is therefore sufficient and intentional.
   */
  const clockRef = useRef<ReturnType<typeof Timecode.VClock.makeForTotal> | undefined>(undefined);
  const lastClockKeyRef = useRef<{ total?: t.Msecs } | undefined>(undefined);
  const clockIsPlayingRef = useRef(false);
  const lastNowRef = useRef<number | undefined>(undefined);
  const modeRef = useRef<'media' | 'pause'>('media');
  const lastSeedRef = useRef<{ timeline?: unknown; beat?: number } | undefined>(undefined);

  function ensureClock(total: t.Msecs): t.Timecode.VirtualClock.Instance {
    const key = { total };
    const prev = lastClockKeyRef.current;
    if (clockRef.current && prev?.total === key.total) return clockRef.current;

    lastClockKeyRef.current = key;
    const clock = Timecode.VClock.makeForTotal(total);

    // New clock instance → re-gate play transitions.
    clockIsPlayingRef.current = false;
    clockRef.current = clock;
    return clock;
  }

  function seedFromRunnerState(runner: t.PlaybackRunner): boolean {
    const s = runner.get().state;
    const timeline = s.timeline;
    const beatIndex = s.currentBeat;
    if (!timeline || beatIndex === undefined) return false;

    const seedKey = { timeline, beat: beatIndex };
    const prev = lastSeedRef.current;

    if (prev?.timeline === seedKey.timeline && prev?.beat === seedKey.beat) return false;
    lastSeedRef.current = seedKey;

    const beat = timeline.beats[beatIndex];
    if (!beat) return false;

    const clock = ensureClock(timeline.virtualDuration);
    clock.seek(Timecode.VTime.fromMsecs(beat.vTime));
    lastNowRef.current = undefined;

    /**
     * Important:
     * We may be coming out of a materialized pause that paused the media element.
     * Ensure we re-enter "media" mode on beat change; the caller will decide
     * whether to issue an actual deck.play().
     */
    modeRef.current = 'media';

    return true;
  }

  useEffect(() => {
    let disposed = false;

    const step = () => {
      if (disposed) return;

      const runner = args.getRunner();
      if (!runner) return void Schedule.raf(step);

      const seeded = seedFromRunnerState(runner);
      const snap = runner.get();
      const s = snap.state;
      const timeline = s.timeline;

      // Only advance time while playing (intent-level).
      if (s.phase !== 'active' || s.intent !== 'play' || !timeline || s.currentBeat === undefined) {
        lastNowRef.current = undefined;
        modeRef.current = 'media';

        const clock = clockRef.current;
        if (clock) clock.pause();
        clockIsPlayingRef.current = false;

        Schedule.raf(step);
        return;
      }

      const clock = ensureClock(timeline.virtualDuration);

      /**
       * If we just seeded (beat changed), we may have left the media element paused.
       * Force the active deck into play, once, on the transition.
       */
      if (seeded) {
        args.runtime.deck.play(s.decks.active);
      }

      /**
       * Gate clock.play() to the transition into playable state (avoid per-frame mutation).
       */
      if (!clockIsPlayingRef.current) {
        clock.play();
        clockIsPlayingRef.current = true;
      }

      const now = performance.now();
      const prevNow = lastNowRef.current;
      lastNowRef.current = now;

      const dtMsNum = prevNow === undefined ? 0 : Math.max(0, now - prevNow);
      const dtMs = dtMsNum as t.Msecs;
      const state = clock.advance(dtMs);
      const nextVTime = Timecode.VTime.toMsecs(state.vtime);

      runner.send({
        kind: 'video:time',
        deck: s.decks.active,
        vTime: nextVTime,
      });

      // Materialize pause windows (pause after beat.duration for beat.pause).
      const beat = timeline.beats[s.currentBeat];
      if (beat) {
        const pause = beat.pause ?? 0;

        /**
         * Semantics:
         * - beat.duration is the total virtual span until the next beat starts.
         * - beat.pause is the tail of that span that should be "pause time".
         */
        const totalSpan = beat.duration;
        const mediaSpan = Math.max(0, totalSpan - pause);

        const pauseFrom = (beat.vTime + mediaSpan) as t.Msecs;
        const pauseTo = (pauseFrom + pause) as t.Msecs;

        const isInPause = pause > 0 && nextVTime >= pauseFrom && nextVTime < pauseTo;
        const active = s.decks.active;

        if (isInPause && modeRef.current !== 'pause') {
          modeRef.current = 'pause';
          args.runtime.deck.pause(active);
        } else if (!isInPause && modeRef.current !== 'media') {
          modeRef.current = 'media';
          args.runtime.deck.play(active);
        }
      }

      Schedule.raf(step);
    };

    Schedule.raf(step);
    return () => void (disposed = true);
  }, [args.runtime, args.getRunner]);
}
