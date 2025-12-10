import type { t } from './common.ts';

/**
 * Trait-as: "media-composition"
 */
export namespace MediaComposition {
  export namespace Sequence {
    export type Lib = t.SlugSequenceLib;
  }
  export namespace Playback {
    export type Lib = t.PlaybackLib;
  }
}

/** MediaComposition namespace */
export type MediaCompositionLib = {
  readonly Sequence: t.MediaComposition.Sequence.Lib;
  readonly Playback: t.MediaComposition.Playback.Lib;
};
