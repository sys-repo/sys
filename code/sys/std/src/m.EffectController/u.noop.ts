import { Is } from './common.ts';

type O = Record<string, unknown>;

/**
 * Default no-op predicate for EffectController patches.
 *
 * Treats the following as no-ops:
 * - `undefined` or `null`
 * - empty object `{}` (common for `Partial<State>`)
 *
 * All non-object patches are treated as meaningful.
 *
 * Intended as a cheap, shallow guard for the default
 * `Partial<State>` patch style. Only plain-object patches
 * (object literal / null-proto) participate in shallow
 * noop suppression. Callers with different patch semantics
 * should supply a custom `isNoop`.
 */
export function defaultIsNoop<State, Patch>(curr: State, patch: Patch | undefined): boolean {
  if (Is.nil(patch)) return true;
  if (!Is.plainObject(patch)) return false;

  const keys = Object.keys(patch as object);
  if (keys.length === 0) return true;

  const currRecord = (Is.record(curr) ? curr : {}) as O;
  const patchRecord = patch as O;

  return keys.every((key) => Object.is(currRecord[key], patchRecord[key]));
}
