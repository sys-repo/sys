import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { Mutate } from './m.Mutate.ts';
import { isObject, Validate } from './u.ts';

/**
 * Helpers for working with arrays that represent object paths.
 */
export const ObjectPath: t.ObjectPathLib = {
  Is,
  Mutate,

  /**
   * Prepend a path.
   */
  prepend(target: t.ObjectPath, prefix: t.ObjectPath) {
    return [...prefix, ...target];
  },

  /**
   * Read into an object and return the resulting value at the given path.
   */
  resolve<T>(root: unknown | unknown[], path: t.ObjectPath): T | undefined {
    Validate.rootParam(root);
    if (!path || path.length === 0) return root as T;

    let current: any = root;
    for (const key of path) {
      if (current[key] === undefined) return undefined;
      current = current[key];
    }

    return current;
  },

  /**
   * Return a strongly typed version of the resolve ƒ(🌳);
   */
  resolver<T>() {
    return (root: unknown | unknown[], path: t.ObjectPath): T | undefined => {
      return ObjectPath.resolve<T>(root, path);
    };
  },

  /**
   * Determine if the given path exists on the object.
   */
  exists(root: unknown, path: t.ObjectPath) {
    Validate.rootParam(root);
    Validate.pathParam(path);

    const pathToParent = path.length === 0 ? [] : path.slice(0, -1);
    const parent = ObjectPath.resolve(root, pathToParent);
    const field = path[path.length - 1];

    if (!(isObject(parent) || Array.isArray(parent))) return false;
    if (Array.isArray(parent) && typeof field === 'number') return true;
    if (isObject(parent)) return Object.keys(parent).includes(String(field));

    return false;
  },

  /**
   * Converts a JSON patch path to an array of strings representing each part.
   * @param path The JSON patch path (e.g., "/foo/bar/0").
   * @returns Array of strings representing each part of the path.
   */
  fromString(path: string): t.ObjectPath {
    if (typeof path !== 'string') return [];

    path = path.trim().replace(/^\/+/, '');
    if (path === '/') return [];

    // Split and unescape: '~1' → '/', '~0' → '~' (part of the RFC-6902 JSON patch standard)
    return path
      .split('/')
      .filter(Boolean)
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  },

  /**
   * Convert an arbitrary input value to a path.
   * Useful for deriving safely from unknown patch {object} types.
   */
  from(input: any): t.ObjectPath {
    if (Is.path(input)) return input;

    const value = isObject(input) ? (input as any).path : input;
    if (Is.path(value)) return value;
    if (typeof value === 'string') return ObjectPath.fromString(value);
    return [];
  },
} as const;
