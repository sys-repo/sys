import type { t } from '../common.ts';

/**
 * Exports from an imported `hook.ts` file.
 */
export type DocumentGraphHookModule = {
  /**
   * Graph-walk document hook.
   *
   * Called once for every document encountered during a DAG walk.
   * Use this to inspect, validate, or mutate documents via CRDT commands.
   */
  readonly onWalk?: t.DocumentGraphWalkHook;

  /**
   * DAG calculated hook.
   *
   * Called once for after the complete document DAG has been calculated.
   */
  readonly onDag?: t.DocumentGraphDagHook;
};
