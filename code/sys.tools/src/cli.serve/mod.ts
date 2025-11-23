/**
 * @module
 * Serve CLI tools.
 */
import { Fs } from './common.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { cli } = await import('./m.cli.ts');
  await cli(Fs.cwd('terminal'), Deno.args);
}
