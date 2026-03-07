import { type t } from '../common.ts';
import { parse } from '../core/u.parse.ts';
import { RE } from '../m.Pattern.ts';

export function splitOnce(input: string, token: string): [string, string] {
  const i = input.indexOf(token);
  return [input.slice(0, i), input.slice(i + token.length)];
}

/**
 * Lexical check for a single bound string.
 */
export function isBoundLex(s: string): boolean {
  if (s === '') return true; // open
  if (s === '0') return true; // zero shorthand
  if (s === '-0') return true; // negative zero → treat as zero

  if (s.startsWith('-')) {
    const abs = s.slice(1);
    return RE.timecode.test(abs);
  }
  return RE.timecode.test(s);
}

/**
 * Classify a bound into abs/open/relEnd.
 */
export function toBound(s: string): t.TimecodeSliceBound {
  if (s === '') return { kind: 'open' };
  if (s === '0') return { kind: 'abs', ms: 0 as t.Msecs };
  if (s === '-0') return { kind: 'relEnd', ms: 0 as t.Msecs }; // preserve intent

  if (s.startsWith('-')) {
    const abs = s.slice(1);
    const ms = parse(abs as t.VttTimecode);
    return { kind: 'relEnd', ms };
  }

  const ms = parse(s as t.VttTimecode);
  return { kind: 'abs', ms };
}

/**
 * Format milliseconds → "HH:MM:SS" (adds .mmm if non-zero).
 */
export function toHms(ms: t.Msecs): string {
  const totalMs = Number(ms);
  const totalSec = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const core = [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  const frac = totalMs % 1000;
  return frac ? `${core}.${String(frac).padStart(3, '0')}` : core;
}
