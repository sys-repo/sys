import { type t, DEFAULTS, Signal } from './common.ts';

type T = t.VideoPlayerSignals;
const D = DEFAULTS;

/**
 * Factory: create a new instance of signals
 */
export const playerSignalsFactory: t.PlayerSignalsFactory = (defaults = {}) => {
  const s = Signal.create;

  const props: T['props'] = {
    // Values.
    ready: s(false),
    playing: s(false),
    loop: s(defaults.loop ?? D.loop),
    currentTime: s<t.Secs>(0),
    cornerRadius: s<number>(defaults.cornerRadius ?? D.cornerRadius),
    showFullscreenButton: s<boolean>(defaults.showFullscreenButton ?? D.showFullscreenButton),
    showControls: s<boolean>(defaults.showControls ?? D.showControls),

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
