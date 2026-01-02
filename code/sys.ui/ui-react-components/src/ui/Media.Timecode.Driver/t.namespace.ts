import type * as R from './t.runtime.ts';
import type * as W from './t.wire.ts';

/**
 * Clock driver for the Timecode playback system.
 */
export namespace TimecodeDriver {
  export type Lib = {
    /** Create a new instance of the driver. */
    create(args: R.CreatePlaybackDriverArgs): R.PlaybackDriver;
  };

  export type Schedule = R.Schedule;
  export type ResolveBeatMedia = R.ResolveBeatMedia;
  export type PlaybackDriver = R.PlaybackDriver;

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
