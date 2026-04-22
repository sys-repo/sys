import type { t } from './common.ts';

export const AUTHORITY_JSON = Symbol('ViteStartup.authorityJson');
export const MODULE_SYNC_ENABLED = '#module-sync-enabled' as const;

export type AuthorityState = t.ViteStartup.Authority & {
  readonly [AUTHORITY_JSON]: Record<string, unknown>;
};
