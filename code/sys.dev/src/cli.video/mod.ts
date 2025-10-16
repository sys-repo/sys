/**
 * @module
 * CLI utilities for processing and transforming video files.
 */
import { c, Fs } from './common.ts';

/**
 * Library:
 */
export { VideoTools } from './m.VideoTools.ts';

/**
 * CLI entry:
 */
if (import.meta.main) {
  const { entry } = await import('./-entry.ts');
  const dir = Fs.cwd('terminal');

  console.info();
  console.info(c.green('Video Tools'));
  await entry({ dir });
  console.info();
}
