import type { t } from './common.ts';

/**
 * Filter a FileMap by predicate.
 */
export function filter(filemap: t.FileMap, fn: t.FileMapFilter): t.FileMap {
  const next: Record<string, string> = {};
  for (const [path, value] of Object.entries(filemap)) {
    if (fn({ path, value })) next[path] = value;
  }
  return next as t.FileMap;
}
