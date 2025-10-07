import { type t, DEFAULTS, Signal, slug } from './common.ts';

type T = t.VideoPlayerSignals;
const D = DEFAULTS;

/**
 * Factory: create a new instance of signals
 */
export const playerSignalsFactory: t.PlayerSignalsFactory = (input = {}) => {
  const defaults = wrangle.defaults(input);
  const s = Signal.create;

  const props: T['props'] = {
    ready: s(false),

    // Media:
    src: s<t.StringVideoAddress | undefined>(defaults.src),
    playing: s<boolean>(false),
    loop: s<boolean>(defaults.loop ?? D.loop),
    autoPlay: s<boolean>(defaults.autoPlay ?? D.autoPlay),
    muted: s<boolean>(defaults.muted ?? D.muted),

    currentTime: s<t.Secs>(0),
    duration: s<t.Secs>(0),
    buffering: s<boolean>(false),
    buffered: s<t.Secs>(),
    crop: s(defaults.crop),

    // Appearance:
    showControls: s<boolean>(defaults.showControls ?? D.showControls),
    showFullscreenButton: s<boolean>(defaults.showFullscreenButton ?? D.showFullscreenButton),
    showVolumeControl: s<boolean>(defaults.showVolumeControl ?? D.showVolumeControl),
    cornerRadius: s<number>(defaults.cornerRadius ?? D.cornerRadius),
    aspectRatio: s<string>(defaults.aspectRatio ?? D.aspectRatio),
    scale: s<number | t.VideoPlayerScale>(defaults.scale ?? D.scale),
    fadeMask: s<undefined | t.VideoPlayerFadeMask>(wrangle.fadeMask(defaults.fadeMask)),

    // Commands:
    jumpTo: s<t.VideoPlayerSeek | undefined>(),
  };

  const instance = slug();
  const api: T = {
    instance,
    get props() {
      return props;
    },
    get is() {
      const playing = props.playing.value;
      const paused = !playing;
      return { playing, paused };
    },
    get src() {
      return props.src.value;
    },

    /**
     * Methods:
     */
    play: () => api.toggle(true),
    pause: () => api.toggle(false),
    toggle(playing) {
      const next = typeof playing === 'boolean' ? playing : !props.playing.value;
      props.playing.value = next;
      return api;
    },
    jumpTo(second, options = {}) {
      const { play = true } = options;
      props.jumpTo.value = { second, play };
      return api;
    },
  };

  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  defaults(
    input?: t.PlayerSignalsFactoryDefaults | t.StringVideoAddress,
  ): t.PlayerSignalsFactoryDefaults {
    if (!input) return {};
    if (typeof input === 'string') return { src: input };
    return input;
  },

  fadeMask(input?: t.Pixels | t.VideoPlayerFadeMask): t.VideoPlayerFadeMask | undefined {
    if (!input) return undefined;
    if (typeof input === 'number') return { direction: 'Top:Down', size: input };
    return input;
  },
} as const;
