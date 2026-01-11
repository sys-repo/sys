/**
 * Media.Timecode.PlaybackDriver
 *
 * Runtime boundary.
 *
 * Responsibilities:
 * - inputs  ← authoritative time source (video OR synthetic pause clock)
 * - effects → imperative runtime I/O derived from reducer cmds
 *
 * Non-responsibilities:
 * - no timeline construction
 * - no playback policy
 * - no state mutation (machine-owned)
 *
 * Selects and gates the active time authority only.
 */
export { Dev } from './-dev/mod.ts';
export { PlaybackDriver } from './m.PlaybackDriver.ts';
