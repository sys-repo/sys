/**
 * @module
 * Pure `SlugTree` operations.
 *
 * Scope:
 * - Tree transforms and serialization
 * - No filesystem dependency
 * - No client/network loading concerns
 */
import type { t } from './common.ts';
import { reindex } from './u.reindex.ts';
import { toYaml } from './u.toYaml.ts';

export const SlugTree: t.SlugTree.Lib = {
  reindex,
  toYaml,
};
