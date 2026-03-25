import { type t, Cli, Fs } from './common.ts';
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
    const workspace = await wrangle.runPhase(
      spinner,
      'normalizing workspace...',
      silent,
      () => Workspace.normalize(cwd),
    );
    const graphPayload = args.graph ?? await wrangle.runPhase(
      spinner,
      'building workspace graph...',
      silent,
      () => Graph.build(cwd),
    );
    const snapshot = Graph.snapshot(graphPayload);
    const graph = await wrangle.runPhase(
      spinner,
      'writing workspace graph snapshot...',
      silent,
      () => Graph.write({ cwd, snapshot }),
    );
    return { workspace, graph };
  },
};

/**
 * Helpers:
 */
const wrangle = {
  async runPhase<T>(
    spinner: t.CliSpinner.Instance,
    label: string,
    silent: boolean,
    fn: () => Promise<T>,
  ) {
    if (silent) return await fn();
    spinner.start(Cli.Fmt.spinnerText(label));
    try {
      return await fn();
    } finally {
      spinner.stop();
    }
  },
} as const;
