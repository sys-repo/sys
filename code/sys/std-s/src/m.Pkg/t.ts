import type { t } from './common.ts';
import type { PkgLib } from '@sys/std/t';

/**
 * (server extenions of): <PkgLib>
 *
 * Tools for working with the system standard
 * {pkg} "package" meta-data structure.
 */
export type PkgSLib = PkgLib & {
  /**
   * Prepare and save a "distribution package"
   * meta-data file, `pkg.json`.
   */
  saveDist(dist: t.StringDirPath): Promise<t.PkgSaveDistResponse>;
};

/**
 * Response to `Pkg.saveDist` method.
 */
export type PkgSaveDistResponse = {
  ok: boolean;
  exists: boolean;
  dir: t.StringDirPath;
  error?: t.StdError;
};
