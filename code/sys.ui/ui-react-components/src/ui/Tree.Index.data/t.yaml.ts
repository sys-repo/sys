import { type t } from './common.ts';

/**
 * Namespace of YAML adapter tools.
 */
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
}>;

/**
 * IndexTree YAML source dialect.
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
