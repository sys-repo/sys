import { type t } from './common.ts';
import { bindRO } from './u.bindRO.ts';
import { bindRW } from './u.bindRW.ts';
import { makeCurriedAll } from './u.path.ts';

type PathInput = t.PathLike | undefined | null;

/**
 * Obj.Path-based lenses.
 * Thin sugar over Obj.Path.curry + Mutate.
 */
export const Lens: t.ObjLensLib = {
  /** Create an unbound lens at a path. Accepts pointer string or ObjectPath. */
  at<T = unknown>(...path: PathInput[]): t.ObjLens<T> {
    const cur = makeCurriedAll<T>(...path);
    const bind = <S extends Record<string, unknown>>(subject: S) => bindRW<S, T>(cur, subject);
    // Spread preserves Curried surface (path/get/exists/set/ensure/delete/join)
    return { ...cur, bind } as t.ObjLens<T>;
  },

  /**
   * Bind a subject to an optional path. Equivalent to: Lens.at(path...).bind(subject).
   * When no path segments are supplied or only null/undefined are given, binds at the root [].
   */
  bind<S extends Record<string, unknown>, T = unknown>(
    subject: S,
    ...path: PathInput[]
  ): t.ObjLensRef<S, T> {
    return this.at<T>(...path).bind(subject);
  },

  /** Readonly variants. */
  ReadOnly: {
    at<T = unknown>(...path: PathInput[]): t.ReadOnlyObjLens<T> {
      const cur = makeCurriedAll<T>(...path);
      const { path: p, get, exists, at: join } = cur;
      const bind = <S extends Record<string, unknown>>(subject: S) => bindRO<S, T>(cur, subject);
      // Return only the readonly surface + bind
      return { path: p, get, exists, at: join, bind } as t.ReadOnlyObjLens<T>;
    },

    /**
     * Readonly variant of `bind`. Equivalent to: Lens.ReadOnly.at(path...).bind(subject).
     * When no path segments are supplied or only null/undefined are given, binds at the root [].
     */
    bind<S extends Record<string, unknown>, T = unknown>(
      subject: S,
      ...path: PathInput[]
    ): t.ReadOnlyObjLensRef<S, T> {
      return this.at<T>(...path).bind(subject);
    },
  },
};
