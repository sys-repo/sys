/**
 * @module
 * Publish files beneath one root without overwriting existing targets, and promote
 * directories among cooperating Rooted writers.
 */
import type { t } from './common.ts';
import { createRooted } from './u/u.create.ts';
import { isFailure } from './u/u.error.ts';

/**
 * Publish files without overwriting existing targets and promote directories among Rooted writers.
 */
export const Rooted: t.FsRooted.Lib = Object.freeze({
  Is: Object.freeze({ failure: isFailure }),
  create: (options) => createRooted(options),
});
