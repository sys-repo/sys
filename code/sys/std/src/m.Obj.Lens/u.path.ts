import { type t, Path } from './common.ts';

export * from './u.bindRO.ts';
export * from './u.bindRW.ts';

type PathInput = t.PathLike | undefined | null;

/**
 * Normalize incoming paths (pointer codec; numeric tokens → numbers).
 */
export function toPath(input: t.PathLike): t.ObjectPath {
  if (typeof input === 'string') {
    return Path.normalize(input, { codec: 'pointer', numeric: true });
  }
  if (Array.isArray(input)) {
    // Coerce digit-only string tokens (e.g. ['0'] → [0]) using core helper
    return Path.asNumeric(input);
  }
  return input;
}

/**
 * Make an unbound curried path from many inputs.
 */
export function makeCurriedAll<T>(...inputs: PathInput[]): t.CurriedPath<T> {
  return Path.curry<T>(toPathAll(...inputs));
}

/**
 * Normalize many inputs (pointer strings / object paths), skipping null/undefined.
 */
export function toPathAll(...inputs: PathInput[]): t.ObjectPath {
  const out: t.ObjectPath = [];
  for (const input of inputs) {
    if (input == null) continue;
    const p = toPath(input);
    out.push(...p);
  }
  return out;
}
