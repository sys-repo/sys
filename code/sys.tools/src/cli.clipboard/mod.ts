/**
 * @module
 * CLI helpers for copying LLM friendly text-file content to the clipboard.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
import { runWithRootUpdateAdvisory } from '../u.root/u.updateAdvisory.ts';
export { cli };

/**
 * Library:
 */
export { ClipboardTools } from './m.ClipboardTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpdateAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
