import { DomMock, act, describe, expect, it, renderHook } from '../../../-test.ts';
import { type t, Schedule } from '../common.ts';
import { useClock } from '../u.runner.clock.playback.ts';
import { createRuntime } from './u.fixture.ts';

type DeckId = t.TimecodeState.Playback.DeckId;

type RunnerSnap = {
  readonly state: {
    readonly phase: 'active' | 'ended' | 'idle';
    readonly intent: 'play' | 'pause' | 'stop';
    readonly timeline?: t.TimecodeState.Playback.Timeline;
    readonly currentBeat?: number;
    readonly decks: { readonly active: DeckId };
  };
};

function timelinePauseWindowFixture(): t.TimecodeState.Playback.Timeline {
  const segIdA = 'seg:A';
  const segIdB = 'seg:B';

  const beats: readonly t.TimecodeState.Playback.Beat[] = [
    /**
     * Intentionally inconsistent:
     * - beat.duration is NOT authoritative for pause-window in useClock
     * - next beat start (nextBeat.vTime) IS authoritative
     */
    { index: 0, vTime: 33_000, duration: 12_000, pause: 2_000, segmentId: segIdA },

    // Next beat starts at +14s (33_000 + 14_000 = 47_000)
    { index: 1, vTime: 47_000, duration: 4_000, pause: 3_000, segmentId: segIdB },
  ];

  const segments: readonly t.TimecodeState.Playback.Segment[] = [
    { id: segIdA, beat: { from: 0, to: 1 } },
    { id: segIdB, beat: { from: 1, to: 2 } },
  ];

  return { beats, segments, virtualDuration: 60_000 } as const;
}

function timelineNoPauseFixture(): t.TimecodeState.Playback.Timeline {
  const segId = 'seg:0';

  const beats: readonly t.TimecodeState.Playback.Beat[] = [
    { index: 0, vTime: 0, duration: 10_000, pause: 0, segmentId: segId },
    { index: 1, vTime: 10_000, duration: 10_000, pause: 0, segmentId: segId },
  ];

  const segments: readonly t.TimecodeState.Playback.Segment[] = [
    { id: segId, beat: { from: 0, to: 2 } },
  ];

  return { beats, segments, virtualDuration: 20_000 } as const;
}

function createRunnerStub(snap: { current: RunnerSnap }): t.PlaybackRunner {
  return {
    get: () => snap.current as unknown as t.PlaybackRunnerState,
    send: (_input) => void _input,
    subscribe: (_fn) => () => void 0,
    dispose: () => void 0,
  };
}

type RafDriver = {
  readonly queue: Array<() => void>;
  raf(cb: () => void): void;
  flushOne(): void;
};

function createRafDriver(): RafDriver {
  const queue: Array<() => void> = [];
  return {
    queue,
    raf(cb) {
      queue.push(cb);
    },
    flushOne() {
      const cb = queue.shift();
      if (cb) cb();
    },
  };
}

function withDeterministicRafAndNow(
  run: (e: { readonly raf: RafDriver; readonly setNow: (ms: number) => void }) => void,
): void {
  const raf = createRafDriver();
  const rafPrev = Schedule.raf;

  const perf = globalThis.performance as Performance;
  const nowPrev = perf.now.bind(perf);

  let now = 0;
  const setNow = (ms: number) => void (now = ms);

  // Patch Schedule.raf
  (Schedule as unknown as { raf: (cb: () => void) => void }).raf = raf.raf;

  // Patch performance.now
  Object.defineProperty(globalThis.performance, 'now', {
    value: () => now,
    configurable: true,
  });

  try {
    run({ raf, setNow });
  } finally {
    (Schedule as unknown as { raf: (cb: () => void) => void }).raf = rafPrev;

    Object.defineProperty(globalThis.performance, 'now', {
      value: nowPrev,
      configurable: true,
    });
  }
}

describe('Playback.useClock', () => {
  DomMock.polyfill();

  it.skip('materializes pause window using nextBeat.vTime delta (not beat.duration)', () => {
    const { runtime, calls } = createRuntime();

    const snap: { current: RunnerSnap } = {
      current: {
        state: {
          phase: 'active',
          intent: 'play',
          timeline: timelinePauseWindowFixture(),
          currentBeat: 0,
          decks: { active: 'A' },
        },
      },
    };

    const runner = createRunnerStub(snap);

    withDeterministicRafAndNow(({ raf, setNow }) => {
      const step = (nextNowMs: number) => {
        act(() => {
          setNow(nextNowMs);
          raf.flushOne();
        });
      };

      const { unmount } = renderHook(() =>
        useClock({
          runtime,
          getRunner: () => runner,
        }),
      );

      /**
       * Frame 1: seed frame (no emit, no pause/play side effects)
       * Frame 2: first running frame, dt=0
       */
      step(0);
      step(0);

      /**
       * Pause window math:
       *   beat.vTime = 33_000
       *   nextStart = 47_000
       *   totalSpan = 14_000
       *   pause = 2_000
       *   pauseFrom = 45_000
       *   pauseTo   = 47_000
       */
      for (let i = 1; i <= 11; i++) step(i * 1000);
      expect(calls.some((c) => c.kind === 'pause')).to.eql(false);

      step(12_000);
      const firstPauseIndex = calls.findIndex((c) => c.kind === 'pause');
      expect(firstPauseIndex).to.be.greaterThan(-1);

      step(13_000);
      step(14_000);

      const didPlayAfterPause = calls.slice(firstPauseIndex + 1).some((c) => c.kind === 'play');

      expect(didPlayAfterPause).to.eql(true);

      unmount();
    });
  });

  it('never issues runtime pause/play when beat.pause is 0 (over many frames)', () => {
    const { runtime, calls } = createRuntime();

    const snap: { current: RunnerSnap } = {
      current: {
        state: {
          phase: 'active',
          intent: 'play',
          timeline: timelineNoPauseFixture(),
          currentBeat: 0,
          decks: { active: 'A' },
        },
      },
    };

    const runner = createRunnerStub(snap);

    withDeterministicRafAndNow(({ raf, setNow }) => {
      const step = (nextNowMs: number) => {
        act(() => {
          setNow(nextNowMs);
          raf.flushOne();
        });
      };

      const { unmount } = renderHook(() =>
        useClock({
          runtime,
          getRunner: () => runner,
        }),
      );

      step(0);
      step(0);

      for (let i = 1; i <= 30; i++) step(i * 1000);

      expect(calls.some((c) => c.kind === 'pause')).to.eql(false);
      expect(calls.some((c) => c.kind === 'play')).to.eql(false);

      unmount();
    });
  });
});
