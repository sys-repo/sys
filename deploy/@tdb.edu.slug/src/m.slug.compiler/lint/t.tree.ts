import { type t } from './common.ts';

/** Slug-tree filesystem lint settings. */
export type LintProfileSlugTree = {
  /** Source directory to scan. */
  readonly source?: t.StringPath;
  /** Targets for generated artifacts. */
  readonly target?: LintProfileSlugTreeTarget;
  /** File extensions to include (e.g. ".md"). */
  readonly include?: readonly string[];
  /** Directory entries to ignore. */
  readonly ignore?: readonly string[];
  /** Sort directory entries by name. */
  readonly sort?: boolean;
  /** Treat README.md as the directory slug. */
  readonly readmeAsIndex?: boolean;
};

export type LintProfileSlugTreeTarget = {
  /** Manifest targets for generated artifacts. */
  readonly manifest?: t.StringPath | readonly t.StringPath[];
  /** Optional directory to copy source content into. */
  readonly dir?:
    | t.StringPath
    | LintProfileSlugTreeTargetDir
    | readonly LintProfileSlugTreeTargetDir[];
  /** Optional CRDT write target. */
  readonly crdt?: {
    readonly ref?: t.StringRef;
    readonly path?: t.StringPath;
  };
};

export type LintProfileSlugTreeTargetDir = {
  readonly kind: 'source' | 'sha256';
  readonly path: t.StringPath;
};
