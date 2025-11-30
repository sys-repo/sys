import { Is } from './common.ts';

type O = Record<string, unknown>;

/**
 * Returns a plain object if the input is a record; otherwise returns an empty object.
 */
export function ensureIsObject(input?: O): O {
  if (!input) return {};
  if (!Is.record(input)) return {};
  return input;
}
