/**
 * @module
 * Terminal text layout, styling, and ANSI utilities.
 *
 * Default foreground colors:
 * - white → primary; gray → secondary.
 * - green → affirmative; cyan → informational.
 * - magenta → valid, non-default state; yellow → caution.
 * - red → failure, hard block, or destructive change.
 *
 * Output must remain understandable without color. Decorative colors do not indicate status;
 * bold and dim change emphasis, not severity. Omission markers use dim gray, independent of
 * the surrounding text.
 */

/**
 * Format text for command-line output.
 */
export { Fmt } from './m/m.Fmt.ts';

/**
 * Apply ANSI colors and text styles.
 */
export { c } from '../common.ts';

/**
 * ANSI color utilities.
 */
export { Color } from '../common.ts';

/**
 * Remove ANSI escape codes from a string.
 */
export { stripAnsi } from '../common.ts';

/**
 * Measure, fit, wrap, and clip terminal text.
 */
export { Text } from '../m.Fmt.Text/mod.ts';

/**
 * Format navigable help chapters.
 */
export { Chapters } from '../m.Fmt.Chapters/mod.ts';

/**
 * Format terminal tables.
 */
export { Table } from '../m.Table/mod.ts';
