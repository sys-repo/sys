import { type t } from './common.ts';
import { mirrorToken } from './u.causal.mirrorToken.ts';

/**
 * EffectController causal helpers.
 */
export const Causal: t.Effect.Causal.Lib = Object.freeze({
  mirrorToken,
});
