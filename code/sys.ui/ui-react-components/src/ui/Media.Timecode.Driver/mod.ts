/**
 * Media.Timecode.Driver
 *
 * Clock driver for the Timecode playback system.
 *
 * This module sits at the boundary between the pure playback state machine
 * and its runtime host. It translates observed time sources (video signals,
 * timers) into reducer inputs, and executes reducer-emitted commands against
 * an imperative runtime.
 *
 * Conceptually:
 *   • The state machine decides what should happen.
 *   • The driver observes what is happening and applies what was decided.
 *
 * The driver carries no timeline knowledge and makes no playback decisions.
 * It does not compute beats, segments, or progression. Its internal state is
 * limited to a small latch that selects and gates a single authoritative
 * time source.
 *
 * Time advances from observed media time when playback is live, and from a
 * synthetic monotonic clock only while materializing virtual pauses.
 *
 * This separation is intentional: it keeps temporal logic testable, keeps
 * policy out of the runtime edge, and allows the driver to be replaced or
 * reimplemented without disturbing the state machine.
 */
export { PlaybackDriver } from './m.Driver.ts';
