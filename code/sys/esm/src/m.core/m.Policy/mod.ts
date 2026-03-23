import { type t } from './common.ts';
import { candidates } from './m.candidates.ts';
import { decide, decideAll } from './m.decide.ts';

/**
 * @module
 * Pure dependency policy algebra.
 */
export const Policy: t.EsmPolicy.Lib = {
  candidates,
  decide,
  decideAll,
};
