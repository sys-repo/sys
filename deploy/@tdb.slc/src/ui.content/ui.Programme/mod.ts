/**
 * @module Programme
 */
import { factory } from './m.Factory.tsx';
import { createProgrammeSignals as signals } from './m.Signals.ts';
import { Programme } from './ui.tsx';

export { factory };

/**
 * Programme (Content API)
 */
export const Programme = {
  factory,
  View: { Main: Programme },
  signals,
} as const;
