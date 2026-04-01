import { FILE, renderStageEntrypoints } from './-tmpl/mod.ts';
import { type t, Fs, Time, Workspace } from './common.ts';
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

export async function executeStage(
  request: t.DenoDeploy.Stage.Request,
  hooks: StageHooks = {},
): Promise<t.DenoDeploy.Stage.Result> {
  const { workspace, target } = await resolveStageTarget(request);
  const root = await resolveStageRoot(workspace.dir, request.root);
  const snapshot = await Workspace.Prep.Graph.read(workspace.dir);
  if (!snapshot) {
    const err = `DenoDeploy.stage: missing workspace graph snapshot at '${Fs.join(workspace.dir, '.tmp', 'workspace.graph.json')}' — run prep first`;
    throw new Error(err);
  }
  const retain = closureFromGraph(snapshot.graph, target.relative);
  const ctx = { workspace, target, root } as const;

  await hooks.onRoot?.(ctx);
  await hooks.onBuildStart?.(ctx);

  const buildStartedAt: t.Msecs = Time.now.timestamp;
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

  await hooks.onStageStart?.(ctx);
  const stageStartedAt: t.Msecs = Time.now.timestamp;
  try {
    await materializeWorkspace({ source: workspace.dir, root, retain });
    await rewriteStageWorkspace(root, retain);
    await ensureStageDriverDenoImport(root);

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
