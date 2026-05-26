import type { EffectController } from '@sys/std/t';
import type { t } from './common.ts';

/** Type re-export. */
export type * from './t.hook.ts';

/**
 * EffectController (React Extensions)
 */
export type EffectControllerReactLib = EffectController.Lib & {
  readonly useEffectController: t.UseEffectController;
};
