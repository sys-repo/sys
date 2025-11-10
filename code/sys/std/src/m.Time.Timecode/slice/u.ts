import { type t, RE } from '../common.ts';
import { parse } from '../core/u.parse.ts';

export function splitOnce(input: string, token: string): [string, string] {
  const i = input.indexOf(token);
  return [input.slice(0, i), input.slice(i + token.length)];
}

/**
 * Lexical check for a single bound string.
 */
export function isBoundLex(s: string): boolean {
  if (s === '') return true; // open
  if (s.startsWith('-')) {
    const abs = s.slice(1);
    return RE.test(abs);
  }
  return RE.test(s);
}

/**
 * Classify a bound into abs/open/relEnd.
 */
export function toBound(s: string): t.TimecodeSliceBound {
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
