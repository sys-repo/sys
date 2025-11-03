/**
 * @module
 * CLI helpers for performing common file-system tasks.
 */
import type { t } from './common.ts';
import { Fs } from './common.ts';

/**
 * Library:
 */
export { FsTools } from './m.FsTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { cli } = await import('./u.cli.ts');
  await cli({ dir: Fs.cwd('terminal'), argv: Deno.args });
}
