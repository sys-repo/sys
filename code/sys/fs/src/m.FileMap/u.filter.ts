import { type t, Path } from './common.ts';
import { Data } from './m.Data.ts';

/**
 * Filter a FileMap by predicate.
 */
export function filter(filemap: t.FileMap, fn: t.FileMapFilter): t.FileMap {
  const next: Record<string, string> = {};
  for (const [path, value] of Object.entries(filemap)) {
    const filename = Path.basename(path);
    const contentType = Data.contentType.fromUri(value);
    const ext = Path.extname(path);
    const args: t.FileMapFilterArgs = { path, filename, ext, contentType, value };
    if (fn(args)) next[path] = value;
  }
  return next as t.FileMap;
}
