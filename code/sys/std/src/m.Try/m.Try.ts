import { type t } from './common.ts';
import { _catch } from './u.catch.ts';

/**
 * Helpers for safe try/catch execution.
 */
export const Try: t.TryLib = {
  catch: _catch,
};
