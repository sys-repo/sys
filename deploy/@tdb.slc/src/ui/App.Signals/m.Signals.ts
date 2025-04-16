import type { t } from './common.ts';
import { create } from './m.Signals.create.ts';
import { controller } from './m.Signals.controller.ts';

export const AppSignals: t.AppSignalsLib = {
  create,
  controller,
};
