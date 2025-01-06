import { Path } from './libs.ts';
import type * as t from './t.ts';

/**
 * Convert a path into a {TmplFile} data structure.
 */
export function toTmplFile(base: t.StringDir, relative: t.StringRelativePath): t.TmplFile {
  base = Path.resolve(base.trim());
  if (Path.Is.absolute(relative) && !relative.startsWith(base)) {
    const msg = `The given [relative] path is absolute but does not match the given [base].`;
    const err = `${msg}\n- base:     ${base}\n- relative: ${relative}`;
    throw new Error(err);
  }

  relative = relative.trim();
  relative = Path.normalize(relative);
  if (relative.startsWith(base)) relative = relative.slice(base.length + 1);

  const absolute = Path.join(base, relative);
  const dir = wrangle.dir(relative);
  const name = Path.basename(relative);
  const ext = Path.extname(relative);
  const file = { name, ext };

  return {
    absolute,
    base,
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
} as const;
