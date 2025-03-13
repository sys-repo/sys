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

export type VideoTimestamp = {
  timestamp: t.StringTimestamp;
  total: t.VideoTimestampTotal;
  data: t.VideoTimestampProps;
};

export type VideoTimestampTotal = {
  msecs: t.Msecs;
  secs: t.Secs;
  mins: t.Mins;
  hours: t.Hours;
};
