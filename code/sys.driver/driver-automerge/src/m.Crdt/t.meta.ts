import type { t } from './common.ts';

/** Common metadata optionally applied to new documents under the `.meta` path. */
export type Sys = {
  readonly createdAt?: t.UnixTimestamp;
};
