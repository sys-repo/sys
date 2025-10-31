import { type t, Path } from './common.ts';
import { joinAll } from './u.ts';

export function makeLens<T, P, V>(doc: t.Immutable<T, P>, path: t.ObjectPath): t.Lens<T, P, V> {
  const get = (): V | undefined =>
    Path.get<V>(doc.current as unknown as Record<string, unknown>, path);

  const getOr = <D extends t.NonUndefined<V>>(def: D): V | D => {
    const v = get();
    return (v === undefined ? def : v) as V | D;
  };

  const exists = () => Path.exists(doc.current as unknown as Record<string, unknown>, path);

  const set = (value: V) =>
    doc.change((draft: unknown) => {
      Path.Mutate.set(draft as Record<string, unknown>, path, value);
    });

  const update = (map: (curr: V | undefined) => V) =>
    doc.change((draft: unknown) => {
      const curr = Path.get<V>(draft as Record<string, unknown>, path);
      Path.Mutate.set(draft as Record<string, unknown>, path, map(curr));
    });

  const ensure = <D extends t.NonUndefined<V>>(def: D): V | D => {
    const curr = get();
    if (curr !== undefined) return curr as V | D;
    doc.change((draft: unknown) => {
      Path.Mutate.set(draft as Record<string, unknown>, path, def as unknown as V);
    });
    return getOr(def);
  };

  const del = () =>
    doc.change((draft: unknown) => {
      Path.Mutate.delete(draft as Record<string, unknown>, path);
    });

  const child = <U = unknown>(sub: t.ObjectPath) =>
    makeLens<T, P, U>(doc, Path.join(path, sub, 'absolute'));

  const as = <U = unknown>() => makeLens<T, P, U>(doc, path);

  const at = <U = unknown>(...segments: t.ObjectPath[]) =>
    makeLens<T, P, U>(doc, joinAll(path, segments));

  /**
   * API:
   */
  return {
    get doc() {
      return doc;
    },
    path,
    get,
    getOr,
    exists,
    set,
    update,
    ensure,
    delete: del,
    child,
    as,
    at,
  };
}
