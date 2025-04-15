import type { t } from './common.ts';

/**
 * The content stages of the view.
 */
export type ContentStage = 'Entry' | 'Trailer' | 'Overview' | 'Programme';

/**
 * Time based content definition.
 */
export type ContentTimestamps = t.Timestamps<ContentTimestamp>;
export type ContentTimestamp = ContentTimestampMap | ContentTimestampMap['body'];
export type ContentTimestampMap = {
  body: (props: VideoContentProps) => t.ReactNode;
};

/**
 * Content variation: Video.
 */
export type VideoContent = t.Content<V & { '-type': 'VideoContent' }>;
export type VideoContentProps = t.ContentProps<V>;
type V = {
  id: t.ContentStage;
  timestamps: ContentTimestamps;
  showElapsed?: boolean;
  playOnLoad?: boolean;
  video?: t.VideoPlayerSignals;
};

/**
 * Content variation: Static.
 */
export type StaticContent = t.Content<{
  '-type': 'StaticContent';
  id: t.ContentStage;
}>;
