import type { t } from './common.ts';

export type * from './t.info.ts';
export type * from './t.switch.ts';

/**
 * UI tools for representing the CRDT repository.
 */
export type RepoLib = {
  readonly Info: t.FC<t.RepoInfoProps>;
  readonly SyncEnabledSwitch: t.FC<t.SyncEnabledSwitchProps>;
};

/**
 * Consolidated, derived connection state for a CRDT repo.
 */
export type RepoStatus = {
  /** High-level connection state derived from syncEnabled + peers:
   *  - 'offline'    → sync disabled
   *  - 'connecting' → sync enabled but no peers yet
   *  - 'online'     → sync enabled and at least one peer online
   */
  readonly status: 'offline' | 'connecting' | 'online';
  /** True once the repo has emitted its initial props/snapshot. */
  readonly ready: boolean;
  /** Whether sync is currently enabled for this repo. */
  readonly syncEnabled: boolean;
  /** True when at least one sync peer is connected. */
  readonly hasPeers: boolean;
  /** True when the repo is configured with at least one sync server URL. */
  readonly hasServers: boolean;
};
