import { type t, Arr, Fs, Str } from './common.ts';
import { State } from './m.State.ts';

const compare = Str.Compare.codeUnit();

type WorkspaceFileJson = {
  workspace?: t.StringPath[];
} & t.JsonMap;

export const Workspace: t.WorkspacePrep.Workspace.Lib = {
  async normalize(cwd = Fs.cwd()) {
    const path = State.workspaceFile(cwd);
    const before = (await Fs.readJson<WorkspaceFileJson>(path)).data;
    if (!before) throw new Error(`Workspace.Prep.Workspace.normalize: failed to read "${path}"`);

    const after = normalizeWorkspace(before);
    const beforeWorkspace = Array.isArray(before.workspace) ? before.workspace : [];
    const afterWorkspace = Array.isArray(after.workspace) ? after.workspace : [];
    const changed = !Arr.equal(beforeWorkspace, afterWorkspace);
    if (changed) {
      await Fs.writeJson(path, after as t.Json);
    }

    return { changed, path };
  },
};

/**
 * Helpers:
 */
function normalizeWorkspace(input: WorkspaceFileJson): WorkspaceFileJson {
  const next = structuredClone(input);
  const workspace = Array.isArray(next.workspace) ? next.workspace : [];
  next.workspace = [...new Set(workspace)].toSorted(compare);
  return next;
}
