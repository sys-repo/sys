import type { t } from './common.ts';

/**
 * The content stages of the view.
 */
export type ContentStage = 'Entry' | 'Trailer' | 'Overview' | 'Programme';

/**
 * Time based content definition.
 */
export type ContentTimestamps = t.Timestamps<ContentTimestamp>;
export type ContentTimestamp = ContentTimestampProps | ContentTimestampProps['column'];
export type ContentTimestampProps = {
  column?: t.VideoContentRenderer;
  pulldown?: t.VideoContentRenderer;
};

/**
 * Content variation: Video.
 */
export type VideoContent = t.Content<V & { kind: 'VideoContent' }>;
export type VideoContentProps = t.ContentProps<V>;
type V = {
  id: t.ContentStage;
  timestamps: ContentTimestamps;
  showElapsed?: boolean;
  playOnLoad?: boolean;
  video?: t.VideoPlayerSignals;
};

export type VideoContentRenderer = t.ContentRenderer<t.VideoContentProps>;

/**
 * Content variation: Static.
 */
export type StaticContent = t.Content<{
  id: t.ContentStage;
  kind: 'StaticContent';
}>;
