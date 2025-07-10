import type { t } from './common.ts';
import { set } from './m.Mutate.set.ts';
import { get } from './m.Path.get.ts';

type O = Record<string, unknown>;

/**
 * Ensure a value at the given path exists (not undefined),
 * and if not assigns the given default.
 */
export function ensure<T = unknown>(subject: O, path: t.ObjectPath, value: t.NonUndefined<T>): T {
  const existing = get(subject, path);
  if (existing === undefined) set(subject, path, value);
  return get<T>(subject, path, value);
}
