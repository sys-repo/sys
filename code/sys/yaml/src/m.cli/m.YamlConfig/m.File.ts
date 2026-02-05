/**
 * @module
 */
import type { t } from './common.ts';
import { create, fromPkg } from './u.file.ts';

export const File: t.YamlConfigFileLib = {
  create,
  fromPkg,
};
