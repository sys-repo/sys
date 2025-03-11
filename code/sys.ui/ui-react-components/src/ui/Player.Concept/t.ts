import type { t } from './common.ts';

/**
 * An extended video player.
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  title?: string;
  video?: string;
  timestamps?: t.VideoTimestamps;
  thumbnails?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * Timestamp data.
 */
export type VideoTimestamps = {
  [HH_MM_SS_mmm: string]: VideoTimestampProps;
};

export type VideoTimestampProps = {
  image?: t.StringPath;
};

export type VideoTimestampItem = {
  timestamp: string;
  total: { secs: t.Secs; msecs: t.Msecs };
  data: t.VideoTimestampProps;
};
