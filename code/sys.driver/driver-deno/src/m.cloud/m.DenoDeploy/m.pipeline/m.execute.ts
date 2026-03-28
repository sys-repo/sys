import { type t, Fs, Str, Time } from './common.ts';
import { deploy } from '../m.deploy/mod.ts';
import { DeploymentNote } from '../m.stage/-tmpl.note/mod.ts';
import { executeStage } from '../m.stage/u.executeStage.ts';
import { prepare } from './u.prepare.ts';
import { verifyPreview } from './u.verify.ts';

type Ctx = {
  readonly request: t.DenoDeploy.Pipeline.Request;
  readonly emit: (step: t.DenoDeploy.Pipeline.Step) => void;
};

export async function execute(ctx: Ctx): Promise<t.DenoDeploy.Pipeline.Result> {
  let root: t.StringDir | undefined;
  let note: Awaited<ReturnType<typeof wrangle.note>> | undefined;
  const staged = await executeStage(
    { target: { dir: ctx.request.pkgDir }, root: { kind: 'temp' } },
    {
      async onRoot(stageCtx) {
        root = stageCtx.root;
        note = await wrangle.note({ pkgDir: ctx.request.pkgDir, root });
        await DeploymentNote.write(root, note);
        ctx.emit({ kind: 'stage:start', pkgDir: ctx.request.pkgDir, root });
      },
      onBuildStart() {
        if (!note || !root) return;
        ctx.emit({ kind: 'build:start', pkgDir: ctx.request.pkgDir, root });
        note = DeploymentNote.buildStarted(note);
        return DeploymentNote.write(root, note);
      },
      async onBuildDone(stageCtx) {
        if (!note || !root) return;
        ctx.emit({
          kind: 'build:done',
          pkgDir: ctx.request.pkgDir,
          root,
          elapsed: stageCtx.elapsed,
        });
        note = await DeploymentNote.buildDone(note, {
          pkgDir: stageCtx.target.absolute,
          elapsed: stageCtx.elapsed,
        });
        await DeploymentNote.write(root, note);
      },
      onBuildFailed(stageCtx) {
        if (!note || !root) return;
        ctx.emit({
          kind: 'build:failed',
          pkgDir: ctx.request.pkgDir,
          root,
          elapsed: stageCtx.elapsed,
          error: stageCtx.error,
        });
        note = DeploymentNote.buildFailed(note, {
          elapsed: stageCtx.elapsed,
          error: stageCtx.error,
        });
        return DeploymentNote.write(root, note);
      },
      onStageStart() {
        if (!note || !root) return;
        ctx.emit({ kind: 'stage:materialize:start', pkgDir: ctx.request.pkgDir, root });
        note = DeploymentNote.stageStarted(note);
        return DeploymentNote.write(root, note);
      },
      async onStageDone(result) {
        if (!note || !root) return;
        ctx.emit({
          kind: 'stage:materialize:done',
          stage: {
            target: result.target,
            workspace: result.workspace,
            root: result.root,
            entry: result.entry,
          },
          elapsed: result.elapsed,
        });
        note = await DeploymentNote.stageDone(note, {
          stageRoot: result.root,
          elapsed: result.elapsed,
        });
        await DeploymentNote.write(root, note);
      },
      onStageFailed(stageCtx) {
        if (!note || !root) return;
        ctx.emit({
          kind: 'stage:materialize:failed',
          pkgDir: ctx.request.pkgDir,
          root,
          elapsed: stageCtx.elapsed,
          error: stageCtx.error,
        });
        note = DeploymentNote.stageFailed(note, {
          elapsed: stageCtx.elapsed,
          error: stageCtx.error,
        });
        return DeploymentNote.write(root, note);
      },
    },
  );
  ctx.emit({ kind: 'stage:done', stage: staged });

  if (!note || !root) {
    throw new Error('DenoDeploy.pipeline: missing stage root context.');
  }

  ctx.emit({ kind: 'prepare:start', stage: staged });
  note = DeploymentNote.prepareStarted(note);
  await DeploymentNote.write(root, note);
  const prepareStartedAt = Time.now.timestamp as t.Msecs;
  let prepared;
  try {
    prepared = await prepare(staged);
  } catch (error) {
    const elapsed = Time.elapsed(prepareStartedAt).msec as t.Msecs;
    ctx.emit({ kind: 'prepare:failed', stage: staged, elapsed, error });
    note = DeploymentNote.prepareFailed(note, { elapsed, error });
    await DeploymentNote.write(root, note);
    throw error;
  }
  note = DeploymentNote.prepareDone(note, {
    elapsed: Time.elapsed(prepareStartedAt).msec as t.Msecs,
  });
  await DeploymentNote.write(root, note);
  ctx.emit({ kind: 'prepare:done', stage: staged, prepared });

  note = DeploymentNote.deployStarted(note);
  await DeploymentNote.write(root, note);
  ctx.emit({ kind: 'deploy:start', stage: staged, config: ctx.request.config });
  const deployStartedAt = Time.now.timestamp as t.Msecs;
  let result;
  try {
    result = await deploy({
      stage: staged,
      ...ctx.request.config,
    });
  } catch (error) {
    ctx.emit({
      kind: 'deploy:failed',
      elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
      error,
    });
    note = DeploymentNote.deployFailed(note, {
      elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
      error,
    });
    await DeploymentNote.write(root, note);
    throw error;
  }

  if (!result.ok) {
    const error = 'error' in result ? result.error : wrangle.deployFailure(result);
    ctx.emit({
      kind: 'deploy:failed',
      elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
      error,
    });
    note = DeploymentNote.deployFailed(note, {
      elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
      error,
    });
    await DeploymentNote.write(root, note);
    if ('error' in result) throw result.error;
    throw new Error(wrangle.deployFailure(result));
  }

  note = DeploymentNote.deployDone(note, {
    elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
    revision: result.deploy?.url?.revision,
    preview: result.deploy?.url?.preview,
    verify: ctx.request.verify?.preview !== false,
  });
  await DeploymentNote.write(root, note);
  ctx.emit({ kind: 'deploy:done', result });

  const preview = result.deploy?.url?.preview;
  if (ctx.request.verify?.preview !== false) {
    if (!preview) {
      throw new Error('DenoDeploy.pipeline: verify.preview requires deploy.url.preview.');
    }
    note = DeploymentNote.verifyStarted(note);
    await DeploymentNote.write(root, note);
    ctx.emit({ kind: 'verify:start', previewUrl: preview });
    const verifyStartedAt = Time.now.timestamp;
    try {
      await verifyPreview(preview);
    } catch (error) {
      ctx.emit({
        kind: 'verify:failed',
        previewUrl: preview,
        elapsed: Time.elapsed(verifyStartedAt).msec,
        error,
      });
      note = DeploymentNote.verifyFailed(note, {
        elapsed: Time.elapsed(verifyStartedAt).msec,
        error,
      });
      await DeploymentNote.write(root, note);
      throw error;
    }
    note = DeploymentNote.verifyDone(note, { elapsed: Time.elapsed(verifyStartedAt).msec });
    await DeploymentNote.write(root, note);
    ctx.emit({ kind: 'verify:done', previewUrl: preview });
  }

  return {
    stage: staged,
    prepared,
    deploy: result,
  };
}

/**
 * Helpers:
 */
const wrangle = {
  deployFailure(input: {
    readonly code: number;
    readonly stdout: string;
    readonly stderr: string;
  }) {
    return Str.dedent(`
      DenoDeploy.pipeline: deploy failed (code ${input.code}).

      stdout:
      ${input.stdout}

      stderr:
      ${input.stderr}
    `);
  },

  async note(args: { readonly pkgDir: t.StringDir; readonly root: t.StringDir }) {
    const denoJson = (await Fs.readJson(Fs.join(args.pkgDir, 'deno.json'))).data as
      | { readonly name?: string; readonly version?: string }
      | undefined;
    return await DeploymentNote.create({
      name: denoJson?.name ?? '(unknown)',
      version: denoJson?.version ?? '0.0.0',
      sourcePackage: args.pkgDir,
      stageRoot: args.root,
    });
  },
} as const;
