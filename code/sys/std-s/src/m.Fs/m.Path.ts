import { exists } from '@std/fs';
import { Path as Base, type t } from './common.ts';
import { Is } from './m.Is.ts';

/**
 * Helpers for working with resource paths with the
 * existence of the server FS tools.
 */
export const Path: t.FsPathLib = {
  ...Base,
  async asDir(path: string) {
    if (!(await exists(path))) return path;
    return (await Is.dir(path)) ? path : Base.dirname(path);
  },
};
