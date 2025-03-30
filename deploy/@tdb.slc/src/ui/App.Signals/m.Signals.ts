import type { t } from './common.ts';
import { AppPlayer } from './m.Player.ts';
import { create } from './m.Signals.create.ts';

export const AppSignals: t.AppSignalsLib = {
  Player: AppPlayer,
  create,
};
