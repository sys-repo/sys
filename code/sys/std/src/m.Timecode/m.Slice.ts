import { type t, RE } from './common.ts';
import { parse } from './u.core.parse.ts';

/**
 * Implementation of time-slice strings:
 * "<from>..<to>"
 *
 * - Bounds may be:
 *   • absolute VTT timecode        → "HH:MM:SS(.mmm)"
 *   • empty (open)                 → ""      (resolved to 0 or total)
 *   • negative VTT (from the end)  → "-HH:MM:SS(.mmm)"
 *
 * Resolution yields a concrete [from, to) millisecond window.
 */
export const Slice: t.TimecodeSliceLib = {
  is(input): input is t.TimecodeSliceString {
    if (typeof input !== 'string') return false;
    const idx = input.indexOf('..');
    if (idx < 0) return false;
    if (input.indexOf('..', idx + 2) !== -1) return false; // must appear exactly once

    const [a, b] = splitOnce(input, '..');
    return isBoundLex(a) && isBoundLex(b);
  },

  parse(input) {
    // Precondition: call-sites should guard with is(), but we still handle defensively.
    if (!Slice.is(input)) throw new Error('Invalid time slice string');
    const [a, b] = splitOnce(input, '..');
    const start = toBound(a);
    const end = toBound(b);
    return { raw: input, start, end };
  },

  resolve(slice, total) {
    const clamp = (n: number) => Math.max(0, Math.min(total, n));

    const startMs = resolveBound(slice.start, total, 'start');
    const endMs = resolveBound(slice.end, total, 'end');

    const from = clamp(startMs);
    const to = clamp(endMs);

    // Coerce to a valid window ensuring from <= to:
    if (from <= to) return { from, to };
    return { from: to, to: from };
  },
};

/**
 * Helpers:
 */
function splitOnce(input: string, token: string): [string, string] {
  const i = input.indexOf(token);
  return [input.slice(0, i), input.slice(i + token.length)];
}

/** Lexical check for a single bound string. */
function isBoundLex(s: string): boolean {
  if (s === '') return true; // open
  if (s.startsWith('-')) {
    const abs = s.slice(1);
    return RE.test(abs);
  }
  return RE.test(s);
}

/** Classify a bound into abs/open/relEnd. */
function toBound(s: string): t.TimecodeSliceBound {
  if (s === '') return { kind: 'open' };
  if (s.startsWith('-')) {
    const abs = s.slice(1);
    // TimeSlice.is() guarantees lexical validity, so parse is safe here.
    const ms = parse(abs as t.VttTimecode);
    return { kind: 'relEnd', ms };
  }
  const ms = parse(s as t.VttTimecode);
  return { kind: 'abs', ms };
}

/** Resolve a classified bound against total duration. */
function resolveBound(bound: t.TimecodeSliceBound, total: t.Msecs, side: 'start' | 'end'): t.Msecs {
  switch (bound.kind) {
    case 'abs':
      return bound.ms;
    case 'relEnd':
      return total - bound.ms;
    case 'open':
      return side === 'start' ? 0 : total;
  }
}
