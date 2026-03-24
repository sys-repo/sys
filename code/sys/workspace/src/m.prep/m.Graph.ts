import { type t, Fs, Is, Obj } from './common.ts';
import { WorkspaceGraph } from '../m.graph/mod.ts';
import { State } from './m.State.ts';

export const Graph: t.WorkspacePrep.Graph.Lib = {
  async build(cwd = Fs.cwd()) {
    const deno = (await Fs.readJson<Record<string, unknown>>(State.workspaceFile(cwd))).data ?? {};
    const workspace = Array.isArray(deno.workspace) ? deno.workspace.filter(Is.str) : [];
    const include = workspace.map((path) => `${path}/deno.json`);

    const graph = await WorkspaceGraph.collect({ cwd, source: { include } });
    const packages = WorkspaceGraph.packageEdges(graph);
    const ordered = WorkspaceGraph.order(packages);
    if (!ordered.ok) {
      if ('invalid' in ordered) {
        const keys = ordered.invalid.keys.join(', ');
        const err = `Workspace.Prep.Graph.build: failed to order workspace paths (${ordered.invalid.code}): ${keys}`;
        throw new Error(err);
      }
      const err = `Workspace.Prep.Graph.build: failed to order workspace paths (cycle): ${ordered.cycle.keys.join(', ')}`;
      throw new Error(err);
    }

    return {
      orderedPaths: ordered.items.map((item) => item.package.path),
      edges: packages.edges.map((edge) => ({ from: edge.from, to: edge.to })),
    };
  },

  snapshot(graph) {
    return WorkspaceGraph.Snapshot.create({ graph });
  },

  read(cwd = Fs.cwd()) {
    return WorkspaceGraph.Snapshot.read(State.graphFile(cwd));
  },

  async write(args) {
    const cwd = args.cwd ?? Fs.cwd();
    const path = State.graphFile(cwd);
    await Fs.ensureDir(Fs.dirname(path));
    const existing = await WorkspaceGraph.Snapshot.read(path);
    const written = await WorkspaceGraph.Snapshot.write(args.snapshot, path);
    return {
      changed: !isCurrent(existing, written),
      path,
      snapshot: written,
    };
  },

  async ensure(args = {}) {
    const graph = args.graph ?? (await Graph.build(args.cwd));
    const snapshot = Graph.snapshot(graph);
    return Graph.write({ cwd: args.cwd, snapshot });
  },
};

/**
 * Helpers:
 */
function isCurrent(a: t.WorkspaceGraph.Snapshot.Doc | undefined, b: t.WorkspaceGraph.Snapshot.Doc) {
  if (!a) return false;
  return (
    a['.meta'].schemaVersion === b['.meta'].schemaVersion &&
    a['.meta'].hash.graph === b['.meta'].hash.graph &&
    Obj.eql(a['.meta'].generator, b['.meta'].generator) &&
    Obj.eql(a.graph, b.graph)
  );
}
