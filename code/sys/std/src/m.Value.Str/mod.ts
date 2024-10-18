/**
 * @module
 * Tools for working on strings of text.
 *
 * @example
 * ```ts
 * import { Value, Str } from '@sys/std/value';
 *
 * const long = 'hello world.'.repeat(100)'
 * const short = Str.shorten(long);
 * const caps = Str.capitalize(short);
 *
 * expect(Value.Str).to.equal(Str);
 * ```
 */
export { Str, bytes, capitalize, diff, plural, replace, shorten, splice } from './m.Str.ts';
