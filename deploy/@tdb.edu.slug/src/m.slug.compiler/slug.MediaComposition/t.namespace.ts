import type { t } from './common.ts';

/**
 * Trait: media-composition primitives.
 */
export namespace MediaComposition {
  /**
   * Sequence authoring and normalization types.
   */
  export namespace Sequence {
    export type Lib = t.SlugSequenceLib;
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

    export type Beat = t.SequenceBeat;
    export type BeatPayload = t.SequenceBeatPayload;
  }

  /**
   * Playback-time resolution and execution types.
   */
  export namespace Playback {
    export type Lib = t.SlugPlaybackLib;
    export type Spec = t.SlugPlaybackSpec;
    export type Bundle = t.SlugPlaybackBundle;
    export type MediaResolver = t.SlugPlaybackMediaResolver;
  }

  /**
   * Bundled media assets emitted for a slug.
   */
  export namespace Assets {
    export type Kind = t.SlugAssetKind;
    export type Asset = t.SlugAsset;
    export type Manifest = t.SlugAssetsManifest;
  }
}
