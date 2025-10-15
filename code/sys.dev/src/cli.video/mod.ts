/**
 * @module
 * CLI utilities for processing and transforming video files.
 */
import { type t, c, Fs } from './common.ts';

/**
 * Library:
 */
export { VideoTools } from './m.VideoTools.ts';

/**
 * CLI entry:
 */
if (import.meta.main) {
  const path = Fs.cwd('terminal');

  console.info();
  console.info(c.green('Video'));
  console.info(c.gray(path));
  console.info();
}
