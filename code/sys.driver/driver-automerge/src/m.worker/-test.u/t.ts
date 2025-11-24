import type { t } from '../common.ts';

/**
 * Shared worker fixture surface for integration tests.
 */
export type TestWorkerFixture = {
  /** Worker-backed CRDT repo facade (main-thread proxy). */
  readonly repo: t.CrdtRepo;

  /** Worker handle and URL used to spawn it. */
  readonly worker: {
    readonly url: URL;
    readonly instance: Worker;
  };

  /** Spawn configuration used for this worker repo. */
  readonly config: t.CrdtWorkerConfigFs;

  /** Underlying MessagePort used for repo RPC and commands. */
  readonly port: MessagePort;

  /**
   * Dispose the worker-backed repo and terminate the worker.
   * Ensures no ports or async operations leak between tests.
   */
  dispose(): Promise<void>;
};
