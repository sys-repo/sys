import type { t } from '../common.ts';

export type TestVideoPlayerSignalsState = {
  played: number;
  paused: number;
  jumpTo: Jump[];
};

type Jump = { second: number; play?: boolean };
const store = new WeakMap<t.VideoPlayerSignals, TestVideoPlayerSignalsState>();

/**
 * Test fixture: minimal VideoPlayerSignals stub with call tracking.
 */
export const TestVideoPlayerSignals = {
  make,
  state,
} as const;

function make(): t.VideoPlayerSignals {
  const state: TestVideoPlayerSignalsState = { played: 0, paused: 0, jumpTo: [] };

  const api = {
    instance: 'test' as unknown as t.StringId,
    props: {} as unknown as t.VideoPlayerSignalProps,
    is: { playing: false, paused: true },
    src: undefined,

    play: () => {
      state.played++;
      return api as unknown as t.VideoPlayerSignals;
    },
    pause: () => {
      state.paused++;
      return api as unknown as t.VideoPlayerSignals;
    },
    toggle: (_playing?: boolean) => api as unknown as t.VideoPlayerSignals,
    jumpTo: (second: t.Secs, options?: { play?: boolean }) => {
      state.jumpTo.push({ second: Number(second), play: options?.play });
      return api as unknown as t.VideoPlayerSignals;
    },
  };

  store.set(api, state);
  return api as unknown as t.VideoPlayerSignals;
}

function state(signals: t.VideoPlayerSignals): TestVideoPlayerSignalsState {
  const s = store.get(signals);
  if (!s) {
    const err = `TestVideoPlayerSignals.state: missing state for signals instance.`;
    throw new Error(err);
  }
  return s;
}
