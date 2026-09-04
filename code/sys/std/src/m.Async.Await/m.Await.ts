import { Is, type t } from './common.ts';
import { maybeWait } from './u.maybeWait.ts';
import { semaphore } from './u.semaphore.ts';

/**
 * Tools for working with promises.
 */
export const Await: t.Await.Lib = Object.freeze({
  isPromise: Is.promise,
  maybeWait,
  semaphore,
});
