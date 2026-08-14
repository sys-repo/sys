import { Fs, type t } from './common.ts';

export const State: t.WorkspacePrep.State.Lib = Object.freeze({
  workspaceFile(cwd = Fs.cwd()) {
    return Fs.join(cwd, 'deno.json');
  },

  graphFile(cwd = Fs.cwd()) {
    return Fs.join(cwd, 'deno.graph.json');
  },
});
