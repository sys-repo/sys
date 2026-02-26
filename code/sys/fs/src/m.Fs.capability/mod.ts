/**
 * @module
 * Filesystem Capability
 * Portable filesystem/path capability interfaces and adapters for runtime injection.
 */
import { type t } from './common.ts';

export const FsCapability: {
  readonly fromFs: (fs: t.FsLib) => t.FsCapability.Lib;
} = {
  fromFs(fs) {
    return {
      read: fs.read,
      exists: fs.exists,
      copy: fs.copy,
      write: fs.write,
      ensureDir: fs.ensureDir,
      stat: fs.stat,
      dirname: fs.dirname,
      join: fs.join,
      cwd: fs.cwd,
      tildeExpand: fs.Tilde.expand,
    };
  },
};
