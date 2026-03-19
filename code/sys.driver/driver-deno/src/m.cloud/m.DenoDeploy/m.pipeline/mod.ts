import { type t, Fs, Rx, Str, Time } from './common.ts';
import { deploy } from '../m.deploy/mod.ts';
import { DeploymentNote } from '../m.stage/-tmpl.note/mod.ts';
import { executeStage } from '../m.stage/u.executeStage.ts';
import { DeployConfig } from '../u.deployConfig.ts';
import { prepare } from './u.prepare.ts';
import { verifyPreview } from './u.verify.ts';

export const pipeline: t.DenoDeploy.Lib['pipeline'] = (request) => {
  const normalized = wrangle.request(request);
  const life = Rx.abortable();
  const $$ = Rx.subject<t.DenoDeploy.Pipeline.Step>();
  const $ = $$.pipe(Rx.takeUntil(life.dispose$));
  let ran = false;

  return Rx.toLifecycle<t.DenoDeploy.Pipeline.Handle>(life, {
    request: normalized,
    $,

    async run() {
      if (ran) throw new Error('DenoDeploy.pipeline.run(): deployment handles are single-use.');
      ran = true;

      let root: t.StringDir | undefined;
      let note: Awaited<ReturnType<typeof wrangle.note>> | undefined;
      const staged = await executeStage(
        {
          target: { dir: normalized.pkgDir },
          root: { kind: 'temp' },
        },
        {
          async onRoot(ctx) {
            root = ctx.root;
            note = await wrangle.note({
              pkgDir: normalized.pkgDir,
              root,
            });
            await DeploymentNote.write(root, note);
            $$.next({ kind: 'stage:start', pkgDir: normalized.pkgDir, root });
          },
          onBuildStart() {
            if (!note || !root) return;
            note = DeploymentNote.buildStarted(note);
            return DeploymentNote.write(root, note);
          },
          async onBuildDone(ctx) {
            if (!note || !root) return;
            note = await DeploymentNote.buildDone(note, {
              pkgDir: ctx.target.absolute,
              elapsed: ctx.elapsed,
            });
            await DeploymentNote.write(root, note);
          },
          onBuildFailed(ctx) {
            if (!note || !root) return;
            note = DeploymentNote.buildFailed(note, {
              elapsed: ctx.elapsed,
              error: ctx.error,
            });
            return DeploymentNote.write(root, note);
          },
          onStageStart() {
            if (!note || !root) return;
            note = DeploymentNote.stageStarted(note);
            return DeploymentNote.write(root, note);
          },
          async onStageDone(result) {
            if (!note || !root) return;
            note = await DeploymentNote.stageDone(note, {
              stageRoot: result.root,
              elapsed: result.elapsed,
            });
            await DeploymentNote.write(root, note);
          },
          onStageFailed(ctx) {
            if (!note || !root) return;
            note = DeploymentNote.stageFailed(note, {
              elapsed: ctx.elapsed,
              error: ctx.error,
            });
            return DeploymentNote.write(root, note);
          },
        },
      );
      $$.next({ kind: 'stage:done', stage: staged });

      $$.next({ kind: 'prepare:start', stage: staged });
      const prepared = await prepare(staged);
      $$.next({ kind: 'prepare:done', stage: staged, prepared });

      if (!note || !root) {
        throw new Error('DenoDeploy.pipeline: missing stage root context.');
      }

      note = DeploymentNote.deployStarted(note);
      await DeploymentNote.write(root, note);
      $$.next({ kind: 'deploy:start', stage: staged, config: normalized.config });
      const deployStartedAt = Time.now.timestamp as t.Msecs;
      let result;
      try {
        result = await deploy({
          stage: staged,
          ...normalized.config,
        });
      } catch (error) {
        note = DeploymentNote.deployFailed(note, {
          elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
          error,
        });
        await DeploymentNote.write(root, note);
        throw error;
      }

      if (!result.ok) {
        note = DeploymentNote.deployFailed(note, {
          elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
          error: 'error' in result ? result.error : wrangle.deployFailure(result),
        });
        await DeploymentNote.write(root, note);
        if ('error' in result) throw result.error;
        throw new Error(wrangle.deployFailure(result));
      }

      note = DeploymentNote.deployDone(note, {
        elapsed: Time.elapsed(deployStartedAt).msec as t.Msecs,
        revision: result.deploy?.url?.revision,
        preview: result.deploy?.url?.preview,
        verify: normalized.verify?.preview !== false,
      });
      await DeploymentNote.write(root, note);
      $$.next({ kind: 'deploy:done', result });

      const preview = result.deploy?.url?.preview;
      if (normalized.verify?.preview !== false) {
        if (!preview) {
          throw new Error('DenoDeploy.pipeline: verify.preview requires deploy.url.preview.');
        }
        note = DeploymentNote.verifyStarted(note);
        await DeploymentNote.write(root, note);
        $$.next({ kind: 'verify:start', previewUrl: preview });
        const verifyStartedAt = Time.now.timestamp as t.Msecs;
        try {
          await verifyPreview(preview);
        } catch (error) {
          note = DeploymentNote.verifyFailed(note, {
            elapsed: Time.elapsed(verifyStartedAt).msec as t.Msecs,
            error,
          });
          await DeploymentNote.write(root, note);
          throw error;
        }
        note = DeploymentNote.verifyDone(note, {
          elapsed: Time.elapsed(verifyStartedAt).msec as t.Msecs,
        });
        await DeploymentNote.write(root, note);
        $$.next({ kind: 'verify:done', previewUrl: preview });
      }

      return {
        stage: staged,
        prepared,
        deploy: result,
      };
    },
  });
};

/**
 * Helpers:
 */
const wrangle = {
  request(input: t.DenoDeploy.Pipeline.Request): t.DenoDeploy.Pipeline.Request {
    return {
      ...input,
      pkgDir: input.pkgDir.trim() as t.StringDir,
      config: DeployConfig.normalize(input.config),
    };
  },

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
