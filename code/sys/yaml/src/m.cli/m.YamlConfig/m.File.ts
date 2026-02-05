/**
 * @module
 */
import type { t } from './common.ts';
import { create, fromPkg, migrateDir } from './u.fs.file.ts';

export const File: t.YamlConfigFileLib = {
  create,
  fromPkg,
  migrateDir,
};
