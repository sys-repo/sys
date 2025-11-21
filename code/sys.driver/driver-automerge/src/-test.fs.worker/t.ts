import type { t } from '../common.ts';

/**
 * Repo/worker setup within unit-tests.
 */
export type TestWorkerEnv = {
  readonly repo: t.Crdt.Repo;
  readonly worker: Worker;
  dispose(): Promise<void>;
};
