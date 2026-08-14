/**
 * @module
 * Tools for formatting `jsr:` import specifiers.
 */
import type { JsrImport } from './t.ts';
import { specifier } from './u.specifier.ts';

/** Import specifier helpers. */
export const Import: JsrImport.Lib = Object.freeze({ specifier });
