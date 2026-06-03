import type { Effect as StdEffect } from '@sys/std/t';
import type { t } from './common.ts';

/** Type re-exports. */
export type * from './m.EffectController/t.ts';

/**
 * Effect primitives (React extensions).
 */
export declare namespace Effect {
  /** React-facing effect helper surface. */
  export type Lib = Omit<StdEffect.Lib, 'Controller'> & {
    readonly Controller: t.EffectController.Lib;
    readonly useEffectController: t.EffectController.Hook.Fn;
  };
}
