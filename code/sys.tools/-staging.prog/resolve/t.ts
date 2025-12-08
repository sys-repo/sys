import type { t } from '../common.ts';

type Dag = t.Graph.Dag.Result;
type O = Record<string, unknown>;
type N = t.Graph.Dag.Node;
type NodeAlias = t.Alias.TableAnalysis | undefined;

export type LensLib = {
  readonly yaml: t.ObjLens<string>;
  readonly alias: t.ObjLens<O>;
  readonly sequence: t.ObjLens<O[]>;
  readonly tasks: t.ObjLens<t.Task[]>;
};

export type ResolversLib = {
  readonly Lens: LensLib;
  readonly Resolve: ResolveLib;
};

export type ResolveLib = {
  readonly path: ResolvePathFn;
  slug(node: N): O | null | undefined;
  slugParts(node: N): { alias?: O; sequence?: O[] };
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
  readonly node: N;
  readonly isRoot: boolean;
  readonly slug?: O | null;
  readonly alias?: NodeAlias;
};

/**
 * Parser helpers.
 */
export type MakeParserFn = (yamlPath: t.ObjectPath) => Parser;
export type Parser = {
  readonly Resolve: ResolveLib;
  readonly Lens: LensLib;
  parseRoot(dag: Dag): ParsedNode;
  findParsedNode(dag: Dag, id: t.Crdt.Id): ParsedNode | undefined;
};
