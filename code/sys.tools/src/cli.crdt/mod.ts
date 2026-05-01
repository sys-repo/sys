/**
 * @module
 * CLI tools for working with CRDT documents.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
import { runWithRootUpdateAdvisory } from '../u.root/u.updateAdvisory.ts';
export { cli };

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpdateAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
