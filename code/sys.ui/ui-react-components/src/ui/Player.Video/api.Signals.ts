import { type t, Signal } from './common.ts';

/**
 * Factory: create a new instance of signals
 */
export function playerSignalsFactory() {
  const api: t.VideoPlayerSignals = {
    props: {
      playing: Signal.create(false),
      jumpTo: Signal.create<t.VideoPlayerJumpTo | undefined>(),
      currentTime: Signal.create<t.Secs>(0),
    },
    jumpTo(time, play = true) {
      api.props.jumpTo.value = { time, play };
    },
  };

  return api;
}
