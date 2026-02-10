import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.causal.ts';

/**
 * Effect primitives.
 * Minimal runtime surfaces for effect control and causal bridge helpers.
 */
export type EffectLib = {
  readonly Causal: t.EffectCausalLib;
  readonly Controller: t.EffectControllerLib;
};
