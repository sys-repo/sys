/**
 * @module
 * CLI helpers for copying LLM friendly text-file content to the clipboard.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
import { runWithRootUpgradeAdvisory } from '../u.root/u.upgradeAdvisory.ts';
/**
 * Run the clipboard copy CLI.
 */
export { cli };

/**
 * Library:
 */
export { ClipboardTools } from './m.ClipboardTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpgradeAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
