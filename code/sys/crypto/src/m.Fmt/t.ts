import { type t } from './common.ts';

/**
 * Hash related console logging helpers.
 */
export type HashFmtLib = {
  digest(input?: t.HashInput, options?: { length?: number; algo?: boolean }): string;
};
