import type { t } from './common.ts';
import type * as R from './t.runtime.ts';
import type * as W from './t.wire.ts';

/**
 * Clock driver for the Timecode playback system.
 */
export namespace TimecodePlaybackDriver {
  /** Public module surface for the playback-driver package namespace. */
  export type Lib = t.TimecodePlaybackDriverLib;

  /** Schedule contract used by the runtime loop implementation. */
  export type Schedule = R.Schedule;
  /** Runtime playback driver interface bound to timeline state and effects. */
  export type Driver = R.PlaybackDriver;
  /** Video deck registry type consumed by the playback driver. */
  export type VideoDecks = t.VideoDecks;
  /** Controller contract that exposes timeline state and commands. */
  export type TimelineController = R.TimelineController;
  /** Resolver contract that maps beat references to playable media. */
  export type ResolveBeatMedia = R.ResolveBeatMedia;

  /**
   * Wire-format interop shapes (tooling/loader manifests + bundles).
   */
  export namespace Wire {
    /** Packaged timeline bundle shape used for loader/tooling interop. */
    export type Bundle<P = unknown> = W.SpecTimelineBundle<P>;
    /** Manifest of static assets referenced by a timeline bundle. */
    export type AssetsManifest = W.SpecTimelineAssetsManifest;
    /** Single asset descriptor inside a playback assets manifest. */
    export type Asset = W.SpecTimelineAsset;
    /** Full wire-format manifest containing timelines and referenced assets. */
    export type Manifest<P = unknown> = W.SpecTimelineManifest<P>;
  }
}
