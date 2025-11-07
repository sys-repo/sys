import { Path, type t } from './common.ts';
import { toPathAll } from './u.path.ts';

type O = Record<string, unknown>;
type PathInput = t.PathLike | undefined | null;

/**
 * Bind a curried path to a subject to produce a bound read/write lens.
 */
export function bindRW<S extends O, T>(cur: t.CurriedPath<T>, subject: S): t.BoundObjLens<S, T> {
  const { path } = cur;
  const isRoot = path.length === 0;

  const get = (def?: t.NonUndefined<T>) =>
    arguments.length === 0
      ? isRoot
        ? subject
        : cur.get(subject as O)
      : isRoot
        ? (subject ?? def)
        : cur.get(subject as O, def as any);

  const exists = () => (isRoot ? true : cur.exists(subject as O));

  const set = (value: T) => {
    if (isRoot) {
      Path.Mutate.diff(value as unknown as O, subject as O);
      return undefined;
    }
    return cur.set(subject as O, value);
  };

  const ensure = (def: t.NonUndefined<T>) => {
    if (isRoot) return subject == null ? def : (subject as any);
    return cur.ensure(subject as O, def);
  };

  const del = () => {
    if (isRoot) {
      for (const k of Object.keys(subject)) delete subject[k];
      return undefined;
    }
    return cur.delete(subject);
  };

  const join = <U>(...subpath: PathInput[]) =>
    bindRW<S, U>(cur.join<U>(toPathAll(...subpath)), subject);

  return { subject, path, get: get as any, exists, set, ensure, delete: del, join };
}
