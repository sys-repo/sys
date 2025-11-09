/**
 * @module Timecode
 *
 * Pure functional utilities for working with media-style timecodes:
 * `MM:SS`, `HH:MM:SS`, or `HH:MM:SS.mmm`.
 *
 * Core:
 * - `Timecode.pattern` → regex string for validation
 * - `Timecode.regex` → compiled `RegExp`
 * - `Timecode.is()` → type guard for valid codes
 * - `Timecode.kindOf()` → lexical form ('MM:SS' | 'HH:MM:SS' | 'HH:MM:SS.mmm')
 * - `Timecode.parse()` → parse to milliseconds
 * - `Timecode.format()` → format milliseconds into a timecode
 * - `Timecode.sort()` → stable lexical/temporal ordering
 * - `Timecode.toEntries()` → convert `{ [tc]: data }` → sorted entries
 *
 * Functional ops:
 * - `find()` → first entry matching predicate
 * - `findAtOrBefore()` → latest ≤ target seconds
 * - `neighbors()` → previous / next around a time
 * - `between()` → entries within `[start, end)`
 * - `nearest()` → N closest entries to a time
 *
 * Example:
 * ```ts
 * import { Timecode } from '@sys/std/timecode';
 *
 * if (Timecode.is('03:25.000')) {
 *   const ms = Timecode.parse('03:25.000');
 *   console.log(Timecode.format(ms + 500)); // → '03:25.500'
 * }
 * ```
 */
export { Ops } from './m.Ops.ts';
export { Timecode } from './m.Timecode.ts';
export { between, find, findAtOrBefore, nearest, neighbors } from './u.ops.ts';
