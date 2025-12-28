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
export const useClock: t.TimecodePlaybackLib['useClock'] = (args): void => {
  /**
   * VirtualClock integration.
   *
   * This hook requires monotonic/clamped virtual-time progression plus play/pause control.
   * Segment-level source mapping is not required; a total-duration clock is sufficient.
   */
  const clockRef = useRef<t.Timecode.VirtualClock.Instance | undefined>(undefined);
  const lastTotalRef = useRef<t.Msecs | undefined>(undefined);
  const clockIsPlayingRef = useRef(false);
  const lastNowRef = useRef<number | undefined>(undefined);
  const modeRef = useRef<'media' | 'pause'>('media');
  const lastSeedRef = useRef<{ timeline?: unknown; beat?: number } | undefined>(undefined);

  const lastEmittedVTimeRef = useRef<t.Msecs | undefined>(undefined);
  const endedSentRef = useRef(false);

  /**
   * End-detect arming guard.
   * We only allow end-detect once we have observed forward progress past the seeded vTime.
   * This prevents "seek-to-end" from immediately being interpreted as ended due to clamp/rounding.
   */
  const endDetectArmedRef = useRef(false);
  const seedVTimeRef = useRef<t.Msecs | undefined>(undefined);

  function ensureClock(total: t.Msecs): t.Timecode.VirtualClock.Instance {
    const prevTotal = lastTotalRef.current;
    if (clockRef.current && prevTotal === total) return clockRef.current;

    lastTotalRef.current = total;
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
     * We may be coming out of a materialized pause that paused the media element.
     * Re-enter "media" mode on beat change; runner decides whether to play.
     */
    modeRef.current = 'media';

    /**
     * Treat explicit beat changes as a discontinuity boundary.
     * Reset clock play-gate + terminal guards so "seek back from end" cannot inherit
     * an old terminal clamp state.
     */
    clock.pause();
    clockIsPlayingRef.current = false;
    lastEmittedVTimeRef.current = undefined;
    endedSentRef.current = false;

    // End detect must be re-armed by observed forward progress after the seed.
    endDetectArmedRef.current = false;
    seedVTimeRef.current = beat.vTime;

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

        lastEmittedVTimeRef.current = undefined;
        endedSentRef.current = false;
        endDetectArmedRef.current = false;
        seedVTimeRef.current = undefined;

        const clock = clockRef.current;
        if (clock) clock.pause();
        clockIsPlayingRef.current = false;

        Schedule.raf(step);
        return;
      }

      ensureClock(timeline.virtualDuration);

      /**
       * On a seed frame:
       * - do NOT mutate runtime play state (runner owns cmd ordering)
       * - do NOT advance virtual time
       * - do NOT emit video:time
       *
       * We simply schedule the next RAF to let runtime land load/seek.
       */
      if (seeded) {
        Schedule.raf(step);
        return;
      }

      /**
       * Gate clock.play() to the transition into playable state (avoid per-frame mutation).
       */
      const clock = clockRef.current;
      if (!clock) {
        Schedule.raf(step);
        return;
      }

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

      /**
       * Only arm end-detect once we see forward progress beyond the seeded vTime.
       * This prevents a seek near end from immediately tripping end-detect due to
       * clamp/rounding and repeated vTime.
       */
      const seedVTime = seedVTimeRef.current;
      if (!endDetectArmedRef.current) {
        if (seedVTime === undefined || nextVTime > seedVTime) {
          endDetectArmedRef.current = true;
        }
      }

      /**
       * VirtualClock may clamp at the end of the timeline, causing vTime to flatline.
       *
       * Invariant:
       * - If vTime is terminal AND repeating, stop driving immediately (no spam),
       *   regardless of how quickly the runner flips intent/phase.
       * - Emit one terminal signal (video:ended) at most once per play-run.
       *
       * Guard:
       * - Never end-detect until we've observed forward progress after a seed.
       */
      if (endDetectArmedRef.current) {
        const prevEmit = lastEmittedVTimeRef.current;
        const isRepeat = prevEmit !== undefined && nextVTime === prevEmit;

        // Timelines are discrete msecs and VirtualClock may never equal virtualDuration exactly.
        const END_EPS_MS: t.Msecs = 1;
        const endVTime = Math.max(0, (timeline.virtualDuration - END_EPS_MS) as t.Msecs);
        const isAtOrBeyondEnd = nextVTime >= endVTime;

        if (isAtOrBeyondEnd && isRepeat) {
          const active = s.decks.active;

          if (!endedSentRef.current) {
            endedSentRef.current = true;
            runner.send({ kind: 'video:ended', deck: active });
          }

          // Hard stop local driving immediately (best-effort).
          clock.pause();
          clockIsPlayingRef.current = false;
          lastNowRef.current = undefined;
          modeRef.current = 'media';
          lastEmittedVTimeRef.current = undefined;

          Schedule.raf(step);
          return;
        }
      }

      lastEmittedVTimeRef.current = nextVTime;

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
};
