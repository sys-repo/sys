/**
 * @module
 */
import { Layout, AppRender as Render, AppSignals as Signals } from './common.ts';
import type { AppLib } from './t.ts';

export const App: AppLib = {
  type: '@tdb.slc:app',
  Layout,
  Render,
  Signals,
  signals: Signals.create,
};
