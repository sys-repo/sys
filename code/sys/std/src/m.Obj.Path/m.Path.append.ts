import { type t } from './common.ts';

export function appendSuffix(path: t.ObjectPath, suffix: string): t.ObjectPath;
export function appendSuffix(path: undefined, suffix: string): undefined;
export function appendSuffix(
  path: t.ObjectPath | undefined,
  suffix: string,
): t.ObjectPath | undefined;
export function appendSuffix(
  path: t.ObjectPath | undefined,
  suffix: string,
): t.ObjectPath | undefined {
  if (!path || path.length === 0) return path ?? undefined;
  const next = path.slice() as t.ObjectPath;
  next[next.length - 1] = `${next[next.length - 1]}${suffix}`;
  return next;
}
