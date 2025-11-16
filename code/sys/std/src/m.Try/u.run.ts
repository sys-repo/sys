import { type t } from './common.ts';
import { _catch } from './u.catch.ts';

/**
 * Helpers for safe try/catch execution.
 */
export const run = <T>(
  fn: () => T | Promise<T>,
): t.TryRunResult<T> | Promise<t.TryRunResult<T>> => {
  const out = _catch(fn as () => T | Promise<T>);

  // Async branch: _catch returned a Promise<TryResult<T>>.
  if (out instanceof Promise) {
    return out.then((result) => {
      const catchFn = (handler: (error: Error) => void): t.TryResult<T> => {
        if (!result.ok) handler(result.error);
        return result;
      };
      return { result, catch: catchFn };
    });
  }

  // Sync branch: _catch returned TryResult<T>.
  const result = out as t.TryResult<T>;
  const catchFn = (handler: (error: Error) => void): t.TryResult<T> => {
    if (!result.ok) handler(result.error);
    return result;
  };
  return { result, catch: catchFn };
};
