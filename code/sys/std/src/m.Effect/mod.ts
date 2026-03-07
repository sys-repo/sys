/**
 * @module
 * Effect primitives.
 * Minimal runtime surfaces for effect control and causal bridge helpers.
 */
import type { t } from './common.ts';
import { EffectController } from '../m.EffectController/mod.ts';
import { Causal } from './m.Causal.ts';

export { EffectController };

export const Effect: t.EffectLib = {
  Controller: EffectController,
  Causal,
};
