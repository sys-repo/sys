import { type t, Cli, Fs, Time } from './common.ts';
import { Graph } from './m.Graph.ts';
import { State } from './m.State.ts';
import { Workspace } from './m.Workspace.ts';

export const WorkspacePrep: t.WorkspacePrep.Lib = {
  State,
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
    return await wrangle.runPhase(args.spinner, msg, args.silent, () => Workspace.normalize(args.cwd));
  },

  async graphPayload(args: {
    readonly cwd: t.StringDir;
    readonly graph?: t.WorkspaceGraph.PersistedGraph;
    readonly silent: boolean;
    readonly spinner: t.CliSpinner.Instance;
  }) {
    if (args.graph) return args.graph;
    const msg = 'building workspace dependency graph...';
    return await wrangle.runPhase(args.spinner, msg, args.silent, () => Graph.build(args.cwd));
  },

  async graphWrite(args: {
    readonly cwd: t.StringDir;
    readonly snapshot: t.WorkspaceGraph.Snapshot.Doc;
    readonly silent: boolean;
    readonly spinner: t.CliSpinner.Instance;
  }) {
    const msg = 'writing workspace graph snapshot...';
    return await wrangle.runPhase(args.spinner, msg, args.silent, () =>
      Graph.write({ cwd: args.cwd, snapshot: args.snapshot })
    );
  },

  async runPhase<T>(
    spinner: t.CliSpinner.Instance,
    label: string,
    silent: boolean,
    fn: () => Promise<T>,
  ) {
    if (silent) return await fn();
    console.info();
    const startedAt = Time.now.timestamp;
    const timer = Time.interval(1000, () => (spinner.text = wrangle.phaseText(label, startedAt)));
    spinner.start(Cli.Fmt.spinnerText(label));
    try {
      return await fn();
    } finally {
      timer.cancel();
      spinner.stop();
      console.info();
    }
  },

  phaseText(label: string, startedAt: number) {
    return Cli.Fmt.spinnerText(`${label} ${String(Time.elapsed(startedAt))}`);
  },
} as const;
