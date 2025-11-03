/**
 * @module
 * CLI helpers for copying LLM friendly text-file content to the clipboard.
 */
import { Fs } from './common.ts';

/**
 * Library:
 */
export { ClipboardTools } from './m.ClipboardTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { cli } = await import('./u.cli.ts');
  await cli({ dir: Fs.cwd('terminal'), argv: Deno.args });
}
