import type { t } from './common.ts';

/**
 * Thin system driver for Git.
 */
export type GitLib = {
  /** Runtime preflight for Git. */
  readonly probe: t.GitProbeFn;
};
