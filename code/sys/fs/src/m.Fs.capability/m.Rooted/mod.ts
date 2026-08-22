/**
 * @module
 * Read admitted files and publish, seal, coordinate, or remove owned trees beneath one root.
 */
import type { t } from './common.ts';
import { createRooted } from './u/u.create.ts';
import { isFailure } from './u/u.error.ts';

/**
 * Read admitted files and own published trees beneath one canonical Rooted directory.
 */
export const Rooted: t.FsRooted.Lib = Object.freeze({
  Is: Object.freeze({ failure: isFailure }),
  create: (options) => createRooted(options),
});
