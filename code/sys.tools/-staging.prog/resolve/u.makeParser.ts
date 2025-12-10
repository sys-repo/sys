import { type t, AliasResolver, Obj } from '../common.ts';
import { resolvePath } from './u.resolve.path.ts';
import { makeResolvers } from './u.resolve.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;
type NodeAlias = t.Alias.TableAnalysis | undefined;
type Dag = t.Graph.Dag.Result;

export const makeParser: t.MakeParser = (yamlPath: t.ObjectPath) => {
  const { Lens, Resolve } = makeResolvers(yamlPath);

  /**
   * Parse a DAG node into:
   *   - slug: YAML doc.data
   *   - alias: Alias.TableAnalysis bound to slug, with alias table at ['alias']
   *
   * `isRoot` is just a flag you pass for e.dag.nodes[0] so you can
   * treat that node as the global index resolver if needed.
   */
  function parseNode(node: N, isRoot: boolean = false): t.ParsedNode {
    const slug = Resolve.slug(node); // doc.data | undefined
    const alias: NodeAlias = slug ? AliasResolver.analyze(slug, { alias: ['alias'] }) : undefined;
    return Obj.asGetter({ node, isRoot, slug, alias });
  }

  /**
   * Convenience: parse the DAG root once.
   */
  function parseRoot(dag: Dag): t.ParsedNode {
    const rootNode = dag.nodes[0];
    return parseNode(rootNode, true);
  }

  /**
   * Convenience: find and parse a node by CRDT id.
   */
  function findParsedNode(dag: Dag, docid: t.Crdt.Id): t.ParsedNode | undefined {
    const node = dag.nodes.find((d) => d.id === docid);
    return node ? parseNode(node, false) : undefined;
  }

  /**
   * Convenience: curry the root and node resolvers for path resolution.
   */
  function path(dag: Dag, docid: t.Crdt.Id) {
    const root = parseRoot(dag);
    const node = findParsedNode(dag, docid);
    const index = root.alias?.resolver;
    const local = node?.alias?.resolver;
    const resolve = (raw: string) => resolvePath(raw, local, index);
    const ok = !!node && !!local && !!index;
    return { ok, root, node, resolve };
  }

  /** Finish up. */
  const api: t.Parser = {
    Resolve,
    Lens,
    path,
    parseRoot,
    findParsedNode,
  };
  return api;
};
