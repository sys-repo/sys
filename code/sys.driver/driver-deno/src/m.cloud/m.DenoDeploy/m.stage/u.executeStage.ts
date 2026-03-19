import { type t, Fs, Time } from './common.ts';
import { FILE, renderStageEntrypoints } from './-tmpl/mod.ts';
import { buildStageTarget } from './u.buildStageTarget.ts';
import { ensureStageDriverDenoImport } from './u.ensureStageDriverDenoImport.ts';
import { materializeWorkspace } from './u.materializeWorkspace.ts';
import { resolveStageRoot } from './u.resolveStageRoot.ts';
import { resolveStageTarget } from './u.resolveStageTarget.ts';

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
  const ctx = { workspace, target, root } as const;

  await hooks.onRoot?.(ctx);
  await hooks.onBuildStart?.(ctx);

  const buildStartedAt = Time.now.timestamp as t.Msecs;
  try {
    await buildStageTarget(target.absolute);
  } catch (error) {
    await hooks.onBuildFailed?.({ ...ctx, elapsed: Time.elapsed(buildStartedAt).msec as t.Msecs, error });
    throw error;
  }
  await hooks.onBuildDone?.({ ...ctx, elapsed: Time.elapsed(buildStartedAt).msec as t.Msecs });

  await hooks.onStageStart?.(ctx);
  const stageStartedAt = Time.now.timestamp as t.Msecs;
  try {
    await materializeWorkspace(workspace.dir, root);
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

    await hooks.onStageDone?.({ ...result, elapsed: Time.elapsed(stageStartedAt).msec as t.Msecs });
    return result;
  } catch (error) {
    await hooks.onStageFailed?.({ ...ctx, elapsed: Time.elapsed(stageStartedAt).msec as t.Msecs, error });
    throw error;
  }
}
