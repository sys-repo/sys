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
  const {
    includeSkipped = false,
    onDoc: userOnDoc,
    onSkip: userOnSkip,
    onRefs: userOnRefs,
    ...rest
  } = args;

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

  const onDoc: t.Graph.WalkArgs<T>['onDoc'] = async (e) => {
    const { id, depth, doc } = e;
    const node = ensureMutable(id, depth);
    node.doc = doc;
    if (userOnDoc) {
      await userOnDoc(e);
    }
  };

  const onSkip: t.Graph.WalkArgs<T>['onSkip'] = (e) => {
    const { id, depth, reason } = e;
    if (includeSkipped && reason !== 'already-processed') {
      const node = ensureMutable(id, depth);
      node.reason = reason;
    }
    if (userOnSkip) {
      userOnSkip(e);
    }
  };

  const onRefs: t.Graph.WalkArgs<T>['onRefs'] = (e) => {
    const { id, depth, refs } = e;
    const node = ensureMutable(id, depth);
    node.refs = [...refs];
    for (const to of refs) {
      edges.push({ from: id, to });
    }
    if (userOnRefs) {
      userOnRefs(e);
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
      get refs() {
        return [...m.refs];
      },
      reason: m.reason,
    });
  }

  return {
    root: walkArgs.id,
    get nodes() {
      return nodes;
    },
    get edges() {
      return edges;
    },
    get processed() {
      return processed;
    },
  };
}

export const build: t.GraphLib['Dag']['build'] = buildDag;
