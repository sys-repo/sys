import { Is } from './common.ts';
import { maybeWait } from './u.maybeWait.ts';

/**
 * Tools for working with promises.
 */
export const Promise = {
  maybeWait,
  isPromise: Is.promise,
};
