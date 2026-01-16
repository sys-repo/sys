import type { t } from '../common.ts';

type O = Record<string, unknown>;
type NodeAlias = t.Alias.TableAnalysis | undefined;

export type LensLib = {
  readonly yaml: t.ObjLens<string>;
  readonly alias: t.ObjLens<O>;
  readonly data: t.ObjLens<O>;
  readonly traits: t.ObjLens<t.SlugTrait[]>;
  readonly tasks: t.ObjLens<t.Task[]>;
};

export type ResolversLib = {
  readonly Lens: LensLib;
  readonly Resolve: ResolveLib;
};

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
