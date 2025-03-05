import type { t } from './common.ts';

/**
 * An extended video player.
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  title?: string;
  video?: string;
  timestamps?: t.VideoTimestamps;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * Timestamp images
 */
export type VideoTimestamps = {
  [ts: string]: VideoTimestamp;
};

export type VideoTimestamp = {};
