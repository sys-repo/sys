/**
 * @module
 * Safe unified try/catch execution for sync, async, and thenable functions.
 */
import type { t } from './common.ts';
import { _catch } from './u.catch.ts';
import { run } from './u.run.ts';

export const Try: t.TryLib = {
  run: run as t.TryRun,
};
