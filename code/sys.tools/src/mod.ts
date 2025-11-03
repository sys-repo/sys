/**
 * @module
 */
import { pkg } from './pkg.ts';
export { pkg };

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { Fmt } = await import('./common.ts');

  const text = await Fmt.help('System Tools', (e, c) => {
    const fmt = (path: string) => c.gray(`${pkg.name}/`) + path;
    e.row(fmt('copy'), c.gray(`(← alias cp)`));
    e.row(fmt('crdt'));
    e.row(fmt('video'));
  });

  console.info(text);
}
