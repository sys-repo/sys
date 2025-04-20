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
export type VideoContent = t.Content<VideoProps & { kind: 'VideoContent' }>;
export type VideoContentProps = t.ContentProps<VideoProps>;
type VideoProps = {
  id: t.ContentStage;
  video?: t.VideoPlayerSignals;
  timestamps: ContentTimestamps;
  playOnLoad?: boolean;
  showElapsed?: boolean;
};

export type VideoContentRenderer = t.ContentRenderer<t.VideoContentProps>;

/**
 * Content variation: Static.
 */
export type StaticContent = t.Content<StaticProps & { kind: 'StaticContent' }>;
export type StaticContentProps = t.ContentProps<StaticProps>;
type StaticProps = {
  id: t.ContentStage;
};
