import type { t } from './common.ts';
export type * from './t.codec.ts';
export type * from './t.curried.ts';

type O = Record<string, unknown>;

/**
 * Tools for working with objects via abstract path arrays.
 */
export type ObjPathLib = Readonly<{
  Codec: t.ObjectPathCodecLib;
  /** The default string ←→ array encode/decode helpers. */
  codec: t.ObjectPathCodec;
  /** Encode using the default codec. */
  encode: t.ObjectPathCodec['encode'];
  /** Decode using the default codec. */
  decode: t.ObjectPathCodec['decode'];

  /** Tools for mutating an object in-place. */ Mutate: ObjPathMutateLib;

  /** Create a new curried-path instance for the given path. */
  curry: t.CurriedPathLib['create'];

  /**
   * Deep-get helper with overloads so the return type
   * is `T | undefined` unless you pass a default value.
   */
  get<T = unknown>(subject: O | undefined, path: t.ObjectPath): T | undefined;
  get<T = unknown>(subject: O | undefined, path: t.ObjectPath, defaultValue: t.NonUndefined<T>): T;

  /**
   * Determine if the given path exists on the subject, irrespective of value.
   */
  exists(subject: O | undefined, path: t.ObjectPath): boolean;
}>;

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
export type ObjPathMutateLib = Readonly<{
  /**
   * Deep-set helper that mutates `subject` setting a nested value at the `path`.
   *  - Creates intermediate objects/arrays as needed.
   *  - If `value` is `undefined`, the property is removed via [delete] rather than assigned `undefined`.
   */
  set<T = unknown>(subject: O, path: t.ObjectPath, value: T): t.ObjDiffOp | undefined;

  /**
   * Ensure a value at the given path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure<T = unknown>(subject: O, path: t.ObjectPath, defaultValue: t.NonUndefined<T>): T;

  /**
   * Deletes the value at the given path if it exists.
   */
  delete(subject: O, path: t.ObjectPath): t.ObjDiffOp | undefined;

  /**
   * Mutate `target` in-place so that, once the function returns,
   * `target` is a deep structural clone of `source`.
   *
   *  - Uses {@link Obj.Path.Mutate.set} for every write/delete.
   *  - Walks objects deeply; whole arrays are replaced when they differ (unless `diffArrays` is true).
   *  - No external dependencies, deterministic, and ~75 LOC.
   */
  diff<T extends O = O>(source: T, target: T, options?: t.ObjDiffOptions): t.ObjDiffReport;
}>;

/** Options passed to `Obj.Path.diff` method. */
export type ObjDiffOptions = { diffArrays?: boolean };

/**
 * A JSON-serialisable description of one structural change.
 */
export type ObjDiffOp =
  | { type: 'add'; path: t.ObjectPath; value: unknown } //                        ← key existed only in → source
  | { type: 'remove'; path: t.ObjectPath; prev: unknown } //                      ← key existed only in → target
  | { type: 'update'; path: t.ObjectPath; prev: unknown; next: unknown } //       ← primitive / object leaf changed
  | { type: 'array'; path: t.ObjectPath; prev: unknown[]; next: unknown[] }; //   ← whole array replaced

/**
 * Aggregate result returned `Obj.diff`.
 */
export type ObjDiffReport = {
  /** Ordered list of operations in the sequence they were applied. */
  readonly ops: ObjDiffOp[];
  /** Summary stats of operations: */
  readonly stats: {
    readonly adds: number;
    readonly removes: number;
    readonly updates: number;
    readonly arrays: number;
    readonly total: number;
  };
};
