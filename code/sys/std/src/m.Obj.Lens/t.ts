import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Library surface for Obj.Path.Lens (no implementation here; types only).
 */
export type ObjLensLib = {
  /** Create an unbound lens at a path. Accepts pointer string or ObjectPath. */
  at<T = unknown>(path: t.PathLike): t.ObjLens<T>;

  /** Bind a subject at a path. */
  on<S extends O, T = unknown>(subject: S, path: t.PathLike): t.BoundObjLens<S, T>;

  /** Bind a subject at the root path []. */
  of<S extends O>(subject: S): t.BoundObjLens<S, unknown>;

  /** Readonly variants. */
  readonly ReadOnly: {
    at<T = unknown>(path: t.PathLike): t.ReadOnlyObjLens<T>;
    on<S extends O, T = unknown>(subject: S, path: t.PathLike): t.ReadOnlyBoundObjLens<S, T>;
    of<S extends O>(subject: S): t.ReadOnlyBoundObjLens<S, unknown>;
  };
};

/**
 * A passable "window/view" into a sub-tree, built on Obj.Path curry primitives.
 * No events, no .current/.change — pure get/exists and Mutate semantics.
 */

/**
 * Unbound lens (path only).
 */
export type ObjLens<T = unknown> = t.CurriedPath<T> & {
  /** Bind a subject to get a convenient handle that no longer needs the subject argument. */
  bind<S extends O>(subject: S): t.BoundObjLens<S, T>;
};

/** Bound lens (path + subject). */
export type BoundObjLens<S extends O, T = unknown> = {
  readonly subject: S;
  readonly path: t.ObjectPath;

  /** Deep get. Returns undefined when absent unless default is provided. */
  get(): T | undefined;
  get(defaultValue: t.NonUndefined<T>): T;

  /** True if the path exists irrespective of value. */
  exists(): boolean;

  /** Deep set. Creates parents as needed. Undefined deletes the property. */
  set(value: T): t.ObjDiffOp | undefined;

  /** Ensure non-undefined value at path, returning the ensured value. */
  ensure(defaultValue: t.NonUndefined<T>): T;

  /** Delete the value at path if present. */
  delete(): t.ObjDiffOp | undefined;

  /** Compose a sub-lens (shares the same subject). */
  join<U = unknown>(subpath: t.ObjectPath): t.BoundObjLens<S, U>;
};

/**
 * Readonly unbound lens (no mutation surface).
 */
export type ReadOnlyObjLens<T = unknown> = Pick<
  t.CurriedPath<T>,
  'path' | 'get' | 'exists' | 'join'
> & {
  bind<S extends O>(subject: S): t.ReadOnlyBoundObjLens<S, T>;
};

/**
 * Readonly bound lens (no mutation surface).
 */
export type ReadOnlyBoundObjLens<S extends O, T = unknown> = {
  readonly subject: S;
  readonly path: t.ObjectPath;

  get(): T | undefined;
  get(defaultValue: t.NonUndefined<T>): T;
  exists(): boolean;

  /** Compose a sub-lens (shares the same subject). */
  join<U = unknown>(subpath: t.ObjectPath): t.ReadOnlyBoundObjLens<S, U>;
};
