import type { t } from './common.ts';

/**
 * Returns a shallow slice of the given object path.
 * Mirrors `Array.prototype.slice(start, end?)` (pure, half-open, negative indices supported).
 */
export const slice: t.ObjPathLib['slice'] = (path, start, end) => {
  return path.slice(start, end) as unknown as t.ObjectPath;
};
