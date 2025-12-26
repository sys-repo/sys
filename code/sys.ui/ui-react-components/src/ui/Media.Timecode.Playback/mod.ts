/**
 * @module
 * Media.Timecode.Playback
 *
 * Runtime adapter for the Timecode playback state machine.
 *
 * This module bridges the pure Playback reducer (`@sys/ui-state/timecode`)
 * with React and media runtimes (e.g. <video>):
 *  - feeds external signals (video time, readiness) into the machine
 *  - executes reducer-issued commands against the runtime
 *  - exposes observable playback state to the UI
 *
 * All playback laws live in the reducer.
 * This layer translates decisions into effects — nothing more.
 */
export { Playback } from './m.Playback.ts';
export { usePlaybackClock } from './u.runner.clock.playback.ts';
