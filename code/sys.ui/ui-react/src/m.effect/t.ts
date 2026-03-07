import { EffectLib } from '@sys/std/t';
import type { t } from './common.ts';

/** Type re-exports/ */
export type * from './m.EffectController/t.ts';

export type EffectReactLib = Omit<EffectLib, 'Controller'> & {
  readonly Controller: t.EffectControllerReactLib;
  readonly useEffectController: t.UseEffectController;
};
