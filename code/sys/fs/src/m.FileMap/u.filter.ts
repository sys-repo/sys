import { type t, Path } from './common.ts';
import { Data } from './m.Data.ts';

/**
 * Filter a FileMap by predicate.
 */
export function filter(filemap: t.FileMap, fn: t.FileMapFilter): t.FileMap {
  const next: Record<string, string> = {};
  for (const [path, value] of Object.entries(filemap)) {
    if (fn(toFilterArgs(path, value))) next[path] = value;
  }
  return next as t.FileMap;
}

/**
 * Derive filter args from path/value pair.
 */
export function toFilterArgs(path: string, value: string): t.FileMapFilterArgs {
  const filename = Path.basename(path);
  const contentType = Data.contentType.fromUri(value);
  const ext = Path.extname(path);
  return {
    contentType,
    path,
    filename,
    ext,
    get value() {
      return value;
    },
  };
}
