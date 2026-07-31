/**
 * @module
 * Filesystem capability adapters and Rooted publishers.
 */
import { type t } from './common.ts';
import { Files } from './m.Files/mod.ts';
import { Rooted } from './m.Rooted/mod.ts';
import { fromFs } from './m.fromFs.ts';

/** Filesystem capability adapters and Rooted publishers. */
export const FsCapability: t.FsCapability.Lib = {
  fromFs,
  Files,
  Rooted,
};
