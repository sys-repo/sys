import type { t } from './common.ts';

/**
 * MediaPlaybackDriver.
 *
 * Thin head over `TreeContentDriver`;
 * playback-specific runtime extensions are composed above this seam.
 */
export declare namespace MediaPlaybackDriver {
  /** Public module surface. */
  export type Lib = {
    readonly orchestrator: (props: OrchestratorProps) => Orchestrator;
    readonly head: HeadLib;
  };

  export type HeadLib = {
    /** Runtime composition seam over TreeContent state: derives playback runtime/view state + slot patch. */
    readonly useHead: (args: HeadArgs) => HeadView;
    readonly usePlaybackRuntime: (args: {
      readonly playback?: t.SpecTimelineManifest;
      readonly assets?: readonly t.SpecTimelineAsset[];
      readonly sessionKey?: string;
    }) => PlaybackRuntime;
    readonly should: HeadShouldLib;
    readonly toPlaybackData: (input: unknown) => HeadMediaData | undefined;
    readonly toCurrentPosition: (snapshot?: t.TimecodeState.Playback.Snapshot) => string | undefined;
    readonly toCurrentPayload: (args: {
      playback?: t.SpecTimelineManifest;
      snapshot?: t.TimecodeState.Playback.Snapshot;
    }) => unknown;
  };

  export type HeadArgs = {
    readonly content: t.TreeContentController.State;
    readonly selection: t.TreeSelectionController.State;
    readonly theme: t.CommonTheme;
    readonly muted?: boolean;
    readonly renderNavFooter?: (args: {
      readonly runtime: PlaybackRuntime;
      readonly theme: t.CommonTheme;
      readonly media: HeadMediaData;
    }) => t.ReactNode;
  };

  export type HeadShouldLib = {
    readonly initPlayback: (args: {
      readonly hasTimeline: boolean;
      readonly hasPlayback: boolean;
      readonly initToken: string;
      readonly lastInitToken: string;
    }) => boolean;
  };

  export type HeadMediaData = {
    readonly playback: t.SpecTimelineManifest;
    readonly assets: readonly t.SpecTimelineAsset[];
  };

  export type PlaybackRuntime = {
    readonly decks: t.TimecodePlaybackDriver.VideoDecks;
    readonly controller: t.TimecodePlaybackDriver.TimelineController;
    readonly snapshot: t.TimecodeState.Playback.Snapshot;
    readonly timeline: ReturnType<typeof import('./common.ts').PlaybackDriver.Util.usePlaybackTimeline>;
    readonly bundle?: t.SpecTimelineBundle;
    readonly currentBeatIndex: t.TimecodeState.Playback.BeatIndex;
    readonly currentBeatMedia?: ReturnType<t.TimecodePlaybackDriver.ResolveBeatMedia>;
    readonly currentMediaSrc?: string;
  };

  export type HeadView = {
    readonly runtime: PlaybackRuntime;
    readonly derived: {
      readonly media?: HeadMediaData;
      readonly sessionKey?: string;
      readonly position?: string;
      readonly payload?: unknown;
      readonly currentMediaSrc?: string;
    };
    readonly slotsPatch: t.TreeHostSlots;
  };

  /** Re-exported core loader contract. */
  export type ContentLoader = t.TreeContentDriver.ContentLoader;
  /** Re-exported core runtime shape. */
  export type Orchestrator = t.TreeContentDriver.Orchestrator;
  /** Re-exported core creation args. */
  export type OrchestratorProps = t.TreeContentDriver.OrchestratorProps;
}
