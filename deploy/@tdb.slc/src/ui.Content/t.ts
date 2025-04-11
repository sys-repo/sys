import type { t } from './common.ts';

/**
 * The content stages of the view.
 */
export type ContentStage = 'Entry' | 'Trailer' | 'Overview' | 'Programme';

/**
 * Time based content definition.
 */
export type ContentTimestamps = t.Timestamps<ContentTimestamp>;
export type ContentTimestamp = (props: VideoContentProps) => t.ReactNode;

/**
 * Content variation: Video.
 */
export type VideoContent = t.Content<V>;
export type VideoContentProps = t.ContentProps<V>;
type V = {
  id: t.ContentStage;
  timestamps: ContentTimestamps;
  showElapsed?: boolean;
  playOnLoad?: boolean;
  // video?: { src: string };
};

/**
 * Content variation: Static.
 */
export type StaticContent = t.Content<{ id: t.ContentStage }>;
