/**
 * @module
 * A typed Deno boundary for running Pi as a profile-driven system agent.
 */
export { Pi } from './m.core/mod.ts';
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { exitCode, main } = await import('./m.core/m.cli/mod.ts');
  const code = exitCode(await main({ argv: Deno.args }));
  if (code !== 0) Deno.exitCode = code;
}
