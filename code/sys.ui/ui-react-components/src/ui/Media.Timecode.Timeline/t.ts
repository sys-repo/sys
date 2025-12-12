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
 */
export type UseMediaTimelineControllerArgs<P = unknown> = {
  bundle?: t.SpecTimelineBundle<P>;
  video?: t.VideoPlayerSignals;
};

export type UseMediaTimelineControllerResult<P = unknown> = {
  timeline?: t.Timecode.Experience.Timeline<P>;
  activeIndex: number | undefined;
  beats: readonly {
    index: number;
    beat: t.Timecode.Experience.Beat<P>;
    url?: string;
  }[];
  select(index: number): void;
  play(index: number): void; // alias for now: select+ensure playing
};
