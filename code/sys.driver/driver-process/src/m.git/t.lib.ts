import type { t } from './common.ts';

/**
 * Thin system driver for Git.
 */
export type GitLib = {
  /** Runtime preflight for Git. */
  readonly probe: t.GitProbeFn;
  /** Inspect repository status via git status. */
  readonly status: t.GitStatusFn;
  /** Raw porcelain v2 -z status output. */
  readonly statusPorcelainV2Z: t.GitStatusPorcelainV2ZFn;
  /** Discover the repository root. */
  readonly root: t.GitRootFn;
};
