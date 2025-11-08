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
 * - String segments are pre-sanitized and strictly decoded (pointer default).
 * - Array segments pass through untouched.
 */
export function toPathAll(...inputs: PathInput[]): t.ObjectPath {
  const out: t.ObjectPath = [];
  for (const seg of sanitizePathInputs(...inputs)) {
    // Strings have already been decoded to ObjectPath;
    // Arrays must still be coerced to numeric indices where applicable:
    const arr = Array.isArray(seg) ? Path.asNumeric(seg) : seg;
    out.push(...arr);
  }
  return out;
}

export function sanitizePathInputs(...segments: PathInput[]): t.PathLike[] {
  const out: t.PathLike[] = [];
  for (const seg of segments) {
    if (seg == null) continue;
    if (Array.isArray(seg)) {
      out.push(seg);
    } else if (typeof seg === 'string') {
      // Tolerant repair, still strict decode:
      out.push(Path.decode(seg, { safe: true }));
    } else {
      out.push(seg);
    }
  }
  return out;
}
