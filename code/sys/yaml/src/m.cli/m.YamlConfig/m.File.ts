/**
 * @module
 */
import type { t } from './common.ts';
import { create, fromPkg, migrateDir } from './u.fs.file.ts';

export const File: t.YamlConfig.File.Lib = {
  create,
  fromPkg,
  migrateDir,
};
