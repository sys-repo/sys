import type { t } from './common.ts';
import { create } from './m.create.ts';
import { fromDist } from './m.fromDist.ts';

/**
 * Bounded application HTTP reads backed by private R2 objects.
 */
export const ReadRoute: t.R2.ReadRoute.Lib = { create, fromDist };
