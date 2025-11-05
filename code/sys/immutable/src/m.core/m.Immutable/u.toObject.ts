type O = Record<string, unknown>;

export * from './m.Is.ts';
export * from './u.Wrangle.ts';

import { Is } from './m.Is.ts';

/**
 * Conver a composite <Map> object into a simple {object} ← [Immutable.current]
 */
export function toObject<T extends O>(input?: any): T {
  if (Is.proxy(input)) {
    return Object.keys(input).reduce((acc, key) => {
      (acc as any)[key] = input[key];
      return acc;
    }, {} as T);
  }

  return input;
}
