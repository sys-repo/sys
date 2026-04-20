/**
 * @module
 * Environment-agnostic logging primitives for consistent, dependency-free console output.
 *
 * @example
 * import { Log } from '@sys/std/log';
 * const enabled = { value: true };  // ← signal-like
 * const log = Log.logger('My.Category', { enabled, method: 'info' });
 * log('boot');                      // ← prints
 * enabled.value = false;            // ← turn off without globals
 * log('muted');                     // ← no-op
 */
export { Log } from './m.Log.ts';
