import type { t } from './common.ts';

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
};
