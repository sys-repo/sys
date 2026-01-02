import type { t } from './common.ts';
import type * as R from './t.runtime.ts';
import type * as W from './t.wire.ts';

/**
 * Clock driver for the Timecode playback system.
 */
export namespace TimecodeDriver {
  export type Lib = t.TimecodeDriverLib;

  export type Schedule = R.Schedule;
  export type ResolveBeatMedia = R.ResolveBeatMedia;
  export type PlaybackDriver = R.PlaybackDriver;
  export type TimelineController = R.TimelineController;

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
