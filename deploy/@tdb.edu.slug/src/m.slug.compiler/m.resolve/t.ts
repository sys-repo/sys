import type { t } from '../common.ts';

type O = Record<string, unknown>;
type NodeAlias = t.Alias.TableAnalysis | undefined;

/** Slug resolver lenses for common YAML and object paths. */
export type LensLib = {
  readonly yaml: t.ObjLens<string>;
  readonly alias: t.ObjLens<O>;
  readonly data: t.ObjLens<O>;
  readonly traits: t.ObjLens<t.SlugTrait[]>;
  readonly tasks: t.ObjLens<t.Task[]>;
};

/** Resolver library surface. */
export type ResolversLib = {
  readonly Lens: LensLib;
  readonly Resolve: ResolveLib;
};

/** Slug resolver helpers. */
export type ResolveLib = {
  readonly path: ResolvePathFn;
  slug(node: t.Graph.Dag.Node): O | null | undefined;
  slugParts(node: t.Graph.Dag.Node): {
    readonly alias?: O;
    readonly data?: O;
    readonly traits?: readonly t.SlugTrait[];
  };
};

/**
 * Resolve an alias-based path using:
 *   - a local resolver (subject slug)
 *   - a root/index resolver (program index)
 */
export type ResolvePathFn = (
  raw: unknown,
  local: t.Alias.Resolver | undefined,
  index?: t.Alias.Resolver,
) => t.Alias.Expand.Chain.Result | undefined;

/** Parsed slug node with derived resolver state. */
export type ParsedNode = {
  readonly node: t.Graph.Dag.Node;
  readonly isRoot: boolean;
  readonly slug?: O | null;
  readonly alias?: NodeAlias;
};

/**
 * Parser helpers.
 */
export type MakeParser = (yamlPath: t.ObjectPath) => Parser;
/** Parser for resolved slug graphs. */
export type Parser = {
  readonly Resolve: ResolveLib;
  readonly Lens: LensLib;
  parseRoot(dag: t.Graph.Dag.Result): ParsedNode;
  findParsedNode(dag: t.Graph.Dag.Result, id: t.Crdt.Id): ParsedNode | undefined;
  path(
    dag: t.Graph.Dag.Result,
    docid: t.Crdt.Id,
  ): {
    ok: boolean;
    root: ParsedNode;
    node?: ParsedNode;
    resolve(raw: string): t.Alias.Expand.Chain.Result | undefined;
  };
};
