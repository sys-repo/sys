import { type t, Cli, Fs, Is, Obj, Time } from './common.ts';
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

  async check(cwd = Fs.cwd()) {
    const path = State.graphFile(cwd);
    const existing = await Graph.read(cwd);
    const graph = await Graph.build(cwd);
    const expected = Graph.snapshot(graph);
    return {
      path,
      current: isCurrent(existing, expected),
      existing,
      expected,
    };
  },

  async verify(args = {}) {
    const cwd = args.cwd ?? Fs.cwd();
    const silent = args.silent ?? false;
    if (silent) return await wrangle.assertCurrent(cwd);

    const spinner = Cli.Spinner.create('');
    const startedAt = Time.now.timestamp;
    const text = () => Cli.Fmt.spinnerText(`checking workspace graph... ${String(Time.elapsed(startedAt))}`);
    const timer = Time.interval(1000, () => (spinner.text = text()));
    spinner.start(text());
    try {
      const res = await wrangle.assertCurrent(cwd);
      spinner.stop();
      return res;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      spinner.fail(Cli.Fmt.spinnerText(`Check failed: ${err.message}`));
      throw err;
    } finally {
      timer.cancel();
      spinner.stop();
    }
  },

  async write(args) {
    const cwd = args.cwd ?? Fs.cwd();
    const path = State.graphFile(cwd);
    await Fs.ensureDir(Fs.dirname(path));
    const existing = await WorkspaceGraph.Snapshot.read(path);
    if (existing && isCurrent(existing, args.snapshot)) {
      return {
        changed: false,
        path,
        snapshot: existing,
      };
    }

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
const wrangle = {
  async assertCurrent(cwd = Fs.cwd()) {
    const res = await Graph.check(cwd);
    if (!res.existing) {
      const err = `Workspace graph missing at '${res.path}'`;
      throw new Error(`${err} — run 'deno task prep:graph'`);
    }

    if (!res.current) {
      const err = `Workspace graph is stale at '${res.path}'`;
      throw new Error(`${err} — run 'deno task prep:graph'`);
    }

    return res;
  },
} as const;

function isCurrent(a: t.WorkspaceGraph.Snapshot.Doc | undefined, b: t.WorkspaceGraph.Snapshot.Doc) {
  if (!a) return false;
  return (
    a['.meta'].schemaVersion === b['.meta'].schemaVersion &&
    a['.meta'].hash['/graph'] === b['.meta'].hash['/graph'] &&
    Obj.eql(a['.meta'].generator, b['.meta'].generator) &&
    Obj.eql(a.graph, b.graph)
  );
}
