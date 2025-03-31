/**
 * @module
 */
import { type t, AppSignals, Layout } from './common.ts';

export const App: t.AppLib = {
  Signals: AppSignals,
  signals: AppSignals.create,
  Layout,
};
