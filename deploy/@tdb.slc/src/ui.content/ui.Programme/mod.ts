/**
 * @module Programme
 */
import { factory } from './m.Factory.tsx';
import { createProgrammeSignals as signals } from './m.Signals.ts';
import { Programme as Main } from './ui.tsx';

import { useProgrammeController } from './use.Programme.Controller.ts';
import { useSectionController } from './use.Section.Controller.ts';

export { factory };

/**
 * Programme (Content API)
 */
export const Programme = {
  factory,
  signals,
  View: { Main },

  // Hooks:
  useProgrammeController,
  useSectionController,
} as const;
