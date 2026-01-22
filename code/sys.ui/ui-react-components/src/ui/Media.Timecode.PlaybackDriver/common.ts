import { pkg, Pkg } from '../common.ts';

export { PlaybackSchema } from '@sys/schema/model/timecode/playback';
export { Timecode } from '@sys/std/timecode';
export { Timecode as TimecodeState } from '@sys/ui-state/timecode';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Media.Timecode.Driver';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
