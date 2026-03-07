import { useEffect, useRef } from 'react';
import { type t, Schedule, Timecode } from './common.ts';
import { Convert } from './u.convert.ts';

/**
 * Drive virtual-time progression for playback.
 *
 * Contract:
 * - Emits runner input: { kind:'video:time', deck, vTime }.
 * - Materializes beat.pause windows by pausing/playing the active deck.
 *
 * Critical invariants:
 * 1) Never advance vTime virtually (clock.advance) unless we are explicitly inside a pause window.
 *    → Outside pause windows, if media is stalled/non-authoritative we FREEZE vTime.
 * 2) Keep the VirtualClock aligned to the last emitted vTime at all times.
 *    → Switching authority can’t “jump” due to a drifting clock.
 * 3) Pause/play commands are issued on transitions only (no repeated spam).
 */

type DebugGlobals = {
  readonly __SYS__?: {
    readonly timecodePlaybackDebug?: boolean;
  };
};

const readDebugFlag = (): boolean => {
  const g = globalThis as unknown as DebugGlobals;
  return g.__SYS__?.timecodePlaybackDebug === true;
};

type DiagReason =
  | 'boot'
  | 'seed'
  | 'endedTick'
  | 'pause:enter'
  | 'pause:exit'
  | 'authority:freeze'
  | 'authority:resume'
  | 'post-change';

type DiagPacket = {
  readonly reason: DiagReason;
  readonly now: number;
  readonly deck?: t.TimecodeState.Playback.DeckId;
  readonly beat?: number;
  readonly vTime?: number;
  readonly mediaMs?: number;
  readonly stalledForMs?: number;
};

const diag = (
  packet: DiagPacket,
  state: { readonly lastAt: Record<string, number> },
  options?: { readonly throttleMs?: number },
) => {
  if (!readDebugFlag()) return;

  const throttleMs = options?.throttleMs ?? 250;
  const key = packet.reason;

  const last = state.lastAt[key];
  if (last !== undefined && packet.now - last < throttleMs) return;
  state.lastAt[key] = packet.now;

  // eslint-disable-next-line no-console
  console.debug('[Timecode.Playback] ' + packet.reason, packet);
};

export const useClock: t.TimecodePlaybackLib['useClock'] = (args): void => {
  const clockRef = useRef<t.Timecode.VirtualClock.Instance | undefined>(undefined);
  const lastTotalRef = useRef<t.Msecs | undefined>(undefined);

  const lastNowRef = useRef<number | undefined>(undefined);
  const lastSeedRef = useRef<{ timeline?: unknown; beat?: number } | undefined>(undefined);

  const lastEmittedVTimeRef = useRef<t.Msecs | undefined>(undefined);

  // Media authority: vTime = mediaMs + mediaOffset while authoritative.
  const mediaOffsetRef = useRef<t.Msecs | undefined>(undefined);

  // Stall tracking.
  const lastMediaMsRef = useRef<t.Msecs | undefined>(undefined);
  const lastMediaProgressNowRef = useRef<number | undefined>(undefined);

  // Ended-tick tracking (per deck).
  const lastEndedTickRef = useRef<Record<t.TimecodeState.Playback.DeckId, number>>({ A: 0, B: 0 });

  // Pause materialization transition tracking.
  const lastInPauseRef = useRef<boolean>(false);

  // When we detect a discontinuity (ended/deck swap/beat change), freeze vTime until media progresses again.
  const awaitingMediaResumeRef = useRef<boolean>(false);

  // Local diagnostic throttle state.
  const diagStateRef = useRef<{ lastAt: Record<string, number> }>({ lastAt: {} });

  const msecs = (n: number): t.Msecs => n as t.Msecs;

  function ensureClock(total: t.Msecs): t.Timecode.VirtualClock.Instance {
    const prevTotal = lastTotalRef.current;
    if (clockRef.current && prevTotal === total) return clockRef.current;

    lastTotalRef.current = total;
    const clock = Timecode.VClock.makeForTotal(total);

    clockRef.current = clock;
    return clock;
  }

  function alignClockTo(vTime: t.Msecs): void {
    const clock = clockRef.current;
    if (!clock) return;
    clock.seek(Timecode.VTime.fromMsecs(vTime));
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

    ensureClock(timeline.virtualDuration);

    const vTime = msecs(Number(beat.vTime));
    lastEmittedVTimeRef.current = vTime;
    alignClockTo(vTime);

    lastNowRef.current = undefined;

    // Reset authority + stall state on discontinuities.
    mediaOffsetRef.current = undefined;
    lastMediaMsRef.current = undefined;
    lastMediaProgressNowRef.current = undefined;

    lastInPauseRef.current = false;
    awaitingMediaResumeRef.current = true;

    diag(
      {
        reason: 'seed',
        now: performance.now(),
        beat: beatIndex,
        vTime: Number(vTime),
      },
      diagStateRef.current,
      { throttleMs: 0 },
    );

    return true;
  }

  useEffect(() => {
    let disposed = false;

    diag(
      {
        reason: 'boot',
        now: performance.now(),
      },
      diagStateRef.current,
      { throttleMs: 0 },
    );

    const step = () => {
      if (disposed) return;

      const runner = args.getRunner();
      if (!runner) return void Schedule.raf(step);

      const seeded = seedFromRunnerState(runner);
      if (seeded) return void Schedule.raf(step);

      const snap = runner.get();
      const s = snap.state;
      const timeline = s.timeline;

      if (s.phase !== 'active' || s.intent !== 'play' || !timeline || s.currentBeat === undefined) {
        lastNowRef.current = undefined;

        mediaOffsetRef.current = undefined;
        lastMediaMsRef.current = undefined;
        lastMediaProgressNowRef.current = undefined;

        lastInPauseRef.current = false;
        awaitingMediaResumeRef.current = false;

        Schedule.raf(step);
        return;
      }

      ensureClock(timeline.virtualDuration);

      const now = performance.now();
      const prevNow = lastNowRef.current;
      lastNowRef.current = now;

      const dtMsNum = prevNow === undefined ? 0 : Math.max(0, now - prevNow);
      const dtMs = msecs(dtMsNum);

      const activeDeckId = s.decks.active;
      const activeSignals = args.runtime.decks?.get(activeDeckId);

      const hasDeck = activeSignals !== undefined;
      const mediaSecs = activeSignals?.props.currentTime.value ?? 0;
      const mediaMs = Convert.toMsecs(mediaSecs);

      // Stall tracking: treat progress as “> +0.5ms” to ignore float jitter.
      const prevMediaMs = lastMediaMsRef.current;
      const progressed =
        hasDeck && (prevMediaMs === undefined ? true : Number(mediaMs) > Number(prevMediaMs) + 0.5);

      if (hasDeck) {
        lastMediaMsRef.current = mediaMs;

        if (progressed) {
          lastMediaProgressNowRef.current = now;
          awaitingMediaResumeRef.current = false;
        } else if (lastMediaProgressNowRef.current === undefined) {
          lastMediaProgressNowRef.current = now;
        }
      }

      const stalledForMs =
        hasDeck && !progressed && lastMediaProgressNowRef.current !== undefined
          ? now - lastMediaProgressNowRef.current
          : 0;

      // Ended-tick observation (active deck only).
      const activeEndedTick = activeSignals?.props.endedTick.value ?? 0;
      const lastActiveTick = lastEndedTickRef.current[activeDeckId] ?? 0;

      if (activeEndedTick !== lastActiveTick) {
        lastEndedTickRef.current[activeDeckId] = activeEndedTick;

        // Discontinuity: freeze until media progresses again.
        awaitingMediaResumeRef.current = true;
        mediaOffsetRef.current = undefined;

        diag(
          {
            reason: 'endedTick',
            now,
            deck: activeDeckId,
            beat: s.currentBeat,
            vTime: Number(lastEmittedVTimeRef.current ?? 0),
          },
          diagStateRef.current,
          { throttleMs: 0 },
        );

        runner.send({ kind: 'video:ended', deck: activeDeckId });

        // After signaling ended, runner may swap decks/beats; treat as discontinuity.
        const postEnded = runner.get().state;
        if (
          postEnded.currentBeat !== s.currentBeat ||
          postEnded.decks.active !== s.decks.active ||
          postEnded.phase !== s.phase
        ) {
          mediaOffsetRef.current = undefined;
          lastMediaMsRef.current = undefined;
          lastMediaProgressNowRef.current = undefined;

          awaitingMediaResumeRef.current = true;
          lastInPauseRef.current = false;

          diag(
            {
              reason: 'post-change',
              now,
              deck: postEnded.decks.active,
              beat: postEnded.currentBeat,
            },
            diagStateRef.current,
            { throttleMs: 0 },
          );
        }

        Schedule.raf(step);
        return;
      }

      // Compute pause window for the current beat.
      const beat = timeline.beats[s.currentBeat];
      const pause = msecs(Number(beat?.pause ?? 0));

      const nextBeat = timeline.beats[s.currentBeat + 1];
      const nextStart = msecs(Number(nextBeat?.vTime ?? timeline.virtualDuration));

      const beatStart = msecs(Number(beat?.vTime ?? 0));
      const totalSpan = msecs(Math.max(0, Number(nextStart) - Number(beatStart)));
      const mediaSpan = msecs(Math.max(0, Number(totalSpan) - Number(pause)));

      const pauseFrom = msecs(Number(beatStart) + Number(mediaSpan));
      const pauseTo = msecs(Number(pauseFrom) + Number(pause));

      const currVTime = lastEmittedVTimeRef.current ?? msecs(0);

      const isInPause =
        Number(pause) > 0 &&
        Number(currVTime) >= Number(pauseFrom) &&
        Number(currVTime) < Number(pauseTo);

      // Pause materialization transitions.
      if (isInPause && !lastInPauseRef.current) {
        lastInPauseRef.current = true;

        // Enter pause: pause active deck, allow virtual advance.
        args.runtime.deck.pause(activeDeckId);

        awaitingMediaResumeRef.current = false;

        diag(
          {
            reason: 'pause:enter',
            now,
            deck: activeDeckId,
            beat: s.currentBeat,
            vTime: Number(currVTime),
          },
          diagStateRef.current,
          { throttleMs: 0 },
        );
      }

      if (!isInPause && lastInPauseRef.current) {
        lastInPauseRef.current = false;

        // Exit pause: resume media, freeze until we see actual media progression (seek/buffer may occur).
        args.runtime.deck.play(activeDeckId);

        mediaOffsetRef.current = undefined;
        lastMediaMsRef.current = undefined;
        lastMediaProgressNowRef.current = undefined;

        awaitingMediaResumeRef.current = true;

        diag(
          {
            reason: 'pause:exit',
            now,
            deck: activeDeckId,
            beat: s.currentBeat,
            vTime: Number(currVTime),
          },
          diagStateRef.current,
          { throttleMs: 0 },
        );
      }

      // Decide authority + compute nextVTime.
      //
      // Rule: only advance virtual time inside explicit pause windows.
      // Otherwise: prefer media when progressing; else freeze.
      let nextVTime = currVTime;

      if (isInPause) {
        // Virtual advance allowed only for pause windows.
        const clock = clockRef.current;
        if (clock) {
          alignClockTo(currVTime);
          const st = clock.advance(dtMs);
          const advanced = msecs(Number(Timecode.VTime.toMsecs(st.vtime)));

          // Clamp at pause end to avoid overshoot that can create awkward boundary behavior.
          nextVTime = msecs(Math.min(Number(advanced), Number(pauseTo)));
        }
      } else {
        const STALL_THRESHOLD_MS = 750;

        const canUseMedia =
          hasDeck &&
          !awaitingMediaResumeRef.current &&
          (progressed || stalledForMs < STALL_THRESHOLD_MS);

        if (canUseMedia) {
          // (Re)build offset whenever we resume media authority.
          const offset = mediaOffsetRef.current ?? msecs(Number(currVTime) - Number(mediaMs));

          mediaOffsetRef.current = offset;

          nextVTime = msecs(Number(mediaMs) + Number(offset));

          alignClockTo(nextVTime);

          diag(
            {
              reason: 'authority:resume',
              now,
              deck: activeDeckId,
              beat: s.currentBeat,
              vTime: Number(nextVTime),
              mediaMs: Number(mediaMs),
              stalledForMs,
            },
            diagStateRef.current,
            { throttleMs: 500 },
          );
        } else {
          // Freeze vTime outside pause windows if media isn’t authoritative.
          nextVTime = currVTime;
          alignClockTo(nextVTime);

          if (hasDeck && (awaitingMediaResumeRef.current || stalledForMs >= STALL_THRESHOLD_MS)) {
            diag(
              {
                reason: 'authority:freeze',
                now,
                deck: activeDeckId,
                beat: s.currentBeat,
                vTime: Number(nextVTime),
                mediaMs: Number(mediaMs),
                stalledForMs,
              },
              diagStateRef.current,
              { throttleMs: 500 },
            );
          }
        }
      }

      // Monotonic vTime (never go backwards).
      const prevEmit = lastEmittedVTimeRef.current;
      if (prevEmit !== undefined && Number(nextVTime) < Number(prevEmit)) {
        nextVTime = prevEmit;
      }

      lastEmittedVTimeRef.current = nextVTime;

      runner.send({
        kind: 'video:time',
        deck: activeDeckId,
        vTime: nextVTime,
      });

      // Observe runner changes after time emission.
      const post = runner.get().state;
      if (post.currentBeat !== s.currentBeat || post.decks.active !== s.decks.active) {
        mediaOffsetRef.current = undefined;
        lastMediaMsRef.current = undefined;
        lastMediaProgressNowRef.current = undefined;

        awaitingMediaResumeRef.current = true;
        lastInPauseRef.current = false;

        diag(
          {
            reason: 'post-change',
            now,
            deck: post.decks.active,
            beat: post.currentBeat,
            vTime: Number(lastEmittedVTimeRef.current ?? 0),
          },
          diagStateRef.current,
          { throttleMs: 0 },
        );

        Schedule.raf(step);
        return;
      }

      Schedule.raf(step);
    };

    Schedule.raf(step);
    return () => void (disposed = true);
  }, [args.runtime, args.getRunner]);
};
