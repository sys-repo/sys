import { type t, StdEffectController } from './common.ts';
import { useEffectController } from './u.useEffectController.ts';

export const EffectController: t.EffectController.Lib = {
  ...StdEffectController,
  useEffectController,
};
