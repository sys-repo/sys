import type { t } from './common.ts';

/**
 * Trait-as: "media-composition"
 */
export namespace MediaComposition {
  export namespace Sequence {
    export type Lib = t.SequenceLib;
    export type Item = t.SequenceItem;
    export type VideoItem = t.SequenceVideoItem;
    export type EmbedItem = t.SequenceEmbedItem;
    export type PauseItem = t.SequencePauseItem;
    export type ImageItem = t.SequenceImageItem;
    export type Timestamps = t.SequenceTimestamps;
    export namespace Timestamp {
      export type Text = t.SequenceTimestampText;
      export type Entry = t.SequenceTimestampEntry;
    }
  }
  export namespace Playback {
    export type Lib = t.PlaybackLib;
    export type Spec = t.PlaybackSpec;
    export type Bundle = t.PlaybackBundle;
    export type MediaResolver = t.PlaybackMediaResolver;
  }
}
