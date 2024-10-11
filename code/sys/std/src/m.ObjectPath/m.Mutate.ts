import type { t } from './common.ts';
import { resolve, Validate } from './u.ts';

/**
 * Helpers for mutating value via an [ObjectPath].
 */
export const Mutate: t.ObjectPathMutateLib = {
  /**
   * Write a value to the given path on the root object.
   * If parts of the path do not exist, they are created as objects.
   */
  value<T>(root: unknown, path: t.ObjectPath, value: T): void {
    Validate.rootParam(root);
    Validate.pathParam(path);
    let current: any = root;

    path.forEach((key, index) => {
      if (index === path.length - 1) {
        // Last key in path → update the value.
        if (value === undefined) delete current[key];
        else current[key] = value;
      } else {
        // If the next part of the path doesn't exist, create it as an object.
        if (typeof current[key] !== 'object' || current[key] === null) current[key] = {};
        current = current[key];
      }
    });
  },

  /**
   * Ensures there is an object at the given path.
   */
  ensure<T>(root: unknown | unknown[], path: t.ObjectPath, defaultValue: T): T {
    const existing = resolve<T>(root, path);
    if (existing) return existing;
    Mutate.value(root, path, defaultValue);
    return resolve<T>(root, path)!;
  },

  /**
   * Performs a field deletion at the given path.
   */
  delete(root: unknown, path: t.ObjectPath) {
    Mutate.value(root, path, undefined);
  },
} as const;
