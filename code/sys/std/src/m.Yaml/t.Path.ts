import type { t } from './common.ts';

type NodeOrNil = t.Yaml.Node | null | undefined;

/**
 * API namespace for working with paths that
 * reach into a parsed yaml AST.
 */
export type YamlPathLib = {
  /** Factory for a curried path. */
  create<T = unknown>(path: t.ObjectPath): YamlPath<T>;

  /**
   * Find the deepest node whose range encloses `offset`
   * and return the logical object path leading to it.
   */
  atOffset(node: NodeOrNil, offset: t.Index, path?: t.ObjectPath): t.ObjectPath;

  /**
   * Resolve a logical object path to a YAML AST node (if any).
   */
  atPath(ast: t.YamlAst, path: t.ObjectPath): t.Yaml.Node | undefined;
};

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

  /**
   * Deletes the value at the given path if it exists.
   */
  delete(subject: t.YamlAst): t.ObjDiffOp | undefined;

  /**
   * Creates a new curried path combining this path as the root
   * and the given sub-path.
   */
  join<T = unknown>(subpath: t.ObjectPath): YamlPath<T>;
};
