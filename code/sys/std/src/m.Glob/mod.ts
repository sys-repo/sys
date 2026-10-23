/**
 * @module
 * Small deterministic path-glob matching for normalized path-like strings.
 *
 * This is not shell glob, minimatch, gitignore, or filesystem traversal.
 */
import type { t } from './common.ts';
import { matches } from './m.matches.ts';

/**
 * Small deterministic path-glob matcher for normalized path-like strings.
 * This is not shell glob, minimatch, gitignore, or filesystem traversal.
 */
export const Glob: t.Glob.Lib = Object.freeze({
  matches,
});
