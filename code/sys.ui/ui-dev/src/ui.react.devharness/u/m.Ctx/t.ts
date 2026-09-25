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
    options?: { env?: t.DevEnvVars; until?: t.UntilInput },
  ): Promise<t.DevContext>;
};
