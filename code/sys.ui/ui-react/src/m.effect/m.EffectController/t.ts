import type { t } from './common.ts';
import { EffectControllerLib } from '@sys/std/t';

/** Type re-export. */
export type * from './t.hook.ts';

/**
 * EffectController (React Extensions)
 */
export type EffectControllerReactLib = EffectControllerLib & {
  readonly useEffectController: t.UseEffectController;
};
