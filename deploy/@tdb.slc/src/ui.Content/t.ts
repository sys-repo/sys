import type { t } from './common.ts';

/**
 * The content stages of the view.
 */
export type ContentStage = 'Entry' | 'Trailer' | 'Overview' | 'Programme';

/**
 * Component props that include timestamp based content.
 */
export type ContentTimestampProps = t.ContentProps & { timestamp: t.StringTimestamp };

/**
 * Time based content definition.
 */
export type ContentTimestamps = t.Timestamps<ContentTimestamp>;
export type ContentTimestamp = {
  /** Render the content for the current timestamp. */
  render?(props: ContentTimestampProps): t.ReactNode;
  // image?: t.StringPath;
};

/**
 * Content variation: Video
 */
export type VideoContent = t.Content<{
  id: t.ContentStage;
  // video?: { src: string };
  timestamps: ContentTimestamps;
}>;

/**
 * Content variation: Static
 */
export type StaticContent = t.Content<{ id: t.ContentStage }>;
