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
  data: t.VideoTimestampProps;
  total: { secs: t.Secs; msecs: t.Msecs };
};
