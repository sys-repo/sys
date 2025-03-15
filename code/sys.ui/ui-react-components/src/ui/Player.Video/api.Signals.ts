import { type t, DEFAULTS, Signal } from './common.ts';

type T = t.VideoPlayerSignals;

/**
 * Factory: create a new instance of signals
 */
export const playerSignalsFactory: t.PlayerSignalsFactory = (defaults = {}) => {
  const s = Signal.create;

  const props: T['props'] = {
    // Fields.
    ready: s(false),
    playing: s(false),
    loop: s(defaults.loop ?? DEFAULTS.loop),
    currentTime: s<t.Secs>(0),
    fullscreenButton: s(defaults.fullscreenButton ?? DEFAULTS.fullscreenButton),

    // Commands.
    jumpTo: s<t.VideoPlayerJumpTo | undefined>(),
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
