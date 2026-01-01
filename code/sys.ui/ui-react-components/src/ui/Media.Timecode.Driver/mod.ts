/**
 * Media.Timecode.Driver
 *
 * Runtime boundary:
 * - inputs  ← authoritative time (video OR synthetic pause clock)
 * - effects → imperative runtime (from reducer cmds)
 *
 * No timeline/policy; only selects/gates the time source.
 */
export { PlaybackDriver } from './m.Driver.ts';
