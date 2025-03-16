import type { t } from './common.ts';
export type * from './t.timestamp.ts';

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
 * Events.
 */
export type VideoTimestampHandler = (e: VideoTimestampHandlerArgs) => void;
export type VideoTimestampHandlerArgs = t.VideoTimestamp;
