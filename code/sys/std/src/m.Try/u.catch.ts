import { type t, isPromise, Err } from './common.ts';

// Overload: throws → sync result
export function _catch<T = never>(fn: () => never): t.TryResult<T>;
// Overload: async
export function _catch<T>(fn: () => Promise<T>): Promise<t.TryResult<T>>;
// Overload: sync
export function _catch<T>(fn: () => T): t.TryResult<T>;

/**
 * Execute a function safely, returning a result object instead of throwing.
 */
export function _catch<T>(fn: () => T | Promise<T>): t.TryResult<T> | Promise<t.TryResult<T>> {
  try {
    const out = fn();
    if (isPromise(out)) {
      return Promise.resolve(out)
        .then((data) => ({ ok: true as const, data, error: undefined }))
        .catch((e) => ({ ok: false as const, error: toError(e) }));
    }
    return { ok: true, data: out as T, error: undefined };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

/**
 * Helpers:
 */
function toError(cause: unknown): Error {
  // Coerce any thrown value to a native Error:
  return Err.Is.errorLike(cause) ? (cause as Error) : new Error(String(cause));
}
