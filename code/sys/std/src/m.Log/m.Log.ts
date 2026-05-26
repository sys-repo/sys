import { levels, type t } from './common.ts';
import { makeLogger as logger } from './u.logger.ts';

/**
 * Tools for standardised console logging.
 */
export const Log: t.Log.Lib = {
  levels,
  logger,
};
