import { type t, DEFAULTS, Signal } from './common.ts';

type T = t.VideoPlayerSignals;

/**
 * Factory: create a new instance of signals
 */
export const playerSignalsFactory: t.PlayerSignalsFactory = (defaults = {}) => {
  const s = Signal.create;

  const props: T['props'] = {
    // Values.
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
      props.jumpTo.value = { second, play };
      return api;
    },
    play: () => api.toggle(true),
    pause: () => api.toggle(false),
    toggle(playing) {
      const next = typeof playing === 'boolean' ? playing : !props.playing.value;
      props.playing.value = next;
      return api;
    },
  };

  return api;
};
