import type * as Y from 'yaml';
import type { t } from './common.ts';

type NodeOrNull = Y.Node | null | undefined;

/**
 * API namespace for working with paths that
 * reach into a parsed yaml AST.
 */
export type YamlPathLib = Readonly<{

  /**
   * Find the deepest node whose range encloses `offset`
   * and return the logical object path leading to it.
   */
  atOffset(node: NodeOrNull, offset: t.Index, path?: t.ObjectPath): t.ObjectPath;
}>;

/**
 * Represents a path into a yaml AST (abstract syntax tree).
 */
export type YamlPath = Readonly<{
  path: t.ObjectPath;
}>;
