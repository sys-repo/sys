import { WorkspacePrep } from '../m.prep/mod.ts';
import { Fs, type t, Time } from './common.ts';
import { resolveJobs } from './u.jobs.ts';
import { createRunPlan } from './u.plan.ts';
import { runParallel } from './u.run.parallel.ts';
import { runSequential } from './u.run.sequential.ts';

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
  console.info(`workspace ${task} → ${plan.orderedPaths.length} packages ordered`);

  if (task === 'test' && isParallel(args)) {
    const jobs = resolveJobs({ jobs: args.strategy.jobs });
    return await runParallel({ cwd, task, plan, jobs, startedAt });
  }

  return await runSequential({ cwd, task, plan, startedAt });
}

/**
 * Helpers:
 */
async function resolveGraph(
  cwd: t.StringDir,
  args: t.WorkspaceRun.Args,
): Promise<t.WorkspaceGraph.PersistedGraph> {
  if (args.graph) {
    console.info('workspace graph → using provided graph');
    return args.graph;
  }

  if (args.rebuildGraph === true) {
    console.info('workspace graph → rebuilding');
    return await WorkspacePrep.Graph.build(cwd);
  }

  console.info('workspace graph → loading snapshot');
  const snapshot = await WorkspacePrep.Graph.read(cwd);
  if (snapshot) {
    console.info('workspace graph → using snapshot');
    return snapshot.graph;
  }

  console.info('workspace graph → snapshot missing, rebuilding');
  return await WorkspacePrep.Graph.build(cwd);
}

function isParallel(
  args: t.WorkspaceRun.Args | t.WorkspaceRun.Test.Args,
): args is t.WorkspaceRun.Test.Args & { readonly strategy: t.WorkspaceRun.Test.Strategy.Parallel } {
  return 'strategy' in args && args.strategy?.kind === 'parallel';
}
