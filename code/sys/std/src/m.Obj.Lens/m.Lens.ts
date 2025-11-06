import { type t, Path } from './common.ts';
import { bindRO, bindRW, makeCurried, toPath } from './u.ts';

type O = Record<string, unknown>;

/**
 * Obj.Path-based lenses.
 * Thin sugar over Obj.Path.curry + Mutate.
 */
export const Lens: t.ObjLensLib = {
  at<T = unknown>(path: t.PathLike): t.ObjLens<T> {
    const cur = makeCurried<T>(path);
    const bind = <S extends O>(subject: S) => bindRW<S, T>(cur, subject);
    // Spread preserves Curried surface (path/get/exists/set/ensure/delete/join)
    return { ...cur, bind } as t.ObjLens<T>;
  },

  on<S extends O, T = unknown>(subject: S, path: t.PathLike): t.BoundObjLens<S, T> {
    return Lens.at<T>(path).bind(subject);
  },

  of<S extends O>(subject: S): t.BoundObjLens<S, unknown> {
    return Lens.on<S, unknown>(subject, []);
  },

  ReadOnly: {
    at<T = unknown>(path: t.PathLike): t.ReadOnlyObjLens<T> {
      const full = Lens.at<T>(path);
      const { path: p, get, exists, join } = full;
      const bind = <S extends O>(subject: S) => bindRO<S, T>(makeCurried<T>(p), subject);
      // Strip mutators; keep readonly surface + bind
      return { path: p, get, exists, join, bind } as t.ReadOnlyObjLens<T>;
    },

    on<S extends O, T = unknown>(subject: S, path: t.PathLike): t.ReadOnlyBoundObjLens<S, T> {
      return Lens.ReadOnly.at<T>(path).bind(subject);
    },

    of<S extends O>(subject: S): t.ReadOnlyBoundObjLens<S, unknown> {
      return Lens.ReadOnly.on<S, unknown>(subject, []);
    },
  },
};
