import type { t } from './common.ts';

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

/**
 * Events.
 */
export type VideoTimestampHandler = (e: VideoTimestampHandlerArgs) => void;
export type VideoTimestampHandlerArgs = {
  readonly timestamp: string;
  readonly data: t.VideoTimestampProps;
};
