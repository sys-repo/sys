import { type t, Signal } from './common.ts';

type T = t.VideoPlayerSignals;

/**
 * Factory: create a new instance of signals
 */
export const playerSignalsFactory: t.PlayerSignalsFactory = (defaults = {}) => {
  const props: T['props'] = {
    ready: Signal.create(false),
    playing: Signal.create(false),
    loop: Signal.create(false),
    jumpTo: Signal.create<t.VideoPlayerJumpTo | undefined>(),
    currentTime: Signal.create<t.Secs>(0),
    fullscreenButton: Signal.create(defaults.fullscreenButton ?? false),
  };

  const api: T = {
    props,
    jumpTo(second, options = {}) {
      const { play = true } = options;
      api.props.jumpTo.value = { second, play };
    },
  };

  return api;
};
