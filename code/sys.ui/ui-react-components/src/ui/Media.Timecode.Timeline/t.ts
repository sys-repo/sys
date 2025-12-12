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
};

export type UseMediaTimelineResult<P = unknown> = {
  readonly resolved?: t.Timecode.Composite.Resolved;
  readonly timeline?: t.Timecode.Experience.Timeline<P>;
};
