import { type t, Path } from './common.ts';

export * from './u.bindRO.ts';
export * from './u.bindRW.ts';

/**
 * Normalize incoming paths (pointer codec; numeric tokens → numbers).
 */
export function toPath(input: t.PathLike): t.ObjectPath {
  return typeof input === 'string'
    ? Path.normalize(input, { codec: 'pointer', numeric: true })
    : input;
}

/**
 * Make an unbound curried path from a path-like.
 */
export function makeCurried<T>(path: t.PathLike): t.CurriedPath<T> {
  return Path.curry<T>(toPath(path));
}
