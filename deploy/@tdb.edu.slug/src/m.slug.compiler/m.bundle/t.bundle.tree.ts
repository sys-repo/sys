import type { t } from './common.ts';

/**
 * Configuration
 */
export type SlugBundleSlugTreeFs = {
  /** Source directory to scan. */
  readonly source?: t.StringPath;
  /** CRDT configuration for DAG-based lookup. */
  readonly crdt: {
    readonly docid: t.StringId;
    readonly path: t.StringPath;
  };
  /** Targets for generated artifacts. */
  readonly target?: SlugBundleSlugTreeTarget;
  /** File extensions to include (e.g. ".md"). */
  readonly include?: readonly string[];
  /** Directory entries to ignore. */
  readonly ignore?: readonly string[];
  /** Sort directory entries by name. */
  readonly sort?: boolean;
  /** Treat README.md as the directory slug. */
  readonly readmeAsIndex?: boolean;
};

export type SlugBundleSlugTreeTarget = {
  /** Manifest targets for generated artifacts. */
  readonly manifest?: t.StringPath | readonly t.StringPath[];
  /** Optional directory to copy source content into. */
  readonly dir?:
    | t.StringPath
    | SlugBundleSlugTreeTargetDir
    | readonly SlugBundleSlugTreeTargetDir[];
};

export type SlugBundleSlugTreeTargetDir = {
  readonly kind: 'source' | 'sha256';
  readonly path: t.StringPath;
};

export type SlugTreeFsStats = {
  readonly files: number;
  readonly sourceFiles: number;
  readonly sha256Files: number;
  readonly manifests: number;
  readonly elapsedMs: number;
};
