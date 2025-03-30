/**
 * @module
 */
import { type t, AppSignals } from './common.ts';

export const App: t.AppLib = {
  Signals: AppSignals,
  signals: AppSignals.create,
};
