import { type t } from '../common.ts';

/**
 * Deeply clone the given object (circular-reference safe)
 * with support for Date and RegExp.
 */
export const clone: t.ObjLib['clone'] = (obj) => deepClone(obj);

/**
 * Helpers
 */
function deepClone<T>(obj: T, visited = new WeakMap()): T {
  // Primitives and functions not cloned.
  if (obj === null || typeof obj !== 'object') return obj;

  // Return cached clone if available (handle cycles safely).
  if (visited.has(obj)) return visited.get(obj);

  // Handle Date objects:
  if (obj instanceof Date) {
    const clonedDate = new Date(obj.getTime());
    visited.set(obj, clonedDate);
    // Clone any extra properties on the Date:
    for (const key of Reflect.ownKeys(obj)) {
      // NB: Optionally skip built-in keys, though most Date objects won't have extra ones.
      if (typeof key === 'string' && ['getTime', 'toString', 'valueOf', 'toJSON'].includes(key)) {
        continue;
      }
      (clonedDate as any)[key] = deepClone((obj as any)[key], visited); // ← 🌳 RECURSION
    }
    return clonedDate as unknown as T;
  }

  // Handle RegExp objects:
  if (obj instanceof RegExp) {
    const clonedRegExp = new RegExp(obj.source, obj.flags);
    visited.set(obj, clonedRegExp);

    // Clone any extra properties on the RegExp:
    for (const key of Reflect.ownKeys(obj)) {
      (clonedRegExp as any)[key] = deepClone((obj as any)[key], visited); // ← 🌳 RECURSION
    }
    return clonedRegExp as unknown as T;
  }

  // Handle arrays:
  if (Array.isArray(obj)) {
    const arrClone: any[] = [];
    visited.set(obj, arrClone);
    for (const item of obj) {
      arrClone.push(deepClone(item, visited)); // ← 🌳 RECURSION
    }
    return arrClone as unknown as T;
  }

  // Handle plain objects:
  const cloneObj = Object.create(Object.getPrototypeOf(obj));
  visited.set(obj, cloneObj);

  // Copy value, and preserve dyanmic getter/setter properties.
  for (const key of Reflect.ownKeys(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (!desc) continue;

    const clonedDesc = { ...desc };
    if ('value' in desc) clonedDesc.value = deepClone(desc.value, visited); // ← 🌳 RECURSION

    // NB: Getter/setter functions assigned as-is (not cloned).
    Object.defineProperty(cloneObj, key, clonedDesc);
  }

  // Finish up.
  return cloneObj;
}
