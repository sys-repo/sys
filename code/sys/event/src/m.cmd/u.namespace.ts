import type { t } from './common.ts';

/**
 * Exact namespace matching for Cmd wire envelopes.
 */
export function sameNamespace(a: t.Cmd.Namespace | undefined, b: t.Cmd.Namespace | undefined) {
  return a === b;
}
