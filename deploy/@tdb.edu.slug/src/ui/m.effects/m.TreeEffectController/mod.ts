/**
 * @module
 * TreeEffectController - orchestration surface above TreeHost.
 * Owns tree selection + external load synchronization state.
 */
import type { t } from './common.ts';
import { Controller as Factory } from './m.Controller.ts';

export const TreeEffectController: t.TreeEffectController.Lib = {
  ...Factory,
};
