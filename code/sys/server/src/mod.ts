/**
 * @module
 * Primitives and entrypoint surfaces for system server packages.
 */
export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

/**
 * Main entry:
 */
if (import.meta.main) {
  const { ServerCli } = await import('./m.cli/mod.ts');
  const res = await ServerCli.run({ argv: Deno.args });
  if (res.kind === 'error') Deno.exitCode = res.code;
}
