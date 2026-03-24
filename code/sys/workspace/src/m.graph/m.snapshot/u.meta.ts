import { type t, D, Obj } from './common.ts';

type M = t.WorkspaceGraph.Snapshot.Meta;

export function meta(args: {
  createdAt: t.UnixTimestamp;
  graphHash: t.StringHash;
  modifiedAt?: t.UnixTimestamp;
  generator?: M['generator'];
}): M {
  return {
    createdAt: args.createdAt,
    ...(args.modifiedAt !== undefined ? { modifiedAt: args.modifiedAt } : {}),
    schemaVersion: D.schemaVersion,
    graphHash: args.graphHash,
    generator: args.generator ? cloneGenerator(args.generator) : D.GENERATOR,
  };
}

function cloneGenerator(generator: M['generator']): M['generator'] {
  return {
    pkg: Obj.clone(generator.pkg),
    type: generator.type,
  };
}
