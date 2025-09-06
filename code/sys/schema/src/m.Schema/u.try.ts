import { AssertError, type ValueError } from '@sinclair/typebox/value';

/**
 * Safe try/throw execution for schema-related actions.
 * Returns { ok:true, value } on success; { ok:false, errors: ValueError[] } on TypeBox failure.
 * Non-TypeBox errors are rethrown.
 */
export function tryValidate<T>(fn: () => T | undefined) {
  try {
    const value = fn();
    return { ok: true as const, value: value as T };
  } catch (err) {
    if (err instanceof AssertError) {
      return { ok: false as const, errors: toErrorArray(err) };
    }
    // Important: bubble up non-TypeBox errors
    throw err;
  }
}

/**
 * Helpers:
 */

/** Normalize thrown TypeBox error shapes into ValueError[] */
function toErrorArray(err: unknown): ValueError[] {
  const any = err as any;

  // Common AssertError shapes:
  if (Array.isArray(any?.errors)) return any.errors as ValueError[];
  if (Array.isArray(any?.error)) return any.error as ValueError[];
  if (any?.error) return [any.error as ValueError];

  // Already looks like a single ValueError
  if (any && typeof any.path === 'string' && typeof any.message === 'string') {
    return [any as ValueError];
  }

  // Fallback (should be rare)
  return [{ path: '', message: String(err) } as unknown as ValueError];
}
