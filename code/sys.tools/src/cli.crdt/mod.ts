/**
 * @module
 * CLI tools for working with CRDT documents.
 */
import { Fs } from './common.ts';

/**
 * Library:
 */
export { CrdtTools } from './m.CrdtTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { cli } = await import('./u.cli.ts');
  const dir = Fs.cwd('terminal');
  await cli({ dir, argv: Deno.args });
}
