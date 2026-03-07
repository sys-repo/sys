import { Effect as StdEffect } from '@sys/std/effect';

import type { t } from './common.ts';
import { EffectController as Controller, useEffectController } from './m.EffectController/mod.ts';

export const Effect: t.EffectReactLib = {
  ...StdEffect,
  Controller,
  useEffectController,
};
