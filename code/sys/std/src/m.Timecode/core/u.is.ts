import { type t, RE } from '../common.ts';

/**
 * Check if a string is a valid VTT timecode (e.g. "00:01:23.456").
 */
export function is(input: unknown): input is t.VttTimecode {
  return typeof input === 'string' && RE.test(input);
}
