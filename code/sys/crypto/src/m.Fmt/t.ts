import { type t } from './common.ts';

export type LogLib = {};

/**
 * Hash related console logging helpers.
 */
export type FmtHashLib = {
  digest(input?: t.HashInput, options?: { length?: number }): string;
};
