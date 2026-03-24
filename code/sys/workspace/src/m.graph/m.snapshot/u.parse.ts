import { type t, D, Is, Pkg } from './common.ts';

export function parseSnapshot(data: unknown): t.WorkspaceGraph.Snapshot.Doc | undefined {
  if (!Is.record<Record<string, unknown>>(data)) return undefined;
  const item = data;
  const meta = parseMeta(item['.meta']);
  const graph = parseGraph(item.graph);
  if (!meta || !graph) return undefined;
  return { '.meta': meta, graph };
}

function parseMeta(data: unknown): t.WorkspaceGraph.Snapshot.Meta | undefined {
  if (!Is.record<Record<string, unknown>>(data)) return undefined;
  const item = data;
  if (item.schemaVersion !== D.schemaVersion) return undefined;
  if (!Is.num(item.createdAt)) return undefined;
  if (item.modifiedAt !== undefined && !Is.num(item.modifiedAt)) return undefined;
  if (!Is.str(item.graphHash)) return undefined;

  const generator = parseGenerator(item.generator);
  if (!generator) return undefined;

  return {
    createdAt: item.createdAt as t.UnixTimestamp,
    ...(item.modifiedAt !== undefined ? { modifiedAt: item.modifiedAt as t.UnixTimestamp } : {}),
    schemaVersion: D.schemaVersion,
    graphHash: item.graphHash as t.StringHash,
    generator,
  };
}

function parseGenerator(data: unknown): t.WorkspaceGraph.Snapshot.Meta['generator'] | undefined {
  if (!Is.record<Record<string, unknown>>(data)) return undefined;
  const item = data;
  const pkg = parsePkg(item.pkg);
  if (!pkg || !Is.str(item.type)) return undefined;
  return { pkg, type: item.type };
}

function parsePkg(data: unknown): t.Pkg | undefined {
  if (!Pkg.Is.pkg(data)) return undefined;
  return Pkg.toPkg(data);
}

function parseGraph(data: unknown): t.WorkspaceGraph.PersistedGraph | undefined {
  if (!Is.record<Record<string, unknown>>(data)) return undefined;
  const item = data;
  if (!Array.isArray(item.orderedPaths) || !item.orderedPaths.every(Is.str)) return undefined;
  if (!Array.isArray(item.edges)) return undefined;

  const edges = item.edges
    .map((edge) => parseEdge(edge))
    .filter((edge): edge is t.WorkspaceGraph.PersistedEdge => !!edge);
  if (edges.length !== item.edges.length) return undefined;

  return {
    orderedPaths: [...item.orderedPaths] as readonly t.StringPath[],
    edges,
  };
}

function parseEdge(data: unknown): t.WorkspaceGraph.PersistedEdge | undefined {
  if (!Is.record<Record<string, unknown>>(data)) return undefined;
  const item = data;
  if (!Is.str(item.from) || !Is.str(item.to)) return undefined;
  return {
    from: item.from as t.StringPath,
    to: item.to as t.StringPath,
  };
}
