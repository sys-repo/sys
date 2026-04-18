import { Cli, Fs, type t } from './common.ts';
import { PrepDeps as Deps } from './m.Deps.ts';
import { Fmt } from './m.Fmt.ts';
import { Graph } from './m.Graph.ts';
import { State } from './m.State.ts';
import { Workspace } from './m.Workspace.ts';
import { runPhase } from '../u.phase.ts';

export const WorkspacePrep: t.WorkspacePrep.Lib = {
  State,
  Deps,
  Fmt,
  Graph,
  Workspace,
  async run(args = {}) {
    const cwd = args.cwd ?? Fs.cwd();
    const silent = args.silent ?? false;
    const spinner = Cli.Spinner.create('');
    const workspace = await wrangle.workspace({ cwd, silent, spinner });
    const graphPayload = await wrangle.graphPayload({ cwd, graph: args.graph, silent, spinner });
    const snapshot = Graph.snapshot(graphPayload);
    const graph = await wrangle.graphWrite({ cwd, snapshot, silent, spinner });
    return { workspace, graph };
  },
};

/**
 * Helpers:
 */
const wrangle = {
  async workspace(args: {
    readonly cwd: t.StringDir;
    readonly silent: boolean;
    readonly spinner: t.CliSpinner.Instance;
  }) {
    const msg = 'normalizing workspace...';
    return await runPhase({
      spinner: args.spinner,
      label: msg,
      silent: args.silent,
      fn: () => Workspace.normalize(args.cwd),
    });
  },

  async graphPayload(args: {
    readonly cwd: t.StringDir;
    readonly graph?: t.WorkspaceGraph.PersistedGraph;
    readonly silent: boolean;
    readonly spinner: t.CliSpinner.Instance;
  }) {
    if (args.graph) return args.graph;
    const msg = 'building workspace dependency graph...';
    return await runPhase({
      spinner: args.spinner,
      label: msg,
      silent: args.silent,
      fn: () => Graph.build(args.cwd),
    });
  },

  async graphWrite(args: {
    readonly cwd: t.StringDir;
    readonly snapshot: t.WorkspaceGraph.Snapshot.Doc;
    readonly silent: boolean;
    readonly spinner: t.CliSpinner.Instance;
  }) {
    const msg = 'writing workspace graph snapshot...';
    return await runPhase({
      spinner: args.spinner,
      label: msg,
      silent: args.silent,
      fn: () => Graph.write({ cwd: args.cwd, snapshot: args.snapshot }),
    });
  },
} as const;
