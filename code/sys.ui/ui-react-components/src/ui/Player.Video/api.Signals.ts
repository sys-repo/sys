import { type t, Signal } from './common.ts';

/**
 * Factory: create a new instance of signals
 */
export function playerSignalsFactory() {
  const api: t.VideoPlayerSignals = {
    props: {
      ready: Signal.create(false),
      playing: Signal.create(false),
      loop: Signal.create(false),
      jumpTo: Signal.create<t.VideoPlayerJumpTo | undefined>(),
      currentTime: Signal.create<t.Secs>(0),
    },
    jumpTo(time, options = {}) {
      const { play = true } = options;
      api.props.jumpTo.value = { second: time, play };
    },
  };

  return api;
}
