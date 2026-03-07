import type { t } from './common.ts';
import { Is } from './m.Is.ts';

type O = Record<string, unknown>;

/**
 * Convert a composite <Map> object into a simple {object} ← [Immutable.current]
 */
export function toObject<T extends O>(input: T): t.UnwrapImmutable<T>;
export function toObject<T extends O | undefined>(input?: T): t.UnwrapImmutable<T>;
export function toObject(input?: any): any {
  if (Is.proxy(input)) {
    return Object.keys(input).reduce((acc, key) => {
      (acc as any)[key] = input[key];
      return acc;
    }, {} as any);
  }
  return input;
}
