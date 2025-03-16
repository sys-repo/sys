import type { t } from './common.ts';

/**
 * Timestamp data.
 */
export type VideoTimestamps = t.Timestamps<t.VideoTimestampProp>;

export type VideoTimestampProp = {
  image?: t.StringPath;
};

export type VideoTimestamp = {
  timestamp: t.StringTimestamp;
  total: t.VideoTimestampTotal;
  data: t.VideoTimestampProp;
};

export type VideoTimestampTotal = {
  msecs: t.Msecs;
  secs: t.Secs;
  mins: t.Mins;
  hours: t.Hours;
};
