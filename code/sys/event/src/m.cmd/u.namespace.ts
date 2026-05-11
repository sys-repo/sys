import type { t } from './common.ts';

/**
 * Exact namespace matching for Cmd wire envelopes.
 */
export function sameNamespace(a: t.CmdNamespace | undefined, b: t.CmdNamespace | undefined) {
  return a === b;
}
