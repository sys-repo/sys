import type { t } from './common.ts';
import type { PkgLib } from '@sys/std/t';

/**
 * PkgLib (server extenions)
 *
 * Tools for working with the system standard
 * {pkg} "package" meta-data structure.
 */
export type PkgSLib = PkgLib & {
  /**
   * Prepare and save a "distribution package"
   * meta-data file, `pkg.json`.
   */
  dist(args: t.SaveDistArgs): Promise<t.PkgSaveDistResponse>;
};

export type SaveDistArgs = {
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
  dir: t.StringDirPath;
  dist: t.DistPkg;
  error?: t.StdError;
};
