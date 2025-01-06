import { type t, StdPath } from './common.ts';

/**
 * Convert a path into a `FsFile` data-structure.
 */
export const toFile: t.FsFileFactory = (path, baseDir) => {
  let relative = StdPath.normalize(path.trim());
  let base = wrangle.base(path, baseDir);
  if (StdPath.Is.absolute(relative) && !relative.startsWith(base)) {
    const msg = `The given [relative] path is absolute but does not match the given [base].`;
    const err = `${msg}\n- base:     ${base}\n- relative: ${relative}`;
    throw new Error(err);
  }
  if (relative.startsWith(base)) relative = relative.slice(base.length + 1);

  const absolute = StdPath.join(base, relative);
  const dir = wrangle.dir(relative);
  const name = StdPath.basename(relative);
  const ext = StdPath.extname(relative);
  const file = { name, ext };

  return {
    base,
    absolute,
    relative,
    dir,
    file,
    toString: () => absolute,
  };
};

/**
 * Helpers
 */
const wrangle = {
  dir(path: t.StringPath) {
    const dir = StdPath.dirname(path);
    return dir === '.' ? '' : dir;
  },

  base(path: t.StringPath, baseDir?: t.StringDir) {
    if (typeof baseDir === 'string') return StdPath.resolve(baseDir.trim());
    if (StdPath.Is.absolute(path)) return StdPath.dirname(path);
    return Deno.cwd();
  },
} as const;
