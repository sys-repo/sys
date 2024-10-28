import { type t, Fs, Delete } from './common.ts';
import { Pkg } from '@sys/std/pkg';

export const saveDist: t.PkgSLib['saveDist'] = async (dir) => {
  let ok = true;
  let error: t.StdError | undefined;
  const exists = await Fs.exists(dir);
  if (!exists) {
    ok = false;
    const message = `The given "dist" directory for the package does not exist: ${dir}`;
    error = { name: 'ReferenceError', message };
  }

  /**
   * Resposne
   */
  const res: t.PkgSaveDistResponse = {
    ok,
    dir: dir,
    exists,
    error,
  };
  return Delete.undefined(res);
};
