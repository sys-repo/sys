/**
 * @module
 */
import { type t } from './common.ts';
import { Probe } from './ui.Probe.tsx';
import { Result } from './ui.Result.tsx';
import { Signals } from './m.Signals.ts';
import { Renderer } from './m.Renderer.tsx';

export const ActionProbe: t.ActionProbe.Lib = {
  Probe,
  Result,
  Signals,
  signals: Signals.create,
  Renderer,
  renderer: Renderer.create,
};
