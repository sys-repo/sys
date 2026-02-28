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

/**
 * Runtime filesystem surface used by the compiler adapter.
 * Starts from the portable `FsCapability.Instance` and adds the local methods
 * still required for directory walking/materialization orchestration.
 */
export type SlugTreeFsRuntime = t.FsCapability.Instance & {
  readonly readText: (path: t.StringPath) => Promise<{ readonly data?: string }>;
  readonly copyFile: (
    from: t.StringPath,
    to: t.StringPath,
    options?: { force?: boolean; throw?: boolean; log?: boolean },
  ) => Promise<unknown>;
  readonly walk: (
    root: t.StringPath,
    options?: {
      maxDepth?: number;
      includeDirs?: boolean;
      includeFiles?: boolean;
      includeSymlinks?: boolean;
      followSymlinks?: boolean;
      exts?: string[];
      match?: RegExp[];
      skip?: RegExp[];
    },
  ) => AsyncIterable<{
    path: string;
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }>;
  readonly remove: (
    path: string,
    options?: { dryRun?: boolean; log?: boolean },
  ) => Promise<boolean>;
  readonly extname: (path: string) => string;
  readonly resolvePath: (...parts: readonly string[]) => string;
  readonly relativePath: (from: string, to: string) => string;
};
