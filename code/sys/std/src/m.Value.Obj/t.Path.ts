import { type t } from './common.ts';

export type KeyMap = Record<string, unknown>;

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
  get<T = unknown>(subject: unknown, path: t.ObjectPath, defaultValue: NonNullable<T>): T;
};

/**
 * Tools that mutate an object in-place using
 * an abstract path arrays.
 */
export type ObjPathMutateLib = {
  /**
   * Deep-set helper (mutates `subject` in-place, relying on
   * proxy layers to record structural changes).
   */
  set<T = unknown>(subject: KeyMap, path: t.ObjectPath, value: T): void;
};
