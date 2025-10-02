/**
 * @module: @sys/std/async
 * Primitives for scheduling, timing, and lifecycle control.
 */
export { Promise, maybeWait } from '../m.Async.Promise/mod.ts';
export { Schedule } from '../m.Async.Schedule/mod.ts';
export { Lease } from './m.Lease.ts';
export { singleton } from './u.singleton.ts';
