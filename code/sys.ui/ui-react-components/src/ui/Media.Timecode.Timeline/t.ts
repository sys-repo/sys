import type { t } from './common.ts';

/** Type exports: */
export type * from './-dev/t.ts';
export type * from './-spec/-t.spec.ts';

/**
 * Timeline Component namespace:
 */
export type MediaTimelineLib = {
  readonly Dev: { readonly Harness: t.FC<t.MediaTimelineHarnessProps> };
  useTimeline<P = unknown>(spec?: t.Timecode.Playback.Spec<P>): t.UseMediaTimelineResult<P>;
  useTimelineController<P = unknown>(
    args: t.UseMediaTimelineControllerArgs<P>,
  ): t.UseMediaTimelineControllerResult<P>;
};

/**
 * Virtual Timeline (Data).
 */
export type UseMediaTimelineResult<P = unknown> = {
  readonly resolved?: t.Timecode.Composite.Resolved;
  readonly timeline?: t.Timecode.Experience.Timeline<P>;
};

/**
 * Virtual Timeline Controller.
 *
 * Drives the Playback runner via VideoPlayerSignals (minimal single-deck bridge for now).
 */
export type UseMediaTimelineControllerArgs<P = unknown> = {
  readonly bundle?: t.SpecTimelineBundle<P>;
  readonly video?: { A: t.VideoPlayerSignals; B: t.VideoPlayerSignals };
};

export type UseMediaTimelineControllerResult<P = unknown> = {
  readonly timeline?: t.Timecode.Experience.Timeline<P>;
  readonly activeIndex: number | undefined;
  readonly beats: readonly {
    readonly index: number;
    readonly beat: t.Timecode.Experience.Beat<P>;
    readonly url?: string;
  }[];
  select(index: number): void;
  play(index: number): void; // alias for now: select+ensure playing
};
