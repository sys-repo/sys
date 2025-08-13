/**
 * Helpers for retrieveing environment variables (aka. "secrets").
 * @module
 *
 * @example
 * ```ts
 * import { Env } from '@sys/fs/env';
 * const env = await Env.load();
 *
 * env.get('TEST_SAMPLE') //== "foobar"
 * ```
 */
export { Env } from './m.Env.ts';
