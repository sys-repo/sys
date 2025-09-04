/**
 * @module
 * Index of common file-system templates for "system".
 */
import { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { cli } from './m.tmpl/mod.ts';
export { pkg };

/**
 * Command-line:
 */
if (import.meta.main) {
  const { entry } = await import('./m.tmpl/-entry.ts');
  await entry();
}
