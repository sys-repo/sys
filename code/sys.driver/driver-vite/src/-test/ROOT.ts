/**
 * @module
 * Testing tools.
 */

import { Path } from '@sys/std';
import { default as denofile } from '../../../../../deno.json' with { type: 'json' };

/**
 * Testing constants.
 */
const dir = Path.resolve('../../..');
export const ROOT = {
  dir,
  resolve: (...path: string[]) => Path.join(dir, ...path),

  /**
   * Workspace `deno.json` file.
   */
  denofile: {
    path: Path.join(dir, 'deno.json'), // NB: relative to executing module
    json: denofile,
  },
} as const;
