/**
 * @module
 * Filesystem Capability
 * Portable filesystem/path capability interfaces and adapters for runtime injection.
 */
import { type t } from './common.ts';
import { Files } from './m.Files/mod.ts';
import { fromFs } from './m.fromFs.ts';

/** Filesystem capability adapters for injected runtime filesystems. */
export const FsCapability: t.FsCapability.Lib = {
  fromFs,
  Files,
};
