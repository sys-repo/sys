/**
 * @module
 */
import { type t, Layout, AppRender as Render, AppSignals as Signals } from './common.ts';

export const App: t.AppLib = {
  type: '@tdb.slc:app',
  Layout,
  Render,
  Signals,
  signals: Signals.create,
};
