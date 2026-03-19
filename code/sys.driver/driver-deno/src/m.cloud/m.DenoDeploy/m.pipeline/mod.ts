import { type t, D, Fs, Rx, Str } from './common.ts';
import { deploy } from '../m.deploy/mod.ts';
import { stage } from '../m.stage/mod.ts';
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

      const root = (await Fs.makeTempDir({ prefix: D.tmpDirPrefix.stage })).absolute as t.StringDir;
      $$.next({ kind: 'stage:start', pkgDir: normalized.pkgDir, root });
      const staged = await stage({
        target: { dir: normalized.pkgDir },
        root: { kind: 'path', dir: root },
      });
      $$.next({ kind: 'stage:done', stage: staged });

      $$.next({ kind: 'prepare:start', stage: staged });
      const prepared = await prepare(staged);
      $$.next({ kind: 'prepare:done', stage: staged, prepared });

      $$.next({ kind: 'deploy:start', stage: staged, config: normalized.config });
      const result = await deploy({
        stage: staged,
        ...normalized.config,
      });

      if (!result.ok) {
        if ('error' in result) throw result.error;
        throw new Error(wrangle.deployFailure(result));
      }

      $$.next({ kind: 'deploy:done', result });

      const preview = result.deploy?.url?.preview;
      if (normalized.verify?.preview !== false) {
        if (!preview) {
          throw new Error('DenoDeploy.pipeline: verify.preview requires deploy.url.preview.');
        }
        $$.next({ kind: 'verify:start', previewUrl: preview });
        await verifyPreview(preview);
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
} as const;
