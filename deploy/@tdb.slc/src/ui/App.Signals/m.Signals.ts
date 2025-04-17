import type { t } from './common.ts';
import { Controllers } from '../App.Signals.Controller/mod.ts';
import { create } from './m.Signals.create.ts';

export const AppSignals: t.AppSignalsLib = {
  Controllers,
  create,
};
