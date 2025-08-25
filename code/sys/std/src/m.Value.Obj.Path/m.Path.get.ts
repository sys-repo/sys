import type { t } from './common.ts';

/**
 * Deep-get helper with overloads so the return type
 * is `T | undefined` unless a default value is passed,
 * then reliably returns `T`.
 */
export function get<T = unknown>(
  subject: unknown,
  path: t.ObjectPath,
  defaultValue?: t.NonUndefined<T>,
) {
  let node: any = subject;

  for (const key of path) {
    if (node == null) return defaultValue as T;
    node = node[key as keyof typeof node];
  }

  return (node === undefined ? defaultValue : node) as T;
}
