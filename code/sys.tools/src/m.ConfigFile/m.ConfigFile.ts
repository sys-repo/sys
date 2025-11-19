import { type t } from './common.ts';
import { getOrCreate, getter } from './u.get.ts';
import { defaultDoc } from './u.ts';

/**
 * Simple JSON based file-persitence for configuration settings file.
 */
export const ConfigFile: t.ConfigFileLib = {
  getter,
  getOrCreate,
  default: defaultDoc,
};
