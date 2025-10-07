/**
 * Tools for working with Unix-like `glob` file matching patterns.
 * @module
 */
import { Glob } from './m.Glob.ts';

export { Glob };
export const glob = Glob.create;
