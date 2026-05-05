/**
 * @module
 * CLI utilities for processing and transforming video files.
 */
import { Fs } from './common.ts';
import { cli } from './m.cli.ts';
import { runWithRootUpdateAdvisory } from '../u.root/u.updateAdvisory.ts';
export { cli };

/**
 * Library:
 */
export { VideoTools } from './m.VideoTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  await runWithRootUpdateAdvisory(() => cli(Fs.cwd('terminal'), Deno.args));
}
