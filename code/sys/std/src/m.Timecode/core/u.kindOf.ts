import { type t, RE } from '../common.ts';

/**
 * Determine the timecode format kind (HH:MM:SS, HH:MM:SS.mmm, or MM:SS).
 */
export function kindOf(tc: string): t.TimecodeKind {
  const hasMillis = tc.includes('.');
  const core = hasMillis ? tc.split('.')[0] : tc;
  const parts = core.split(':').length;
  if (parts === 2) return 'MM:SS';
  return hasMillis ? 'HH:MM:SS.mmm' : 'HH:MM:SS';
}
