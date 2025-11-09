import { type t, RE } from './common.ts';

/** Type guard: true when input matches the grammar. */
export function is(input: unknown): input is t.VttTimecode {
  return typeof input === 'string' && RE.test(input);
}

export function kindOf(tc: string): t.TimecodeKind {
  const hasMillis = tc.includes('.');
  const core = hasMillis ? tc.split('.')[0] : tc;
  const parts = core.split(':').length;
  if (parts === 2) return 'MM:SS';
  return hasMillis ? 'HH:MM:SS.mmm' : 'HH:MM:SS';
}
