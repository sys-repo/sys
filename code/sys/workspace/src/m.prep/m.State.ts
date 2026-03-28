import { type t, Fs } from './common.ts';

export const State: t.WorkspacePrep.State.Lib = {
  workspaceFile(cwd = Fs.cwd()) {
    return Fs.join(cwd, 'deno.json');
  },

  graphFile(cwd = Fs.cwd()) {
    return Fs.join(cwd, '.tmp', 'workspace.graph.json');
  },
};
