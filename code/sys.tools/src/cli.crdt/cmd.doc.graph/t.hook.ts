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

  /**
   * Optional plugin extensions (eg. lint tasks).
   */
  readonly plugins?: readonly DocumentGraphPlugin[];
};

/**
 * Document-graph plugin interface.
 */
export type DocumentGraphPlugin = {
  /** Stable identifier (default menu label). */
  readonly id: string;

  /** Optional menu label override. */
  readonly title?: string;

  /** Execute plugin action. */
  readonly run: (args: {
    cwd: t.StringDir;
    dag: t.Graph.Dag.Result;
    cmd: t.Crdt.Cmd.Client;
    docpath: t.ObjectPath;
  }) => Promise<void>;
};
