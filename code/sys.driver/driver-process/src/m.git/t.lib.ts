import type { t } from './common.ts';

/**
 * Thin system driver for Git.
 */
export type GitLib = {
  /** Runtime preflight for Git. */
  readonly probe: t.GitProbeFn;
  /** Inspect repository status via git status. */
  readonly status: t.GitStatusFn;
  /** Discover the repository root. */
  readonly root: t.GitRootFn;
};
