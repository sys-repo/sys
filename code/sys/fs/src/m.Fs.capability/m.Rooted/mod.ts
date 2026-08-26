/**
 * @module
 * Publish, seal, coordinate, and remove owned trees beneath one canonical root.
 */
import type { t } from './common.ts';
import { createRooted } from './u/u.create.ts';
import { isFailure } from './u/u.error.ts';

/**
 * Publish, seal, coordinate, and remove owned trees beneath one canonical Rooted directory.
 */
export const Rooted: t.FsRooted.Lib = Object.freeze({
  Is: Object.freeze({ failure: isFailure }),
  create: (options) => createRooted(options),
});
