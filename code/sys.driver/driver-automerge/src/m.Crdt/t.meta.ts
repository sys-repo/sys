import type { t } from './common.ts';

/**
 * Common meta-data optionally applied to all new
 * documents typially under the `.meta` path.
 */
export type SysMeta = {
  readonly createdAt?: t.UnixTimestamp;
};
