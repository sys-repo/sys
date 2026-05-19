/**
 * @module
 * Filesystem Capability
 * Portable filesystem/path capability interfaces and adapters for runtime injection.
 */
import { type t } from './common.ts';
import { Files } from './m.Files.ts';
import { fromFs } from './m.fromFs.ts';

export const FsCapability: t.FsCapability.Lib = {
  fromFs,
  Files,
};
