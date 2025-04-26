/**
 * @module Programme
 */
import { factory } from './m.Factory.tsx';
import { createProgrammeSignals as signals } from './m.Signals.ts';
import { Programme as Main } from './ui.tsx';

export { factory };

/**
 * Programme (Content API)
 */
export const Programme = {
  factory,
  View: { Main },
  signals,
} as const;
