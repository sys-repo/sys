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
 * `Partial<State>` patch style. Callers with different
 * patch semantics should supply a custom `isNoop`.
 */
export function defaultIsNoop<State, Patch>(_: State, patch: Patch | undefined): boolean {
  if (patch === undefined || patch === null) return true;
  if (typeof patch !== 'object') return false;
  return Object.keys(patch as object).length === 0;
}
