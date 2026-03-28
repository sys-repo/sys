import { type t, Rx } from './common.ts';
import { DeployConfig } from '../u.deployConfig.ts';
import { execute } from './m.execute.ts';

export const pipeline: t.DenoDeploy.Lib['pipeline'] = (request) => {
  const normalized = wrangle.request(request);
  const life = Rx.abortable();
  const $$ = Rx.subject<t.DenoDeploy.Pipeline.Step>();
  const $ = $$.pipe(Rx.takeUntil(life.dispose$));
  let ran = false;

  return Rx.toLifecycle<t.DenoDeploy.Pipeline.Handle>(life, {
    $,
    request: normalized,

    async run() {
      if (ran) throw new Error('DenoDeploy.pipeline.run(): deployment handles are single-use.');
      ran = true;
      return await execute({
        request: normalized,
        emit: (step) => $$.next(step),
      });
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
} as const;
