import type { t } from './common.ts';
import { Controllers } from './m.Controllers.ts';
import { create } from './m.Signals.create.ts';

export const AppSignals: t.AppSignalsLib = {
  create,
  Controllers,
};
