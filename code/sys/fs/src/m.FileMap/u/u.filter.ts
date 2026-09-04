import { type t, Path } from '../common.ts';
import { Data } from '../m.Data.ts';

/**
 * Filter a FileMap by predicate.
 */
export const filter: t.FileMap.Filter.Method = (filemap, fn) => {
  const next: Record<string, string> = {};
  for (const [path, value] of Object.entries(filemap)) {
    if (fn(toFilterArgs(path, value))) next[path] = value;
  }
  return next as t.FileMap;
};

/**
 * Derive filter args from path/value pair.
 */
export function toFilterArgs(path: string, value: string): t.FileMap.Filter.Args {
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
