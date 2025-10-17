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
 * CLI entry:
 */
if (import.meta.main) {
  const { cli } = await import('./u.cli.ts');
  await cli({ dir: Fs.cwd('terminal') });
  console.info();
}
