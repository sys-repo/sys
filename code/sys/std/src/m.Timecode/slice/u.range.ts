import { type t } from '../common.ts';
import { is } from './u.is.ts';
import { parse } from './u.parse.ts';
import { resolve } from './u.resolve.ts';
import { toString } from './u.string.ts';

/**
 * Convert a slice string into a concrete [from,to) millisecond window.
 *
 * - Trims and normalizes whitespace before validation.
 * - Returns undefined for invalid syntax or when total is not provided.
 * - Clamps output within [0,total].
 */
export function toRange(
  input?: t.TimecodeSliceStringInput,
  total?: t.Secs,
): t.MsecSpan | undefined {
  // Canonicalize first: trims/condenses whitespace and ensures proper delimiter.
  const normalized = toString(input);
  if (!normalized || !is(normalized)) return undefined;

  // Require total (in seconds) to resolve open/relEnd; coerce → ms (floored).
  if (typeof total === 'number' && Number.isFinite(total) && total >= 0) {
    const totalMs = Math.floor(total * 1000) as t.Msecs;
    const { from, to } = resolve(parse(normalized as t.TimecodeSliceString), totalMs);
    return { from, to };
  }

  // Without total, only absolute..absolute forms are meaningful.
  // For open or relative bounds, total is required to compute concrete window.
  return undefined;
}
