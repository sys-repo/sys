/**
 * @module
 * Formatting helpers, ANSI color tools, and ANSI stripping helpers for CLI output.
 */

/** ANSI color formatter functions. */
export { c } from '../common.ts';
/** ANSI color helper library. */
export { Color } from '../common.ts';
/** Remove ANSI escape codes from a string. */
export { stripAnsi } from '../common.ts';
/** Shared command-line formatting helper library. */
export { Fmt } from './m.Fmt.ts';
/** Text fitting and wrapping helpers. */
export { Text } from '../m.Fmt.Text/mod.ts';
/** Navigable help chapter formatting and tree helpers. */
export { Chapters } from '../m.Fmt.Chapters/mod.ts';
/** Terminal table formatter. */
export { Table } from '../m.Table/mod.ts';
