import { type t } from './common.ts';
import { bindRO, bindRW, makeCurried } from './u.ts';

type O = Record<string, unknown>;

/**
 * Obj.Path-based lenses.
 * Thin sugar over Obj.Path.curry + Mutate.
 */
export const Lens: t.ObjLensLib = {
  /** Create an unbound lens at a path. Accepts pointer string or ObjectPath. */
  at<T = unknown>(path: t.PathLike): t.ObjLens<T> {
    const cur = makeCurried<T>(path);
    const bind = <S extends O>(subject: S) => bindRW<S, T>(cur, subject);
    // Spread preserves Curried surface (path/get/exists/set/ensure/delete/join)
    return { ...cur, bind } as t.ObjLens<T>;
  },

  // 🌸 ---------- ADDED: root-level-bind-sugar ----------
  /**
   * Bind a subject to an optional path. Equivalent to: Lens.at(path).bind(subject).
   * When `path` is omitted, binds at the root [].
   */
  bind<S extends O, T = unknown>(subject: S, path?: t.PathLike): t.BoundObjLens<S, T> {
    const p = path ?? [];
    return this.at<T>(p).bind(subject);
  },
  // 🌸 ---------- /ADDED ----------

  /** Readonly variants. */
  ReadOnly: {
    at<T = unknown>(path: t.PathLike): t.ReadOnlyObjLens<T> {
      const cur = makeCurried<T>(path);
      const { path: p, get, exists, join } = cur;
      const bind = <S extends O>(subject: S) => bindRO<S, T>(cur, subject);
      // Return only the readonly surface + bind
      return { path: p, get, exists, join, bind } as t.ReadOnlyObjLens<T>;
    },

    // 🌸 ---------- ADDED: root-level-readonly-bind-sugar ----------
    /**
     * Readonly variant of `bind`. Equivalent to: Lens.ReadOnly.at(path).bind(subject).
     * When `path` is omitted, binds at the root [].
     */
    bind<S extends O, T = unknown>(subject: S, path?: t.PathLike): t.ReadOnlyBoundObjLens<S, T> {
      const p = path ?? [];
      return this.at<T>(p).bind(subject);
    },
    // 🌸 ---------- /ADDED ----------
  },
};
