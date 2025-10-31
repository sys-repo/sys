import { type t, Path } from './common.ts';

export function joinAll(base: t.ObjectPath, parts: readonly t.ObjectPath[]): t.ObjectPath {
  let acc = base;
  for (const seg of parts) acc = Path.join(acc, seg, 'absolute');
  return acc;
}
