import { type t, Fs } from './common.ts';
import { Path } from './m.DenoFile.Path.ts';
import { load } from './u.load.ts';

export const nearest: t.DenoFileLib['nearest'] = async (start, shouldStop) => {
  const path = await Path.nearest(start, shouldStop);
  if (!path) return undefined;

  const file = (await load(path)).data ?? {};
  const dir = Fs.dirname(path);
  return {
    is: { workspace: Array.isArray(file.workspace) },
    get path() {
      return path;
    },
    get dir() {
      return dir;
    },
    get file() {
      return file;
    },
  };
};
