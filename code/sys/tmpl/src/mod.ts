/**
 * @module
 */
import { Tmpl } from './m.tmpl/mod.ts';
import { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { pkg, Tmpl };

/**
 * Command-line:
 */
if (import.meta.main) await Tmpl.cli();
