import type { t } from './common.ts';
import { Codec } from './m.Codec.ts';

/**
 * Coerce digit-only string tokens into numbers.
 * Returns a mutable ObjectPath (not readonly).
 */
export function asNumeric(path: readonly (string | number)[]): t.ObjectPath {
  const out: (string | number)[] = [];
  for (const k of path) {
    if (typeof k === 'string' && /^(0|[1-9][0-9]*)$/.test(k)) {
      out.push(Number(k)); // ← coerce 0, 10, 123
    } else {
      out.push(k); //         ←  keep '01', '-1', '1.0', '00', etc. as strings
    }
  }
  return out;
}

/**
 * Encode a path array → string.
 * - Uses the given codec (defaults to `pointer`).
 */
export function encode(path: t.ObjectPath, opts?: t.ObjPathEncodeOptions): string {
  const c = resolveCodec(opts?.codec);
  return c.encode(path);
}

/**
 * Decode a string → path array.
 * - Uses the given codec (defaults to `pointer`).
 * - `numeric: true` coerces digit-only tokens into numbers.
 */
export function decode(text: string, opts: t.ObjPathDecodeOptions = {}): t.ObjectPath {
  const { numeric = true } = opts;
  const c = resolveCodec(opts?.codec);
  const out = c.decode(text);
  return numeric ? asNumeric(out) : out;
}

/**
 * Helpers:
 */

/** Resolve a codec from kind or instance. */
function resolveCodec(kind?: t.ObjPathCodecKind | t.ObjPathCodec): t.ObjPathCodec {
  if (!kind) return Codec.default;
  const maybe = kind as t.ObjPathCodec;
  return typeof maybe.encode === 'function' && typeof maybe.decode === 'function'
    ? maybe
    : kind === 'dot'
      ? Codec.dot
      : Codec.pointer;
}
