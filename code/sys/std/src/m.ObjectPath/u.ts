import type { t } from './common.ts';

/**
 * Read into an object and return the resulting value at the given path.
 */
export function resolve<T>(root: unknown | unknown[], path: t.ObjectPath): T | undefined {
  Validate.rootParam(root);
  if (!path || path.length === 0) return root as T;

  let current: any = root;
  for (const key of path) {
    if (current[key] === undefined) return undefined;
    current = current[key];
  }

  return current;
}

export function isObject(input: any): input is object {
  return input !== null && typeof input === 'object';
}

export const Validate = {
  rootParam(root: unknown) {
    if (typeof root !== 'object' || root === null) throw new Error('root is not an object');
  },
  pathParam(path: t.ObjectPath) {
    if (!path || path.length === 0) throw new Error('path cannot be empty');
  },
} as const;
