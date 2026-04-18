import type { t } from './common.ts';

/**
 * Configuration
 */
export type SlugBundleFileTree = {
  /** Source directory to scan. */
  readonly source?: t.StringPath;
  /** Explicit bundle docid (used for manifest indexes). */
  readonly docid?: t.StringId;
  /** Targets for generated artifacts. */
  readonly target?: SlugBundleFileTreeTarget;
  /** Directory entries to ignore. */
  readonly ignore?: readonly string[];
  /** Sort directory entries by name. */
  readonly sort?: boolean;
  /** Treat README.md as the directory slug. */
  readonly readmeAsIndex?: boolean;
};

/** Output targets for generated slug-tree artifacts. */
export type SlugBundleFileTreeTarget = {
  /** Manifest targets for generated artifacts. */
  readonly manifests?: t.StringPath | readonly t.StringPath[];
  /** Optional directory to copy source content into. */
  readonly dir?:
    | t.StringPath
    | SlugBundleFileTreeTargetDir
    | readonly SlugBundleFileTreeTargetDir[];
};

/** Output directory target for generated slug-tree files. */
export type SlugBundleFileTreeTargetDir = {
  readonly kind: 'source' | 'sha256';
  readonly path: t.StringPath;
};

/** Summary stats for a slug-tree filesystem bundle run. */
export type SlugBundleFileTreeStats = {
  readonly files: number;
  readonly sourceFiles: number;
  readonly sha256Files: number;
  readonly manifests: number;
  readonly elapsed: t.Msecs;
};

/** Runtime filesystem surface used by the compiler adapter. */
export type SlugTreeFsRuntime = t.FsCapability.Instance;
