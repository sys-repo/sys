import { type t, AliasResolver, Obj } from './common.ts';
import { makeResolvers } from './resolve/mod.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;
type NodeAlias = t.Alias.TableAnalysis | undefined;

type Dag = t.Graph.Dag.Result;
type ParsedNode = {
  readonly node: N;
  readonly isRoot: boolean;
  readonly slug?: O;
  readonly alias?: NodeAlias;
};

// export function makeParser( e: t.DocumentGraphDagHookCtx) {
export function makeParser(yamlPath: t.ObjectPath) {
  const { Lens, Resolve } = makeResolvers(yamlPath);

  /**
   * Parse a DAG node into:
   *   - slug: YAML doc.data
   *   - alias: Alias.TableAnalysis bound to slug, with alias table at ['alias']
   *
   * `isRoot` is just a flag you pass for e.dag.nodes[0] so you can
   * treat that node as the global index resolver if needed.
   */
  function parseNode(node: N, isRoot: boolean = false): ParsedNode {
    const slug = Resolve.slug(node); // doc.data | undefined
    const alias: NodeAlias = slug ? AliasResolver.analyze(slug, { alias: ['alias'] }) : undefined;
    return Obj.asGetter({ node, isRoot, slug, alias });
  }

  /**
   * Convenience: parse the DAG root once.
   */
  function parseRoot(dag: Dag): ParsedNode {
    const rootNode = dag.nodes[0];
    return parseNode(rootNode, true);
  }

  /**
   * Convenience: find and parse a node by CRDT id.
   */
  function findParsedNode(dag: Dag, id: t.Crdt.Id): ParsedNode | undefined {
    const node = dag.nodes.find((d) => d.id === id);
    return node ? parseNode(node, false) : undefined;
  }

  return {
    Resolve,
    Lens,
    parseRoot,
    findParsedNode,
  };
}
