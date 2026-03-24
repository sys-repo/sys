/**
 * @module
 * Workspace preparation helpers.
 */
import type { t } from './common.ts';

const State: t.WorkspacePrep.State.Lib = {};
const Graph: t.WorkspacePrep.Graph.Lib = {};
const Workspace: t.WorkspacePrep.Workspace.Lib = {};

export const WorkspacePrep: t.WorkspacePrep.Lib = {
  State,
  Graph,
  Workspace,
  async run() {
    throw new Error('Workspace.Prep.run: not implemented');
  },
};
