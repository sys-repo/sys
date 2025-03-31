import { type t, DEFAULTS, Signal } from './common.ts';

type T = t.VideoPlayerSignals;
const D = DEFAULTS;

/**
 * Factory: create a new instance of signals
 */
export const playerSignalsFactory: t.PlayerSignalsFactory = (defaults = {}) => {
  const s = Signal.create;

  const props: T['props'] = {
    ready: s(false),

    // Media.
    src: s<t.StringVideoAddress>(defaults.src ?? D.video),
    playing: s<boolean>(false),
    currentTime: s<t.Secs>(0),
    loop: s<boolean>(defaults.loop ?? D.loop),
    autoPlay: s<boolean>(defaults.autoPlay ?? D.autoPlay),
    muted: s<boolean>(defaults.muted ?? D.muted),

    // Appearance.
    showControls: s<boolean>(defaults.showControls ?? D.showControls),
    showFullscreenButton: s<boolean>(defaults.showFullscreenButton ?? D.showFullscreenButton),
    showVolumeControl: s<boolean>(defaults.showVolumeControl ?? D.showVolumeControl),
    background: s<boolean>(defaults.background ?? D.background),
    cornerRadius: s<number>(defaults.cornerRadius ?? D.cornerRadius),
    aspectRatio: s<string>(defaults.aspectRatio ?? D.aspectRatio),

    // Commands.
    jumpTo: s<t.VideoPlayerJumpTo | undefined>(),
  };

  const api: T = {
    get props() {
      return props;
    },

    /**
     * Methods:
     */
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
