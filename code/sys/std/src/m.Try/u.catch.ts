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
  // Preserve native Error instances as-is.
  if (cause instanceof Error) return cause;

  // Preserve structured "error-like" objects by lifting them into a real Error,
  // while copying fields across (kind, name, code, etc).
  if (Err.Is.errorLike(cause)) {
    const src = cause as { [key: string]: unknown; message: string };

    const error = new Error(src.message);

    // Preserve an explicit name if present (e.g. "CrdtRepoError").
    if (typeof src.name === 'string') {
      error.name = src.name;
    }

    // Copy all enumerable fields onto the Error instance for downstream access.
    Object.assign(error, src);
    return error;
  }

  // Fallback: stringify anything else (numbers, booleans, null, etc).
  return new Error(String(cause));
}
