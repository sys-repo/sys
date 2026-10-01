import type { t } from './common.ts';
import { inspect } from './u.inventory.ts';

/**
 * Bounded accounting, not path admission or verification evidence.
 */
export const Inventory: t.Pkg.Dist.Inventory.Lib = Object.freeze({ inspect });
