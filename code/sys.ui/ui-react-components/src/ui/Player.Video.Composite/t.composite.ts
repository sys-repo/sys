import type { t } from './common.ts';

/**
 * A single piece of source media in the composition.
 * Optional slice narrows the playable window within the source.
 * Optional crop mirrors the lower-level element API (pass-through).
 */
export type VideoPiece = {
  src: string;
  slice?: string | t.TimecodeSliceString;
  crop?: t.VideoCropRange | t.VideoCropRangeTuple;
};

/** Authoring-time composition: an ordered list of pieces. */
export type VideoCompositionSpec = VideoPiece[];

/** Duration (ms) per source URL, supplied post metadata load. */
export type VideoDurationMap = Readonly<Record<string, t.Msecs>>;

/**
 * Resolved segment against real source metadata.
 * - [from,to) are absolute milliseconds within the source asset.
 * - [vFrom,vTo) are absolute milliseconds on the composite (virtual) timeline.
 */
export type VideoResolvedSegment = {
  readonly src: string;
  readonly from: t.Msecs;
  readonly to: t.Msecs;
  readonly vFrom: t.Msecs;
  readonly vTo: t.Msecs;
  readonly crop?: t.VideoCropRange | t.VideoCropRangeTuple;
};

/** Resolved composition and its total virtual duration. */
export type VideoCompositionResolved = {
  readonly segments: readonly VideoResolvedSegment[];
  readonly total: t.Msecs;
};

/** Virtual-time alias for clarity. */
export type VideoVTime = t.Msecs;

/**
 * Map a virtual time position into a concrete source-time within a segment.
 * Returns null if the composition is empty or the time is outside [0,total).
 */
export type VideoMapToSourceResult = {
  readonly index: number;
  readonly seg: VideoResolvedSegment;
  /** Absolute ms within the source asset for this virtual time. */
  readonly srcTime: t.Msecs;
  /** vTime offset from the start of the segment on the virtual timeline. */
  readonly offset: t.Msecs; // = vTime - seg.vFrom
};

export type VideoMapToSource = (
  segments: readonly VideoResolvedSegment[],
  vTime: VideoVTime,
) => VideoMapToSourceResult | null;

/**
 * Resolver: transforms an authoring spec + known durations into an executable timeline.
 * - durations: ms per src URL (must be supplied by caller after metadata load).
 * - Slices are resolved using Timecode.Slice rules.
 * - Zero-length results are dropped.
 */
export type VideoResolveComposition = (
  spec: VideoCompositionSpec,
  durations: VideoDurationMap,
) => VideoCompositionResolved;

/**
 * Minimal event surface for a composite orchestrator (no UI assumptions).
 * A future React wrapper can lift these directly.
 */
export type VideoCompositeEvents = {
  readonly onReady?: (e: { readonly total: t.Msecs }) => void;
  readonly onTime?: (e: { readonly time: t.Msecs }) => void;
  readonly onEnded?: () => void;
};

/**
 * Optional control intents the orchestrator may expose upward.
 * These mirror what you’ll bind to <Player.Video.Element>.
 */
export type VideoCompositeControls = {
  readonly play: () => Promise<void> | void;
  readonly pause: () => void;
  readonly seek: (time: VideoVTime) => void;
};

/**
 * A thin, environment-agnostic orchestration contract:
 * - The orchestrator owns resolution + mapping.
 * - A view layer (e.g., React) binds these to concrete video elements.
 */
export type VideoCompositeOrchestrator = {
  readonly spec: VideoCompositionSpec;
  readonly resolved: VideoCompositionResolved;
  readonly mapToSource: VideoMapToSource;
  readonly controls: VideoCompositeControls;
  readonly events?: VideoCompositeEvents;
};
