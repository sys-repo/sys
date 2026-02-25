import { type t, AliasResolver, Is, Obj, Yaml } from './common.ts';
import { resolveAliasPath } from './u.path.alias.ts';
import { makeResolvers } from './u.resolve.ts';

type DagNode = { id: string; doc?: { current?: string | undefined } };
type Dag = { nodes: DagNode[] };
type ParsedNode = {
  node: DagNode;
  isRoot: boolean;
  slug?: Record<string, unknown> | null;
  alias?: ReturnType<typeof AliasResolver.analyze>;
};

export function makeParser(yamlPath: t.ObjectPath) {
  const { Lens, Resolve } = makeResolvers(yamlPath);

  function parseNode(node: DagNode, isRoot = false): ParsedNode {
    const slug = Resolve.slug(node);
    const alias = slug ? AliasResolver.analyze(slug, { alias: ['alias'] }) : undefined;
    return Obj.asGetter({ node, isRoot, slug, alias });
  }

  function parseRoot(dag: Dag) {
    return parseNode(dag.nodes[0], true);
  }

  function findParsedNode(dag: Dag, docid: string): ParsedNode | undefined {
    const node = dag.nodes.find((d) => d.id === docid);
    return node ? parseNode(node, false) : undefined;
  }

  function path(dag: Dag, docid: string) {
    const root = parseRoot(dag);
    const node = findParsedNode(dag, docid);
    const index = resolveIndexResolver(dag, root, node);
    const local = node?.alias?.resolver;
    const resolve = (raw: string) => resolveAliasPath(raw, local, index);
    const ok = !!node && !!local && !!index;
    return { ok, root, node, resolve };
  }

  return { Resolve, Lens, path, parseRoot, findParsedNode } as const;
}

function resolveIndexResolver(
  dag: Dag,
  root: ParsedNode,
  node?: ParsedNode,
) {
  const fallback = root.alias?.resolver;
  const local = node?.alias?.resolver;
  const rawIndex = local?.alias?.[':index'];
  if (!Is.str(rawIndex) || rawIndex.length === 0) return fallback;

  const ref = normalizeIndexRef(rawIndex);
  const match = dag.nodes.find((d) => d.id === ref);
  if (!match) return fallback;

  const rawYaml = match.doc?.current;
  if (!Is.str(rawYaml)) return fallback;
  const parsedYaml = Yaml.parse<Record<string, unknown>>(rawYaml).data;
  if (!Is.record(parsedYaml)) return fallback;

  const parsed = AliasResolver.analyze(parsedYaml, { alias: ['alias'] });
  return parsed.resolver ?? fallback;
}

function normalizeIndexRef(value: string): string {
  const raw = String(value ?? '').trim();
  if (raw.startsWith('urn:crdt:')) return `crdt:${raw.slice('urn:crdt:'.length)}`;
  if (raw.startsWith('crdt:')) return raw;
  return `crdt:${raw}`;
}
