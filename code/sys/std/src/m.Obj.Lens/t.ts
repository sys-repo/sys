import type { t } from './common.ts';

type O = Record<string, unknown>;
type PathInput = t.PathLike | undefined | null;

/**
 * Library surface for Obj.Path.Lens (no implementation here; types only).
 */
export type ObjLensLib = {
  /** Guard checks on value types. */
  readonly Is: t.ObjLensIsLib;

  /** Create an unbound lens at a path. Accepts pointer string or ObjectPath. */
  at<T = unknown>(...path: PathInput[]): t.ObjLens<T>;

  /**
   * Bind a subject to an optional path. Equivalent to: Obj.at(path).bind(subject).
   * When `path` is omitted, binds at the root [].
   */
  bind<T = unknown, S extends O = O>(subject: S, ...path: PathInput[]): t.ObjLensRef<S, T>;

  /** Readonly variants. */
  readonly ReadOnly: {
    at<T = unknown>(...path: PathInput[]): t.ReadOnlyObjLens<T>;

    /**
     * Readonly variant of `bind`. Equivalent to: Obj.ReadOnly.at(path).bind(subject).
     * When `path` is omitted, binds at the root [].
     */
    bind<T = unknown, S extends O = O>(
      subject: S,
      ...path: PathInput[]
    ): t.ReadOnlyObjLensRef<S, T>;
  };
};

/**
 * Guard checks on value types.
 */
export type ObjLensIsLib = {
  /** Unbound lens (path-only builder). */
  lens(v?: unknown): v is t.ObjLens<unknown>;
  /** Any bound lens (read-only or writable). */
  lensRef(v?: unknown): v is t.ReadOnlyObjLensRef<any, unknown> | t.ObjLensRef<any, unknown>;
  /** Bound read-only lens. */
  lensRefReadOnly(v?: unknown): v is t.ReadOnlyObjLensRef<any, unknown>;
  /** Bound writable lens. */
  lensRefWritable(v?: unknown): v is t.ObjLensRef<any, unknown>;
  /** True if `v` is a bound lens and exposes no mutating ops. */
  readonly(v?: unknown): boolean;
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
  bind<S extends O>(subject: S): t.ObjLensRef<S, T>;
};

/** Bound lens (path + subject). */
export type ObjLensRef<S extends O = O, T = unknown> = {
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
  at<U = unknown>(...subpath: PathInput[]): t.ObjLensRef<S, U>;
};

/**
 * Readonly unbound lens (no mutation surface).
 */
export type ReadOnlyObjLens<T = unknown> = Pick<
  t.CurriedPath<T>,
  'at' | 'path' | 'get' | 'exists'
> & {
  bind<S extends O>(subject: S): t.ReadOnlyObjLensRef<S, T>;
};

/**
 * Readonly bound lens (no mutation surface).
 */
export type ReadOnlyObjLensRef<S extends O, T = unknown> = {
  readonly subject: S;
  readonly path: t.ObjectPath;

  get(): T | undefined;
  get(defaultValue: t.NonUndefined<T>): T;
  exists(): boolean;

  /** Compose a sub-lens (shares the same subject). */
  at<U = unknown>(...subpath: PathInput[]): t.ReadOnlyObjLensRef<S, U>;
};
