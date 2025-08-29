/**
 * @module
 */
import { c } from '@sys/color/ansi';
import { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Exports:
 */
export { Templates } from '../-tmpl/mod.ts';
export { tmplFilter } from './common.ts';
export { pkg };

/**
 * Command-line:
 */
if (import.meta.main) {
  const msg = `🐷 coming soon...command-line template generators`;
  console.info();
  console.info(c.gray(c.italic(msg)));
  console.info(pkg);
  console.info();
}
