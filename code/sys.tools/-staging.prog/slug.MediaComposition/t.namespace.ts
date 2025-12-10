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
    export type Spec = t.PlaybackSpec;
    export type Bundle = t.PlaybackBundle;
    export type MediaResolver = t.PlaybackMediaResolver;
  }
}
