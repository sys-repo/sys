import type { t } from './common.ts';

/**
 * Controller Hook:
 */
export type UseRepoHook = () => RepoHook;
export type RepoHook = {
  readonly ready: boolean;
};
