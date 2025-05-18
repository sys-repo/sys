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
   * Prepare and save a "distribution package"
   * meta-data file, `pkg.json`.
   */
  compute(args: t.PkgDistComputeArgs): Promise<t.PkgDistComputeResponse>;

  /**
   * Verify a folder with hash definitions of the distribution-package.
   */
  verify(
    dir: t.StringPath,
    hash?: t.StringHash | t.CompositeHash,
  ): Promise<t.PkgDistVerifyResponse>;

  /** Convert a <DistPkg> to a string for logging. */
  toString(dist?: t.DistPkg, options?: { title?: string; dir?: t.StringDir }): string;

  /** Log a `toString()` of the given <DistPkg> to the console. */
  log(dist?: t.DistPkg, options?: { title?: string; dir?: t.StringDir }): void;
};

/**
 * Arguments passed to the `Pkg.Dist.compute` method.
 */
export type PkgDistComputeArgs = {
  dir: t.StringPath;
  pkg?: t.Pkg;
  builder?: t.Pkg;
  entry?: string;
  url?: t.DistPkg['url'];
  save?: boolean;
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
  dist?: t.DistPkg;
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
