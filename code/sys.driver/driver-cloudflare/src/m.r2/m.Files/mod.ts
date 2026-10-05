import type { t } from './common.ts';
import { create } from './m.create.ts';

/**
 * Files<T> backing adapter over R2 buckets.
 */
export const Files: t.R2.Files.Lib = Object.freeze({ create });
