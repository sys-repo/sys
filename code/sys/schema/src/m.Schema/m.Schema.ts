import { Type, type Static } from '@sinclair/typebox';
import { AssertError, Value, type ValueError } from '@sinclair/typebox/value';

import { type t } from './common.ts';
export type { Static };

export { Type, Value };

export const Schema: t.SchemaLib = {
  get Type() {
    return Type;
  },
  get Value() {
    return Value;
  },

  /**
   * Safe try/throw execution for schema-related actions.
   * Returns { ok:true, value } on success; { ok:false, errors: ValueError[] } on TypeBox failure.
   * Non-TypeBox errors are rethrown.
   */
  try<T>(fn: () => T | undefined) {
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
  },
} as const;

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
