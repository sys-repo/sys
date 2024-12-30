import { Path } from './libs.ts';
import type * as t from './t.ts';

/**
 * Convert a path into a {TmplFile} data structure.
 */
export function toTmplFile(path: t.StringPath): t.TmplFile {
  path = path.trim();
  const trimmed = Path.trimCwd(path);
  const dir = Path.dirname(trimmed) === '.' ? '' : Path.dirname(trimmed);
  const name = Path.basename(trimmed);
  return { path, dir, name };
}
