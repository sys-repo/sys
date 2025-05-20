import { type t } from './common.ts';
import { toString } from './u.log.toString.ts';

/**
 * Log `toString` to the console.
 */
export const log: t.PkgDistFsLib['log'] = (dist, options = {}) => {
  console.info(toString(dist, options));
};

/**
 * Logging helpers for the PkgDist data.
 */
export const Log: t.PkgDistLog = {
  toString,
};
