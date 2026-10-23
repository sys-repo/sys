import { NodeFsConstants, openNodeFile, slug, Time } from '../common.ts';
import type { Io } from '../t.internal.ts';

export const DEFAULT_IO: Io = Object.freeze({
  lstat: Deno.lstat,
  realPath: Deno.realPath,
  readDir: Deno.readDir,
  mkdir: Deno.mkdir,
  open: Deno.open,
  // Deno.FsFile has no descriptor chmod; Node compatibility preserves inode binding.
  openMode: async (path) => {
    const file = await openNodeFile(
      path,
      NodeFsConstants.O_RDONLY | NodeFsConstants.O_NONBLOCK,
    );
    return {
      stat: async () => {
        const info = await file.stat();
        return {
          isFile: info.isFile(),
          isDirectory: info.isDirectory(),
          dev: info.dev,
          ino: info.ino,
          mode: info.mode,
          nlink: info.nlink,
        };
      },
      chmod: (mode) => file.chmod(mode),
      close: () => file.close(),
    };
  },
  link: Deno.link,
  rename: Deno.rename,
  remove: Deno.remove,
  wait: (msecs, signal) => Time.wait(msecs, { signal }),
  token: slug,
});

export function withIo(overrides: Partial<Io> = {}): Io {
  return Object.freeze({ ...DEFAULT_IO, ...overrides });
}
