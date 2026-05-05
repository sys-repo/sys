/**
 * @module
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { Cell } from './m.cell/mod.ts';

/**
 * Main entry:
 */
if (import.meta.main) {
  const CLI_SPEC = './m.' + 'cli/mod.ts';
  const { CellCli } = await import(/* @vite-ignore */ CLI_SPEC);
  const res = await CellCli.run({ argv: Deno.args });
  if (res.kind === 'error') Deno.exitCode = res.code;
}
