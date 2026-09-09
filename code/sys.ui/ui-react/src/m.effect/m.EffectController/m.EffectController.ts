import { type t, StdEffectController } from './common.ts';
import { useEffectController } from './u.useEffectController.ts';

/** Effect controller helpers with React hook support. */
export const EffectController: t.EffectController.Lib = {
  ...StdEffectController,
  useEffectController,
};
