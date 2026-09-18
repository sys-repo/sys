import { Is } from '../common.ts';

/**
 * Determine whether an object owns the given property key.
 */
export function hasOwn<K extends PropertyKey>(input: unknown, key: K): input is Record<K, unknown> {
  return (Is.object(input) || Is.func(input)) && Object.prototype.hasOwnProperty.call(input, key);
}
