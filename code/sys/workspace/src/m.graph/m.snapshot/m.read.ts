import { type t, Fs, JsonFile } from './common.ts';
import { defaultDoc } from './u.defaultDoc.ts';
import { parseSnapshot } from './u.parse.ts';

export const read: t.WorkspaceGraph.Snapshot.Lib['read'] = async (path) => {
  if (!(await Fs.exists(path))) return undefined;

  const initial = defaultDoc();
  const file = await JsonFile.get<t.WorkspaceGraph.Snapshot.Doc>(path, initial);
  return parseSnapshot(file.current);
};
