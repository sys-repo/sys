import { Is, type t } from './common.ts';

/**
 * Wait for the promise to complete if the given value
 * is a promise, other wise immediate resposne.
 */
export const maybeWait: t.MaybeWait = async <T>(value: T | Promise<T>) => {
  if (Is.promise(value)) await value;
  return value;
};
