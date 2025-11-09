/**
 * @module Timecode
 *
 * Provides pure functional utilities for working with media-style timecodes:
 * `MM:SS`, `HH:MM:SS`, or `HH:MM:SS.mmm`.
 *
 * Exposes:
 * - `Timecode.pattern` → regex string for validation
 * - `Timecode.regex`   → compiled RegExp
 * - `Timecode.is()`    → type guard
 * - `Timecode.parseMs()` → convert to milliseconds
 * - `Timecode.cmp()`   → comparator
 * - `Timecode.sort()`  → stable ordering
 * - `Timecode.format()` → format milliseconds into a timecode
 * - `Timecode.kindOf()` → returns lexical form
 *
 * Typical usage:
 * ```ts
 * import { Timecode } from '@sys/std/timecode';
 *
 * if (Timecode.is('03:25.000')) {
 *   const ms = Timecode.parseMs('03:25.000');
 *   console.log(Timecode.format(ms + 500)); // '03:25.500'
 * }
 * ```
 */
export { Timecode } from './m.Timecode.ts';
