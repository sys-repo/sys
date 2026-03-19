import { type t, Rx, Str } from './common.ts';
import { deploy } from '../m.deploy/mod.ts';
import { stage } from '../m.stage/mod.ts';
import { prepare } from './u.prepare.ts';
import { verifyPreview } from './u.verify.ts';

export const pipeline: t.DenoDeploy.Lib['pipeline'] = (request) => {
  const life = Rx.abortable();
  const $$ = Rx.subject<t.DenoDeploy.Pipeline.Step>();
  const $ = $$.pipe(Rx.takeUntil(life.dispose$));
  let ran = false;

  return Rx.toLifecycle<t.DenoDeploy.Pipeline.Handle>(life, {
    request,
    $,

    async run() {
      if (ran) throw new Error('DenoDeploy.pipeline.run(): deployment handles are single-use.');
      ran = true;

      $$.next({ kind: 'stage:start', pkgDir: request.pkgDir });
      const staged = await stage({ target: { dir: request.pkgDir } });
      $$.next({ kind: 'stage:done', stage: staged });

      $$.next({ kind: 'prepare:start', stage: staged });
      const prepared = await prepare(staged);
      $$.next({ kind: 'prepare:done', stage: staged, prepared });

      $$.next({ kind: 'deploy:start', stage: staged, config: request.config });
      const result = await deploy({
        stage: staged,
        ...request.config,
      });

      if (!result.ok) {
        if ('error' in result) throw result.error;
        throw new Error(wrangle.deployFailure(result));
      }

      $$.next({ kind: 'deploy:done', result });

      const preview = result.deploy?.url?.preview;
      if (request.verify?.preview !== false) {
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
