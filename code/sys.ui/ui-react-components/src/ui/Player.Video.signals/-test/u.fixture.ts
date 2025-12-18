import { type t, Signal } from '../common.ts';

export type TestVideoPlayerSignalsState = {
  played: number;
  paused: number;
  jumpTo: readonly Jump[];
};

type Jump = { second: number; play?: boolean };
const store = new WeakMap<
  t.VideoPlayerSignals,
  { played: number; paused: number; jumpTo: Jump[] }
>();

/**
 * Test fixture: minimal VideoPlayerSignals stub with call tracking.
 */
export const TestVideoPlayerSignals = {
  make,
  state,
} as const;

function make(): t.VideoPlayerSignals {
  const tracked = { played: 0, paused: 0, jumpTo: [] as Jump[] };

  const props: t.VideoPlayerSignalProps = {
    ready: Signal.create(false),
    src: Signal.create<t.StringVideoAddress | undefined>(undefined),

    /**
     * Media:
     */
    playing: Signal.create(false),
    loop: Signal.create(false),
    autoPlay: Signal.create(false),
    muted: Signal.create(false),

    currentTime: Signal.create(0 as t.Secs),
    duration: Signal.create(60 as t.Secs),
    buffering: Signal.create(false),
    buffered: Signal.create<t.Secs | undefined>(undefined),
    slice: Signal.create<t.Timecode.Slice.String | string | undefined>(undefined),

    /**
     * Appearance:
     */
    showControls: Signal.create<boolean | undefined>(undefined),
    showFullscreenButton: Signal.create<boolean | undefined>(undefined),
    showVolumeControl: Signal.create<boolean | undefined>(undefined),
    aspectRatio: Signal.create<string | undefined>(undefined),
    cornerRadius: Signal.create<number | undefined>(undefined),
    scale: Signal.create<t.Percent | t.VideoPlayerScale | undefined>(undefined),
    fadeMask: Signal.create<t.VideoPlayerFadeMask | undefined>(undefined),

    /**
     * Commands:
     */
    jumpTo: Signal.create<t.VideoPlayerSeek | undefined>(undefined),
  };

  const api: t.VideoPlayerSignals = {
    instance: 'test' as t.StringId,
    props,
    get is() {
      const playing = Boolean(props.playing.value);
      return { playing, paused: !playing };
    },
    src: undefined,

    play() {
      tracked.played++;
      props.playing.value = true;
      return api;
    },

    pause() {
      tracked.paused++;
      props.playing.value = false;
      return api;
    },

    toggle(playing?: boolean) {
      const next = playing ?? !props.playing.value;
      return next ? api.play() : api.pause();
    },

    jumpTo(second: t.Secs, options?: { play?: boolean }) {
      const play = options?.play;
      tracked.jumpTo.push({ second: Number(second), play });

      props.jumpTo.value = { second, play };
      props.currentTime.value = second;

      if (play === true) api.play();
      if (play === false) api.pause();

      return api;
    },
  };

  store.set(api, tracked);
  return api;
}

function state(signals: t.VideoPlayerSignals): TestVideoPlayerSignalsState {
  const s = store.get(signals);
  if (!s) throw new Error('TestVideoPlayerSignals.state: missing state for signals instance.');
  return { played: s.played, paused: s.paused, jumpTo: s.jumpTo };
}
