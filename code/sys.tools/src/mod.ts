/**
 * @module
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { Fmt } = await import('./common.ts');
  console.info(await Fmt.help('System Tools'));
}
