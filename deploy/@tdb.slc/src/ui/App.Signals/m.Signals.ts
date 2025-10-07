import type { AppSignalsLib } from './t.ts';

import { Controllers } from '../App.Signals.Controller/mod.ts';
import { create } from './m.Signals.create.ts';

export const AppSignals: AppSignalsLib = {
  Controllers,
  create,
};
