import { type t, c, Cli, Fs, Is, Obj, Str, Time } from './common.ts';
import { WorkspaceGraph } from '../m.graph/mod.ts';
import { State } from './m.State.ts';
import { runPhase } from '../u.phase.ts';

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
    const spinner = Cli.Spinner.create('');
    return runPhase({
      spinner,
      label: 'checking workspace graph...',
      silent,
      fn: () => wrangle.assertCurrent(cwd),
      fail: (error) => `Check failed: ${error.message}`,
    });
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
    const cwd = args.cwd ?? Fs.cwd();
    const silent = args.silent ?? false;
    const ensureStartedAt = Time.now.timestamp;
    const spinner = Cli.Spinner.create('');
    const graph = args.graph ?? await runPhase({
      spinner,
      label: 'building workspace dependency graph...',
      silent,
      fn: () => Graph.build(cwd),
    });
    const snapshot = Graph.snapshot(graph);
    return runPhase({
      spinner,
      label: 'writing workspace graph snapshot...',
      silent,
      fn: () => Graph.write({ cwd, snapshot }),
      done: (res) =>
        wrangle.done({
          cwd,
          graph,
          path: res.path,
          changed: res.changed,
          startedAt: ensureStartedAt,
        }),
    });
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

  async done(args: {
    readonly cwd: t.StringDir;
    readonly graph: t.WorkspaceGraph.PersistedGraph;
    readonly path: t.StringPath;
    readonly changed: boolean;
    readonly startedAt: number;
  }) {
    const path = c.gray(Fs.trimCwd(args.path, { cwd: args.cwd, prefix: true }));
    const stats = await Fs.stat(args.path);
    const size = Str.bytes(stats?.size ?? 0);
    const nodes = args.graph.orderedPaths.length;
    const summary = `${nodes} ${Str.plural(nodes, 'node')}, ${size}`;
    const state = args.changed ? '' : ' (no change)';
    const elapsed = c.dim(
      c.gray(
        ` ${summary} in ${String(Time.elapsed(args.startedAt))}${state}`,
      ),
    );
    const done = `${c.green('done:')} ${path}${elapsed}`;
    if (!args.changed) return done;

    const commit = `chore(workspace): refresh generated workspace graph snapshot (${summary})`;
    const suggestion = Cli.Fmt.Commit.suggestion(commit, {
      title: { text: 'suggested commit msg:', color: 'cyan', bold: false },
      message: { color: 'white' },
    });
    return `${done}\n\n${suggestion}\n`;
  },
} as const;

function isCurrent(a: t.WorkspaceGraph.Snapshot.Doc | undefined, b: t.WorkspaceGraph.Snapshot.Doc) {
  if (!a) return false;
  return (
    a['.meta'].schemaVersion === b['.meta'].schemaVersion &&
    Obj.eql(a['.meta'].hash, b['.meta'].hash) &&
    Obj.eql(a['.meta'].generator, b['.meta'].generator) &&
    Obj.eql(a.graph, b.graph)
  );
}
