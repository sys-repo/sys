import { ObjectPath, type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Safely modify a string stored on an immutable object <T>
 * (NB: this mutates the given state.)
 */
export const splice: t.TextSplice = <T extends O = O>(
  state: T,
  path: t.ObjectPath,
  index: t.Index,
  delCount: number,
  newText?: string,
): void => {
  if (path.length === 0) throw new Error('Target path is empty');
  const target = ObjectPath.resolve<O>(state, path.slice(0, -1));
  const prop = path[path.length - 1];

  // Guard inputs.
  if (!target || typeof target !== 'object') {
    throw new Error(`Target path "${path.join('.')}" is not within an object`);
  }
  if (!(target[prop] === undefined || typeof target[prop] === 'string')) {
    throw new Error(`Target path "${path.join('.')}" is not a string`);
  }

  // Perform the splice operation.
  const str = target[prop] ?? '';
  target[prop] = `${str.slice(0, index)}${newText || ''}${str.slice(index + delCount)}`;
};

/**
 * Replace all of a string using splice.
 */
export const replace: t.TextReplace = <T extends O>(doc: T, path: t.ObjectPath, next: string) => {
  const current = ObjectPath.resolve(doc, path);
  if (typeof current === 'string') splice(doc, path, 0, current.length, next);
};
