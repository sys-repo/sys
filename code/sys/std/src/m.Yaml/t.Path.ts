import type * as Y from 'yaml';
import type { t } from './common.ts';

type NodeOrNull = Y.Node | null | undefined;

/**
 * API namespace for working with paths that
 * reach into a parsed yaml AST.
 */
export type YamlPathLib = Readonly<{
  /** Factory for a curried path. */
  create<T = unknown>(path: t.ObjectPath): YamlPath<T>;

  /**
   * Find the deepest node whose range encloses `offset`
   * and return the logical object path leading to it.
   */
  atOffset(node: NodeOrNull, offset: t.Index, path?: t.ObjectPath): t.ObjectPath;
}>;

/**
 * Represents a path into a yaml AST (abstract syntax tree).
 */
export type YamlPath<T = unknown> = {
  /** The curried path. */
  readonly path: t.ObjectPath;

  /**
   * Deep-get helper with overloads so the return type
   * is `T | undefined` unless you pass a default value.
   */
  get(subject: t.YamlAst | undefined): T | undefined;
  get(subject: t.YamlAst | undefined, defaultValue: t.NonUndefined<T>): T;

  /**
   * Determine if the given path exists on the subject, irrespective of value.
   */
  exists(subject: t.YamlAst | undefined): boolean;

  /**
   * Deep-set helper that mutates `subject` setting a nested value at the path.
   *  - Creates intermediate objects/arrays as needed.
   *  - If `value` is `undefined`, the property is removed via [delete] rather than assigned `undefined`.
   */
  set(subject: t.YamlAst, value: T): t.ObjDiffOp | undefined;

  /**
   * Ensure a value at the path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure(subject: t.YamlAst, defaultValue: t.NonUndefined<T>): T;
};
