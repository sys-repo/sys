import { type t } from './common.ts';
import { walk } from './u.walk.ts';

type O = Record<string, unknown>;

type MutableNode<T extends O = O> = {
  depth: number;
  doc?: t.ImmutableSnapshot<T>;
  refs: t.StringId[];
  reason?: t.Graph.SkipReason;
};

/**
 * Generic DAG materializer built on top of `Graph.walk`.
 */
async function buildDag<T extends O = O>(
  args: t.Graph.Dag.BuildArgs<T>,
): Promise<t.Graph.Dag.Result<T>> {
  const { includeSkipped = false, ...rest } = args;

  const byId = new Map<t.StringId, MutableNode<T>>();
  const edges: t.Graph.Dag.Edge[] = [];

  const ensureMutable = (id: t.StringId, depth: number): MutableNode<T> => {
    const existing = byId.get(id);
    if (existing) {
      if (depth < existing.depth) existing.depth = depth;
      return existing;
    }
    const node: MutableNode<T> = { depth, refs: [] };
    byId.set(id, node);
    return node;
  };

  const onDoc: t.Graph.WalkArgs<T>['onDoc'] = ({ id, depth, doc }) => {
    const node = ensureMutable(id, depth);
    node.doc = doc;
  };

  const onSkip: t.Graph.WalkArgs<T>['onSkip'] = ({ id, depth, reason }) => {
    if (!includeSkipped) return;
    if (reason === 'already-processed') return;
    const node = ensureMutable(id, depth);
    node.reason = reason;
  };

  const onRefs: t.Graph.WalkArgs<T>['onRefs'] = ({ id, depth, refs }) => {
    const node = ensureMutable(id, depth);
    node.refs = [...refs];
    for (const to of refs) {
      edges.push({ from: id, to });
    }
  };

  const walkArgs: t.Graph.WalkArgs<T> = {
    ...(rest as Omit<t.Graph.WalkArgs<T>, 'onDoc' | 'onSkip' | 'onRefs'>),
    onDoc,
    onSkip,
    onRefs,
  };

  const { processed } = await walk<T>(walkArgs);

  const nodes: t.Graph.Dag.Node<T>[] = [];
  for (const [id, m] of byId.entries()) {
    nodes.push({
      id,
      depth: m.depth,
      doc: m.doc,
      refs: [...m.refs],
      reason: m.reason,
    });
  }

  return {
    root: walkArgs.id,
    nodes,
    edges,
    processed,
  };
}

export const dag: t.GraphLib['dag'] = buildDag;
