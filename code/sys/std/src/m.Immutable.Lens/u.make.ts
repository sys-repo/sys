import { type t, Path } from './common.ts';

type O = Record<string, unknown>;

export function makeLens<T, P, V>(doc: t.Immutable<T, P>, path: t.ObjectPath): t.Lens<T, P, V> {
  function get(): V | undefined {
    return Path.get<V>(doc.current as unknown as O, path);
  }

  function getOr<D extends t.NonUndefined<V>>(def: D): V | D {
    const v = get();
    return (v === undefined ? def : v) as V | D;
  }

  function exists(): boolean {
    return Path.exists(doc.current as unknown as O, path);
  }

  function set(value: V): void {
    doc.change((draft: unknown) => Path.Mutate.set(draft as O, path, value));
  }

  function update(map: (curr?: V) => V): void {
    doc.change((draft: unknown) => {
      const curr = Path.get<V>(draft as O, path);
      Path.Mutate.set(draft as O, path, map(curr));
    });
  }

  function ensure<D extends t.NonUndefined<V>>(def: D): V | D {
    const curr = get();
    if (curr !== undefined) return curr as V | D;
    doc.change((draft: unknown) => Path.Mutate.set(draft as O, path, def as unknown as V));
    return getOr(def);
  }

  function del(): void {
    doc.change((draft: unknown) => Path.Mutate.delete(draft as O, path));
  }

  function child<U = unknown>(sub: t.ObjectPath) {
    return makeLens<T, P, U>(doc, Path.joinAll(path, sub));
  }

  function as<U = unknown>() {
    return makeLens<T, P, U>(doc, path);
  }

  function at<U = unknown>(...segments: t.ObjectPath[]) {
    const joined = Path.joinAll(path, ...segments);
    return makeLens<T, P, U>(doc, joined);
  }

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
