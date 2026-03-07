import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * User-supplied function invoked after the complete
 * document DAG has been calculated.
 */
export type DocumentGraphDagHook<T extends O = O> = (
  ctx: DocumentGraphDagHookCtx<T>,
) => void | Promise<void>;

/**
 * Context passed to the `onDag` callback hook.
 */
export type DocumentGraphDagHookCtx<T extends O = O> = {
  readonly cmd: t.Crdt.Cmd.Client;
  readonly root: t.Crdt.Id;
  readonly path: { readonly yaml: t.ObjectPath };
  readonly dag: t.Graph.Dag.Result<T>;
  readonly startedAt: t.Msecs;
};
