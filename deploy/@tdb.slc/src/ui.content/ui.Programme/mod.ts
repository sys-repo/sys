/**
 * @module Programme
 */
import { factory } from './m.Factory.tsx';
import { ProgrammeRoot } from './ui.tsx';

export { factory };

/**
 * Programme (Content API)
 */
export const Programme = {
  factory,
  View: { Main: ProgrammeRoot },
} as const;
