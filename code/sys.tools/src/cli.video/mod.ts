/**
 * @module
 * CLI utilities for processing and transforming video files.
 */
import { Fs } from './common.ts';

/**
 * Library:
 */
export { VideoTools } from './m.VideoTools.ts';

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const { cli } = await import('./m.cli.ts');
  await cli(Fs.cwd('terminal'), Deno.args);
}
