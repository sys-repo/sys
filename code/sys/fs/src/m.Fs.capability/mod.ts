/**
 * @module
 * Filesystem adapters and confined Rooted publication, sealing, lease, and removal capabilities.
 */
import type { t } from './common.ts';
import { Files } from './m.Files/mod.ts';
import { Rooted } from './m.Rooted/mod.ts';
import { fromFs } from './m.fromFs.ts';

/**
 * Filesystem adapters and confined Rooted owned-tree capabilities.
 */
export const FsCapability: t.FsCapability.Lib = Object.freeze({
  fromFs,
  Files,
  Rooted,
});
