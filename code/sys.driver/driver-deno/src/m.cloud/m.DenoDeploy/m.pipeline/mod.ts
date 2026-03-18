import { type t, Rx } from './common.ts';

export const pipeline: t.DenoDeploy.Lib['pipeline'] = (request) => {
  const life = Rx.abortable();
  const $$ = Rx.subject<t.DenoDeploy.Pipeline.Step>();
  const $ = $$.pipe(Rx.takeUntil(life.dispose$));

  return Rx.toLifecycle<t.DenoDeploy.Pipeline.Handle>(life, {
    $,

    async run() {
      throw new Error(
        `DenoDeploy.pipeline: not implemented yet for ${request.pkgDir}. Extract the proven staged deploy flow next.`,
      );
    },
  });
};
