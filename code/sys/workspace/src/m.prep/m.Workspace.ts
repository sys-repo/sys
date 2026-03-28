import { type t, Arr, Fs } from './common.ts';
import { State } from './m.State.ts';

export const Workspace: t.WorkspacePrep.Workspace.Lib = {
  async normalize(cwd = Fs.cwd()) {
    const path = State.workspaceFile(cwd);
    const before = (await Fs.readJson<t.DenoFileJson>(path)).data;
    if (!before) throw new Error(`Workspace.Prep.Workspace.normalize: failed to read "${path}"`);

    const after = normalizeWorkspace(before);
    const beforeWorkspace = Array.isArray(before.workspace) ? before.workspace : [];
    const afterWorkspace = Array.isArray(after.workspace) ? after.workspace : [];
    const changed = !Arr.equal(beforeWorkspace, afterWorkspace);
    if (changed) {
      await Fs.writeJson(path, after);
    }

    return { changed, path };
  },
};

/**
 * Helpers:
 */
function normalizeWorkspace(input: t.DenoFileJson): t.DenoFileJson {
  const next = structuredClone(input);
  const workspace = Array.isArray(next.workspace) ? next.workspace : [];
  next.workspace = [...new Set(workspace)].toSorted((a, b) => a.localeCompare(b));
  return next;
}
