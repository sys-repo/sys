/**
 * @module Programme
 */
import { factory } from './m.Factory.tsx';
import { ProgrammeSignals as Signals } from './m.Signals.ts';
import { Calc, toPlaylist } from './u.ts';
import { Programme as Main } from './ui.tsx';
import { useController } from './use.Controller.ts';
import { Programme as Media } from './v.ts';

export { factory };

/**
 * Programme (Content API)
 */
export const Programme = {
  Signals,
  factory,
  Media,
  Calc,

  // UI Components:
  View: { Main },
  useController,

  // Helpers:
  toPlaylist,
} as const;
