/**
 * @module
 * Process-local reference account authority. No listener or browser ceremony on import.
 */
import { type t, Time } from './common.ts';
import { createWith } from './u/u.createWith.ts';
import { verifier } from './u/u.verifier.ts';

/**
 * Construct the process-local reference account authority.
 */
export const AccountService: t.AccountService.Lib = {
  create: (options) => createWith(options, { now: () => Time.now.timestamp, verifier }),
};
