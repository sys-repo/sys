import type { t } from './common.ts';
import type * as R from './t.runtime.ts';
import type * as W from './t.wire.ts';

/**
 * Clock driver for the Timecode playback system.
 */
export namespace TimecodePlaybackDriver {
  export type Lib = t.TimecodePlaybackDriverLib;

  export type Schedule = R.Schedule;
  export type Driver = R.PlaybackDriver;
  export type VideoDecks = t.VideoDecks;
  export type TimelineController = R.TimelineController;
  export type ResolveBeatMedia = R.ResolveBeatMedia;

  /**
   * Wire-format interop shapes (tooling/loader manifests + bundles).
   */
  export namespace Wire {
    export type Bundle<P = unknown> = W.SpecTimelineBundle<P>;
    export type AssetsManifest = W.SpecTimelineAssetsManifest;
    export type Asset = W.SpecTimelineAsset;
    export type Manifest<P = unknown> = W.SpecTimelineManifest<P>;
  }
}
