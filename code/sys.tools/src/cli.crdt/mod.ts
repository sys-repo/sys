/**
 * @module
 * CLI tools for working with CRDT documents.
 */
import type { t } from './common.ts';
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
  await cli({ dir: Fs.cwd('terminal'), argv: Deno.args });
}
