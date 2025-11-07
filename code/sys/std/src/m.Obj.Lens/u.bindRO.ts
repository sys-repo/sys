import { type t } from './common.ts';
import { toPathAll } from './u.path.ts';

type O = Record<string, unknown>;
type PathInput = t.PathLike | undefined | null;

/**
 * Bind a curried path to a subject to produce a bound readonly lens.
 */
export function bindRO<S extends O, T>(
  cur: t.CurriedPath<T>,
  subject: S,
): t.ReadOnlyObjLensRef<S, T> {
  const { path } = cur;

  const get = (def?: t.NonUndefined<T>) => {
    return arguments.length === 0
      ? //
        cur.get(subject as O)
      : cur.get(subject as O, def as any);
  };

  const exists = () => cur.exists(subject as O);

  const join = <U>(...subpath: PathInput[]) => {
    return bindRO<S, U>(cur.join<U>(toPathAll(...subpath)), subject);
  };

  return {
    subject,
    path,
    get: get as any,
    exists,
    join,
  };
}
