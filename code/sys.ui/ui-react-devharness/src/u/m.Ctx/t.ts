import type { t } from '../common.ts';

/**
 * DevHarness {Ctx} "context" generator for a DevHarness spec.
 */
export type ContextLib = {
  /**
   * Create a new instance of the Context logic.
   */
  init(
    instance: t.DevInstance,
    options?: { env?: t.DevEnvVars; dispose$?: t.UntilObservable },
  ): Promise<t.DevContext>;
};
