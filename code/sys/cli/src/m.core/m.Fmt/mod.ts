/**
 * @module
 * Formatting helpers, ANSI color tools, and ANSI stripping helpers for CLI output.
 *
 * Default system foreground grammar:
 * - white → primary; gray → secondary.
 * - green → affirmative; cyan → informational.
 * - magenta → awareness of a valid non-default state; yellow → caution.
 * - red → failure, hard block, or destructive change.
 *
 * ANSI-stripped output remains semantically complete. Identity accents do not establish status;
 * bold and dim change emphasis, not severity. Formatter-inserted omission markers are dim gray
 * structural context and do not inherit the foreground of retained content.
 */

/** Shared command-line formatting helper library. */
export { Fmt } from './m/m.Fmt.ts';

/** ANSI color formatter functions. */
export { c } from '../common.ts';
/** ANSI color helper library. */
export { Color } from '../common.ts';
/** Remove ANSI escape codes from a string. */
export { stripAnsi } from '../common.ts';
/** Terminal text measurement, fitting, wrapping, and clipping operations. */
export { Text } from '../m.Fmt.Text/mod.ts';
/** Navigable help chapter formatting and tree helpers. */
export { Chapters } from '../m.Fmt.Chapters/mod.ts';
/** Terminal table formatter. */
export { Table } from '../m.Table/mod.ts';
