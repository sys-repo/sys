import type { t } from './common.ts';
import { AssertError } from './m.Value.ts';

/**
 * Safe try/throw execution for schema-related actions.
 * Returns { ok:true, value } on success; { ok:false, errors: ValueError[] } on schema assertion failure.
 * Unexpected errors are rethrown.
 */
export function tryValidate<T>(fn: () => T | undefined) {
  try {
    const value = fn();
    return { ok: true as const, value: value as T };
  } catch (err) {
    if (err instanceof AssertError) {
      return { ok: false as const, errors: toErrorArray(err) };
    }
    // Important: bubble up unexpected errors.
    throw err;
  }
}

/**
 * Helpers:
 */

/** Normalize thrown schema error shapes into ValueError[] */
function toErrorArray(err: unknown): t.ValueError[] {
  if (err instanceof AssertError) return [...err.errors];

  // Fallback (should be rare)
  return [{ path: '', message: String(err) } as t.ValueError];
}
