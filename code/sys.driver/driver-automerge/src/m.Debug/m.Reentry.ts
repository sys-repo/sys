import { type t } from './common.ts';

let depth = 0;
const labelsStack: string[] = [];

/**
 * Re-entrancy sentinel.
 */
export const Reentry: t.Debug.Reentry.Lib = {
  enter<T>(label: string, fn: () => T): T {
    depth++;
    labelsStack.push(label);
    try {
      return fn();
    } finally {
      labelsStack.pop();
      depth--;
    }
  },
  inCallback(): boolean {
    return depth > 0;
  },
  labels(): readonly string[] {
    return labelsStack.slice();
  },
} satisfies t.Debug.Reentry.Lib;
