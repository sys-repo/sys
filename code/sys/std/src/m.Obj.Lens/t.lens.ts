import { type t } from './common.ts';

type O = Record<string, unknown>;
type PathInput = t.PathLike | undefined | null;

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
