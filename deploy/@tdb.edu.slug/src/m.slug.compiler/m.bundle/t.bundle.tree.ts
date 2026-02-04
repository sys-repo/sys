import type { t } from './common.ts';

/**
 * Configuration
 */
export type SlugBundleFileTree = {
  /** Source directory to scan. */
  readonly source?: t.StringPath;
  /** Explicit bundle docid (used for manifest indexes). */
  readonly docid?: t.StringId;
  /** CRDT configuration for DAG-based lookup. */
  readonly crdt: {
    readonly docid: t.StringId;
    readonly path: t.StringPath;
  };
  /** Targets for generated artifacts. */
  readonly target?: SlugBundleFileTreeTarget;
  /** File extensions to include (e.g. ".md"). */
  readonly include?: readonly string[];
  /** Directory entries to ignore. */
  readonly ignore?: readonly string[];
  /** Sort directory entries by name. */
  readonly sort?: boolean;
  /** Treat README.md as the directory slug. */
  readonly readmeAsIndex?: boolean;
};

export type SlugBundleFileTreeTarget = {
  /** Manifest targets for generated artifacts. */
  readonly manifests?: t.StringPath | readonly t.StringPath[];
  /** Optional directory to copy source content into. */
  readonly dir?:
    | t.StringPath
    | SlugBundleFileTreeTargetDir
    | readonly SlugBundleFileTreeTargetDir[];
};

export type SlugBundleFileTreeTargetDir = {
  readonly kind: 'source' | 'sha256';
  readonly path: t.StringPath;
};

export type SlugBundleFileTreeStats = {
  readonly files: number;
  readonly sourceFiles: number;
  readonly sha256Files: number;
  readonly manifests: number;
  readonly elapsed: t.Msecs;
};
