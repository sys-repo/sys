import { D, Obj, type t } from './common.ts';

type M = t.WorkspaceGraph.Snapshot.Meta;

export function meta(args: {
  createdAt: t.UnixTimestamp;
  graphHash: t.StringHash;
  modifiedAt?: t.UnixTimestamp;
  generator?: M['generator'];
  hashPolicy?: M['hash']['/graph:policy'];
}): M {
  return {
    createdAt: args.createdAt,
    ...(args.modifiedAt !== undefined ? { modifiedAt: args.modifiedAt } : {}),
    schemaVersion: D.schemaVersion,
    hash: {
      '/graph': args.graphHash,
      '/graph:policy': args.hashPolicy ?? D.HASH_POLICY,
    },
    generator: cloneGenerator(args.generator ?? D.GENERATOR),
  };
}

function cloneGenerator(generator: M['generator']): M['generator'] {
  return {
    pkg: { name: generator.pkg.name, version: generator.pkg.version },
    types: Obj.clone(generator.types),
  };
}
