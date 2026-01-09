import { type t, Is } from './common.ts';
import { maybeWait } from './u.maybeWait.ts';
import { semaphore } from './u.semaphore.ts';

/**
 * Tools for working with promises.
 */
export const Promise: t.PromiseLib = {
  isPromise: Is.promise,
  maybeWait,
  semaphore,
};
