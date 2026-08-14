/**
 * @module
 * Publish files beneath one root, promote directories, and coordinate owned-tree
 * lifecycles among cooperating Rooted processes.
 */
import type { t } from './common.ts';
import { createRooted } from './u/u.create.ts';
import { isFailure } from './u/u.error.ts';

/**
 * Publish and coordinate owned trees beneath one canonical Rooted directory.
 */
export const Rooted: t.FsRooted.Lib = Object.freeze({
  Is: Object.freeze({ failure: isFailure }),
  create: (options) => createRooted(options),
});
