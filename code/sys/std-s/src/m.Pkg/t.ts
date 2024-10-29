import type { t } from './common.ts';
import type { PkgLib } from '@sys/std/t';

/**
 * PkgLib (server extenions)
 *
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export type PkgSLib = PkgLib & {
  readonly Dist: t.PkgDistLib;
};

/**
 * Tools for working with "distribution"
 */
export type PkgDistLib = {
  /**
   * Prepare and save a "distribution package"
   * meta-data file, `pkg.json`.
   */
  compute(args: t.PkgDistComputeArgs): Promise<t.PkgSaveDistResponse>;
};

export type PkgDistComputeArgs = {
  dir: t.StringPath;
  pkg?: t.Pkg;
  entry?: string;
  save?: boolean;
};

/**
 * Response to `Pkg.saveDist` method.
 */
export type PkgSaveDistResponse = {
  ok: boolean;
  exists: boolean;
  dir: t.StringDir;
  dist: t.DistPkg;
  error?: t.StdError;
};
