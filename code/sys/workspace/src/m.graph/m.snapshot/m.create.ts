import { type t, Time } from './common.ts';
import { GraphHash } from './m.Hash.ts';
import { meta } from './u.meta.ts';

export const create: t.WorkspaceGraph.Snapshot.Lib['create'] = (args) => {
  const { graph, digest } = GraphHash.snapshot(args.graph);
  return {
    '.meta': meta({
      createdAt: Time.now.timestamp,
      graphHash: digest,
    }),
    graph,
  };
};
