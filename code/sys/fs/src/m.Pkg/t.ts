import type { PkgLib } from '@sys/std/t';
import type { t } from './common.ts';

/**
 * PkgLib (server extenions)
 *
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export type PkgFsLib = PkgLib & {
  /** Tools for working with distribution packages. */
  readonly Dist: t.PkgDistFsLib;
};

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export type PkgDistFsLib = t.PkgDistLib & {
  /**
   * Load a `dist.json` file into a \<DistPackage\> type.
   */
  load(dir: t.StringPath): Promise<t.PkgDistLoadResponse>;

  /**
   * Prepare and save a "distribution package" meta-data file, `pkg.json`.
   */
  compute(args: t.PkgDistComputeArgs): Promise<t.PkgDistComputeResponse>;

  /**
   * Verify a folder with hash definitions of the distribution-package.
   */
  verify(
    dir: t.StringPath,
    hash?: t.StringHash | t.CompositeHash,
  ): Promise<t.PkgDistVerifyResponse>;

  /** Logging helpers for the PkgDist data. */
  readonly Log: PkgDistLog;
};

/**
 * Logging helpers for the PkgDist data.
 */
export type PkgDistLog = {
  /** Convert a <DistPkg> to a string for logging. */
  dist(dist?: t.DistPkg, options?: LogOptions): string;
  /** Prepare a string showing a tree child-packages for logging. */
  children(dir: t.StringDir, dist: t.DistPkg): Promise<string>;
};
type LogOptions = { title?: string | false; dir?: t.StringDir; indent?: number };

/**
 * Arguments passed to the `Pkg.Dist.compute` method.
 */
export type PkgDistComputeArgs = {
  dir: t.StringPath;
  pkg?: t.Pkg;
  builder?: t.Pkg;
  save?: boolean;
  filter?(path: t.StringPath): boolean;
  onHashProgress?(e: t.DirHashComputeProgressEvent): void | Promise<void>;
  /**
   * Reuse child `dist.hash.parts` to avoid re-hashing nested bundles.
   *
   * Behavior:
   * - Child content hash parts are merged into the parent hash tree.
   * - Child `dist.json` file bytes are intentionally NOT included in the parent hash.
   *
   * Rationale:
   * - Keeps parent digest content-stable across rebuilds where only child metadata
   *   (for example `build.time`) changes.
   */
  trustChildDist?: boolean;
};

/**
 * Response from the `Pkg.Dist.compute` method call.
 */
export type PkgDistComputeResponse = {
  exists: boolean;
  dir: t.StringDir;
  dist: t.DistPkg;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.load` method call.
 */
export type PkgDistLoadResponse = {
  exists: boolean;
  path: t.StringPath;
  kind: 'canonical' | 'legacy' | 'invalid' | 'missing';
  dist?: t.DistPkg;
  legacy?: t.DistPkgLegacy;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.verify` method call.
 */
export type PkgDistVerifyResponse = {
  is: t.HashVerifyResponse['is'];
  exists: boolean;
  dist?: t.DistPkg;
  error?: t.StdError;
};
