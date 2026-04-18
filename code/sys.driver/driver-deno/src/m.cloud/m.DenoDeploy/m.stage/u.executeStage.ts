import { FILE, renderStageEntrypoints } from './-tmpl/mod.ts';
import { type t, DenoFile, Fs, Time, Workspace } from './common.ts';
import { buildStageTarget } from './u.buildStageTarget.ts';
import { closureFromGraph } from './u.closureFromGraph.ts';
import { ensureStageDriverDenoImport } from './u.ensureStageDriverDenoImport.ts';
import { materializeWorkspace } from './u.materializeWorkspace.ts';
import { resolveStageRoot } from './u.resolveStageRoot.ts';
import { resolveStageTarget } from './u.resolveStageTarget.ts';
import { rewriteStageWorkspace } from './u.rewriteStageWorkspace.ts';

type StageContext = {
  readonly workspace: t.DenoWorkspace;
  readonly target: { readonly absolute: t.StringDir; readonly relative: t.StringRelativeDir };
  readonly root: t.StringDir;
};

type StageHooks = {
  readonly onRoot?: (ctx: StageContext) => Promise<void> | void;
  readonly onBuildStart?: (ctx: StageContext) => Promise<void> | void;
  readonly onBuildDone?: (
    ctx: StageContext & { readonly elapsed: t.Msecs },
  ) => Promise<void> | void;
  readonly onBuildFailed?: (
    ctx: StageContext & { readonly elapsed: t.Msecs; readonly error: unknown },
  ) => Promise<void> | void;
  readonly onStageStart?: (ctx: StageContext) => Promise<void> | void;
  readonly onStageDone?: (
    result: t.DenoDeploy.Stage.Result & { readonly elapsed: t.Msecs },
  ) => Promise<void> | void;
  readonly onStageFailed?: (
    ctx: StageContext & { readonly elapsed: t.Msecs; readonly error: unknown },
  ) => Promise<void> | void;
};

const STAGE_RUNTIME_PACKAGES = ['code/sys.driver/driver-deno'] as const;

export async function executeStage(
  request: t.DenoDeploy.Stage.Request,
  hooks: StageHooks = {},
): Promise<t.DenoDeploy.Stage.Result> {
  const { workspace, target } = await resolveStageTarget(request);
  const root = await resolveStageRoot(workspace.dir, request.root);
  const graph = await Workspace.Prep.Graph.ensure({ cwd: workspace.dir, silent: true });
  const snapshot = graph.snapshot;
  const retain = wrangle.retainPackages(snapshot.graph, target.relative);
  const shouldBuild = await wrangle.shouldBuildTarget(target.absolute);
  const ctx = { workspace, target, root } as const;

  await hooks.onRoot?.(ctx);

  const buildStartedAt: t.Msecs = Time.now.timestamp;
  if (shouldBuild) {
    await hooks.onBuildStart?.(ctx);
    try {
      await buildStageTarget(target.absolute);
    } catch (error) {
      await hooks.onBuildFailed?.({
        ...ctx,
        elapsed: Time.elapsed(buildStartedAt).msec,
        error,
      });
      throw error;
    }
    await hooks.onBuildDone?.({ ...ctx, elapsed: Time.elapsed(buildStartedAt).msec });
  }

  await hooks.onStageStart?.(ctx);
  const stageStartedAt: t.Msecs = Time.now.timestamp;
  try {
    await materializeWorkspace({ source: workspace.dir, root, retain });
    await rewriteStageWorkspace(root, retain);
    await ensureStageDriverDenoImport(root, retain);

    const rendered = renderStageEntrypoints(target.relative);
    const entry = Fs.join(root, FILE.entry);
    const entryPaths = Fs.join(root, FILE.entryPaths);
    await Fs.write(entry, rendered.entry, { force: true });
    await Fs.write(entryPaths, rendered.entryPaths, { force: true });

    const result = {
      target: { dir: target.absolute },
      workspace,
      root,
      entry,
    } as const;

    await hooks.onStageDone?.({ ...result, elapsed: Time.elapsed(stageStartedAt).msec });
    return result;
  } catch (error) {
    const elapsed = Time.elapsed(stageStartedAt).msec;
    await hooks.onStageFailed?.({ ...ctx, elapsed, error });
    throw error;
  }
}

const wrangle = {
  retainPackages(
    graph: t.WorkspaceGraph.PersistedGraph,
    target: t.StringPath,
  ): ReadonlySet<t.StringPath> {
    const retain = new Set(closureFromGraph(graph, target));

    for (const path of STAGE_RUNTIME_PACKAGES) {
      if (!graph.orderedPaths.includes(path)) continue;
      for (const pkg of closureFromGraph(graph, path)) retain.add(pkg);
    }

    return retain;
  },

  async shouldBuildTarget(targetDir: t.StringDir) {
    const denofile = await DenoFile.load(targetDir);
    const task = denofile.data?.tasks?.build;
    return typeof task === 'string' && task.trim().length > 0;
  },
} as const;
