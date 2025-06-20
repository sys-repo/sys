/**
 * @module
 */
import type { t } from './common.ts';
import { useRepo } from './use.Repo.ts';

/**
 * Components:
 */
import { SyncEnabledSwitch } from './ui.Switch.SyncEnabled.tsx';
export { SyncEnabledSwitch };

/**
 * Library:
 */
export const Repo: t.RepoLib = {
  SyncEnabledSwitch,
  useRepo,
};
