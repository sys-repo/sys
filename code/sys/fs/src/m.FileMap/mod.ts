/**
 * Tools for generating and saving bundles of files as a structured object.
 * @module
 *
 * NOTE: This is useful for converting file-system layouts into a simple
 *       {object} that can be embedded included within a module's source code.
 */
import type { FileMapLib } from './t.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { bundle } from './u.bundle.ts';
import { write } from './u.write.ts';

export const FileMap: FileMapLib = {
  Is,
  Data,
  bundle,
  write,
};
