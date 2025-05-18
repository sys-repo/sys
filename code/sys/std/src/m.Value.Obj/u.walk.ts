import { type t } from '../common.ts';

type PathArray = (string | number)[];

/**
 * Walks an object tree (recursive descent) implementing
 * a visitor callback for each item.
 */
export function walk<T extends object | any[]>(parent: T, fn: t.ObjWalkCallback) {
  const walked = new Map<any, boolean>(); // NB: protect against circular-references.

  const walk = <T extends object | any[]>(
    parent: T,
    levelPath: PathArray,
    fn: t.ObjWalkCallback,
  ) => {
    let _stopped = false;
    const stop = () => (_stopped = true);

    const process = (key: string | number, value: any) => {
      const isArray = Array.isArray(value);
      const isObject = value !== null && typeof value === 'object';
      const hasWalked = (isObject || isArray) && walked.has(value);
      if (_stopped) return;

      const mutate = <T>(value: T) => ((parent as any)[key] = value);
      const path = [...levelPath, key];
      fn({ parent, path, key, value, stop, mutate });

      if (_stopped || hasWalked) return; // NB: visit if already walked, but don't recurse.
      if (isObject || isArray) {
        walked.set(value, true);
        walk(value, path, fn); // <== RECURSION 🌳
      }
    };

    if (Array.isArray(parent)) {
      parent.forEach((item, i) => process(i, item));
    } else if (typeof parent === 'object' && parent !== null) {
      Object.entries(parent).forEach(([key, value]) => process(key, value));
    }
  };

  // Start.
  walk<T>(parent, [], fn);
}
