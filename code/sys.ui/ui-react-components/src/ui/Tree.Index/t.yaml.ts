import { type t } from './common.ts';

export type IndexTreeYamlLib = Readonly<{
  /**
   * Normalize a YAML-dialect object into a stable, ordered `TreeList`.
   * Plain objects are leaves by default; set `inferPlainObjectsAsBranches` to treat
   * mapping-only nodes as branches.
   */
  from(
    source:
      | Record<string, t.YamlTreeSourceNode>
      | ReadonlyArray<Record<string, t.YamlTreeSourceNode>>,
    options?: { inferPlainObjectsAsBranches?: boolean },
  ): t.TreeNodeList;

  /**
   * Parse YAML text in the IndexTree authoring dialect and normalize it to a `TreeList`.
   *
   * Accepts either:
   * - a root mapping: `{ Key: Node, ... }`
   * - or a root sequence of single-entry maps (to force top-level order):
   *   `- Key: Node`
   *
   * Semantics:
   * - Anything can be a leaf. An object becomes a wrapper/branch only when it contains
   *   "." (meta) or "children".
   * - Ordering: for mapping roots, relies on parser insertion order; for sequence roots,
   *   preserves the sequence order exactly.
   * - `meta.id` overrides the path segment used to build `node.key`. `meta.label` may be
   *   a string or JSX.Element and becomes `node.label`.
   *
   * @param text YAML string in the IndexTree dialect.
   * @returns Normalized `TreeList` for rendering.
   *
   * @example
   * // mapping root
   * const yaml = `
   * Getting Started: crdt:ref
   * Section:
   *   children:
   *     A: ref:a
   * `;
   * const tree = IndexTree.Yaml.parse(yaml);
   *
   * @example
   * // sequence root (explicit top-level order)
   * const yaml = `
   * - Foo: ref:foo
   * - Bar:
   *     .: { label: 'Bar (custom)', id: 'bar' }
   *     children:
   *       - Baz: ref:baz
   * `;
   * const tree = IndexTree.Yaml.parse(yaml);
   */
  parse(text: string): t.TreeNodeList;

  /**
   * Get children at a path ('', 'a/b/c', or ['a','b','c']).
   * Path segments match either the literal segment or an `id` override from `meta.id`.
   */
  at(root: t.TreeNodeList, path: t.ObjectPath): t.TreeNodeList;

  /**
   * Find a node by exact `key` (full path) or by predicate.
   */
  find(
    root: t.TreeNodeList,
    keyOr: string | ((n: { node: any; parents: ReadonlyArray<any> }) => boolean),
  ): t.TreeNode | undefined;
}>;

/**
 * IndexTree YAML source dialect.
 * Anything can be a leaf. An object is a "wrapper" (and may be a branch)
 * iff it carries "." (meta) or "children".
 *
 * @example of source YAML dialect:
 * ```yaml
 *  # Leaf (scalar)
 *  Getting Started: crdt:ref
 *
 *  # Leaf (object payload):
 *  Foo:
 *    a: 1
 *    b: 2
 *
 *  # Leaf (object payload + meta):
 *  Bar:
 *    .: { label: 'Bar (custom)' }
 *    a: 1
 *    b: 2
 *
 *  # Branch (explicit children; optional meta; plus extra data fields)
 *  Examples:
 *    .: { note: 'group', id: 'examples' }
 *    info: 'group details'    # becomes part of node.value
 *    children:
 *      - SubTree: foo
 *      - Bar: hello
 *
 *  # Branch (children as record; order comes from YAML parser’s insertion order)
 *  Section:
 *    children:
 *      A: ref:a
 *      B: ref:b
 * ```
 */
export type YamlTreeSourceList = _SourceList;
export type YamlTreeSourceWrapper = _SourceWrapper;
export type YamlTreeSourceNode = _SourceNode;

type _SourceNode = unknown | _SourceWrapper | _SourceList;
interface _SourceList extends ReadonlyArray<Readonly<Record<string, _SourceNode>>> {}
interface _SourceWrapper extends Readonly<Record<string, _SourceNode>> {
  /** Node meta ("." key). Optional; presence marks a wrapper. */
  readonly ['.']?: Readonly<Record<string, unknown>>;

  /** Children as record (unordered) or ordered list. */
  readonly children?: Readonly<Record<string, _SourceNode>> | _SourceList;

  // Optional typo guards (declare each only once):
  readonly ['. ']?: never; // trailing space
  readonly [' .']?: never; // leading space
}
