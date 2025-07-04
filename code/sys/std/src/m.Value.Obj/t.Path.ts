import type { t } from './common.ts';

type O = Record<string, unknown>;
type KeyMap = Record<string, unknown>;

/**
 * Tools for working with objects via abstract path arrays.
 */
export type ObjPathLib = {
  readonly Mutate: ObjPathMutateLib;

  /**
   * Deep-get helper with overloads so the return type
   * is `T | undefined` **unless** you pass a default value.
   */
  get<T = unknown>(subject: unknown, path: t.ObjectPath): T | undefined;
  get<T = unknown>(subject: unknown, path: t.ObjectPath, defaultValue: t.NonUndefined<T>): T;

  /**
   * Determine if the given path exists on the subject, irrespective of value.
   */
  exists(subject: unknown, path: t.ObjectPath): boolean;

  /**
   * Deep-set helper (mutates `subject` in-place, relying on
   * proxy layers to record structural changes).
   */
  readonly mutate: ObjPathMutateLib['set'];
};

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
export type ObjPathMutateLib = {
  /**
   * Ensure a value at the given path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure<T = unknown>(subject: KeyMap, path: t.ObjectPath, defaultValue: t.NonUndefined<T>): T;

  /**
   * Mutates `subject`, setting a nested value at `path`.
   *  - Creates intermediate objects/arrays as needed.
   *  - If `value` is `undefined`, the property is removed via [delete] instead.
   */
  set<T = unknown>(subject: KeyMap, path: t.ObjectPath, value: T): void;

  /**
   * Mutate `target` in-place so that, once the function returns,
   * `target` is a deep structural clone of `source`.
   *
   *  - Uses {@link Obj.Path.Mutate.set} for every write/delete.
   *  - Walks objects deeply; whole arrays are replaced when they differ.
   *  - No external dependencies, deterministic, and ~75 LOC.
   */
  diff<T extends O = O>(source: T, target: T): ObjDiffReport;
};

/**
 * A JSON-serialisable description of one structural change.
 */
export type ObjDiffOp =
  | { type: 'add'; path: t.ObjectPath; value: unknown } // key existed only in → source
  | { type: 'remove'; path: t.ObjectPath; prev: unknown } // key existed only in → target
  | { type: 'update'; path: t.ObjectPath; prev: unknown; next: unknown } // primitive / object leaf changed
  | { type: 'array'; path: t.ObjectPath; prev: unknown[]; next: unknown[] }; // whole array replaced

/**
 * Aggregate result returned by `diffWithReport`.
 */
export type ObjDiffReport = {
  /** Ordered list of operations in the sequence they were applied. */
  ops: ObjDiffOp[];
  /** Quick stats for dashboards / logs. */
  stats: {
    adds: number;
    removes: number;
    updates: number;
    arrays: number;
    total: number;
  };
};
