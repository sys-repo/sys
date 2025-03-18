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
    currentTime: s<t.Secs>(0),
    loop: s(defaults.loop ?? D.loop),

    showFullscreenButton: s<boolean>(defaults.showFullscreenButton ?? D.showFullscreenButton),
    showControls: s<boolean>(defaults.showControls ?? D.showControls),
    cornerRadius: s<number>(defaults.cornerRadius ?? D.cornerRadius),
    aspectRatio: s<string>(defaults.aspectRatio ?? D.aspectRatio),

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
