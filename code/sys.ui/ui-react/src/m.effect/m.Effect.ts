import type { t } from './common.ts';
import { Effect as StdEffect } from '@sys/std/effect';
import { EffectController as Controller } from './m.EffectController/mod.ts';

export const Effect: t.EffectReactLib = {
  ...StdEffect,
  Controller,
};
