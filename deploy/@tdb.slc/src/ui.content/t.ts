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
 * Content Variation: Static.
 */
export type StaticContent = t.Content<StaticProps & { kind: 'StaticContent' }>;
export type StaticContentProps = t.ContentProps<StaticProps>;
type StaticProps = {
  id: t.StringId;
};

/**
 * Content Variation: Video.
 */
export type VideoContent = t.Content<VideoProps & { kind: 'VideoContent' }>;
export type VideoContentProps = t.ContentProps<VideoProps>;
type VideoProps = {
  id: t.StringId;
  playOnLoad?: boolean;
  showElapsed?: boolean;
  media?: VideoMediaContent;
};

/**
 * Renders a video with a map of timestamps.
 */
export type VideoContentRenderer = t.ContentRenderer<t.VideoContentProps>;

/** A unit of playable video-media. */
export type VideoMediaContent = {
  id: t.StringId;
  title?: string;
  video: t.VideoPlayerSignals;
  timestamps: ContentTimestamps;
  children?: VideoMediaContent[]; // ← Deep hierarhcy of media.
};
