import { type t, Path } from './common.ts';

/**
 * Convert a path into a [FsFile] data-structure.
 */
export function toFile(path: t.StringPath, baseDir?: t.StringDir): t.FsFile {
  let relative = Path.normalize(path.trim());
  let base = wrangle.base(path, baseDir);
  if (Path.Is.absolute(relative) && !relative.startsWith(base)) {
    const msg = `The given [relative] path is absolute but does not match the given [base].`;
    const err = `${msg}\n- base:     ${base}\n- relative: ${relative}`;
    throw new Error(err);
  }
  if (relative.startsWith(base)) relative = relative.slice(base.length + 1);

  const absolute = Path.join(base, relative);
  const dir = wrangle.dir(relative);
  const name = Path.basename(relative);
  const ext = Path.extname(relative);
  const file = { name, ext };

  return {
    base,
    absolute,
    relative,
    dir,
    file,
    toString: () => absolute,
  };
}

/**
 * Helpers
 */
const wrangle = {
  dir(path: t.StringPath) {
    const dir = Path.dirname(path);
    return dir === '.' ? '' : dir;
  },

  base(path: t.StringPath, baseDir?: t.StringDir) {
    if (typeof baseDir === 'string') return Path.resolve(baseDir.trim());
    if (Path.Is.absolute(path)) return Path.dirname(path);
    return Path.cwd();
  },
} as const;
