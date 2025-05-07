import { type t } from './common.ts';
import { Join } from './m.Join.ts';

const join = Join.posix;

/**
 * Curry a directory path for URLs.
 */
export const dir: t.PathLib['dir'] = (base) => {
  const api: t.PathDirBuilder = {
    dir: (path: string) => dir(join(base, path)),
    path: (...parts: string[]) => join(base, ...parts),
    toString: () => base,
  };
  return api;
};
