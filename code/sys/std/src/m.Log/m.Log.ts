import { type t, levels } from './common.ts';
import { makeLogger as logger } from './u.logger.ts';

/**
 * Tools for standardised console logging.
 */
export const Log: t.LogLib = {
  levels,
  logger,
};
