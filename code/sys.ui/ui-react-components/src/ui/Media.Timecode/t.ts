import type { t } from './common.ts';

/** Type exports:  */
export type * from './t.Playback.ts';

export namespace MediaTimecode {
  /**
   * UI primitives for working with time-code
   */
  export type Lib = {
    Playback: t.FC<t.PlayerControlsProps>;
  };

  /**
   * Generic bundle the UI will eventually consume.
   * Note: P = beat payload (opaque to the generic UI components).
   */
  export type PlaybackBundle<P = unknown> = {
    readonly spec: t.Timecode.Playback.Spec<P>;
    readonly resolveMedia: t.MediaResolver;
  };
}
