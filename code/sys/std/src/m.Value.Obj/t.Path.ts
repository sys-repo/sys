import { type t } from './common.ts';

export type KeyMap = Record<string, unknown>;

/**
 * Tools for working with objects via abstract path arrays.
 */
export type ObjPathLib = {
  /**
   * Deep-get helper with overloads so the return type
   * is `T | undefined` **unless** you pass a default value.
   */
  get<T = unknown>(subject: unknown, path: t.ObjectPath): T | undefined;
  get<T = unknown>(subject: unknown, path: t.ObjectPath, defaultValue: NonNullable<T>): T;

  /**
   * Deep-set helper (mutates `subject` in-place, relying on
   * proxy layers to record structural changes).
   */
  mutate<T = unknown>(subject: KeyMap, path: t.ObjectPath, value: T): void;
};
