import type { t } from './common.ts';
import { Player } from './m.Player.ts';
import { create } from './m.Signals.create.ts';

export const AppSignals: t.AppSignalsLib = {
  Player,
  create,
};
