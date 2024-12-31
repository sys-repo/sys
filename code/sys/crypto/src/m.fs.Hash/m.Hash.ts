import { Hash as Base } from '@sys/std/hash';
import { Dir } from './m.Hash.Dir.ts';
import { Console } from './m.Hash.Console.ts';

import type { t } from './common.ts';

/**
 * `HashLib` (server extensions).
 *
 * Tools for generating and manipulating Hash's
 * within the context of a files and a file-system.
 */
export const Hash: t.HashSLib = {
  ...Base,
  Dir,
  Console,
};
