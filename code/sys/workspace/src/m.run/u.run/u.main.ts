import { WorkspacePrep } from '../../m.prep/mod.ts';
import { Cli, Fs, type t, Time } from '../common.ts';
import { formatIntroLine } from '../u/u.fmt.ts';
import { resolveJobs } from '../u/u.jobs.ts';
import { createRunPlan } from '../u/u.plan.ts';
import { createParallelReporter } from '../u/u.reporter.ts';
import { resolveCommand } from '../u/u.worker.ts';
import { createNativeTestStatsRun } from '../u.testStats/mod.ts';
import { runParallel } from './u.parallel.ts';
import { runSequential } from './u.sequential.ts';

export function runTask(
  task: 'test',
  args?: t.WorkspaceRun.Test.Args,
): Promise<t.WorkspaceRun.Result>;
export function runTask(
  task: Exclude<t.WorkspaceRun.Task, 'test'>,
  args?: t.WorkspaceRun.Args,
): Promise<t.WorkspaceRun.Result>;
export async function runTask(
  task: t.WorkspaceRun.Task,
  args: t.WorkspaceRun.Args | t.WorkspaceRun.Test.Args = {},
): Promise<t.WorkspaceRun.Result> {
  const cwd = args.cwd ?? Fs.cwd();
  const startedAt = Time.now.timestamp;
  const graph = await resolveGraph(cwd, args);
  const plan = await createRunPlan({ cwd, graph, task, filter: args.filter });
  console.info(
    formatIntroLine(`workspace ${task}`, `${plan.orderedPaths.length} packages ordered`),
  );

  const testStats = task === 'test' ? await createNativeTestStatsRun() : undefined;
  try {
    if (task === 'test' && isParallel(args)) {
      const jobs = resolveJobs({ jobs: args.strategy.jobs });
      const runnablePaths = plan.candidates
        .filter((candidate) => resolveCommand(candidate.deno, task))
        .map((candidate) => candidate.dir);
      const terminal = args.reporter === undefined
        ? Cli.Is.terminal('stdout')
        : args.reporter === 'screen';
      const reporter = createParallelReporter({ task, jobs, runnablePaths, terminal });
      reporter.start();
      try {
        return await runParallel({
          cwd,
          task,
          plan,
          jobs,
          startedAt,
          onEvent: reporter.event,
          testStats,
        });
      } finally {
        reporter.stop();
      }
    }

    return await runSequential({ cwd, task, plan, startedAt, testStats });
  } finally {
    await testStats?.cleanup();
  }
}

/**
 * Helpers:
 */
async function resolveGraph(
  cwd: t.StringDir,
  args: t.WorkspaceRun.Args,
): Promise<t.WorkspaceGraph.PersistedGraph> {
  if (args.graph) {
    console.info(formatIntroLine('workspace graph', 'using provided graph'));
    return args.graph;
  }

  if (args.rebuildGraph === true) {
    console.info(formatIntroLine('workspace graph', 'rebuilding'));
    return await WorkspacePrep.Graph.build(cwd);
  }

  console.info(formatIntroLine('workspace graph', 'loading snapshot'));
  const snapshot = await WorkspacePrep.Graph.read(cwd);
  if (snapshot) {
    console.info(formatIntroLine('workspace graph', 'using snapshot'));
    return snapshot.graph;
  }

  console.info(formatIntroLine('workspace graph', 'snapshot missing, rebuilding'));
  return await WorkspacePrep.Graph.build(cwd);
}

function isParallel(
  args: t.WorkspaceRun.Args | t.WorkspaceRun.Test.Args,
): args is t.WorkspaceRun.Test.Args & { strategy: t.WorkspaceRun.Test.Strategy.Parallel } {
  return 'strategy' in args && args.strategy?.kind === 'parallel';
}
