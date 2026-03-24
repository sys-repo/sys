import { type t, Fs } from './common.ts';
import { Graph } from './m.Graph.ts';
import { State } from './m.State.ts';
import { Workspace } from './m.Workspace.ts';

export const WorkspacePrep: t.WorkspacePrep.Lib = {
  State,
  Graph,
  Workspace,
  async run(args = {}) {
    const cwd = args.cwd ?? Fs.cwd();
    const workspace = await Workspace.normalize(cwd);
    const graph = await Graph.ensure({ cwd, graph: args.graph });
    return { workspace, graph };
  },
};
