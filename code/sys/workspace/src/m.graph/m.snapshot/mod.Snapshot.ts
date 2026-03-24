import { type t } from './common.ts';
import { create } from './m.create.ts';
import { read } from './m.read.ts';
import { write } from './m.write.ts';

export const Snapshot: t.WorkspaceGraph.Snapshot.Lib = {
  create,
  read,
  write,
};
