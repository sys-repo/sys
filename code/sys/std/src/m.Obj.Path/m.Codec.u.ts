import type { t } from './common.ts';
import { Codec } from './m.Codec.ts';
import { sanitize } from './m.Path.sanitize.ts';

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
 * - `safe: true` pre-sanitizes the string before strict decode (may still throw).
 */
export function decode(text: string, opts: t.ObjPathDecodeOptions = {}): t.ObjectPath {
  const { numeric = true, safe = false } = opts;
  const c = resolveCodec(opts?.codec);
  const input = safe ? sanitize(text, { codec: c }).text : text; // ← only pre-process
  const out = c.decode(input); // ← still strict; may throw
  return numeric ? asNumeric(out) : out;
}

/**
 * Tolerant decode that never throws; returns result with fixes and optional error.
 */
export function tryDecode(text = '', opts: t.PathTryDecodeOptions = {}): t.PathTryDecodeResult {
  const { codec, numeric, fallback = [] } = opts;
  const { text: repaired, fixes } = sanitize(text, { codec });
  try {
    const path = decode(repaired, { codec, numeric }); // still strict
    return { ok: true, path, fixes };
  } catch (error) {
    return { ok: false, path: fallback, fixes, error: error as Error };
  }
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
