import type { t } from './common.ts';

/**
 * <Component>
 */
export type ThumbnailsProps = {
  timestamps?: t.VideoTimestamps;

  theme?: t.CommonTheme;
  style?: t.CssInput;

  videoSignals?: t.VideoPlayerSignals;
  onTimestampClick?: t.VideoTimestampHandler;
};

/**
 * Timestamps.
 */
export type VideoTimestamps = t.Timestamps<t.VideoTimestampData>;
export type VideoTimestamp = t.Timestamp<t.VideoTimestampData>;
export type VideoTimestampData = { image?: t.StringPath };

/**
 * Events.
 */
export type VideoTimestampHandler = (e: VideoTimestampHandlerArgs) => void;
export type VideoTimestampHandlerArgs = t.VideoTimestamp;
